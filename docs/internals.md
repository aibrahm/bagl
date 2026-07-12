# Bagl compiler internals

A stage-by-stage anatomy of the compiler: what each module does, the
invariants it maintains, the design decisions behind it, and the bugs that
shaped it. Read it top to bottom once, then use the exercise ladder at the
end; if you can do the exercises, you understand the compiler.

The pipeline, in the order a program experiences it:

```
source
  | lexer.ml        characters -> tokens, with positions
  | parser.ml       tokens -> AST (ast.ml), recursive descent
  | autodiff.ml     AST -> AST, expands grad before anything is typed
  | typeinfer.ml    Hindley-Milner + a second unification domain for shapes
  | ir.ml           AST -> control-flow-graph IR, closure conversion
  | optimize.ml     constant folding, DCE, copy propagation, local CSE
  | codegen.ml      IR -> stack bytecode, two-pass jump backpatching
  | vm.ml           executes bytecode; serialize.ml round-trips it to .baglc
```

`bin/main.ml` drives all of this for the CLI and REPL; `js/bagl_js.ml`
exposes the same pipeline to the browser; `lsp/lsp_main.ml` runs the front
half (through inference) to publish editor diagnostics.

---

## 1. Lexer (`src/lexer.ml`)

Hand-rolled, one character of lookahead, no generator. Every token carries
a `span` (`location.ml`): start and end positions with 1-based line and
column plus a byte offset. Spans thread through the entire compiler so any
later stage can point a caret at source; getting them right here is why
error messages are good everywhere else.

Details worth knowing:

- The keyword table in `token.ml` maps identifiers to keywords after the
  identifier is read (`lookup_keyword`). `dot`, `exp`, `grad` is NOT here:
  `grad` is an ordinary identifier, which is what lets autodiff treat
  `grad (fn ...)` as ordinary application syntax it can pattern-match.
- Number literals: one scan handles ints, decimals, and exponents. Integer
  literals go through `int_of_string_opt`, so `99999999999999999999` is a
  lexer diagnostic, not a crash.
- There is a rewind hack where the lexer backs up `pos`/`col` to re-lex a
  character. It works because the rewound character is never a newline.
  Fragile by design debt; a two-token lookahead would remove it.

## 2. Parser (`src/parser.ml`)

Recursive descent with precedence climbing for binary operators
(`precedence`, `parse_binary`). Application is juxtaposition:
`parse_postfix` keeps consuming primaries while they can start an
expression, which makes application left-associative and gives `f x y`
for free.

Decisions with consequences:

- **Parameter annotations parse a non-arrow type** (`parse_param_annot_opt`
  vs `parse_type_annot_opt`). `fn x: int -> x` must not let the type
  parser eat the fn's own arrow; arrow-typed parameters need parentheses:
  `fn f: (int -> int) -> ...`. This was a real bug: the annotation
  grammar was unreachable for months because the arrow was always
  consumed.
- **Tensor literals record their bracket shape.** `ETensor` carries a
  `matrix` flag set by which syntax was used, so `[[1.0, 2.0]]` is a 1x2
  matrix while `[1.0, 2.0]` is a vector. Without the flag the two parse
  identically and 1xN matrices are unrepresentable (that was the case
  until the flag was added).
- Math builtins (`exp`, `log`, `sqrt`, `relu`, `step`) and tensor ops
  (`dot`, `transpose`, `reshape`) are keywords with call syntax, parsed
  into `EMath` / `ETensorOp` nodes directly. They are not functions and
  cannot be passed around; that is a deliberate simplification.

## 3. Autodiff (`src/autodiff.ml`)

The most unusual stage: a source-to-source transform that runs BEFORE type
inference. `grad (fn x -> body)` is rewritten into an ordinary function
computing the derivative, so everything downstream (inference, IR,
optimizer, VM) handles derivatives with zero special cases, and the
derivative itself is type- and shape-checked.

Two modes, dispatched on the parameter annotation in `expand_expr`:

**Scalar forward mode** (`diff`): symbolic differentiation with an
environment mapping variables to their derivative expressions. The
parameter maps to `1.0`; other free variables map to `0.0`. Rules are the
calculus textbook: sum, product, quotient, chain through `let` (bind
`name`, bind `d(name)`, differentiate the body), per-branch through `if`,
and the builtin rules (`exp' = exp`, `relu' = step`, `step' = 0`).
`simplify` folds the `0.0`/`1.0` noise differentiation introduces.

**Tensor reverse mode** (`pull`): reverse-mode AD as an expression
transform. `pull e cbar` produces the gradient contribution of
subexpression `e` under cotangent `cbar`, maintaining the invariant
`rank(cbar) = rank(e)`. Contributions are `option`-typed so subtrees that
never mention the parameter produce no code at all. Key rules:

- `dot`: the pullbacks depend on operand ranks (matrix-matrix pulls back
  through `transpose`; vector-vector through scalar broadcast). Ranks are
  computed by `rank_of`, a mini shape analysis that mirrors typeinfer's
  rules; this is why tensor mode REQUIRES the parameter annotation: the
  transform runs before inference, so the annotation is the root fact
  rank analysis grows from.
- Broadcast reductions: when a scalar parameter meets a rank-1 tensor
  (`s * paths`), the pullback needs a sum. Bagl has no `sum`, but
  `dot(cbar, ones)` is the same thing, and `ones` is expressible as
  `0.0 * t + 1.0`. This one identity is what makes pathwise derivatives
  (Monte Carlo sensitivities) work. The rank-2 version needs a double
  reduction and is rejected.
- `let` in the body: the binding is preserved around the gradient
  expression, and uses of the name chain into its definition. Multiple
  uses sum naturally because each use site contributes separately.

The philosophy both modes share: **anything not handled is a
`Grad_error`, never a wrong number**. Outer products, calls, `letrec`,
conditions on the parameter: all diagnostics.

`expand_expr` threads the enclosing `let` bindings down the walk so the
rank analysis can see tensors bound OUTSIDE the lambda (the training data
a loss closes over). Forgetting that was a real bug: free variables
defaulted to scalar rank and `dot(x, w)` failed to rank.

## 4. Type inference (`src/typeinfer.ml` + `src/types.ml`)

Hindley-Milner with two unification domains.

**Types** are a mutable union-find graph: a type variable is a `ref` that
either links to another type or is unbound at some level. `unify` does
find + occurs check + link. Generalization is the level trick (Remy's
optimization, the same one OCaml uses): variables created inside a `let`
body carry that level, and `generalize` only quantifies variables deeper
than the current level, making let-polymorphism O(1) instead of scanning
the environment.

**Dimensions** are a parallel union-find domain: `SDimVar` refs with their
own `unify_dim` and occurs check. `TTensor(elem, shape)` unifies
element-wise and dimension-wise, which is the whole shape type system.
`infer_dot_shape` pattern-matches the four rank cases and unifies the
shared dimension; a mismatch is the `Dimension mismatch: 3 vs 2` caret
error.

Design points that repay study:

- **Deferred numeric defaulting.** Bagl has no type classes; `+` resolves
  by operand inspection. Originally, two unresolved operands were
  committed to `int` on the spot, which made inference order-dependent:
  `(x + 1.0) + x` worked but `(x + x) + 1.0` failed. Now unresolved
  operand pairs are unified with each other and pushed on
  `numeric_pending`; only at generalization time do still-unbound ones
  default to `int` (`default_numeric_vars`, called before every
  `generalize`). Result: order-independent, and `fn x -> x + x` is still
  `int -> int` as documented.
- **Annotation variables share by name.** `type_annot_to_ty` keeps one
  table per annotation, so both `'n`s in `tensor<float>['n,'n]` are the
  same variable and the annotation genuinely means square.
- **Tensor-op arguments unify.** An argument whose type is still a
  variable (a lambda parameter) is unified with a fresh rank-2 float
  tensor rather than rejected, which is what allows functions over
  tensors. The rank-2 default is a documented corner: annotate 1-D
  parameters.

## 5. IR and lowering (`src/ir.ml`)

The AST lowers to a control-flow-graph IR: functions of basic blocks with
explicit terminators (`TReturn`, `TJump`, `TBranch`) and virtual
registers. `if` creates then/else/merge blocks; both branches write the
same destination register (no phi nodes; see the optimizer caveat).

**The int-vs-float story, in full.** The VM has separate int and float
opcodes, and lowering picks them by asking the type checker about operand
types (`is_float_expr` re-runs `Typeinfer.infer_expr` on the
subexpression in a local type environment). That design has one failure
mode: if the local environment is missing a binding, inference fails, the
`try/with` defaults to "not float", and the VM gets an int opcode for
float data, crashing at runtime on well-typed programs. Three real bugs
came from exactly this, in order of discovery:

1. Lambda parameters were never added to the local type environment. The
   first-ever tensor autodiff test (`grad (fn x -> x * x) 3.0`, whose
   derivative body is `x + x`) crashed the VM and exposed it. Fix: seed
   the parameter's type into the nested `type_env` (from the annotation,
   or by inferring the lambda itself in the enclosing environment).
2. The letrec path passed the OUTER environment (without the recursive
   binding) to the nested body, so recursive call results lowered as int.
3. `rec_ty` itself was inferred by re-running inference on the letrec
   value WITHOUT the binding in scope, so it always failed to `TInt`. Fix:
   mirror typeinfer's own letrec protocol (fresh variable, extend, infer,
   unify).

The principled fix for the whole class is a typed AST from inference so
lowering never re-infers; that is the known next refactor.

Closure conversion happens here too: `collect_free_vars` computes
captures, and a `letrec` closure reserves a self-slot the VM back-patches
after allocation, which is how recursion works without global state.

## 6. Optimizer (`src/optimize.ml`)

Four passes over the IR: constant folding, dead-code elimination (fixpoint
over use counts), copy propagation, and common-subexpression elimination.
CSE is deliberately block-local: the IR is not SSA (both `if` branches
write one destination register), so a cross-block table could observe
conflicting facts. The folding and copy-prop passes share this
sensitivity to block order; full SSA with phi nodes is the structural fix
and the known ceiling of the current design.

## 7. Codegen (`src/codegen.ml`)

Two passes: emit with placeholder jump targets, then backpatch. One
subtlety earned its comment: locals are pre-allocated by scanning every
instruction of the function BEFORE emission (`num_locals`), because a
variable defined in one basic block and used in a later one must have its
slot known when the later block is emitted. The bug that forced this only
fired for top-level `if` whose branches used earlier bindings; the entire
test suite was green because no test happened to have that shape. The
regression tests for it are in the suite now, and `chunk.num_locals` also
sizes the VM's frame so 300 bindings cannot run off a fixed-size array.

## 8. VM (`src/vm.ml`) and serialization (`src/serialize.ml`)

A stack machine: operand stack, frame list, per-frame locals array sized
from the chunk. Values are `VInt | VFloat | VBool | VString | VUnit |
VTensor | VClosure`. The VM type-checks every pop (`pop_float` raises
`Expected float, got ...`), which is why the lowering bugs above crashed
loudly instead of corrupting data. That is a feature: an unsound compiler
plus a checking VM equals debuggable failures.

Tensors are flat float arrays plus shape and strides. `dot` is written
out per rank case, mirroring `infer_dot_shape` exactly; the element-wise
opcodes (`TADD` &hellip; `TDIV`) and math opcodes (`MEXP` &hellip; `MSTEP`)
resolve scalar-vs-tensor operands dynamically, and re-validate shapes at
runtime so hand-crafted bytecode cannot misalign memory. `log` and `sqrt`
raise on domain errors; nothing produces `nan` silently.

Serialization writes big-endian tagged opcodes. The tag tables (write and
read) are hand-maintained and MUST stay in sync; a mismatch corrupts
every `.baglc`. `read_int32` sign-extends, which sounds obvious and was
not: `0 - 5` used to round-trip as `4294967291`. The suite has
round-trip tests for exactly these.

## 9. Tooling

- **REPL** (`bin/main.ml`): bindings persist by textual accumulation.
  Each accepted `let` line is appended (with `in`) to a source prefix,
  and every later line compiles as prefix + line. Recompiling the prefix
  per line is trivially cheap at REPL scale, and closures, `letrec`, and
  `grad` all work in bindings because it is literally the same compiler
  path; there is no interpreter-level global environment to maintain.
- **LSP** (`lsp/lsp_main.ml`): hand-rolled Content-Length framed JSON-RPC
  over stdio. Runs the front half of the pipeline on every edit and
  converts the four span-carrying exceptions into LSP diagnostics
  (bagl is 1-based, LSP 0-based). Top-level `let` chains are split into
  synthetic declarations so hover can type individual bindings.
- **Browser** (`js/bagl_js.ml`): `Js.export` wraps the pipeline as
  `bagl.run(source)` returning `{ok, value, type}` or a structured error
  with span. js_of_ocaml compiles the whole compiler to ~150 KB; the
  playground and the language reference are static pages over that one
  function, and CI executes every example in the reference against it.

---

## The bug museum

Five bugs found in this codebase, each with a lesson:

| Bug | Root cause | Lesson |
|---|---|---|
| Well-typed float programs crashed the VM | Lowering re-infers in an env missing lambda params | A phase that re-derives another phase's answers will disagree with it eventually |
| `(x + x) + 1.0` rejected, `(x + 1.0) + x` fine | Eager int-defaulting mid-inference | Defaulting is a decision; decisions belong at generalization boundaries, not first contact |
| Top-level `if` crashed codegen | Locals allocated lazily per block | A green suite that only exercises one code shape is a false signal |
| `0 - 5` round-tripped as 4294967291 | No sign extension in `read_int32` | Serialization needs round-trip tests, not just write tests |
| Grover-style: works to N, noise past N | (from a sibling project) demos only went to N | Every feature works exactly as far as its tests exercise it and no further |

The first one is the best story: it was found not by a reviewer but by
the autodiff feature itself. The derivative of `x * x` is `x + x`, an
expression shape no human test had written. A new feature is a new test
generator.

## The exercise ladder

Do these in order, without looking at how the existing equivalents were
done first; compare after. Each is a full vertical slice.

1. **Add `%` (integer modulo).** Touches: `token.ml` (token + keyword-free
   operator lexing), `lexer.ml`, `parser.ml` (precedence: same as `*`),
   `ast.ml` (binop), `typeinfer.ml` (int only; what should `%` on floats
   do, and why?), `ir.ml`, `bytecode.ml`, `codegen.ml`, `serialize.ml`
   (BOTH tag tables), `vm.ml` (decide: what does `7 % 0` do?), and tests.
   When it works, ask: why did the exhaustiveness checker find most of
   these sites for you?
2. **Add `tanh` by following `exp`.** Same file list as the builtins.
   Include the scalar derivative rule (`tanh' = 1 - tanh^2`) in `diff`
   and the tensor pullback in `pull`. Write the numerical
   finite-difference test FIRST, watch it fail, then implement.
3. **Explain, in writing, why `grad` runs before type inference**, and
   what would have to change to run it after (hint: what would the
   transform gain, and what does `rank_of` currently reconstruct?). There
   is a real trade here; being able to argue both sides is the point.
4. **Break it on purpose.** Comment out the `default_numeric_vars` call in
   `ELet`, predict which three tests fail and why, then run the suite and
   check your prediction. Do the same for the letrec `rec_ty` protocol in
   `ir.ml`.

If you complete all four, you have touched every stage, both AD modes,
the serializer discipline, and the two subtlest invariants (defaulting
and lowering's type environment). That is "every inch" as an operational
definition, not a feeling.
