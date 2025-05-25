# 5. Expressions

All BAGL programs are expressions that evaluate to values. This chapter describes each expression form.

## 5.1 Literals

### Integer Literals

```bagl
42
-17
0
```

Type: `int`

### Float Literals

```bagl
3.14
-0.5
1.0e10
2.5e-3
```

Type: `float`

### Boolean Literals

```bagl
true
false
```

Type: `bool`

### String Literals

```bagl
"hello"
"line\nbreak"
""
```

Type: `string`

### Tensor Literals

1D tensors (vectors):
```bagl
[1.0, 2.0, 3.0]                    (* tensor<float>[3] *)
[1, 2, 3, 4, 5]                    (* tensor<int>[5] *)
```

2D tensors (matrices):
```bagl
[[1.0, 2.0], [3.0, 4.0]]           (* tensor<float>[2,2] *)
[[1, 2, 3], [4, 5, 6]]             (* tensor<int>[2,3] *)
```

With explicit shape annotation:
```bagl
[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] : [2, 3]
```

## 5.2 Variables

Variables refer to bound values:

```bagl
x
myVariable
_helper
```

Variables must be bound before use (via `let`, `letrec`, or function parameters).

## 5.3 Let Expressions

Bind a value to a name:

```bagl
let name = value in body
let name: type = value in body
```

### Semantics

1. Evaluate `value`
2. Bind result to `name`
3. Evaluate `body` with `name` in scope
4. Return result of `body`

### Examples

```bagl
let x = 5 in x + 1                    (* Result: 6 *)

let x = 5 in
let y = 10 in
x + y                                  (* Result: 15 *)

let double = fn x -> x * 2 in
double 21                              (* Result: 42 *)
```

### Let-Polymorphism

Values bound with `let` can be used polymorphically:

```bagl
let id = fn x -> x in
let a = id 5 in           (* id used at int -> int *)
let b = id true in        (* id used at bool -> bool *)
a                         (* Result: 5 *)
```

## 5.4 Recursive Let (letrec)

Bind a recursive function:

```bagl
letrec name = value in body
letrec name: type = value in body
```

The `value` must be a function (`fn`). The function can refer to itself by `name`.

### Examples

```bagl
letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 5                              (* Result: 120 *)

letrec fib = fn n ->
  if n <= 1 then n
  else fib (n - 1) + fib (n - 2)
in fib 10                              (* Result: 55 *)
```

## 5.5 Function Expressions

Define an anonymous function:

```bagl
fn param -> body
fn param: type -> body
```

### Semantics

Creates a closure capturing the current environment.

### Examples

```bagl
fn x -> x + 1                          (* int -> int *)
fn x -> fn y -> x + y                  (* int -> int -> int *)
fn f -> fn x -> f (f x)                (* ('a -> 'a) -> 'a -> 'a *)
```

### Currying

Multi-argument functions are written as nested single-argument functions:

```bagl
let add = fn x -> fn y -> x + y in
add 3 5                                (* Result: 8 *)

let add3 = add 3 in                    (* Partial application *)
add3 5                                 (* Result: 8 *)
```

## 5.6 Function Application

Apply a function to an argument:

```bagl
f x
f x y z                                (* Same as ((f x) y) z *)
```

### Semantics

1. Evaluate function expression
2. Evaluate argument expression
3. Bind argument to parameter
4. Evaluate function body
5. Return result

### Examples

```bagl
let double = fn x -> x * 2 in
double 21                              (* Result: 42 *)

let compose = fn f -> fn g -> fn x -> f (g x) in
let inc = fn x -> x + 1 in
compose double inc 5                   (* Result: 12 *)
```

## 5.7 Conditional Expressions

```bagl
if condition then expr1 else expr2
```

### Semantics

1. Evaluate `condition` (must be `bool`)
2. If true, evaluate and return `expr1`
3. If false, evaluate and return `expr2`

Both branches must have the same type.

### Examples

```bagl
if true then 1 else 2                  (* Result: 1 *)

let max = fn x -> fn y ->
  if x > y then x else y
in max 5 3                             (* Result: 5 *)

let abs = fn x ->
  if x < 0 then -x else x
in abs (-5)                            (* Result: 5 *)
```

## 5.8 Binary Operators

```bagl
expr1 op expr2
```

### Arithmetic Operators

| Operator | Description | Types |
|----------|-------------|-------|
| `+` | Addition | `int -> int -> int` or `float -> float -> float` |
| `-` | Subtraction | `int -> int -> int` or `float -> float -> float` |
| `*` | Multiplication | `int -> int -> int` or `float -> float -> float` |
| `/` | Division | `int -> int -> int` or `float -> float -> float` |

Division by zero raises a runtime error.

### Comparison Operators

| Operator | Description | Types |
|----------|-------------|-------|
| `==` | Equal | `'a -> 'a -> bool` |
| `!=` | Not equal | `'a -> 'a -> bool` |
| `<` | Less than | `int -> int -> bool` |
| `>` | Greater than | `int -> int -> bool` |
| `<=` | Less or equal | `int -> int -> bool` |
| `>=` | Greater or equal | `int -> int -> bool` |

Note: Comparison operators `<`, `>`, `<=`, `>=` currently only work on integers.

### Logical Operators

| Operator | Description | Types |
|----------|-------------|-------|
| `&&` | Logical AND | `bool -> bool -> bool` |
| `\|\|` | Logical OR | `bool -> bool -> bool` |

Logical operators are **not** short-circuiting in the current implementation.

### Examples

```bagl
1 + 2 * 3                              (* Result: 7, due to precedence *)
(1 + 2) * 3                            (* Result: 9 *)
5 == 5                                 (* Result: true *)
3 < 5 && 5 < 10                        (* Result: true *)
```

## 5.9 Unary Operators

```bagl
-expr
!expr
```

| Operator | Description | Types |
|----------|-------------|-------|
| `-` | Negation | `int -> int` or `float -> float` |
| `!` | Logical NOT | `bool -> bool` |

### Examples

```bagl
-5                                     (* Result: -5 *)
-3.14                                  (* Result: -3.14 *)
!true                                  (* Result: false *)
!(5 > 3)                               (* Result: false *)
```

## 5.10 Tensor Operations

### Dot Product

```bagl
dot(a, b)
```

Matrix/vector multiplication with shape inference:

| A Shape | B Shape | Result Shape |
|---------|---------|--------------|
| `[m, k]` | `[k, n]` | `[m, n]` |
| `[k]` | `[k, n]` | `[n]` |
| `[m, k]` | `[k]` | `[m]` |
| `[k]` | `[k]` | scalar |

### Transpose

```bagl
transpose(a)
```

Transpose a 2D tensor: `[m, n]` becomes `[n, m]`.

### Reshape

```bagl
reshape(a, [new_shape])
```

Reshape tensor to new dimensions. Total element count must match.

### Examples

```bagl
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in  (* [2,3] *)
let b = [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]] in  (* [3,2] *)
dot(a, b)                              (* Result: [2,2] matrix *)

let m = [[1.0, 2.0], [3.0, 4.0]] in
transpose(m)                           (* Result: [[1.0,3.0],[2.0,4.0]] *)

let v = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in
reshape(v, [2, 3])                     (* Result: 2x3 matrix *)
```

## 5.11 Parentheses

Parentheses override precedence:

```bagl
(1 + 2) * 3                            (* 9, not 7 *)
(fn x -> x + 1) 5                      (* Apply anonymous function *)
```
