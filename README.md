# BAGL

A statically-typed functional programming language with first-class tensor support and compile-time shape checking.

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
dune exec bagl
```

```
BAGL v0.1.0
Type expressions to evaluate, or :help for commands.

> 1 + 2
3 : int

> let square = fn x -> x * x in square 5
25 : int

> :quit
```

### Run a File

```bash
dune exec bagl -- examples/hello.bagl
```

### Compile to Bytecode

```bash
dune exec bagl -- -c program.bagl -o program.baglc
dune exec bagl -- program.baglc
```

## Language Overview

### Basic Types

```
int       -- integers: 42, -17
float     -- floats: 3.14, -0.5
bool      -- booleans: true, false
string    -- strings: "hello"
unit      -- unit: ()
```

### Functions

```ml
-- Anonymous functions
let add = fn x y -> x + y in add 2 3

-- Recursive functions
let rec factorial = fn n ->
  if n <= 1 then 1
  else n * factorial (n - 1)
in factorial 5
```

### Tensors

```ml
-- 1D tensor (vector)
let v = [1.0, 2.0, 3.0] in

-- 2D tensor (matrix)
let m = [[1.0, 2.0], [3.0, 4.0]] in

-- Tensor operations
let result = dot(m, v) in        -- matrix-vector multiply
let t = transpose(m) in          -- transpose
let r = reshape(v, [3, 1]) in    -- reshape
```

### Type Annotations

```ml
let x: int = 42 in
let f: int -> int = fn x -> x + 1 in
let t: tensor<float>[2, 3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
```

### Tensor Type System

BAGL infers tensor dimensions at compile time:

```ml
-- Dimension variables ensure shape compatibility
let matmul: tensor<float>[m, n] -> tensor<float>[n, p] -> tensor<float>[m, p] =
  fn a b -> dot(a, b)
```

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
