# 5. Expressions

Every Bagl program is an expression, and running the program evaluates the expression to a value. Chapter 5 describes each kind of expression.

## 5.1 Literals

Each line in the blocks of section 5.1 is a separate literal, and each literal on its own is a complete program.

### Integer literals

```text
42
-17
0
```

The type is `int`. The `-17` line is the negation of the literal `17`, as section 2.4 explains.

### Float literals

```text
3.14
-0.5
1.0e10
2.5e-3
```

The type is `float`.

### Boolean literals

```text
true
false
```

The type is `bool`.

### String literals

```text
"hello"
"line\nbreak"
""
```

The type is `string`.

### Tensor literals

Tensor elements must be floats, and the type checker rejects a tensor literal with int elements.

A literal with one level of brackets is a 1D tensor, which is a vector.
```bagl
[1.0, 2.0, 3.0]  // Type: tensor<float>[3]
```

A literal with two levels of brackets is a 2D tensor, which is a matrix.
```bagl
[[1.0, 2.0], [3.0, 4.0]]  // Type: tensor<float>[2, 2]
```

A literal can also carry an explicit shape annotation.
```bagl
[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] : [2, 3]
```

A literal with int elements fails to type check.
```bagl
[1, 2, 3]  // Error: Cannot unify int with float
```

## 5.2 Variables

A variable refers to a value that has been bound to a name. The names below are examples of variables.

```text
x
myVariable
_helper
```

A variable must be bound before it is used. A `let` binding, a `letrec` binding, or a function parameter can bind it.

## 5.3 Let expressions

A let expression binds a value to a name. It has one of the two forms below.

```text
let name = value in body
let name: type = value in body
```

### Semantics

1. The program evaluates `value`.
2. It binds the result to `name`.
3. It evaluates `body`, with `name` in scope.
4. The result of `body` is the result of the whole expression.

### Examples

```bagl
let x = 5 in x + 1  // Result: 6
```

```bagl
let x = 5 in
let y = 10 in
x + y  // Result: 15
```

```bagl
let double = fn x -> x * 2 in
double 21  // Result: 42
```

### Let-polymorphism

A value bound with `let` can be used at more than one type, as the example shows.

```bagl
let id = fn x -> x in
let a = id 5 in     // id used at int -> int
let b = id true in  // id used at bool -> bool
a                   // Result: 5
```

## 5.4 Recursive let (letrec)

A `letrec` expression binds a recursive function. It has one of the two forms below.

```text
letrec name = value in body
letrec name: type = value in body
```

The `value` must be a function, written with `fn`, and the function can call itself by `name`.

### Examples

```bagl
letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 5  // Result: 120
```

```bagl
letrec fib = fn n ->
  if n <= 1 then n
  else fib (n - 1) + fib (n - 2)
in fib 10  // Result: 55
```

## 5.5 Function expressions

A function expression defines a function that has no name. It has one of the two forms below.

```text
fn param -> body
fn param: type -> body
```

### Semantics

A function expression creates a closure. The closure keeps the values of the variables that the function body uses from the surrounding scope.

### Examples

Each example binds the function to a name and returns it, so the result is the function and its type.

```bagl
let inc = fn x -> x + 1 in inc  // Type: int -> int
```

```bagl
let add = fn x -> fn y -> x + y in add  // Type: int -> int -> int
```

```bagl
let twice = fn f -> fn x -> f (f x) in twice  // Type: ('a -> 'a) -> 'a -> 'a
```

The compiler may print a different letter for the type variable in the last example.

### Currying

A function of several arguments is written as nested functions of one argument each. Applying such a function to fewer arguments than it takes is called partial application, and the result is a function that takes the remaining arguments.

```bagl
let add = fn x -> fn y -> x + y in
add 3 5  // Result: 8
```

```bagl
let add = fn x -> fn y -> x + y in
let add3 = add 3 in  // Partial application
add3 5               // Result: 8
```

## 5.6 Function application

To apply a function, write the function followed by its argument. Application groups to the left.

```text
f x
f x y z  // Same as ((f x) y) z
```

### Semantics

1. The program evaluates the function expression.
2. It evaluates the argument expression.
3. It binds the argument to the parameter.
4. It evaluates the function body.
5. The result of the body is the result of the application.

### Examples

```bagl
let double = fn x -> x * 2 in
double 21  // Result: 42
```

```bagl
let double = fn x -> x * 2 in
let compose = fn f -> fn g -> fn x -> f (g x) in
let inc = fn x -> x + 1 in
compose double inc 5  // Result: 12
```

## 5.7 Conditional expressions

A conditional expression has the form below.

```text
if condition then expr1 else expr2
```

### Semantics

1. The program evaluates `condition`, which must have type `bool`.
2. If the condition is true, the program evaluates `expr1` and returns its value.
3. If the condition is false, the program evaluates `expr2` and returns its value.

Both branches must have the same type.

### Examples

```bagl
if true then 1 else 2  // Result: 1
```

```bagl
let max = fn x -> fn y ->
  if x > y then x else y
in max 5 3  // Result: 5
```

```bagl
let abs = fn x ->
  if x < 0 then -x else x
in abs (-5)  // Result: 5
```

## 5.8 Binary operators

A binary operator goes between its two operands.

```text
expr1 op expr2
```

### Arithmetic operators

| Operator | Description | Types |
|----------|-------------|-------|
| `+` | Addition | `int -> int -> int` or `float -> float -> float` |
| `-` | Subtraction | `int -> int -> int` or `float -> float -> float` |
| `*` | Multiplication | `int -> int -> int` or `float -> float -> float` |
| `/` | Division | `int -> int -> int` or `float -> float -> float` |

Division by zero raises a runtime error. The arithmetic operators also work element by element on two tensors of the same shape, and on a tensor and a float scalar, as chapter 7 describes.

```bagl
1 / 0  // Runtime error: Division by zero
```

### Comparison operators

| Operator | Description | Types |
|----------|-------------|-------|
| `==` | Equal | `'a -> 'a -> bool` |
| `!=` | Not equal | `'a -> 'a -> bool` |
| `<` | Less than | `int -> int -> bool` |
| `>` | Greater than | `int -> int -> bool` |
| `<=` | Less or equal | `int -> int -> bool` |
| `>=` | Greater or equal | `int -> int -> bool` |

The table shows the int form of `<`, `>`, `<=`, and `>=`, and the same operators also accept two floats. The operators `==` and `!=` don't accept tensors or functions.

```bagl
[1.0] == [1.0]  // Error: Equality is not defined for tensors
```

### Logical operators

| Operator | Description | Types |
|----------|-------------|-------|
| `&&` | Logical and | `bool -> bool -> bool` |
| `\|\|` | Logical or | `bool -> bool -> bool` |

In the current implementation, the logical operators always evaluate both operands. They don't stop early when the left operand already decides the result.

### Examples

```bagl
1 + 2 * 3  // Result: 7, because * binds more tightly than +
```

```bagl
(1 + 2) * 3  // Result: 9
```

```bagl
5 == 5  // Result: true
```

```bagl
3 < 5 && 5 < 10  // Result: true
```

## 5.9 Unary operators

A unary operator goes before its operand.

```text
-expr
!expr
```

| Operator | Description | Types |
|----------|-------------|-------|
| `-` | Negation | `int -> int` or `float -> float` |
| `!` | Logical not | `bool -> bool` |

### Examples

```bagl
-5  // Result: -5
```

```bagl
-3.14  // Result: -3.14
```

```bagl
!true  // Result: false
```

```bagl
!(5 > 3)  // Result: false
```

## 5.10 Tensor operations

### Dot product

The dot product has the form below.

```text
dot(a, b)
```

`dot` multiplies matrices and vectors. The compiler works out the result shape from the operand shapes, as the table shows.

| A Shape | B Shape | Result Shape |
|---------|---------|--------------|
| `[m, k]` | `[k, n]` | `[m, n]` |
| `[k]` | `[k, n]` | `[n]` |
| `[m, k]` | `[k]` | `[m]` |
| `[k]` | `[k]` | A float scalar |

### Transpose

The transpose has the form below.

```text
transpose(a)
```

`transpose` swaps the two dimensions of a 2D tensor, so shape `[m, n]` becomes `[n, m]`.

### Reshape

A reshape has the form below, where the second argument is a shape.

```text
reshape(a, [d1, d2])
```

`reshape` gives a tensor new dimensions. The new shape must have the same total number of elements as the old one.

### Examples

```bagl
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in       // [2,3]
let b = [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]] in  // [3,2]
dot(a, b)  // Result: [[58.0, 64.0], [139.0, 154.0]], a [2,2] matrix
```

```bagl
let m = [[1.0, 2.0], [3.0, 4.0]] in
transpose(m)  // Result: [[1.0, 3.0], [2.0, 4.0]]
```

```bagl
let v = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in
reshape(v, [2, 3])  // Result: [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], a 2x3 matrix
```

## 5.11 Parentheses

Parentheses override the usual precedence, as the examples show.

```bagl
(1 + 2) * 3  // Result: 9, not 7
```

```bagl
(fn x -> x + 1) 5  // Applies a function that has no name. Result: 6
```

## 5.12 Automatic differentiation with grad

`grad` does automatic differentiation, which means that it computes the derivative of a function. The expression `grad (fn x -> e)` is a new function, and that function returns the derivative of `e` with respect to `x`. The compiler implements `grad` as a source-to-source transform. A pass rewrites each `grad` expression into ordinary Bagl code before type inference, and the rest of the compiler then checks and runs the derivative like any other function.

`grad` must be applied directly to a function literal in parentheses. The name `grad` is not a value, so `grad` on its own is an unbound variable. If you write `grad f` for a function `f` bound elsewhere, the compiler reports "grad must be applied directly to a function literal".

### Modes

The pass chooses a mode from the annotation on the parameter.
- An unannotated parameter, or a `float` parameter whose body uses no tensors, gets scalar mode. Scalar mode is symbolic forward mode. The pass builds an expression for the derivative with the sum, product, quotient, and chain rules, and the result has type `float -> float`.
- A parameter annotated `tensor<float>[...]` gets reverse mode. The body must compute a scalar, e.g., a loss. The result is a function that returns the gradient, which is a tensor with the same shape as the parameter.
- A `float` parameter whose body uses tensors gets pathwise mode. The pass applies the reverse mode rules to the scalar parameter, so it can differentiate a scalar through tensor code.

An unannotated parameter whose body uses tensors is a compile error, because the pass needs the annotation to choose a mode.

### Supported expressions

In scalar mode, the body can use literals, the parameter, and other variables, which count as constants. It can also use `+`, `-`, `*`, `/`, unary minus, `if`, `let`, and the math functions `exp`, `log`, `sqrt`, `relu`, and `step`. The pass differentiates each branch of an `if`, and it leaves the condition as it is.

Reverse mode and pathwise mode support the same expressions. They also support `dot`, `transpose`, element-wise arithmetic, and arithmetic between a tensor and a scalar.

### Unsupported forms

The pass reports a compile error for each form it can't differentiate correctly, so it doesn't produce a wrong derivative for those forms. The unsupported forms in every mode include the following:
- A call to another function inside the body
- A `letrec` or a nested `fn` inside the body
- A boolean or comparison expression where the pass expects a number

Scalar mode also rejects any tensor operation. Reverse mode and pathwise mode also reject the following forms:
- `reshape`
- A tensor literal whose elements mention the parameter
- An `if` whose condition mentions the parameter
- The matrix side of a matrix-vector or vector-matrix `dot`, because its gradient needs an outer product
- A scalar built from the parameter and broadcast against a matrix
- A body that doesn't compute a scalar

### Examples

In scalar mode, the derivative of `x * x * x` is `3 * x * x`, which is `12.0` at `2.0`.

```bagl
let f = grad (fn x -> x * x * x) in
f 2.0  // Result: 12.0
```

In reverse mode, the gradient of the squared dot product `dot(w, x) * dot(w, x)` is `2 * dot(w, x) * x`. At `w0`, `dot(w0, x)` is `4.5`, so the gradient is `9.0 * x`.

```bagl
let x = [0.5, -1.0, 2.0] in
let w0 = [1.0, 2.0, 3.0] in
let g = grad (fn w: tensor<float>[3] -> dot(w, x) * dot(w, x)) in
g w0  // Result: [4.5, -9.0, 18.0]
```

In pathwise mode, `dot(x * s, x)` is `s` times `dot(x, x)`. Its derivative with respect to `s` is therefore `dot(x, x)`, which is `14.0`.

```bagl
let x = [1.0, 2.0, 3.0] in
let g = grad (fn s: float -> dot(x * s, x)) in
g 2.0  // Result: 14.0
```
