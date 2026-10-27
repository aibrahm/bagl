// One tokenizer for Bagl, used by the editor (through a CodeMirror stream
// language) and by the static code blocks on the Markdown pages, so both color
// code the same way. The word lists follow the keyword table in src/token.ml. grad is an
// ordinary name there that the compiler treats specially, so it is colored as a builtin.

export type TokenType = "keyword" | "builtin" | "type" | "number" | "string" | "comment" | "operator" | "text";

export const KEYWORDS = ["let", "letrec", "in", "fn", "if", "then", "else", "true", "false"];
export const BUILTINS = ["dot", "transpose", "reshape", "exp", "log", "sqrt", "relu", "step", "grad"];
export const TYPES = ["int", "float", "bool", "string", "tensor"];

const RULES: [TokenType, RegExp][] = [
  ["comment", /^\/\/[^\n]*/],
  ["comment", /^\/\*[\s\S]*?(\*\/|$)/],
  ["string", /^"(?:[^"\\\n]|\\.)*"?/],
  ["number", /^\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/],
  ["type", /^'[A-Za-z_]\w*/],
  ["operator", /^(?:->|==|!=|<=|>=|&&|\|\||[-+*/<>=!:])/],
];

const WORD = /^[A-Za-z_]\w*/;

/** Reads one token from the start of `rest`. */
export function nextToken(rest: string): { type: TokenType; length: number } {
  for (const [type, re] of RULES) {
    const m = re.exec(rest);
    if (m) return { type, length: m[0].length };
  }
  const w = WORD.exec(rest);
  if (w) {
    const word = w[0];
    const type: TokenType = KEYWORDS.includes(word) ? "keyword" : BUILTINS.includes(word) ? "builtin" : TYPES.includes(word) ? "type" : "text";
    return { type, length: word.length };
  }
  return { type: "text", length: 1 };
}

export function tokenize(src: string): { type: TokenType; text: string }[] {
  const out: { type: TokenType; text: string }[] = [];
  let i = 0;
  while (i < src.length) {
    const { type, length } = nextToken(src.slice(i));
    const text = src.slice(i, i + length);
    const last = out[out.length - 1];
    if (last && last.type === type && type === "text") last.text += text;
    else out.push({ type, text });
    i += length;
  }
  return out;
}
