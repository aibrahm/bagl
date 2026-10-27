// Runs the Bagl compiler (bagl.js, the js_of_ocaml build of the OCaml compiler)
// off the page's main thread, so a long program can't freeze the page and the
// page can stop it by ending the worker.
importScripts("bagl.js");

self.onmessage = (e) => {
  const { id, source } = e.data;
  const t0 = performance.now();
  let result;
  try {
    result = self.bagl.run(source);
  } catch (err) {
    result = { ok: false, runtime: true, error: String(err) };
  }
  self.postMessage({ id, result, ms: performance.now() - t0 });
};
