// Copies the built site (dist/) into ../docs, which GitHub Pages serves from
// the main branch. docs/.site-files lists what the last publish wrote, so the
// files a new build no longer has are removed, and the hand-written files in
// docs/ (internals.md, language-spec/, screenshots/) are never touched.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const site = fileURLToPath(new URL("..", import.meta.url));
const dist = join(site, "dist");
const docs = join(site, "../docs");
const manifest = join(docs, ".site-files");

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const files = walk(dist).map((f) => relative(dist, f)).sort();

const keep = new Set(files);
const old = existsSync(manifest) ? readFileSync(manifest, "utf8").split("\n").filter(Boolean) : [];
for (const f of old) {
  if (!keep.has(f) && existsSync(join(docs, f))) {
    rmSync(join(docs, f));
    console.log(`removed docs/${f}`);
  }
}
for (const f of files) cpSync(join(dist, f), join(docs, f), { recursive: false, force: true });
// .nojekyll: serve the files as they are, without Jekyll's processing
writeFileSync(join(docs, ".nojekyll"), "");
writeFileSync(manifest, files.join("\n") + "\n");
console.log(`published ${files.length} files to docs/ (${[...new Set(files.map((f) => dirname(f).split("/")[0]))].join(", ")})`);
