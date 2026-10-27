# Bagl design notes

Bagl is a statically typed functional language, and its compiler is written in OCaml. The notes below describe how the compiler is put together and why the main design choices were made.

## Pipeline

```
source -> lexer -> parser -> type inference -> CFG IR -> optimizer -> bytecode -> VM
```

The compiler runs a program through the following steps:

1. The lexer scans the source text into tokens.
2. The parser builds an AST (abstract syntax tree) from the tokens.
3. The autodiff step rewrites each `grad` call into ordinary code. The diagram above does not show the autodiff step, but it runs between the parser and type inference.
4. Type inference checks the program with Hindley-Milner inference, extended with tensor shapes.
5. The compiler lowers the program to an intermediate representation (IR) built as a control-flow graph (CFG), and it optimizes the IR.
6. Code generation turns the IR into stack bytecode, and a stack virtual machine runs the bytecode.

Bytecode can also be saved to a `.baglc` binary file and loaded again.

| Stage | Module | Responsibility |
|---|---|---|
| Lexer | `src/lexer.ml` | Hand-written scanner that tracks lines and columns and skips line and block comments |
| Parser | `src/parser.ml` | Recursive descent with precedence climbing, plus a small grammar for type annotations |
| Autodiff | `src/autodiff.ml` | Rewrites `grad` calls into ordinary functions before type inference |
| Types | `src/types.ml` | Union-find type and dimension variables, generalization and instantiation |
| Inference | `src/typeinfer.ml` | Hindley-Milner with levels, including unification, the occurs check and let-polymorphism |
| IR | `src/ir.ml` | Control-flow graph of basic blocks, and closure conversion |
| Optimizer | `src/optimize.ml` | Constant folding, dead-code elimination, copy propagation and CSE |
| Codegen | `src/codegen.ml` | Turns the IR into a flat opcode array and backpatches the jumps |
| Bytecode | `src/bytecode.ml` | Stack instruction set and disassembler |
| Serialize | `src/serialize.ml` | Binary bytecode format |
| VM | `src/vm.ml` | Stack machine with call frames, closures and tensor kernels |

## Design decisions

### OCaml as the implementation language
Algebraic data types and exhaustive pattern matching keep the definitions of the AST, IR and bytecode short and safe. OCaml's mutable `ref` cells also express the union-find graph for type inference directly. In Rust, the borrow checker would make the shared references in the union-find graph hard to write, and Bagl is small enough that Rust would bring no runtime benefit.

### Type variables as mutable union-find
Type variables are `ref` cells (`Unbound(id, level) | Link ty`) with path compression, which is the representation used by algorithm J. Path compression means that following a chain of links also shortens the chain for later lookups. Unification changes the cells in place, so in practice it runs in close to linear time. An immutable substitution map would make backtracking easier, but it adds a log factor and constant rewriting of trees. The mutable form is the standard choice for a checker that makes a single pass.

### Let-polymorphism by levels
The checker infers the value of a `let` at a higher level. It generalizes a variable only if the variable's level is deeper than the level of the surrounding scope. As a result, the checker doesn't scan the whole environment for free variables at every `let`. The method needs one extra step. When a variable unifies with a type from a shallower level, the variable's level must be lowered to match, and the inference code tracks the change.

### Tensor shapes as a second unification domain
Dimensions have their own union-find variables, separate from type variables, with their own unification and occurs check. `dot`, `transpose` and `reshape` pass shapes along and unify them. As a result, a shape mismatch is a type error at compile time instead of a crash at run time. For example, a `dot` of a `[2,3]` and a `[2,2]` is rejected. The shape checking is the most unusual part of the type system. Tensors currently have a fixed rank of 1 or 2. Element-wise arithmetic broadcasts a float scalar against a tensor, but two tensors in element-wise arithmetic must have the same shape.

### Numeric operators
Bagl has no type classes, so arithmetic and comparison operators choose their meaning by looking at the operand types. If either operand of an arithmetic operator is a tensor, the operation is element-wise. Otherwise, the operation is float if either operand is a float, and integer if not. When both operands are still unresolved, the checker ties them together and waits. Any that are still unresolved when their binding is generalized default to integer. The checker stays single-pass, at the cost of full numeric polymorphism, so `fn x -> x + x` is `int -> int`. The rule gives the same result for either operand order, and tests cover it. A cleaner design would add a `Num` constraint or type classes.

### Control-flow-graph IR
The IR is a graph of basic blocks. Each block records its predecessor and successor blocks, and it ends in a branch, jump or return terminator. The dataflow optimizations need the graph, e.g., liveness for dead-code elimination and tracing each copy to its source for copy propagation. The IR is not full SSA (static single assignment, where each register is written exactly once), so common subexpression elimination stays inside one block. SSA with phi nodes would be the next step, and it would let CSE work across blocks.

### Stack-based virtual machine
Generating code for a stack machine is close to mechanical, because the compiler emits the operands and then the operation. The bytecode is also compact and easy to serialize. A register VM would run fewer instructions, but it needs a register allocator. For a recursive closure, the VM allocates the closure with a reserved slot for itself, and it fills in the slot after construction.

### Source locations everywhere
Every token and AST node carries a span, which is a start and end position in the source. The parser merges spans as it builds larger nodes. Errors show the source line with a caret under the problem. Carrying spans from the start costs much less than adding them later.

## Testing

The suite in `test/test_bagl.ml` covers the lexer, the parser and the inferred types. It also runs programs end to end and checks their values, including tensor arithmetic, recursion, `grad` in both modes, and serialization round trips. The negative cases check that the compiler rejects a shape mismatch, an unbound variable, a non-boolean condition and an integer tensor literal at compile time. Run the suite with `dune test`. The language server has its own protocol test in `lsp/test`.

## Known limitations and future work
- A parameter annotation can't contain a bare arrow, because the arrow would be read as the end of the parameter. An arrow-typed parameter needs parentheses, as in `fn f: (int -> int) -> ...`.
- A lambda parameter used in a tensor operation defaults to rank 2, so a 1-D parameter needs an annotation.
- CSE only works inside one basic block. SSA would allow CSE and GVN (global value numbering) across blocks.
- Numeric operators default to integer instead of being fully polymorphic. A `Num` constraint would remove the shortcut.
