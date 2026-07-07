# BAGL

[![CI](https://github.com/AbdelRahm4n/bagl/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdelRahm4n/bagl/actions/workflows/ci.yml)
![OCaml](https://img.shields.io/badge/OCaml-5.2-orange)
![Tests](https://img.shields.io/badge/tests-46%20passing-brightgreen)

A statically-typed functional programming language with first-class tensor support and compile-time shape checking.

| Shape errors caught at compile time | REPL with Hindley-Milner inference |
|---|---|
| ![Compile-time shape checking](docs/screenshots/shape-error.png) | ![REPL](docs/screenshots/repl.png) |

## Features

- **Hindley-Milner Type Inference** - Full type inference with let-polymorphism
- **First-Class Tensors** - Native tensor types with compile-time dimension checking
- **Dimension Variables** - Polymorphic tensor operations with shape inference
- **Functional Core** - First-class functions, closures, and recursion
- **Stack-Based VM** - Efficient bytecode execution
- **Bytecode Serialization** - Compile once, run anywhere with `.baglc` files

## Installation

Requires OCaml 4.14+ and dune.

```bash
# Clone the repository
git clone https://github.com/AbdelRahm4n/bagl.git
cd bagl

# Build
dune build

# Run tests
dune test

# Install locally
dune install
```

## Usage

### REPL

```bash
dune exec baglc
```

```
Bagl REPL v0.1
Type :quit to exit, :type <expr> to show type

> 1 + 2
= 3 : int

> let square = fn x -> x * x in square 5
= 25 : int

> :type fn x -> x + 1
: int -> int

> :quit
```

### Run a File

```bash
dune exec baglc -- examples/hello.bagl
```

### Compile to Bytecode

```bash
dune exec baglc -- -c program.bagl -o program.baglc
dune exec baglc -- program.baglc
```

## Language Overview

### Basic Types

```
int       -- integers: 42, -17
float     -- floats: 3.14, -0.5
bool      -- booleans: true, false
string    -- strings: "hello"
```

Tensors are always float-backed, so tensor element types are `float`.

### Numeric Operators

Bagl has no type classes, so the arithmetic and comparison operators
(`+ - * /` and `< > <= >=`) are resolved by inspecting their operands:
if either side is a float the operation is float, otherwise it is int.
The rule is symmetric, so `x + 1.0` and `1.0 + x` behave identically.
When both operands are unconstrained the operation defaults to int, so
`fn x -> x + x` is inferred as `int -> int`. This trades full principal
types for a single-pass checker with no overloading machinery.

### Functions

Functions take a single parameter; multiple arguments are curried with
nested `fn`. Recursive bindings use `letrec`.

```ml
-- Anonymous, curried functions
let add = fn x -> fn y -> x + y in add 2 3

-- Recursive functions
letrec factorial = fn n ->
  if n <= 1 then 1
  else n * factorial (n - 1)
in factorial 5
```

### Tensors

```ml
-- 1D tensor (vector) and 2D tensor (matrix)
let v = [1.0, 2.0, 3.0] in
let m = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in

dot(m, v)                          -- matrix-vector product -> [2]
```

```ml
transpose([[1.0, 2.0], [3.0, 4.0]])   -- transpose -> [2, 2]
reshape([1.0, 2.0, 3.0, 4.0], [2, 2]) -- reshape   -> [2, 2]
```

### Type Annotations

```ml
let x: int = 42 in
let f: int -> int = fn x -> x + 1 in
let t: tensor<float>[2, 3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
f x
```

### Tensor Type System

Tensor shapes are checked at compile time. `dot` unifies the shared
dimension, so an incompatible product is a type error before the program
ever runs:

```ml
-- (2x3) . (3x2) type-checks and yields a (2x2)
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]] in
dot(a, b)

-- (2x3) . (2x2) is rejected: "Dimension mismatch: 3 vs 2"
```

Shape annotations may use dimension variables (written `'n`), which the
checker solves against concrete literals, e.g. `[1.0, 2.0, 3.0] : ['n]`.

## Project Structure

```
bagl/
├── src/
│   ├── location.ml    -- Source location tracking
│   ├── token.ml       -- Token definitions
│   ├── lexer.ml       -- Lexical analysis
│   ├── ast.ml         -- Abstract syntax tree
│   ├── parser.ml      -- Recursive descent parser
│   ├── types.ml       -- Type definitions
│   ├── typeinfer.ml   -- Hindley-Milner inference
│   ├── ir.ml          -- Intermediate representation
│   ├── optimize.ml    -- IR optimization passes
│   ├── bytecode.ml    -- Bytecode definitions
│   ├── codegen.ml     -- Code generation
│   ├── serialize.ml   -- Bytecode serialization
│   ├── vm.ml          -- Virtual machine
│   └── errors.ml      -- Error handling
├── bin/
│   └── main.ml        -- CLI entry point
├── examples/          -- Example programs
├── test/              -- Test suite
└── docs/
    └── language-spec/ -- Full language specification
```

## Documentation

See [docs/language-spec/](docs/language-spec/) for the complete language specification:

1. [Introduction](docs/language-spec/01-introduction.md)
2. [Lexical Structure](docs/language-spec/02-lexical-structure.md)
3. [Grammar](docs/language-spec/03-grammar.md)
4. [Types](docs/language-spec/04-types.md)
5. [Expressions](docs/language-spec/05-expressions.md)
6. [Type Inference](docs/language-spec/06-type-inference.md)
7. [Tensor Semantics](docs/language-spec/07-tensor-semantics.md)
8. [Runtime](docs/language-spec/08-runtime.md)
9. [Bytecode Specification](docs/language-spec/09-bytecode-spec.md)

## License

MIT
