# Bagl compiler internals

The sections below walk through the compiler one stage at a time. For each module, they describe what the module does, the invariants it keeps (facts that must always hold), the design choices behind it, and the bugs that changed it. Read the document once from start to end, and then work through the exercises at the end. If you can do the exercises, you understand the compiler.

The compiler runs a program through the following stages, in order:

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

`bin/main.ml` runs the whole pipeline for the command-line tool and for the REPL, which is the interactive prompt. `js/bagl_js.ml` makes the same pipeline available in the browser. `lsp/lsp_main.ml` runs the stages up to and including type inference, and it sends the errors it finds to the editor as diagnostics.

---

## 1. Lexer (`src/lexer.ml`)

The lexer turns characters into tokens. It is written by hand without a lexer generator, and it looks at most two characters ahead (`peek` and `peek_next`). Every token carries a `span` from `location.ml`. A span holds a start position and an end position, and each position has a line and a column that count from 1, plus a byte offset. Spans are passed through every later stage, so any stage can point a caret at the right place in the source. Error messages are accurate in every stage because the lexer records the spans correctly.

Some details of the lexer are easy to miss:

- The keyword table is in `token.ml`. The lexer reads a whole identifier first, and then it looks the identifier up with `lookup_keyword`. `dot` and `exp` are keywords, but `grad` is not. `grad` is an ordinary identifier, so `grad (fn ...)` parses as an ordinary function application. The autodiff stage finds `grad` calls by matching on the application.
- One scan reads integers, decimals and exponents. Integer literals are converted with `int_of_string_opt`, so a literal that is too large, e.g., `99999999999999999999`, gives a lexer error instead of a crash.
- In a few places, the lexer moves `pos` and `col` back by one character so a helper function can read the character again. Moving back is safe because the character is never a newline, so the line count stays correct. The code is fragile. It is design debt, which means code that should be cleaned up later. Reading with two tokens of lookahead would remove the need to move back.

## 2. Parser (`src/parser.ml`)

The parser uses recursive descent, with one function for each grammar rule. The functions call each other as the grammar requires. Binary operators use precedence climbing (`precedence`, `parse_binary`). In precedence climbing, each operator has a binding strength, and the parser groups the stronger operators first. Function application is written by placing the argument after the function, as in `f x`. `parse_application` keeps reading primary expressions while the next token can start one. As a result, application groups to the left, and `f x y` means `(f x) y` with no extra code.

Some parser choices affect the rest of the language:

- A parameter annotation is parsed as a type without an arrow (`parse_param_annot_opt` instead of `parse_type_annot_opt`). In `fn x: int -> x`, the type parser must not take the arrow that belongs to the `fn`. An arrow-typed parameter therefore needs parentheses, as in `fn f: (int -> int) -> ...`. Before the fix, the type parser always took the arrow, so the annotation syntax could never parse. The bug lasted for more than a year.
- A tensor literal records the shape of its brackets. `ETensor` has a `matrix` flag, and the parser sets it from the bracket syntax. As a result, `[[1.0, 2.0]]` is a 1x2 matrix and `[1.0, 2.0]` is a vector. Without the flag, the two literals parse to the same tree. Bagl couldn't represent a 1xN matrix until the flag was added.
- The math builtins (`exp`, `log`, `sqrt`, `relu`, `step`) and the tensor operations (`dot`, `transpose`, `reshape`) are keywords with call syntax. The parser turns them directly into `EMath` and `ETensorOp` nodes. They are not functions, so a program can't pass them around as values. The restriction is a deliberate simplification.

## 3. Autodiff (`src/autodiff.ml`)

The autodiff stage is the most unusual stage in the compiler. It is a source-to-source transform, which means it rewrites one AST into another. It runs before type inference. It rewrites `grad (fn x -> body)` into an ordinary function that computes the derivative. As a result, the later stages (inference, IR, optimizer and VM) handle derivatives with no special cases, and the derivative is checked for types and shapes like any other code.

The stage has two modes, and `expand_expr` picks the mode from the parameter annotation. Tensor mode is used when the parameter has a tensor annotation. It is also used when the parameter has a `float` annotation and the body uses tensor syntax. Scalar mode is used in every other case.

Scalar forward mode, in `diff`, is symbolic differentiation. It keeps an environment that maps each variable to the expression for its derivative. The parameter maps to `1.0`, and every other free variable maps to `0.0`. The rules are the standard calculus rules for sums, products and quotients. For a `let`, the rewrite binds `name` and then binds its derivative `d(name)`, and then it differentiates the body with the chain rule. For an `if`, the rewrite differentiates each branch separately. The builtins have their own rules, e.g., `exp' = exp`, `relu' = step` and `step' = 0`. `simplify` then removes the extra `0.0` and `1.0` terms that differentiation adds.

Tensor reverse mode, in `pull`, is reverse-mode automatic differentiation written as an expression transform. `pull e cbar` produces the gradient contribution of the subexpression `e` for the cotangent `cbar`. The cotangent is the gradient of the final scalar result with respect to `e`, so it has the same rank as `e`. The invariant of `pull` is `rank(cbar) = rank(e)`. The rank is the number of dimensions, so it is 0 for a scalar, 1 for a vector and 2 for a matrix. Each contribution has an `option` type, so a subtree that never mentions the parameter produces no code at all. The main rules are the following:

- For `dot`, the pullback depends on the ranks of the operands. The pullback is the rule that turns the cotangent of a result into the cotangents of its operands. A matrix-matrix product pulls back through `transpose`, and a vector-vector product pulls back through a scalar broadcast. `rank_of` computes the ranks with a small shape analysis that copies the rules in typeinfer. The transform runs before inference, so the rank analysis has to start from the parameter annotation. Tensor mode therefore requires the annotation.
- When a scalar parameter is combined with a rank-1 tensor, as in `s * paths`, the pullback needs a sum. Bagl has no `sum`, but `dot(cbar, ones)` computes the same value. `ones` can be written as `0.0 * t + 1.0`. Pathwise derivatives, e.g., Monte Carlo sensitivities, work because the sum can be written as a `dot`. The rank-2 case would need a double reduction (a sum over both dimensions), so `grad` rejects it.
- For a `let` in the body, the rewrite keeps the binding around the gradient expression, and each use of the name chains into its definition. When the body uses the name more than once, the contributions add up. Each use contributes separately.

Both modes report anything they don't handle as a `Grad_error` instead of returning a wrong number. For example, outer products, function calls and `letrec` all give errors. In tensor mode, a condition that mentions the parameter also gives an error. Scalar mode allows such a condition, because it treats the condition as data and differentiates each branch.

`expand_expr` passes the enclosing `let` bindings down as it walks the tree. The rank analysis needs them to see tensors that are bound outside the lambda, e.g., the training data that a loss function closes over. An earlier version didn't pass them down, and the omission was a bug. Free variables then defaulted to scalar rank, and `rank_of` couldn't find a rank for `dot(x, w)`.

## 4. Type inference (`src/typeinfer.ml` + `src/types.ml`)

Type inference uses Hindley-Milner, the standard algorithm that finds the most general type of each expression without annotations. Bagl's version has two unification domains, one for types and one for tensor dimensions. Unification is the step that makes two types equal by binding their variables.

Types form a mutable union-find graph. In the graph, each type variable is a `ref` that either links to another type or is unbound at some level. `unify` first follows the links and runs the occurs check. The occurs check stops a variable from being bound to a type that contains it. `unify` then links the variable to the other type. Generalization turns a type with free variables into a polymorphic type, and it uses levels. The level method is Remy's optimization, and OCaml uses it too. Variables created while inferring the value of a `let` carry the level of the `let`, and `generalize` only quantifies variables whose level is deeper than the current level. As a result, generalization walks only the type and never scans the environment.

Dimensions form a second union-find domain that works in parallel. Dimension variables are `SDimVar` refs, and they have their own `unify_dim` and occurs check. Two `TTensor(elem, shape)` types unify by unifying their element types and then each pair of dimensions. Tensor unification is the whole shape type system. `infer_dot_shape` matches the four rank cases and unifies the shared dimension. A mismatch produces the `Dimension mismatch: 3 vs 2` error with a caret under the source.

The following design points are the hardest parts of the module:

- Numeric defaulting is deferred. Bagl has no type classes, so `+` chooses int or float by looking at its operands. At first, the checker set two unresolved operands to `int` as soon as it saw them. Inference then depended on the order of the code. For example, `(x + 1.0) + x` worked, but `(x + x) + 1.0` failed. Now the checker unifies two unresolved operands with each other and adds them to `numeric_pending`. Only at generalization time do the ones that are still unbound default to `int`. `default_numeric_vars` does the defaulting, and the checker calls it before every `generalize`. The result no longer depends on order. `fn x -> x + x` is still `int -> int`, as documented.
- Annotation variables with the same name are the same variable. `type_annot_to_ty` keeps one table for each annotation, so both `'n`s in `tensor<float>['n,'n]` are one variable. The annotation therefore means a square matrix.
- Arguments to tensor operations are unified. When an argument's type is still a variable, e.g., a lambda parameter, the checker unifies it with a new rank-2 float tensor type instead of rejecting it. Functions that take tensors work because of the unification. The rank-2 default is a documented limitation, so a 1-D parameter needs an annotation.

## 5. IR and lowering (`src/ir.ml`)

Lowering turns the AST into an IR (intermediate representation) that is a control-flow graph. The IR is made of functions, and each function is a set of basic blocks that use virtual registers. A basic block is a straight run of instructions that ends in one explicit terminator, `TReturn`, `TJump` or `TBranch`. An `if` creates a then block, an else block and a merge block. Both branches write the same destination register, because the IR has no phi nodes (see the note in the optimizer section). A phi node is an instruction that picks a value based on which branch ran.

Lowering has to choose between int and float opcodes, and the choice has caused several bugs. The VM has separate int and float opcodes, and lowering picks between them by asking the type checker for the operand types. `is_float_expr` runs `Typeinfer.infer_expr` again on the subexpression in a local type environment. The design fails in one way. If the local environment is missing a binding, inference fails. The `try/with` then treats the expression as not float. The VM then gets an int opcode for float data, and it stops with an error on a program that type-checks. Three bugs came from missing bindings, listed here in the order they were found:

1. Lambda parameters were never added to the local type environment. The first autodiff test, `grad (fn x -> x * x) 3.0`, exposed the bug, because its derivative body `x + x` crashed the VM. The fix adds the parameter's type to the nested `type_env`. The type comes from the annotation, or from inferring the whole lambda in the enclosing environment.
2. The `letrec` path passed the outer environment to the nested body, and the outer environment lacks the recursive binding. Results of recursive calls were therefore lowered as int.
3. `rec_ty` itself was inferred by running inference on the `letrec` value without the binding in scope, so it always fell back to `TInt`. The fix copies the `letrec` steps from typeinfer. It creates a fresh type variable and adds it to the environment, and then it infers the value and unifies the two.

The proper fix for the whole class of bugs is for inference to produce a typed AST, so that lowering never runs inference again. A typed AST is the next planned refactor.

Closure conversion also happens in lowering. Closure conversion turns each function into code plus a list of the outside variables it captures. `collect_free_vars` computes the captured variables. A `letrec` closure reserves a slot for itself, and the VM fills the slot after it allocates the closure. Recursion works through the slot, without any global state.

## 6. Optimizer (`src/optimize.ml`)

The optimizer has four passes over the IR:

- Constant folding computes operations on constants at compile time.
- Dead-code elimination (DCE) removes instructions whose results are never used. It repeats until the set of used registers stops changing.
- Copy propagation replaces each copied register with its original source.
- Common subexpression elimination (CSE) reuses an earlier result when the same operation appears again on the same operands.

The optimizer runs the passes in the following order: constant folding, copy propagation, CSE and DCE. It then runs copy propagation and DCE a second time.

CSE works only inside one basic block, by design. The IR is not in SSA form (static single assignment, where each register is written exactly once), because both branches of an `if` write one destination register. A table shared across blocks could therefore record facts that conflict. Constant folding and copy propagation depend on block order for the same reason. Full SSA with phi nodes is the general fix. The lack of SSA is the main limit of the current design.

## 7. Codegen (`src/codegen.ml`)

Code generation runs in two passes. The first pass emits code with placeholder jump targets. The second pass fills in the real targets, which is called backpatching. One detail has its own comment in the code. Before emitting anything, the code generator scans every instruction of the function and gives each defined variable a local slot. The slot count is stored in `num_locals`. A variable can be defined in one basic block and used in a later block. Its slot must be known when the later block is emitted, so the scan has to happen first. The bug that led to the scan only happened for a top-level `if` whose branches used earlier bindings. The whole test suite passed, because no test had such an `if`. The suite now has regression tests for the bug (`if_toplevel_var` and `if_toplevel_var_false`). `chunk.num_locals` also sets the size of the VM's frame, so a program with 300 bindings can't run past the end of a fixed-size array.

## 8. VM (`src/vm.ml`) and serialization (`src/serialize.ml`)

The VM is a stack machine. It has an operand stack, a list of frames, and a locals array for each frame that is sized from the chunk. A chunk is the bytecode for one function. Values are `VInt | VFloat | VBool | VString | VUnit | VTensor | VClosure`. The VM checks the type of every value it pops, e.g., `pop_float` raises `Expected float, got ...`. Because of the checks, the lowering bugs above stopped the VM with a clear error instead of corrupting data. The checks are deliberate. When the compiler has a type bug, the checking VM turns it into a failure that is easy to debug.

A tensor is a flat array of floats plus a shape and strides. The strides give the step through the flat array for each dimension. `dot` is written out for each rank case, and the cases match `infer_dot_shape` exactly. The element-wise opcodes (`TADD` to `TDIV`) and the math opcodes (`MEXP` to `MSTEP`) check at run time whether each operand is a scalar or a tensor. They also check shapes again at run time, so hand-written bytecode can't misalign memory. `log` and `sqrt` raise an error on inputs outside their domain instead of returning `nan`.

Serialization writes each opcode as a numeric tag, and it writes integers in big-endian byte order. The write table and the read table are maintained by hand, and they must stay in sync. A mismatch corrupts every `.baglc` file. `read_int32` sign-extends. In other words, when it reads 4 bytes into a larger integer, it keeps a negative number negative. The step seems obvious, but it was missing at first. `0 - 5` was then read back as `4294967291`. The suite has round-trip tests for the tensor and math opcodes and for negative integers.

## 9. Tooling

- The REPL (`bin/main.ml`) keeps bindings by building up source text. Each accepted `let` or `letrec` line is added to a source prefix with `in` after it, and every later line compiles as the prefix followed by the line. Compiling the prefix again for each line costs very little at REPL scale. Closures, `letrec` and `grad` all work in bindings, because the REPL uses the same compiler path. There is no separate global environment to maintain.
- The LSP server (`lsp/lsp_main.ml`) implements the Language Server Protocol, which editors use to get errors and type information. It implements JSON-RPC by hand over standard input and output, with a `Content-Length` header before each message. On every edit, it runs the stages up to type inference, and it turns the four exceptions that carry spans into LSP diagnostics. Bagl counts lines and columns from 1, and LSP counts from 0. The server converts between the two. For hover, the server splits top-level `let` chains into separate declarations, so it can report the type of each binding.
- The browser build (`js/bagl_js.ml`) uses `Js.export` to wrap the pipeline as `bagl.run(source)`. The function returns `{ok, value, type}` on success. On failure, it returns a structured error, which includes a span for compile errors. js_of_ocaml compiles the whole compiler to about 160 KB of JavaScript (50 KB compressed). The playground and the language reference are static pages that call `bagl.run`, and CI runs every example in the reference through it.

---

## Bugs found during development

The table lists bugs found while building Bagl, plus one from a related project, with the cause of each one and the lesson it taught.

| Bug | Root cause | Lesson |
|---|---|---|
| Well-typed float programs crashed the VM | Lowering runs inference again in an environment that lacks the lambda parameters | A stage that recomputes another stage's results will eventually disagree with it |
| `(x + x) + 1.0` was rejected, but `(x + 1.0) + x` worked | The checker defaulted operands to int too early, during inference | Defaulting is a decision, and decisions belong at generalization, not at the first use of a variable |
| A top-level `if` crashed codegen | Locals were allocated lazily, one block at a time | A passing suite that only tests one shape of code gives false confidence |
| `0 - 5` was read back as 4294967291 | `read_int32` did not sign-extend | Serialization needs round-trip tests, not only write tests |
| A Grover search demo worked up to N and gave noise beyond N | The demos only went up to N (from a related project) | A feature works only as far as its tests check it |

The first bug in the table was found by the autodiff feature and not by a reviewer. The derivative of `x * x` is `x + x`, an expression that no hand-written test had produced. A new feature creates new test cases for the rest of the compiler.

## Exercises

Do the exercises in order. For each one, don't look at how the existing similar feature was built until you finish, and then compare the two. Each exercise goes through the compiler from the front end to the back end.

1. Add `%` (integer modulo). The change touches the following files:
   - `token.ml` (a new token for the operator, which is not a keyword), `lexer.ml`, and `parser.ml` (the same precedence as `*`)
   - `ast.ml` (a new binop) and `typeinfer.ml` (int only)
   - `ir.ml`, `bytecode.ml` and `codegen.ml`
   - `serialize.ml` (both tag tables), `vm.ml`, and the tests

   Decide what `%` on floats should do, and why. Also decide what `7 % 0` does. When it works, ask yourself why OCaml's exhaustiveness checker found most of the places you had to change. The exhaustiveness checker warns when a pattern match misses a case.
2. Add `tanh` by following how `exp` is built. The list of files is the same as for the other builtins. Include the scalar derivative rule (`tanh' = 1 - tanh^2`) in `diff` and the tensor pullback in `pull`. Write the numerical finite-difference test first and watch it fail. Then implement the feature.
3. Explain in writing why `grad` runs before type inference, and what would have to change to run it after inference. As a hint, think about what the transform would gain, and about what `rank_of` rebuilds today. Both choices have costs, and the goal is to be able to argue both sides.
4. Break the compiler on purpose. Comment out the `default_numeric_vars` call in the `ELet` case. Predict which three tests fail and why, and then run the suite to check your prediction. Do the same for the `letrec` `rec_ty` steps in `ir.ml`.

If you finish all four exercises, you will have worked on every stage and on both autodiff modes. You will also have worked with the serializer's tag tables and with the two hardest invariants, which are numeric defaulting and the type environment used in lowering. Finishing them is a practical test of whether you know the whole compiler.
