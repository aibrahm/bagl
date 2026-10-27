import { BASE } from "@/lib/site";

// The page side of public/compiler/worker.js. Programs run one at a time in a
// worker; stop() ends the worker (and a program stuck in a loop with it), and
// the next run starts a new one.

export type CompileResult =
  | { ok: true; value: string; type: string }
  | { ok: false; error: string; runtime: true }
  | { ok: false; error: string; runtime?: false; line: number; col: number; endLine: number; endCol: number };

export interface RunOutcome {
  result: CompileResult;
  ms: number;
}

export class StoppedError extends Error {
  constructor() {
    super("The program was stopped.");
  }
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (r: RunOutcome) => void; reject: (e: Error) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(`${BASE}compiler/worker.js`);
    worker.onmessage = (e: MessageEvent<{ id: number; result: CompileResult; ms: number }>) => {
      const p = pending.get(e.data.id);
      pending.delete(e.data.id);
      p?.resolve({ result: e.data.result, ms: e.data.ms });
    };
    worker.onerror = (e) => {
      e.preventDefault();
      const err = new Error("The compiler failed to load.");
      for (const p of pending.values()) p.reject(err);
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export function run(source: string): Promise<RunOutcome> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, source });
  });
}

export function stop() {
  worker?.terminate();
  worker = null;
  for (const p of pending.values()) p.reject(new StoppedError());
  pending.clear();
}

/** The one-line form used by the reference and by scripts/verify.mjs. */
export const format = (r: CompileResult) => (r.ok ? `= ${r.value} : ${r.type}` : r.runtime ? `runtime error: ${r.error}` : `error: ${r.error}`);
