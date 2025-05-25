# 7. Tensor Semantics

This chapter defines the semantics of tensor types and operations in BAGL.

## 7.1 Tensor Representation

### Logical Model

A tensor is a multi-dimensional array of elements:

```
tensor<E>[d₁, d₂, ..., dₙ]
```

- **Element type** `E`: The type of each element (`int` or `float`)
- **Shape** `[d₁, d₂, ..., dₙ]`: Dimensions as a list
- **Rank**: Number of dimensions (length of shape)
- **Size**: Total number of elements (product of dimensions)

### Physical Storage

Tensors are stored in **row-major order** (C-style):

```
[[a, b, c],     stored as    [a, b, c, d, e, f]
 [d, e, f]]                   indices: 0  1  2  3  4  5
```

### Strides

**Strides** map multi-dimensional indices to flat indices:

For shape `[d₁, d₂, ..., dₙ]`:
```
stride[i] = d[i+1] × d[i+2] × ... × d[n]
stride[n] = 1
```

Example for `[2, 3]`:
- `stride[0] = 3` (skip 3 elements per row)
- `stride[1] = 1` (consecutive elements)

Index `[i, j]` maps to flat index: `i × 3 + j × 1`

## 7.2 Tensor Literals

### 1D Tensors (Vectors)

```bagl
[1.0, 2.0, 3.0]           (* tensor<float>[3] *)
[1, 2, 3, 4, 5]           (* tensor<int>[5] *)
```

### 2D Tensors (Matrices)

```bagl
[[1.0, 2.0],              (* tensor<float>[2,2] *)
 [3.0, 4.0]]

[[1, 2, 3],               (* tensor<int>[2,3] *)
 [4, 5, 6]]
```

### Type Inference for Literals

1. Element type inferred from first element
2. All elements must have same type
3. All rows must have same length
4. Shape inferred from structure

### Explicit Shape Annotation

```bagl
[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] : [2, 3]
```

The annotation must match the inferred shape.

## 7.3 Shape Checking

### Compile-Time Verification

BAGL verifies tensor shapes at compile time:

```bagl
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in  (* OK *)
let b: tensor<float>[2,2] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in  (* Error! *)
```

### Dimension Variables

Dimension variables enable shape polymorphism:

```bagl
(* This function works on any square matrix *)
let trace: tensor<float>['n, 'n] -> float = fn m ->
  (* ... compute trace ... *)
```

### Shape Constraints

Operations generate shape constraints:
- `dot(A, B)` requires inner dimensions match
- `transpose(A)` requires 2D tensor
- `reshape(A, s)` requires same total elements

## 7.4 Tensor Operations

### 7.4.1 Dot Product

**Syntax**: `dot(a, b)`

**Shape Rules**:

| A Shape | B Shape | Result Shape | Description |
|---------|---------|--------------|-------------|
| `[m, k]` | `[k, n]` | `[m, n]` | Matrix × Matrix |
| `[k]` | `[k, n]` | `[n]` | Vector × Matrix |
| `[m, k]` | `[k]` | `[m]` | Matrix × Vector |
| `[k]` | `[k]` | scalar | Vector · Vector |

**Semantics**:

Matrix-Matrix (`[m,k] × [k,n] → [m,n]`):
```
C[i,j] = Σ(k) A[i,k] × B[k,j]
```

Vector-Vector (`[k] · [k] → scalar`):
```
result = Σ(i) A[i] × B[i]
```

**Example**:
```bagl
let a = [[1.0, 2.0], [3.0, 4.0]] in       (* [2,2] *)
let b = [[5.0, 6.0], [7.0, 8.0]] in       (* [2,2] *)
dot(a, b)
(* Result: [[19.0, 22.0], [43.0, 50.0]] *)
(* C[0,0] = 1×5 + 2×7 = 19 *)
(* C[0,1] = 1×6 + 2×8 = 22 *)
(* C[1,0] = 3×5 + 4×7 = 43 *)
(* C[1,1] = 3×6 + 4×8 = 50 *)
```

### 7.4.2 Transpose

**Syntax**: `transpose(a)`

**Shape Rule**: `[m, n] → [n, m]`

Only works on 2D tensors.

**Semantics**:
```
B[i,j] = A[j,i]
```

**Example**:
```bagl
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in  (* [2,3] *)
transpose(a)
(* Result: [[1.0, 4.0], [2.0, 5.0], [3.0, 6.0]] *)  (* [3,2] *)
```

### 7.4.3 Reshape

**Syntax**: `reshape(a, [d₁, d₂, ..., dₙ])`

**Shape Rule**: Total elements must be preserved.

```
d₁ × d₂ × ... × dₙ = original size
```

**Semantics**: Reinterprets the flat data with new shape.

**Example**:
```bagl
let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in  (* [6] *)
reshape(a, [2, 3])
(* Result: [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] *)  (* [2,3] *)

reshape(a, [3, 2])
(* Result: [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]] *)  (* [3,2] *)
```

## 7.5 Shape Inference Examples

### Example 1: Matrix Chain

```bagl
let a: tensor<float>[2, 3] = ... in
let b: tensor<float>[3, 4] = ... in
let c: tensor<float>[4, 2] = ... in

let ab = dot(a, b) in    (* [2,3] × [3,4] = [2,4] *)
dot(ab, c)               (* [2,4] × [4,2] = [2,2] *)
```

### Example 2: Dimension Polymorphism

```bagl
(* Generic matrix multiply function *)
let mm = fn a -> fn b -> dot(a, b) in

let x: tensor<float>[2,3] = ... in
let y: tensor<float>[3,5] = ... in
mm x y    (* Result: tensor<float>[2,5] *)
```

### Example 3: Shape Error

```bagl
let a: tensor<float>[2, 3] = ... in
let b: tensor<float>[4, 2] = ... in
dot(a, b)    (* Error: dimension mismatch 3 vs 4 *)
```

## 7.6 Element Type Handling

### Storage

All tensor elements are stored as `float` internally:
- `int` tensors convert integers to floats
- This may cause precision loss for large integers

### Type Inference

Element types are inferred from content:

```bagl
[1, 2, 3]           (* tensor<int>[3] - but stored as float *)
[1.0, 2.0, 3.0]     (* tensor<float>[3] *)
[1, 2.0, 3]         (* Error: inconsistent element types *)
```

## 7.7 Tensor Representation (Internal)

```ocaml
type tensor = {
  data: float array;    (* Flat storage *)
  shape: int list;      (* Dimensions *)
  strides: int list;    (* Access strides *)
}
```

### Creating Tensors

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

## 7.8 Future Extensions

Potential additions to tensor semantics:

### Element-wise Operations
```bagl
a + b      (* Element-wise addition *)
a * b      (* Element-wise multiplication *)
```

### Reduction Operations
```bagl
sum(a)     (* Sum all elements *)
mean(a)    (* Average of elements *)
max(a)     (* Maximum element *)
```

### Slicing
```bagl
a[0:2, 1:3]    (* Submatrix extraction *)
```

### Broadcasting
```bagl
let a: tensor<float>[3, 1] = ...
let b: tensor<float>[1, 4] = ...
a + b    (* Broadcast to [3, 4] *)
```
