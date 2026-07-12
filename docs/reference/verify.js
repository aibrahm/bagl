// Verifies the language reference: every runnable example on the page is
// executed through the real compiler (the js_of_ocaml bundle) and its
// output must match the data-expect attribute rendered next to it.
// Usage: node verify.js <bagl_js_bundle> <index.html>

const fs = require("fs");

const [bundlePath, htmlPath] = process.argv.slice(2);
if (!bundlePath || !htmlPath) {
  console.error("usage: node verify.js <bagl_js_bundle> <index.html>");
  process.exit(2);
}

const m = require(require("path").resolve(bundlePath));
const compiler = m.bagl || (globalThis.bagl);
const html = fs.readFileSync(htmlPath, "utf8");

const unescape = s =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
   .replace(/&#39;/g, "'").replace(/&amp;/g, "&");

// Each example is a textarea followed by an .out div carrying data-expect.
const re = /<textarea[^>]*>([\s\S]*?)<\/textarea>[\s\S]*?data-expect=("([^"]*)"|'([^']*)')/g;

let n = 0, failed = 0, match;
while ((match = re.exec(html)) !== null) {
  n += 1;
  const src = unescape(match[1]);
  const expect = unescape(match[3] !== undefined ? match[3] : match[4]);
  const res = compiler.run(src);
  const got = res.ok
    ? `= ${res.value} : ${res.type}`
    : res.runtime
      ? `runtime error: ${res.error}`
      : `error: ${res.error}`;
  if (got !== expect) {
    failed += 1;
    console.error(`FAIL example #${n}:`);
    console.error(`  source:   ${src.split("\n")[0]}${src.includes("\n") ? " ..." : ""}`);
    console.error(`  expected: ${expect}`);
    console.error(`  got:      ${got}`);
  }
}

if (n === 0) { console.error("no examples found; extraction regex is broken"); process.exit(1); }
console.log(`${n - failed}/${n} reference examples verified`);
process.exit(failed === 0 ? 0 : 1);
