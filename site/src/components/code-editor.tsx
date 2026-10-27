import { useEffect, useRef, useState } from "react";
import { EditorState, StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, type DecorationSet } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { StreamLanguage, bracketMatching, syntaxHighlighting } from "@codemirror/language";
import { classHighlighter, tags } from "@lezer/highlight";
import { nextToken } from "@/lib/highlight";
import { StaticCode } from "@/components/static-code";
import { cn } from "@/lib/utils";

export { StaticCode };

export interface ErrorSpan {
  line: number;
  col: number;
  endLine: number;
  endCol: number;
}

const bagl = StreamLanguage.define<{ inComment: boolean }>({
  name: "bagl",
  startState: () => ({ inComment: false }),
  token(stream, state) {
    if (state.inComment) {
      if (stream.skipTo("*/")) {
        stream.pos += 2;
        state.inComment = false;
      } else stream.skipToEnd();
      return "comment";
    }
    const rest = stream.string.slice(stream.pos);
    if (rest.startsWith("/*") && !rest.includes("*/")) {
      stream.skipToEnd();
      state.inComment = true;
      return "comment";
    }
    const { type, length } = nextToken(rest);
    stream.pos += length;
    // "builtin" and "type" are also legacy CodeMirror token names with other tags, so these two get names of their own
    return type === "text" ? null : type === "builtin" ? "baglBuiltin" : type === "type" ? "baglType" : type;
  },
  tokenTable: { baglBuiltin: tags.macroName, baglType: tags.typeName },
});

const setError = StateEffect.define<ErrorSpan | null>();
const errorMark = Decoration.mark({ class: "cm-bagl-error" });
const errorField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(marks, tr) {
    marks = marks.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setError)) continue;
      if (!e.value) return Decoration.none;
      const doc = tr.state.doc;
      const { line, col, endLine, endCol } = e.value;
      if (line < 1 || line > doc.lines) return Decoration.none;
      const from = Math.min(doc.line(line).from + Math.max(0, col - 1), doc.length);
      const end = endLine >= 1 && endLine <= doc.lines ? Math.min(doc.line(endLine).from + Math.max(0, endCol - 1), doc.length) : from;
      const to = Math.max(end, Math.min(from + 1, doc.line(line).to));
      return to > from ? Decoration.set([errorMark.range(from, to)]) : Decoration.none;
    }
    return marks;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const theme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "var(--text)", height: "100%" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-code)", fontSize: "max(16px, 0.9375rem)", lineHeight: "1.6", overscrollBehavior: "contain" },
  ".cm-content": { padding: "0.875rem 0", caretColor: "var(--accent)" },
  ".cm-line": { padding: "0 1.25rem" },
  ".cm-gutters": { backgroundColor: "transparent", color: "var(--syn-comment)", border: "none", paddingInlineStart: "0.5rem" },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklch, var(--cream) 5%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text)" },
  ".cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "color-mix(in oklch, var(--accent) 35%, transparent)" },
  ".cm-matchingBracket": { backgroundColor: "color-mix(in oklch, var(--accent) 25%, transparent)", outline: "none" },
});

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onRun?: () => void;
  error?: ErrorSpan | null;
  label: string;
  gutter?: boolean;
  fill?: boolean;
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  className?: string;
}

export function CodeEditor({ value, onChange, onRun, error = null, label, gutter = false, fill = false, wrap = false, className }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onChange, onRun });
  handlers.current = { onChange, onRun };

  useEffect(() => {
    const extensions: Extension[] = [
      history(),
      drawSelection(),
      bracketMatching(),
      bagl,
      syntaxHighlighting(classHighlighter),
      errorField,
      theme,
      EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false", autocapitalize: "off", autocorrect: "off" }),
      keymap.of([
        { key: "Mod-Enter", run: () => (handlers.current.onRun?.(), true) },
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) handlers.current.onChange?.(u.state.doc.toString());
      }),
    ];
    if (gutter) extensions.push(lineNumbers(), highlightActiveLine());
    if (wrap) extensions.push(EditorView.lineWrapping);
    const v = new EditorView({ state: EditorState.create({ doc: value, extensions }), parent: host.current! });
    view.current = v;
    setReady(true);
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once; value changes from outside go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: setError.of(error) });
  }, [error]);

  return (
    <div ref={host} className={cn("bagl-editor", fill && "h-full", className)}>
      {/* the server render shows the code as text; the editor takes its place once it loads */}
      {!ready && <StaticCode source={value} />}
    </div>
  );
}
