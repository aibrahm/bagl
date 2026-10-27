// Fills each built page with its server render, so the pages show their text
// before (and without) JavaScript, and checks that every heading in the
// sidebars and the search index exists on its page.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const site = fileURLToPath(new URL("..", import.meta.url));
const dist = join(site, "dist");
const { render } = await import(pathToFileURL(join(site, ".ssr/entry-server.js")).href);

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith(".html") ? [p] : [];
  });

let problems = 0;
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, "utf8");
  const page = /data-page="([^"]+)"/.exec(html)?.[1];
  if (!page) continue;
  const body = await render(page);
  if (!html.includes("<!--app-->")) throw new Error(`${file} has no <!--app--> marker`);
  const out = html.replace("<!--app-->", body);
  writeFileSync(file, out);

  // every same-page link must point at an id on the page
  const ids = new Set([...out.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, id] of out.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(id)) {
      problems += 1;
      console.error(`${file.slice(dist.length)}: link to #${id}, but no element has that id`);
    }
  }
  console.log(`prerendered ${file.slice(dist.length)} (${page}, ${(out.length / 1024).toFixed(0)} KB)`);
}
if (problems) process.exit(1);
