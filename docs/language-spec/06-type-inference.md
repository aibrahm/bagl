# 6. Type Inference

BAGL uses Hindley-Milner type inference extended with dimension variables for tensor shapes. This chapter describes the algorithm.

## 6.1 Overview

Type inference determines the type of every expression without requiring explicit annotations. The algorithm:

1. Assigns type variables to unknown types
2. Collects constraints from expression structure
3. Solves constraints via unification
4. Generalizes types at let bindings

## 6.2 Type Environments

A **type environment** maps variable names to type schemes:

```
Γ = { x₁ : σ₁, x₂ : σ₂, ... }
```

Where `σ` is a type scheme: `∀ α₁...αₙ. τ`

### Operations

- **Lookup**: `Γ(x)` returns the scheme bound to `x`
- **Extension**: `Γ, x : σ` adds a binding
- **Free variables**: `FV(Γ)` returns all free type variables

## 6.3 Inference Rules

### Literals

```
─────────────────
Γ ⊢ n : int        (integer literal)

─────────────────
Γ ⊢ f : float      (float literal)

─────────────────
Γ ⊢ b : bool       (boolean literal)
```

### Variables

```
x : σ ∈ Γ    τ = instantiate(σ)
────────────────────────────────
        Γ ⊢ x : τ
```

### Let Binding

```
Γ ⊢ e₁ : τ₁    Γ, x : generalize(Γ, τ₁) ⊢ e₂ : τ₂
─────────────────────────────────────────────────────
            Γ ⊢ let x = e₁ in e₂ : τ₂
```

### Recursive Let

```
Γ, x : τ ⊢ e₁ : τ₁    unify(τ, τ₁)    Γ, x : generalize(Γ, τ) ⊢ e₂ : τ₂
──────────────────────────────────────────────────────────────────────────
                  Γ ⊢ letrec x = e₁ in e₂ : τ₂
```

### Function

```
Γ, x : τ₁ ⊢ e : τ₂
─────────────────────────
Γ ⊢ fn x -> e : τ₁ -> τ₂
```

### Application

```
Γ ⊢ e₁ : τ₁    Γ ⊢ e₂ : τ₂    unify(τ₁, τ₂ -> α)
──────────────────────────────────────────────────
              Γ ⊢ e₁ e₂ : α
```

### Conditional

```
Γ ⊢ e₁ : τ₁    Γ ⊢ e₂ : τ₂    Γ ⊢ e₃ : τ₃
unify(τ₁, bool)    unify(τ₂, τ₃)
────────────────────────────────────────────
      Γ ⊢ if e₁ then e₂ else e₃ : τ₂
```

## 6.4 Unification

Unification finds a substitution that makes two types equal.

### Algorithm

```
unify(τ₁, τ₂):
  τ₁' = find(τ₁)  // Follow links
  τ₂' = find(τ₂)  // Follow links

  match (τ₁', τ₂'):
    | (int, int) -> ok
    | (float, float) -> ok
    | (bool, bool) -> ok
    | (α, τ) or (τ, α) where α is unbound ->
        if occurs(α, τ) then error "recursive type"
        link(α, τ)
    | (τ₁ -> τ₂, τ₃ -> τ₄) ->
        unify(τ₁, τ₃)
        unify(τ₂, τ₄)
    | (tensor<e₁>[s₁], tensor<e₂>[s₂]) ->
        unify(e₁, e₂)
        unify_shape(s₁, s₂)
    | _ -> error "cannot unify"
```

### Path Compression

Type variables use union-find with path compression:

```ocaml
let rec find_ty = function
  | TVar ({ contents = Link t } as r) ->
      let t' = find_ty t in
      r := Link t';  (* Path compression *)
      t'
  | t -> t
```

## 6.5 Dimension Unification

Dimensions are unified similarly to types:

```
unify_dim(d₁, d₂):
  d₁' = find_dim(d₁)
  d₂' = find_dim(d₂)

  match (d₁', d₂'):
    | (n, m) where n = m -> ok
    | (n, m) where n ≠ m -> error "dimension mismatch"
    | (α, d) or (d, α) where α is unbound ->
        link(α, d)
```

### Shape Unification

Shapes must have equal rank and matching dimensions:

```
unify_shape(s₁, s₂):
  if length(s₁) ≠ length(s₂) then
    error "shape rank mismatch"
  for each (d₁, d₂) in zip(s₁, s₂):
    unify_dim(d₁, d₂)
```

## 6.6 Generalization

Generalization converts a type to a type scheme by quantifying free variables:

```
generalize(Γ, τ):
  free_vars = FV(τ) - FV(Γ)
  return ∀ free_vars. τ
```

### Level-Based Generalization

BAGL uses levels for efficient generalization:

1. Each type variable has a creation level
2. `enter_level()` increments current level
3. Variables with level > current are generalizable
4. `leave_level()` decrements level after binding

## 6.7 Instantiation

Instantiation creates fresh type variables for quantified variables:

```
instantiate(∀ α₁...αₙ. τ):
  substitution = { αᵢ → fresh_var() for i in 1..n }
  return apply(substitution, τ)
```

## 6.8 Tensor Operation Types

### Dot Product

```
infer_dot(shape₁, shape₂):
  match (shape₁, shape₂):
    | ([m, k₁], [k₂, n]) ->
        unify_dim(k₁, k₂)
        return [m, n]
    | ([k₁], [k₂, n]) ->
        unify_dim(k₁, k₂)
        return [n]
    | ([m, k₁], [k₂]) ->
        unify_dim(k₁, k₂)
        return [m]
    | ([k₁], [k₂]) ->
        unify_dim(k₁, k₂)
        return []  // scalar
```

### Transpose

```
infer_transpose(shape):
  match shape:
    | [m, n] -> [n, m]
    | _ -> error "transpose requires 2D tensor"
```

## 6.9 Example Inference

### Example 1: Identity Function

```bagl
let id = fn x -> x in id 5
```

Inference steps:
1. `fn x -> x`: Assign `x : α`, body type is `α`, function type is `α -> α`
2. Generalize to `∀α. α -> α`
3. `id 5`: Instantiate to `β -> β`, unify with `int -> γ`
4. Result: `β = int`, `γ = int`, final type is `int`

### Example 2: Tensor Dot

```bagl
let a: tensor<float>[2,3] = ... in
let b: tensor<float>[3,2] = ... in
dot(a, b)
```

Inference steps:
1. `a : tensor<float>[2,3]`
2. `b : tensor<float>[3,2]`
3. `dot(a, b)`: Check shapes `[2,3]` and `[3,2]`
4. Unify inner dimensions: `3 = 3` ✓
5. Result shape: `[2,2]`
6. Final type: `tensor<float>[2,2]`

### Example 3: Polymorphic Function

```bagl
let compose = fn f -> fn g -> fn x -> f (g x) in
compose (fn x -> x + 1) (fn x -> x * 2) 5
```

Inference steps:
1. `fn f -> fn g -> fn x -> f (g x)`:
   - `f : α -> β`, `g : γ -> α`, `x : γ`
   - Type: `(α -> β) -> (γ -> α) -> γ -> β`
2. Generalize to `∀αβγ. (α -> β) -> (γ -> α) -> γ -> β`
3. Application instantiates and unifies:
   - `f = fn x -> x + 1 : int -> int`
   - `g = fn x -> x * 2 : int -> int`
   - `x = 5 : int`
4. Result type: `int`

## 6.10 Error Messages

Type errors include source location:

```
error[E0001]: Cannot unify int with bool
  --> example.bagl:3:10
   |
 3 |   let x: int = true
   |          ^^^   ^^^^ found bool
   |          expected int
```
