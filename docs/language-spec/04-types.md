# 4. Type System

BAGL features a static type system based on Hindley-Milner with extensions for tensor types and dimension polymorphism.

## 4.1 Base Types

### Primitive Types

| Type | Description | Examples |
|------|-------------|----------|
| `int` | Machine integers | `0`, `42`, `-17` |
| `float` | IEEE 754 double-precision | `3.14`, `-0.5`, `1e10` |
| `bool` | Boolean values | `true`, `false` |
| `string` | UTF-8 strings | `"hello"`, `""` |
| `()` | Unit type (internal) | Unit value |

### Type Syntax

```bagl
int                    (* Integer type *)
float                  (* Float type *)
bool                   (* Boolean type *)
string                 (* String type *)
```

## 4.2 Function Types

Function types use the arrow `->` notation:

```
T1 -> T2
```

Where `T1` is the parameter type and `T2` is the return type.

### Properties

- **Right-associative**: `A -> B -> C` means `A -> (B -> C)`
- **Curried by default**: Multi-argument functions are chains of single-argument functions

### Examples

```bagl
int -> int                      (* int to int function *)
int -> int -> int               (* Curried two-argument function *)
(int -> int) -> int             (* Function taking a function *)
tensor<float>[2,3] -> float     (* Tensor to scalar *)
```

## 4.3 Tensor Types

Tensors are multi-dimensional arrays with statically known shapes:

```
tensor<E>[D1, D2, ..., Dn]
```

Where:
- `E` is the element type (typically `int` or `float`)
- `Di` are dimension specifications

### Dimension Specifications

Dimensions can be:

1. **Concrete**: Integer constants like `2`, `3`, `100`
2. **Variables**: Dimension variables like `'n`, `'m` for polymorphism

### Examples

```bagl
tensor<float>[3]           (* 1D tensor with 3 elements *)
tensor<float>[2, 3]        (* 2x3 matrix *)
tensor<int>[4, 4, 4]       (* 3D tensor *)
tensor<float>['n, 'm]      (* Matrix with variable dimensions *)
tensor<float>['n, 'n]      (* Square matrix *)
```

### Shape Rank

The **rank** of a tensor is the number of dimensions:
- Rank 0: Scalar (empty shape `[]`)
- Rank 1: Vector (`[n]`)
- Rank 2: Matrix (`[m, n]`)
- Rank 3+: Higher-dimensional tensor

## 4.4 Type Variables

Type variables enable polymorphism (generic types):

```bagl
'a                    (* Type variable *)
'a -> 'a              (* Identity function type *)
'a -> 'b -> 'a        (* Constant function type *)
```

### Type Variable Naming

- Type variables are written with a leading quote: `'a`, `'b`, `'foo`
- By convention, single letters are used: `'a`, `'b`, `'c`

## 4.5 Type Schemes (Polymorphism)

A **type scheme** quantifies type variables:

```
forall 'a 'b 'n. T
```

Type schemes arise from `let` bindings (let-polymorphism):

```bagl
let id = fn x -> x in      (* id : forall 'a. 'a -> 'a *)
let _ = id 5 in            (* Instantiated to int -> int *)
let _ = id true in         (* Instantiated to bool -> bool *)
id
```

### Generalization Rules

A type variable is generalized if:
1. It is not free in the surrounding environment
2. It was introduced at a deeper level than the current binding

## 4.6 Type Annotations

Type annotations constrain inferred types:

### Binding Annotations

```bagl
let x: int = 5 in ...
let f: int -> int = fn x -> x + 1 in ...
```

### Parameter Annotations

```bagl
fn x: int -> x + 1
fn f: (int -> int) -> f 5
```

### Tensor Annotations

```bagl
let v: tensor<float>[3] = [1.0, 2.0, 3.0] in ...
let m: tensor<float>[2, 2] = [[1.0, 2.0], [3.0, 4.0]] in ...
```

## 4.7 Type Compatibility

### Subtyping

BAGL does not have subtyping. Types must match exactly (up to unification).

### Numeric Coercion

There is no implicit coercion between `int` and `float`. Operations are type-specific:

```bagl
1 + 2          (* int + int = int *)
1.0 + 2.0      (* float + float = float *)
1 + 2.0        (* Type error: cannot unify int with float *)
```

### Tensor Element Types

Tensor operations preserve element types:

```bagl
let a: tensor<float>[2,3] = ... in
let b: tensor<float>[3,2] = ... in
dot(a, b)      (* Result: tensor<float>[2,2] *)
```

## 4.8 Type Equality

Two types are equal if they have the same structure:

| Type 1 | Type 2 | Equal? |
|--------|--------|--------|
| `int` | `int` | Yes |
| `int` | `float` | No |
| `int -> int` | `int -> int` | Yes |
| `int -> int` | `int -> float` | No |
| `tensor<float>[2,3]` | `tensor<float>[2,3]` | Yes |
| `tensor<float>[2,3]` | `tensor<float>[3,2]` | No |
| `'a -> 'a` | `'b -> 'b` | Yes (after renaming) |

## 4.9 Type Errors

Common type errors:

### Type Mismatch

```bagl
let x: int = true    (* Error: Cannot unify int with bool *)
```

### Dimension Mismatch

```bagl
let a: tensor<float>[2,3] = [[1.0, 2.0], [3.0, 4.0]] in
(* Error: Dimension mismatch: 2 vs 3 *)
```

### Unbound Variable

```bagl
x + 1    (* Error: Unbound variable: x *)
```

### Shape Rank Mismatch

```bagl
let v: tensor<float>[3] = [1.0, 2.0, 3.0] in
transpose(v)    (* Error: transpose requires 2D tensor *)
```

## 4.10 Type Representation (Internal)

Internally, types are represented as:

```ocaml
type ty =
  | TInt
  | TFloat
  | TBool
  | TString
  | TUnit
  | TTensor of ty * shape
  | TArrow of ty * ty
  | TVar of tvar ref        (* Unification variable *)

type shape_dim =
  | SDimConst of int        (* Concrete dimension *)
  | SDimVar of dim_var ref  (* Dimension variable *)
```

Type variables use mutable references for efficient unification with path compression.
