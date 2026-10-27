import { useCallback, useEffect, useRef, useState } from "react";
import { Link2, Play, Square } from "lucide-react";
import { Shell } from "@/components/shell";
import { CodeEditor, type ErrorSpan } from "@/components/code-editor";
import { ResultView } from "@/components/result-view";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { VelocityToast } from "@/components/ui/velocity-toast";
import { run, stop, StoppedError, type CompileResult } from "@/lib/compiler";
import { copyToClipboard } from "@/lib/utils";
import examples from "@/content/examples.json";

const EXAMPLES = Object.entries(examples.playground).map(([id, e]) => ({ id, label: e.label, source: e.source }));
const FIRST = EXAMPLES[0];

// A program in the address bar: #code= and the source as base64url (UTF-8).
const encode = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function decode(s: string) {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

type Status = { kind: "loading" } | { kind: "running" } | { kind: "done"; result: CompileResult; ms: number; source: string } | { kind: "stopped" } | { kind: "failed"; message: string };

export default function Playground() {
  const [source, setSource] = useState(FIRST.source);
  const [example, setExample] = useState<string | null>(FIRST.id);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);
  const latest = useRef(source);
  const timer = useRef<number | undefined>(undefined);

  const compile = useCallback(async (code: string) => {
    latest.current = code;
    setStatus((s) => (s.kind === "done" ? s : { kind: "running" }));
    const slowTimer = window.setTimeout(() => setSlow(true), 800);
    try {
      const { result, ms } = await run(code);
      if (latest.current === code) setStatus({ kind: "done", result, ms, source: code });
    } catch (e) {
      if (latest.current === code) setStatus(e instanceof StoppedError ? { kind: "stopped" } : { kind: "failed", message: (e as Error).message });
    } finally {
      clearTimeout(slowTimer);
      if (latest.current === code) setSlow(false);
    }
  }, []);

  // first load: a program from the link, or the first example
  useEffect(() => {
    const m = /^#code=(.+)$/.exec(location.hash);
    const fromLink = m ? decode(m[1]) : null;
    if (fromLink !== null) {
      setSource(fromLink);
      setExample(EXAMPLES.find((e) => e.source === fromLink)?.id ?? null);
      compile(fromLink);
    } else compile(FIRST.source);
  }, [compile]);

  const onEdit = (code: string) => {
    setSource(code);
    setExample(EXAMPLES.find((e) => e.source === code)?.id ?? null);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => compile(code), 300);
  };

  const pick = (id: string) => {
    const e = EXAMPLES.find((x) => x.id === id)!;
    setExample(id);
    setSource(e.source);
    clearTimeout(timer.current);
    if (location.hash) history.replaceState(null, "", location.pathname);
    compile(e.source);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#code=${encode(source)}`;
    history.replaceState(null, "", url);
    if (await copyToClipboard(url)) setCopied(true);
  };

  const error: ErrorSpan | null = status.kind === "done" && !status.result.ok && !status.result.runtime && status.source === source ? status.result : null;

  return (
    <Shell page="playground" footer={false}>
      <main id="main" className="grid h-[calc(100dvh-var(--header-h)-1px)] grid-rows-[auto_minmax(0,1fr)]">
        <h1 className="sr-only">Bagl playground</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-3 py-2 sm:px-5">
          <AnimatedTabs label="Examples" tabs={EXAMPLES} activeTab={example} onChange={pick} className="-mx-1 w-full min-w-0 md:w-auto md:flex-1" />
          <div className="ms-auto flex flex-none items-center gap-2">
            <Button variant="ghost" size="sm" onClick={share} leftIcon={<Link2 aria-hidden className="size-4" />}>
              Copy link
            </Button>
            {slow ? (
              <Button variant="outline" size="sm" onClick={stop} leftIcon={<Square aria-hidden className="size-3.5" />}>
                Stop
              </Button>
            ) : (
              <Button variant="accent" size="sm" onClick={() => compile(source)} leftIcon={<Play aria-hidden className="size-3.5" />} aria-keyshortcuts="Control+Enter Meta+Enter" title="Run (Ctrl or ⌘ + Enter)">
                Run
              </Button>
            )}
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 grid-rows-[minmax(12rem,1fr)_minmax(8rem,auto)] md:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] md:grid-rows-1">
          <section aria-label="Source code" className="code-surface flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-clip">
              <CodeEditor value={source} onChange={onEdit} onRun={() => compile(source)} error={error} label="Bagl source code" gutter fill wrap />
            </div>
          </section>
          <section aria-label="Output" className="flex min-h-0 flex-col border-t border-line pb-[env(safe-area-inset-bottom,0px)] md:border-s md:border-t-0">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4" aria-live="polite">
              {(status.kind === "loading" || status.kind === "running") && <p className="m-0 text-sm text-muted">Running</p>}
              {status.kind === "stopped" && <p className="m-0 text-sm text-muted">Stopped.</p>}
              {status.kind === "failed" && <p className="m-0 text-sm text-error">{status.message}</p>}
              {status.kind === "done" && <ResultView result={status.result} source={status.source} />}
              {status.kind === "done" && <p className="m-0 mt-4 text-xs tabular-nums text-muted">{status.ms.toFixed(1)} ms</p>}
            </div>
          </section>
        </div>
      </main>
      <VelocityToast open={copied} onDismiss={() => setCopied(false)} title="Link copied" />
    </Shell>
  );
}
