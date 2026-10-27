// Runs every example on the site (the home page, the playground and the language reference)
// through a build of the compiler, and checks each result against the expected
// output stored with the example in src/content/examples.json. It also checks
// that the reference page uses each reference example exactly once.
// Usage: node scripts/verify.mjs [path/to/bagl_js.bc.js]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadCompiler, format } from "./load-compiler.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const bundle = process.argv[2] ?? here("../public/compiler/bagl.js");
const compiler = loadCompiler(bundle);
const examples = JSON.parse(readFileSync(here("../src/content/examples.json"), "utf8"));

let n = 0;
let failed = 0;
for (const [group, items] of Object.entries(examples)) {
  for (const [id, { source, expect }] of Object.entries(items)) {
    n += 1;
    const got = format(compiler.run(source));
    if (got !== expect) {
      failed += 1;
      console.error(`FAIL ${group}/${id}`);
      console.error(`  expected: ${expect}`);
      console.error(`  got:      ${got}`);
    }
  }
}

const page = readFileSync(here("../src/content/reference.mdx"), "utf8");
const used = [...page.matchAll(/<Example id="([^"]+)"/g)].map((m) => m[1]);
for (const id of Object.keys(examples.reference)) {
  const count = used.filter((u) => u === id).length;
  if (count !== 1) {
    failed += 1;
    console.error(`FAIL reference.mdx uses example "${id}" ${count} times, expected once`);
  }
}
for (const id of used) {
  if (!(id in examples.reference)) {
    failed += 1;
    console.error(`FAIL reference.mdx uses example "${id}", which examples.json does not have`);
  }
}

if (n === 0) {
  console.error("no examples found");
  process.exit(1);
}
const counts = Object.entries(examples).map(([g, items]) => `${Object.keys(items).length} ${g}`).join(", ");
console.log(`${n - failed}/${n} examples verified (${counts})`);
process.exit(failed === 0 ? 0 : 1);
