# 7. Tensor semantics

Chapter 7 defines what tensor types and tensor operations mean in Bagl.

## 7.1 Tensor representation

### Logical model

A tensor is an array of elements with one or more dimensions. Its type has the following form.

```
tensor<E>[d₁, d₂, ..., dₙ]
```

- The element type `E` is the type of each element. It must be `float`.
- The shape `[d₁, d₂, ..., dₙ]` lists the size of each dimension.
- The rank is the number of dimensions, which is the length of the shape.
- The size is the total number of elements, which is the product of the dimensions.

### Physical storage

The VM stores each tensor as one flat array in row-major order, which is the order C uses. In row-major order, the elements of the first row come first, then the elements of the second row, and so on.

```
[[a, b, c],     stored as    [a, b, c, d, e, f]
 [d, e, f]]                   indices: 0  1  2  3  4  5
```

### Strides

A stride is the number of positions in the flat array that you move when one index goes up by one. The strides turn an index with several parts into a position in the flat array.

For a shape `[d₁, d₂, ..., dₙ]`, the strides are as follows.
```
stride[i] = d[i+1] × d[i+2] × ... × d[n]
stride[n] = 1
```

For example, the shape `[2, 3]` has the following strides.
- `stride[0] = 3`, because each row holds 3 elements.
- `stride[1] = 1`, because the elements of a row are next to each other.

The index `[i, j]` maps to the flat position `i × 3 + j × 1`.

## 7.2 Tensor literals

Tensor elements must be floats. Section 7.6 shows what happens with int elements.

### 1D tensors (vectors)

```bagl
[1.0, 2.0, 3.0]  // Type: tensor<float>[3]
```

### 2D tensors (matrices)

```bagl
[[1.0, 2.0],  // Type: tensor<float>[2, 2]
 [3.0, 4.0]]
```

### Type inference for literals

The compiler checks a tensor literal in the following steps.
1. It infers the element type from the first element, and it requires that type to be `float`.
2. It checks that every element has the same type.
3. It checks that every row has the same length.
4. It infers the shape from the brackets. One level of brackets gives a vector, and two levels give a matrix, even when the matrix has only one row.

### Explicit shape annotation

```bagl
[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] : [2, 3]
```

The annotation must match the shape that the compiler infers.

## 7.3 Shape checking

### Compile-time verification

Bagl checks tensor shapes at compile time. In the first example, the annotation matches the literal.

```bagl
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
a  // OK
```

In the second example, the annotation says the matrix has 2 columns, but the literal has 3.

```bagl
let b: tensor<float>[2,2] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
b  // Error: Dimension mismatch: 2 vs 3
```

### Dimension variables

Dimension variables make shape polymorphism possible, which means one function can accept tensors of different sizes.

```bagl
// square works on a square matrix of any size
let square: tensor<float>['n, 'n] -> tensor<float>['n, 'n] = fn m -> dot(m, m) in
square [[1.0, 2.0], [3.0, 4.0]]  // Result: [[7.0, 10.0], [15.0, 22.0]]
```

The same function rejects a matrix that isn't square, because `'n` must stand for one size.

```bagl
let square: tensor<float>['n, 'n] -> tensor<float>['n, 'n] = fn m -> dot(m, m) in
square [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]  // Error: Dimension mismatch: 2 vs 3
```

### Shape constraints

Each tensor operation adds a constraint on the shapes of its operands.
- `dot(A, B)` requires the inner dimensions to match.
- `transpose(A)` requires a 2D tensor.
- `reshape(A, s)` requires the same total number of elements. The compiler checks the count only when every dimension is a known number, and the VM checks it again at run time.
- Element-wise arithmetic on two tensors requires the two shapes to be equal.

## 7.4 Tensor operations

### 7.4.1 Dot product

The syntax is `dot(a, b)`. The table gives the shape rules.

| A Shape | B Shape | Result Shape | Description |
|---------|---------|--------------|-------------|
| `[m, k]` | `[k, n]` | `[m, n]` | Matrix times matrix |
| `[k]` | `[k, n]` | `[n]` | Vector times matrix |
| `[m, k]` | `[k]` | `[m]` | Matrix times vector |
| `[k]` | `[k]` | A float scalar | Dot product of two vectors |

Each element of the result is a sum of products. For a matrix times a matrix (`[m,k] × [k,n] → [m,n]`), the formula is as follows.
```
C[i,j] = Σ(k) A[i,k] × B[k,j]
```

For two vectors (`[k] · [k] → scalar`), the formula is as follows.
```
result = Σ(i) A[i] × B[i]
```

Example:
```bagl
let a = [[1.0, 2.0], [3.0, 4.0]] in       // [2,2]
let b = [[5.0, 6.0], [7.0, 8.0]] in       // [2,2]
dot(a, b)  // Result: [[19.0, 22.0], [43.0, 50.0]]
// C[0,0] = 1×5 + 2×7 = 19
// C[0,1] = 1×6 + 2×8 = 22
// C[1,0] = 3×5 + 4×7 = 43
// C[1,1] = 3×6 + 4×8 = 50
```

### 7.4.2 Transpose

The syntax is `transpose(a)`, and the shape rule is `[m, n] → [n, m]`. `transpose` works only on 2D tensors. Element `[i, j]` of the result is element `[j, i]` of the input, as the formula shows.
```
B[i,j] = A[j,i]
```

Example:
```bagl
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in  // [2,3]
transpose(a)  // Result: [[1.0, 4.0], [2.0, 5.0], [3.0, 6.0]], with shape [3,2]
```

### 7.4.3 Reshape

The syntax is `reshape(a, [d₁, d₂, ..., dₙ])`. The new shape must have the same total number of elements as the old one.

```
d₁ × d₂ × ... × dₙ = original size
```

`reshape` keeps the flat data as it is, and it reads that data with the new shape.

Example:
```bagl
let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in  // [6]
reshape(a, [2, 3])  // Result: [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], with shape [2,3]
```

```bagl
let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in  // [6]
reshape(a, [3, 2])  // Result: [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]], with shape [3,2]
```

## 7.5 Shape inference examples

### Example 1: Matrix chain

```bagl
let a: tensor<float>[2, 3] = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]] in
let b: tensor<float>[3, 4] = [[1.0, 1.0, 1.0, 1.0], [2.0, 2.0, 2.0, 2.0], [3.0, 3.0, 3.0, 3.0]] in
let c: tensor<float>[4, 2] = [[1.0, 0.0], [0.0, 1.0], [1.0, 0.0], [0.0, 1.0]] in
let ab = dot(a, b) in    // [2,3] × [3,4] = [2,4]
dot(ab, c)               // [2,4] × [4,2] = [2,2]
```

### Example 2: Dimension polymorphism

```bagl
// Generic matrix multiply function
let mm = fn a -> fn b -> dot(a, b) in
let x: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let y: tensor<float>[3,5] = [[1.0, 0.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 0.0, 1.0], [0.0, 0.0, 1.0, 0.0, 1.0]] in
mm x y    // Type: tensor<float>[2,5]
```

### Example 3: Shape error

```bagl
let a: tensor<float>[2, 3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[4, 2] = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [7.0, 8.0]] in
dot(a, b)    // Error: Dimension mismatch: 3 vs 4
```

## 7.6 Element type handling

### Storage

The VM stores every tensor element as a float. The type checker requires float elements, so a program can't build an int tensor. If hand-written bytecode passes an int to `TENSOR_CREATE`, the VM converts it to a float.

### Type inference

The compiler infers the element type of a literal from the first element, and it requires that type to be `float`. A literal of floats has a float element type.

```bagl
[1.0, 2.0, 3.0]  // Type: tensor<float>[3]
```

A literal of ints is a type error.

```bagl
[1, 2, 3]  // Error: Cannot unify int with float
```

A literal that mixes ints and floats also fails, because its first element is an int.

```bagl
[1, 2.0, 3]  // Error: Cannot unify int with float
```

## 7.7 Tensor representation (internal)

The VM stores a tensor with the following OCaml record.

```ocaml
type tensor = {
  data: float array;    (* Flat storage *)
  shape: int list;      (* Dimensions *)
  strides: int list;    (* Access strides *)
}
```

### Creating tensors

```ocaml
let create_tensor shape init_val =
  let size = List.fold_left ( * ) 1 shape in
  {
    data = Array.make size init_val;
    shape;
    strides = compute_strides shape;
  }
```

### Indexing

```ocaml
let flat_index indices strides =
  List.fold_left2 (fun acc i s -> acc + i * s) 0 indices strides

let tensor_get t indices =
  t.data.(flat_index indices t.strides)
```

## 7.8 Future extensions

The sections below list possible additions to tensor semantics. Two of them already exist in part, as each section says.

### Element-wise operations

Element-wise arithmetic is already implemented. The operators `+`, `-`, `*`, and `/` work element by element on two tensors of the same shape.
```bagl
let a = [1.0, 2.0, 3.0] in
let b = [4.0, 5.0, 6.0] in
a * b  // Result: [4.0, 10.0, 18.0]
```

### Reduction operations

Bagl doesn't have reduction operations yet. The block below shows a possible syntax, and the compiler doesn't accept it.
```text
sum(a)     // Sum all elements
mean(a)    // Average of elements
max(a)     // Maximum element
```

### Slicing

Bagl doesn't have slicing yet. The block below shows a possible syntax, and the compiler doesn't accept it.
```text
a[0:2, 1:3]    // Submatrix extraction
```

### Broadcasting

Bagl already broadcasts a float scalar against a tensor, so `a * 2.0` multiplies each element of `a` by `2.0`.
```bagl
let a = [1.0, 2.0, 3.0] in
a * 2.0  // Result: [2.0, 4.0, 6.0]
```

Broadcasting between two tensors of different shapes isn't implemented. A broadcast of the `[3, 1]` tensor and the `[1, 4]` tensor below would give a `[3, 4]` tensor. The compiler rejects the program instead, because the shapes differ.
```bagl
let a: tensor<float>[3, 1] = [[1.0], [2.0], [3.0]] in
let b: tensor<float>[1, 4] = [[1.0, 2.0, 3.0, 4.0]] in
a + b  // Error: Dimension mismatch: 3 vs 1
```
