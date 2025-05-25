# BAGL Language Specification

## 1. Introduction

### 1.1 Overview

**BAGL** (Basic Array/Graph Language) is a statically-typed functional programming language with first-class tensor support and compile-time shape checking. It combines the expressiveness of functional programming with the safety of static typing, making it particularly suited for numerical computing and array-oriented programming.

### 1.2 Key Features

- **Static Typing**: Full Hindley-Milner type inference with let-polymorphism
- **First-Class Tensors**: Native tensor types with compile-time shape verification
- **Functional Paradigm**: First-class functions, closures, and higher-order functions
- **Shape Polymorphism**: Dimension variables enable generic tensor operations
- **Compile-Time Safety**: Shape mismatches caught at compile time, not runtime

### 1.3 Design Goals

1. **Safety**: Catch dimension mismatches and type errors at compile time
2. **Expressiveness**: Support common functional programming patterns
3. **Simplicity**: Minimal but complete language core
4. **Predictability**: Clear, deterministic semantics

### 1.4 Implementation

BAGL is implemented as a compiler in OCaml (~4,244 lines) with the following pipeline:

```
Source Code → Lexer → Parser → AST → Type Inference → IR → Optimization → Bytecode → VM
```

The implementation includes:
- Hand-written lexer with full source location tracking
- Recursive descent parser
- Hindley-Milner type inference with dimension variables
- Graph-based intermediate representation with basic blocks
- Four optimization passes (constant folding, DCE, copy propagation, CSE)
- Stack-based virtual machine with closure support

### 1.5 Example Program

```bagl
(* Matrix multiplication with compile-time shape checking *)
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]] in
let c = dot(a, b) in  (* Result has shape [2,2] *)
transpose(c)          (* Result has shape [2,2] *)
```

```bagl
(* Higher-order functions *)
let compose = fn f -> fn g -> fn x -> f (g x) in
let double = fn x -> x * 2 in
let inc = fn x -> x + 1 in
compose double inc 5  (* Result: 12 *)
```

```bagl
(* Recursive functions *)
letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 5  (* Result: 120 *)
```

### 1.6 Document Structure

This specification is organized as follows:

| Chapter | Content |
|---------|---------|
| 02 - Lexical Structure | Tokens, keywords, literals, comments |
| 03 - Grammar | Formal EBNF grammar |
| 04 - Types | Type system and tensor types |
| 05 - Expressions | All expression forms |
| 06 - Type Inference | Hindley-Milner algorithm |
| 07 - Tensor Semantics | Shape checking and operations |
| 08 - Runtime | VM architecture and execution |
| 09 - Bytecode | Instruction set specification |

### 1.7 Notation Conventions

- `code` indicates literal syntax or identifiers
- *italics* indicates metavariables
- `[...]` indicates optional elements
- `{...}` indicates zero or more repetitions
- `|` indicates alternatives
