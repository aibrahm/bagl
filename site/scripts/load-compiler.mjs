// Loads a js_of_ocaml build of the Bagl compiler in Node. The bundle is a
// CommonJS script, and this package is "type": "module", so it is run here with
// its own module object instead of through require().
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

export function loadCompiler(path) {
  const module = { exports: {} };
  new Function("module", "exports", "require", readFileSync(path, "utf8"))(module, module.exports, createRequire(import.meta.url));
  const compiler = module.exports.bagl ?? globalThis.bagl;
  if (!compiler?.run) throw new Error(`${path} does not export bagl.run`);
  return compiler;
}

export const format = (r) => (r.ok ? `= ${r.value} : ${r.type}` : r.runtime ? `runtime error: ${r.error}` : `error: ${r.error}`);
