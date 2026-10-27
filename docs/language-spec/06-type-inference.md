# 6. Type inference

Bagl uses Hindley-Milner type inference, extended with dimension variables for tensor shapes. Chapter 6 describes the algorithm.

## 6.1 Overview

Type inference works out the type of every expression, so most programs need no type annotations. Some programs still need one. For example, a function parameter that is used as a tensor gets a 2D tensor type unless an annotation says otherwise, so a parameter that should be a vector needs an annotation such as `tensor<float>['n]`.

The algorithm takes the following steps.

1. It gives each unknown type a fresh type variable.
2. It collects constraints from the structure of each expression. A constraint is a rule that two types must be equal.
3. It solves the constraints with unification.
4. It generalizes types at let bindings.

## 6.2 Type environments

A type environment maps each variable name in scope to a type scheme.

```
Γ = { x₁ : σ₁, x₂ : σ₂, ... }
```

In the definition above, each `σ` is a type scheme of the form `∀ α₁...αₙ. τ`.

### Operations

- Lookup, written `Γ(x)`, returns the scheme bound to `x`.
- Extension, written `Γ, x : σ`, adds a binding.
- `FV(Γ)` returns all the free type variables in the environment. A free type variable is one that no `∀` binds.

## 6.3 Inference rules

Each rule below means that if the facts above the line hold, then the fact below the line holds. The notation `Γ ⊢ e : τ` means that in the environment `Γ`, the expression `e` has type `τ`.

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

### Let binding

```
Γ ⊢ e₁ : τ₁    Γ, x : generalize(Γ, τ₁) ⊢ e₂ : τ₂
─────────────────────────────────────────────────────
            Γ ⊢ let x = e₁ in e₂ : τ₂
```

### Recursive let

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

Unification finds a substitution that makes two types equal. A substitution is a choice of a type for each type variable.

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

### Path compression

The compiler stores type variables in a union-find structure, which tracks which variables have been made equal. It also uses path compression. When the compiler follows a chain of links to find what a variable stands for, it points the variable straight at the end of the chain, so the next lookup is faster.

```ocaml
let rec find_ty = function
  | TVar ({ contents = Link t } as r) ->
      let t' = find_ty t in
      r := Link t';  (* Path compression *)
      t'
  | t -> t
```

## 6.5 Dimension unification

The compiler unifies dimensions in the same way as types.

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

### Shape unification

Two shapes unify when they have the same rank and each pair of dimensions unifies.

```
unify_shape(s₁, s₂):
  if length(s₁) ≠ length(s₂) then
    error "shape rank mismatch"
  for each (d₁, d₂) in zip(s₁, s₂):
    unify_dim(d₁, d₂)
```

## 6.6 Generalization

Generalization turns a type into a type scheme. It does so by adding a `∀` for each type variable that is free in the type and not free in the environment.

```
generalize(Γ, τ):
  free_vars = FV(τ) - FV(Γ)
  return ∀ free_vars. τ
```

Bagl has no type classes, so it needs a rule for arithmetic on operands of unknown type. Before it generalizes a binding, the compiler gives the type `int` to any such operand that is still unknown. For example, `let f = fn x -> x + x in ...` gives `f` the type `int -> int`. A float constraint anywhere in the same binding takes priority, so `let g = fn x -> (x + x) + 1.0 in ...` gives `g` the type `float -> float`.

### Level-based generalization

Bagl uses levels to find the variables to generalize without scanning the whole environment. A level is a counter of how deeply the current `let` binding is nested.

1. Each type variable records the level at which it was created.
2. `enter_level()` adds one to the current level before the compiler checks the value of a binding.
3. `leave_level()` subtracts one from the level after the compiler checks the value.
4. A variable whose level is greater than the current level can be generalized.

## 6.7 Instantiation

Instantiation is the reverse of generalization. It replaces each variable bound by `∀` with a fresh type variable.

```
instantiate(∀ α₁...αₙ. τ):
  substitution = { αᵢ → fresh_var() for i in 1..n }
  return apply(substitution, τ)
```

## 6.8 Tensor operation types

### Dot product

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

## 6.9 Example inference

### Example 1: Identity function

```bagl
let id = fn x -> x in id 5
```

The compiler takes the following steps.
1. For `fn x -> x`, it assigns `x : α`. The body also has type `α`, so the function has type `α -> α`.
2. It generalizes the type to `∀α. α -> α`.
3. For `id 5`, it instantiates the scheme to `β -> β` and unifies that with `int -> γ`.
4. Unification gives `β = int` and `γ = int`, so the final type is `int`.

### Example 2: Tensor dot

```bagl
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]] in
dot(a, b)
```

The compiler takes the following steps.
1. It assigns `a : tensor<float>[2,3]`.
2. It assigns `b : tensor<float>[3,2]`.
3. For `dot(a, b)`, it checks the shapes `[2,3]` and `[3,2]`.
4. It unifies the inner dimensions, and `3 = 3` holds.
5. The result shape is `[2,2]`.
6. The final type is `tensor<float>[2,2]`.

### Example 3: Polymorphic function

```bagl
let compose = fn f -> fn g -> fn x -> f (g x) in
compose (fn x -> x + 1) (fn x -> x * 2) 5
```

The compiler takes the following steps.
1. For `fn f -> fn g -> fn x -> f (g x)`, it finds the following types:
   - `f : α -> β`, `g : γ -> α`, and `x : γ`.
   - The whole function has type `(α -> β) -> (γ -> α) -> γ -> β`.
2. It generalizes the type to `∀αβγ. (α -> β) -> (γ -> α) -> γ -> β`.
3. At the application, it instantiates the scheme and unifies it with the arguments:
   - `f = fn x -> x + 1 : int -> int`
   - `g = fn x -> x * 2 : int -> int`
   - `x = 5 : int`
4. The result type is `int`.

## 6.10 Error messages

Each type error includes the source location of the problem. For example, the compiler reports an error for the program below, saved as `example.bagl`.

```bagl
let y = 1 in
let x: int = true in
x + y
```

The first line of the report gives the message, and the second line gives the file, line, and column. The compiler then prints the line with the error between its neighbors, and it marks the part that caused the error with `^`.

```text
error: Cannot unify int with bool
  --> example.bagl:2:14
  |
1 | let y = 1 in
2 | let x: int = true in
  |              ^^^^
3 | x + y
  |
```
