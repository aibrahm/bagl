import { tokenize, type TokenType } from "@/lib/highlight";
import { cn } from "@/lib/utils";

// Token types to the class names that @lezer/highlight's classHighlighter
// writes, so the editor and the static code blocks share one set of colors.
export const CLASS: Record<TokenType, string> = {
  keyword: "tok-keyword",
  builtin: "tok-macroName",
  type: "tok-typeName",
  number: "tok-number",
  string: "tok-string",
  comment: "tok-comment",
  operator: "tok-operator",
  text: "",
};

/** The code as colored text, for the server render and before the editor loads. */
export function StaticCode({ source, className }: { source: string; className?: string }) {
  return (
    <pre className={cn("m-0 overflow-x-auto px-5 py-3.5 font-mono text-[max(16px,0.9375rem)] leading-[1.6]", className)}>
      <code>
        {tokenize(source).map((t, i) =>
          CLASS[t.type] ? (
            <span key={i} className={CLASS[t.type]}>
              {t.text}
            </span>
          ) : (
            t.text
          ),
        )}
      </code>
    </pre>
  );
}

