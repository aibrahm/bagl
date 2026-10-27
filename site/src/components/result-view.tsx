import type { CompileResult } from "@/lib/compiler";
import { cn } from "@/lib/utils";

// A compiler result in the form the REPL prints: "= value : type", or the
// error the way baglc reports it, with the line and a caret under the span.
export function ResultView({ result, source, compact = false }: { result: CompileResult; source?: string; compact?: boolean }) {
  const text = cn("m-0 font-mono whitespace-pre-wrap", compact ? "text-[0.9375rem]" : "text-base leading-relaxed");
  if (result.ok) {
    return (
      <p className={text}>
        <span className="font-semibold">= {result.value}</span>
        <span className="text-muted"> : {result.type}</span>
      </p>
    );
  }
  if (result.runtime) {
    return (
      <p className={text}>
        <span className="font-semibold text-error">runtime error:</span> {result.error}
      </p>
    );
  }
  const line = source?.split("\n")[result.line - 1];
  const from = Math.max(0, result.col - 1);
  const to = result.endLine === result.line ? Math.max(from + 1, result.endCol - 1) : (line?.length ?? from + 1);
  if (compact || line === undefined) {
    return (
      <p className={text}>
        <span className="font-semibold text-error">error:</span> {result.error} <span className="text-muted">(line {result.line}, column {result.col})</span>
      </p>
    );
  }
  const gutter = String(result.line).length;
  return (
    <pre className={cn(text, "overflow-x-auto")}>
      <span className="font-semibold text-error">error:</span> {result.error}
      {"\n"}
      <span className="text-muted">{" ".repeat(gutter)}--&gt; line {result.line}, column {result.col}</span>
      {"\n"}
      <span className="text-muted">{result.line} | </span>
      {line}
      {"\n"}
      <span className="text-muted">{" ".repeat(gutter)} | </span>
      <span className="text-error">{" ".repeat(from) + "^".repeat(Math.max(1, to - from))}</span>
    </pre>
  );
}
