# 4. Type system

Bagl has a static type system based on Hindley-Milner, with two extensions. The first extension adds tensor types. The second adds dimension polymorphism, which lets one function accept tensors of many sizes.

## 4.1 Base types

### Primitive types

| Type | Description | Examples |
|------|-------------|----------|
| `int` | Integers, stored as OCaml `int` values | `0`, `42`, `-17` |
| `float` | IEEE 754 double-precision numbers | `3.14`, `-0.5`, `1e10` |
| `bool` | Boolean values | `true`, `false` |
| `string` | UTF-8 text | `"hello"`, `""` |
| `()` | Unit type, used only inside the compiler | The unit value |

### Type syntax

```text
int                    // Integer type
float                  // Float type
bool                   // Boolean type
string                 // String type
```

## 4.2 Function types

A function type is written with an arrow, `->`.

```
T1 -> T2
```

In the type above, `T1` is the parameter type, and `T2` is the return type.

### Properties

- The arrow groups to the right, so `A -> B -> C` means `A -> (B -> C)`.
- Functions are curried. A function of several arguments is a function of one argument that returns another function, which takes the next argument.

### Examples

```text
int -> int                      // int to int function
int -> int -> int               // Curried two-argument function
(int -> int) -> int             // Function taking a function
tensor<float>[2,3] -> float     // Tensor to scalar
```

## 4.3 Tensor types

A tensor is an array of numbers, and the compiler knows its shape at compile time. A tensor type has the following form.

```
tensor<E>[D1, D2, ..., Dn]
```

In the form above, `E` is the element type, and each `Di` gives the size of one dimension. The element type must be `float`, because the type checker requires float elements in every tensor value. The VM also stores every tensor element as a float.

### Dimension specifications

A dimension can take one of two forms:

1. A concrete size, which is an integer constant, e.g., `2`, `3`, or `100`.
2. A dimension variable, e.g., `'n` or `'m`, which stands for a size that the compiler works out from how the tensor is used.

### Examples

```text
tensor<float>[3]           // 1D tensor with 3 elements
tensor<float>[2, 3]        // 2x3 matrix
tensor<float>[4, 4, 4]     // 3D tensor
tensor<float>['n, 'm]      // Matrix with variable dimensions
tensor<float>['n, 'n]      // Square matrix
```

### Shape rank

The rank of a tensor is the number of its dimensions.
- A tensor of rank 0 is a scalar, and its shape is empty, `[]`.
- A tensor of rank 1 is a vector, with shape `[n]`.
- A tensor of rank 2 is a matrix, with shape `[m, n]`.
- A tensor of rank 3 or more has no special name.

## 4.4 Type variables

A type variable stands for any type. Type variables make polymorphism possible, which means one function can work on values of different types.

```text
'a                    // Type variable
'a -> 'a              // Identity function type
'a -> 'b -> 'a        // Constant function type
```

### Type variable naming

- A type variable starts with a quote, e.g., `'a`, `'b`, or `'foo`.
- By convention, the name after the quote is a single letter, e.g., `'a`, `'b`, or `'c`.

## 4.5 Type schemes (polymorphism)

A type scheme is a type with a list of type variables that can each be replaced by any type. The `forall` in front lists the variables.

```
forall 'a 'b 'n. T
```

The compiler creates a type scheme when it checks a `let` binding. The process is called let-polymorphism, and the example below shows it.

```bagl
let id = fn x -> x in      // id : forall 'a. 'a -> 'a
let _ = id 5 in            // Instantiated to int -> int
let _ = id true in         // Instantiated to bool -> bool
id
```

### Generalization rules

Generalization is the step that turns a type into a type scheme. A type variable is generalized when both of the following hold:
1. The variable is not free in the surrounding environment, which means no variable already in scope has it in its type.
2. The variable was created at a deeper level than the current binding.

## 4.6 Type annotations

A type annotation limits the type that the compiler infers. If the inferred type doesn't match the annotation, the compiler reports an error.

### Binding annotations

```bagl
let x: int = 5 in
let f: int -> int = fn x -> x + 1 in
f x  // Result: 6
```

### Parameter annotations

```bagl
let inc = fn x: int -> x + 1 in
let apply5 = fn f: (int -> int) -> f 5 in
apply5 inc  // Result: 6
```

### Tensor annotations

```bagl
let v: tensor<float>[3] = [1.0, 2.0, 3.0] in
let m: tensor<float>[2, 3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
dot(m, v)  // Result: [14, 32], with type tensor<float>[2]
```

## 4.7 Type compatibility

### Subtyping

Bagl does not have subtyping, so two types must match exactly after unification. Unification is the step that makes two types equal by filling in their type variables.

### Numeric coercion

Bagl never converts between `int` and `float` on its own. For scalars, both operands of an arithmetic operator must have the same type. The first example adds two ints and then two floats, and the second example mixes an int with a float.

```bagl
let a = 1 + 2 in      // int + int = int
let b = 1.0 + 2.0 in  // float + float = float
b                     // Result: 3.0
```

```bagl
1 + 2.0  // Error: Cannot unify int with float
```

### Tensor element types

Tensor operations keep the element type of their operands.

```bagl
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]] in
dot(a, b)      // Result: tensor<float>[2,2]
```

## 4.8 Type equality

Two types are equal when they have the same structure, as the table shows.

| Type 1 | Type 2 | Equal? |
|--------|--------|--------|
| `int` | `int` | Yes |
| `int` | `float` | No |
| `int -> int` | `int -> int` | Yes |
| `int -> int` | `int -> float` | No |
| `tensor<float>[2,3]` | `tensor<float>[2,3]` | Yes |
| `tensor<float>[2,3]` | `tensor<float>[3,2]` | No |
| `'a -> 'a` | `'b -> 'b` | Yes, after renaming the variables |

## 4.9 Type errors

The sections below show the most common type errors.

### Type mismatch

```bagl
let x: int = true in x  // Error: Cannot unify int with bool
```

### Dimension mismatch

```bagl
let a: tensor<float>[2,3] = [[1.0, 2.0], [3.0, 4.0]] in
a  // Error: Dimension mismatch: 3 vs 2
```

### Unbound variable

```bagl
x + 1    // Error: Unbound variable: x
```

### Shape rank mismatch

```bagl
let v: tensor<float>[3] = [1.0, 2.0, 3.0] in
transpose(v)    // Error: transpose requires 2D tensor
```

## 4.10 Type representation (internal)

The compiler stores types with the following OCaml definitions.

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

Each type variable is a mutable reference. When unification solves a variable, the compiler points the reference at the solution. Path compression then shortens chains of such links, so later lookups are fast.
