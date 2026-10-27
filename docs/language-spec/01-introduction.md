# Bagl language specification

## 1. Introduction

### 1.1 Overview

Bagl (Basic Array/Graph Language) is a small functional programming language with static types and built-in tensors. A tensor is an array with one or more dimensions, e.g., a vector or a matrix. The type of a tensor includes its shape, so the compiler checks that tensor shapes fit together before the program runs. Bagl is meant for numerical code that works on arrays.

### 1.2 Key features

- Bagl uses Hindley-Milner type inference with let-polymorphism. Hindley-Milner is the standard method for working out types without annotations, and let-polymorphism means a function bound with `let` can be used at more than one type.
- Tensors are built into the language, and the compiler checks their shapes at compile time.
- Functions are values, so you can pass them as arguments and return them from other functions. A function can also capture variables from the place where it was defined, and the function together with the captured variables is called a closure.
- Shapes can contain dimension variables, e.g., `'n`, so one function can work on tensors of many sizes.
- `grad` turns a function into a new function that computes its derivative, which is called automatic differentiation.
- The compiler reports a shape mismatch at compile time, before the program runs.

### 1.3 Design goals

1. Safety means that the compiler catches dimension mismatches and type errors at compile time.
2. Expressiveness means that the language supports the common patterns of functional programming.
3. Simplicity means that the core of the language is small, but complete.
4. Predictability means that every construct has clear and deterministic behavior.

### 1.4 Implementation

The Bagl compiler is written in OCaml, and its source in `src/` is about 5,200 lines. It runs a program through the following stages:

```
Source Code → Lexer → Parser → AST → grad Expansion → Type Inference → IR → Optimization → Bytecode → VM
```

The implementation has the following parts:
- A lexer written by hand, which records the source location of every token.
- A recursive descent parser, which has one function for each grammar rule.
- A `grad` expansion pass, which rewrites each `grad (fn x -> ...)` into an ordinary function that computes the derivative. The pass runs before type inference, so the derivative is type checked like any other code.
- Hindley-Milner type inference, extended with dimension variables.
- An intermediate representation (IR) built from basic blocks. A basic block is a run of instructions with no jumps into or out of its middle.
- Four optimization passes, which are constant folding, dead code elimination (DCE), copy propagation, and common subexpression elimination (CSE).
- A virtual machine (VM) that keeps its working values on a stack and supports closures.

### 1.5 Example program

```bagl
// Matrix multiplication with compile-time shape checking
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]] in
let c = dot(a, b) in  // Result has shape [2,2]
transpose(c)          // Result has shape [2,2]
```

```bagl
// Higher-order functions
let compose = fn f -> fn g -> fn x -> f (g x) in
let double = fn x -> x * 2 in
let inc = fn x -> x + 1 in
compose double inc 5  // Result: 12
```

```bagl
// Recursive functions
letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 5  // Result: 120
```

### 1.6 Document structure

The specification has nine chapters, listed in the table below.

| Chapter | Content |
|---------|---------|
| 02, Lexical structure | Tokens, keywords, literals, and comments |
| 03, Grammar | The formal grammar in EBNF |
| 04, Types | The type system and tensor types |
| 05, Expressions | Every kind of expression |
| 06, Type inference | The Hindley-Milner algorithm |
| 07, Tensor semantics | Shape checking and tensor operations |
| 08, Runtime | How the VM is built and how it runs a program |
| 09, Bytecode | The instruction set |

### 1.7 Notation conventions

- Text in `code` font is literal syntax or an identifier.
- Text in *italics* is a metavariable, which is a placeholder for any piece of syntax of the named kind.
- `[...]` marks an optional element.
- `{...}` marks an element that can repeat zero or more times.
- `|` separates alternatives.
