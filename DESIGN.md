# Bagl Design Notes

Bagl is a statically typed functional language with a complete compiler written in OCaml. This document explains the architecture and the reasoning behind the main design decisions.

## Pipeline

```
source -> lexer -> parser -> type inference -> CFG IR -> optimizer -> bytecode -> VM
```

Source text is scanned into tokens, parsed into an AST, type-checked with Hindley-Milner inference (extended with tensor-shape typing), lowered to a control-flow-graph intermediate representation, optimized, compiled to stack bytecode, and executed on a stack virtual machine. Bytecode can be serialized to a `.baglc` binary and reloaded.

| Stage | Module | Responsibility |
|---|---|---|
| Lexer | `src/lexer.ml` | Hand-written scanner with line/column tracking and nested block comments |
| Parser | `src/parser.ml` | Recursive descent with precedence climbing; type-annotation sub-grammar |
| Types | `src/types.ml` | Union-find type and dimension variables, generalization, instantiation |
| Inference | `src/typeinfer.ml` | Level-based Hindley-Milner: unification, occurs check, let-polymorphism |
| IR | `src/ir.ml` | Control-flow graph of basic blocks; closure conversion |
| Optimizer | `src/optimize.ml` | Constant folding, dead-code elimination, copy propagation, CSE |
| Codegen | `src/codegen.ml` | Lowers IR to a flat opcode array with back-patched jumps |
| Bytecode | `src/bytecode.ml` | Stack instruction set and disassembler |
| Serialize | `src/serialize.ml` | Binary bytecode format |
| VM | `src/vm.ml` | Stack machine with call frames, closures, and tensor kernels |

## Design decisions

### Implementation language: OCaml
Algebraic data types and exhaustive pattern matching make the AST, IR, and bytecode definitions concise and safe, and OCaml's mutable `ref`-cell graphs express union-find type inference directly. The alternative of Rust would turn the aliased union-find graph into a borrow-checker problem for no runtime benefit at this scale.

### Type variables as mutable union-find
Type variables are `ref` cells (`Unbound(id, level) | Link ty`) with path compression, the algorithm-J representation. Unification mutates in place, so it is effectively near-linear. The alternative of an immutable substitution map is easier to backtrack but adds a log factor and constant tree rewriting; for a single-pass checker the mutable form is standard.

### Let-polymorphism by levels
A `let`'s bound value is inferred at a bumped level, and a variable is generalized only if its level is deeper than the surrounding scope. This avoids scanning the whole environment for free variables at every `let`. It requires lowering a variable's level when it unifies with a shallower one, which the inference tracks.

### Tensor shapes as a second unification domain
Dimensions are their own union-find variables with their own unification and occurs check, parallel to type variables. `dot`, `transpose`, and `reshape` propagate and unify shapes, so a shape mismatch such as multiplying a `[2,3]` by a `[2,2]` is a compile-time type error rather than a runtime crash. This is the most distinctive part of the type system. Current scope: fixed rank (1D and 2D), no broadcasting.

### Numeric operators
Bagl has no type classes, so arithmetic and comparison operators resolve by inspecting operand types: if either operand is a float the operation is float, otherwise integer, and fully unconstrained operands default to integer. This keeps the checker single-pass at the cost of full numeric polymorphism (`fn x -> x + x` is `int -> int`). The behavior is symmetric in the operands and covered by tests. A principled extension would add a `Num` constraint or type classes.

### Control-flow-graph IR
The IR is a graph of basic blocks with explicit predecessor and successor edges and branch or jump terminators. This is the substrate the dataflow optimizations need: liveness for dead-code elimination and source chasing for copy propagation. It is not full SSA, so common-subexpression elimination stays block-local; SSA with phi nodes would be the next step to make it cross blocks.

### Stack-based virtual machine
Codegen to a stack machine is close to mechanical (emit operands, then the operation) and the bytecode is dense and easy to serialize. A register VM would cut instruction count but requires a register allocator. Recursive closures are handled by allocating the closure with a reserved self-slot and back-patching it after construction.

### Source locations everywhere
Every token and AST node carries a span, spans merge as the parser builds up, and errors render with the offending source line and a caret underline. Carrying spans from the start is far cheaper than retrofitting them.

## Testing

The suite (`test/test_bagl.ml`) covers the lexer, parser, type results, end-to-end execution with value assertions (including tensor arithmetic results and recursion), and negative cases (shape mismatch, unbound variable, non-boolean condition, and integer tensor literals are all rejected at compile time). Run with `dune test`.

## Known limitations and future work
- Parameter type annotations (`fn x: int -> ...`) collide with the function-arrow grammar and are not supported; annotate at the `let` binding instead.
- Element-wise tensor arithmetic type-checks but has no VM opcode yet.
- Optimization is block-local; SSA would enable cross-block CSE and GVN.
- Numeric operators default to integer rather than being fully polymorphic; a `Num` constraint would remove the shortcut.
