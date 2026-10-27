import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { CodeEditor, type ErrorSpan } from "@/components/code-editor";
import { ResultView } from "@/components/result-view";
import { run, type CompileResult } from "@/lib/compiler";
import examples from "@/content/examples.json";

type Id = keyof typeof examples.reference;

// One runnable example in the reference. Before you run it, it shows the result
// stored in examples.json, which CI checks against the compiler.
function Expected({ text }: { text: string }) {
  if (text.startsWith("= ")) {
    const cut = text.lastIndexOf(" : ");
    return (
      <p className="m-0 font-mono text-[0.9375rem] whitespace-pre-wrap">
        <span className="sr-only">Result: </span>
        <span className="font-semibold">{text.slice(0, cut)}</span>
        <span className="text-muted">{text.slice(cut)}</span>
      </p>
    );
  }
  return (
    <p className="m-0 font-mono text-[0.9375rem] whitespace-pre-wrap text-error">
      <span className="sr-only">Result: </span>
      {text}
    </p>
  );
}

export function Example({ id }: { id: Id }) {
  const { source: original, expect } = examples.reference[id];
  const [source, setSource] = useState(original);
  const [result, setResult] = useState<{ result: CompileResult; source: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const { result } = await run(source);
      setResult({ result, source });
    } catch (e) {
      setResult({ result: { ok: false, runtime: true, error: (e as Error).message }, source });
    } finally {
      setBusy(false);
    }
  };

  const error: ErrorSpan | null = result && !result.result.ok && !result.result.runtime && result.source === source ? result.result : null;

  return (
    <figure className="not-prose m-0 overflow-clip rounded-sm border border-line">
      <div className="code-surface">
        <CodeEditor value={source} onChange={setSource} onRun={go} error={error} label="Example program, editable" />
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-sunk px-3 py-2.5">
        <button
          type="button"
          onClick={go}
          disabled={busy}
          className="inline-flex h-8 flex-none items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-semibold text-on-accent active:scale-[0.97] disabled:opacity-60 motion-safe:transition-transform"
        >
          <Play aria-hidden className="size-3.5" />
          Run
        </button>
        {source !== original && (
          <button
            type="button"
            onClick={() => {
              setSource(original);
              setResult(null);
            }}
            className="inline-flex h-8 flex-none items-center gap-1.5 rounded-sm px-2 text-sm text-muted hover:text-text active:opacity-70"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Reset
          </button>
        )}
        <div className="min-w-0 flex-1" aria-live="polite">
          {result ? <ResultView result={result.result} source={result.source} compact /> : <Expected text={expect} />}
        </div>
      </figcaption>
    </figure>
  );
}
