import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const SPEC_DIR = here("../docs/language-spec/");
const GENERATED = here("./.generated/");

// The nine spec chapters become one page. Their headings move down one level,
// so each chapter's title is an h2 under the page's own h1, and links between
// chapter files become links to the chapter's heading on the page.
function buildSpec() {
  const files = readdirSync(SPEC_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
  const chapters = files.map((f) => readFileSync(SPEC_DIR + f, "utf8"));
  const slugger = new GithubSlugger();
  const anchorOf = new Map<string, string>();
  chapters.forEach((text, i) => {
    const title = /^#\s+(.+)$/m.exec(text)?.[1] ?? files[i];
    anchorOf.set(files[i], slugger.slug(plain(title)));
  });
  const shifted = chapters.map((text) => {
    // The chapter title is the first heading that starts with its number, as in "# 2. Lexical structure".
    // Headings above it (chapter 1 repeats the spec's title) are dropped, and the rest move so the title is an h2.
    const lines = text.split("\n");
    const first = lines.findIndex((l) => /^#{1,5}\s+\d+\.\s/.test(l));
    const shift = first < 0 ? 1 : 2 - /^#+/.exec(lines[first])![0].length;
    let fence = false;
    return lines
      .slice(Math.max(first, 0))
      .map((line) => {
        if (/^\s*(```|~~~)/.test(line)) fence = !fence;
        if (fence) return line;
        const h = /^(#{1,6})(\s.*)$/.exec(line);
        let out = h ? "#".repeat(Math.min(6, Math.max(2, h[1].length + shift))) + h[2] : line;
        out = out.replace(/\]\((?:\.\/)?(\d\d-[\w-]+\.md)(#[\w-]+)?\)/g, (_, f: string, hash?: string) => `](#${hash ? hash.slice(1) : (anchorOf.get(f) ?? "")})`);
        return out;
      })
      .join("\n");
  });
  const page = [
    "# Language specification",
    "",
    "The specification gives the full rules of Bagl, chapter by chapter. [The language reference](/bagl/reference/) covers the same ground with runnable examples, and it is the better place to start.",
    "",
    ...shifted,
  ].join("\n");
  mkdirSync(GENERATED, { recursive: true });
  writeFileSync(GENERATED + "spec.md", page);
  return page;
}

// Heading text as rehype-slug sees it: no Markdown markers.
function plain(s: string) {
  return s
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_]/g, "")
    .trim();
}

export type TocEntry = { id: string; text: string; depth: number };

function tocOf(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const out: TocEntry[] = [];
  let fence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const text = plain(m[2]);
    out.push({ id: slugger.slug(text), text, depth: m[1].length });
  }
  return out;
}

// virtual:toc holds each page's headings, for the sidebars and the search box.
function toc(): Plugin {
  const id = "virtual:toc";
  const sources = {
    start: here("./src/content/start.mdx"),
    reference: here("./src/content/reference.mdx"),
    internals: here("../docs/internals.md"),
    spec: GENERATED + "spec.md",
  };
  return {
    name: "bagl-toc",
    buildStart() {
      buildSpec();
      for (const f of Object.values(sources)) this.addWatchFile(f);
      for (const f of readdirSync(SPEC_DIR)) this.addWatchFile(SPEC_DIR + f);
    },
    resolveId: (s) => (s === id ? "\0" + id : null),
    load(s) {
      if (s !== "\0" + id) return null;
      const data = Object.fromEntries(Object.entries(sources).map(([k, f]) => [k, tocOf(readFileSync(f, "utf8"))]));
      return `export default ${JSON.stringify(data)};`;
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(SPEC_DIR)) buildSpec();
      if (file.startsWith(SPEC_DIR) || Object.values(sources).includes(file)) {
        const m = server.moduleGraph.getModuleById("\0" + id);
        if (m) server.moduleGraph.invalidateModule(m);
      }
    },
  };
}

buildSpec();

const pages = ["index", "start/index", "playground/index", "reference/index", "internals/index", "spec/index", "404"];

export default defineConfig({
  base: "/bagl/",
  plugins: [
    toc(),
    { enforce: "pre", ...mdx({ remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug], providerImportSource: undefined }) },
    react({ include: /\.(mdx|md|tsx?)$/ }),
    tailwindcss(),
  ],
  // docs/internals.md sits outside this folder, so React must resolve from here
  resolve: { alias: { "@": here("./src") }, dedupe: ["react", "react-dom"] },
  build: {
    outDir: "dist",
    target: "es2022",
    emptyOutDir: true,
    rollupOptions: { input: Object.fromEntries(pages.map((p) => [p, here(`./${p}.html`)])) },
  },
  server: { fs: { allow: [here(".."), here(".")] } },
});
