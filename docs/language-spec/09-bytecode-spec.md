# 9. Bytecode Specification

This chapter documents the BAGL bytecode instruction set.

## 9.1 Bytecode Format

### Program Structure

```
Program = {
  chunks: Chunk[]    (* One chunk per function *)
  entry: int         (* Index of main function *)
}
```

### Chunk Structure

```
Chunk = {
  code: Opcode[]     (* Instruction sequence *)
  num_locals: int    (* Local variable count *)
  num_params: int    (* Parameter count *)
  num_captures: int  (* Captured variable count *)
}
```

## 9.2 Instruction Categories

### Stack Operations
- `PUSH_*` - Push values onto stack
- `POP` - Remove top of stack
- `DUP` - Duplicate top of stack

### Variable Access
- `LOAD_LOCAL` / `STORE_LOCAL` - Local variables
- `LOAD_GLOBAL` / `STORE_GLOBAL` - Global variables
- `LOAD_CAPTURE` - Closure captures

### Arithmetic
- Integer: `IADD`, `ISUB`, `IMUL`, `IDIV`, `INEG`
- Float: `FADD`, `FSUB`, `FMUL`, `FDIV`, `FNEG`

### Comparison
- `IEQ`, `INEQ` - Equality
- `ILT`, `IGT`, `ILE`, `IGE` - Ordering

### Logical
- `AND`, `OR`, `NOT`

### Control Flow
- `JUMP`, `JUMP_IF_FALSE`
- `CALL`, `RETURN`

### Closures
- `MAKE_CLOSURE`, `MAKE_REC_CLOSURE`

### Tensors
- `TENSOR_CREATE`, `TENSOR_DOT`, `TENSOR_TRANSPOSE`, `TENSOR_RESHAPE`

## 9.3 Instruction Reference

### Stack Operations

#### PUSH_INT n
Push integer `n` onto stack.
```
Stack: ... → ..., VInt(n)
```

#### PUSH_FLOAT f
Push float `f` onto stack.
```
Stack: ... → ..., VFloat(f)
```

#### PUSH_BOOL b
Push boolean `b` onto stack.
```
Stack: ... → ..., VBool(b)
```

#### PUSH_STRING s
Push string `s` onto stack.
```
Stack: ... → ..., VString(s)
```

#### PUSH_UNIT
Push unit value onto stack.
```
Stack: ... → ..., VUnit
```

#### POP
Remove top value from stack.
```
Stack: ..., v → ...
```

#### DUP
Duplicate top of stack.
```
Stack: ..., v → ..., v, v
```

### Local Variable Operations

#### LOAD_LOCAL i
Push local variable at index `i`.
```
Stack: ... → ..., locals[i]
```

#### STORE_LOCAL i
Pop value and store in local `i`.
```
Stack: ..., v → ...
Effect: locals[i] = v
```

### Global Variable Operations

#### LOAD_GLOBAL i
Push global variable at index `i`.
```
Stack: ... → ..., globals[i]
```
**Note**: Not currently implemented.

#### STORE_GLOBAL i
Pop value and store in global `i`.
```
Stack: ..., v → ...
Effect: globals[i] = v
```
**Note**: Not currently implemented.

### Closure Operations

#### MAKE_CLOSURE func_id num_captures
Create a closure.
```
Stack: ..., capture₀, ..., captureₙ₋₁ → ..., VClosure
```
Pops `num_captures` values, creates closure referencing function `func_id`.

#### MAKE_REC_CLOSURE func_id num_captures self_idx
Create a recursive closure.
```
Stack: ..., capture₀, ..., captureₙ₋₁ → ..., VClosure
```
Like `MAKE_CLOSURE`, but inserts self-reference at `self_idx`.

#### LOAD_CAPTURE i
Load captured value at index `i`.
```
Stack: ... → ..., current_closure.captures[i]
```

### Integer Arithmetic

#### IADD
Integer addition.
```
Stack: ..., a, b → ..., (a + b)
Types: VInt, VInt → VInt
```

#### ISUB
Integer subtraction.
```
Stack: ..., a, b → ..., (a - b)
Types: VInt, VInt → VInt
```

#### IMUL
Integer multiplication.
```
Stack: ..., a, b → ..., (a * b)
Types: VInt, VInt → VInt
```

#### IDIV
Integer division.
```
Stack: ..., a, b → ..., (a / b)
Types: VInt, VInt → VInt
Error: Division by zero if b = 0
```

#### INEG
Integer negation.
```
Stack: ..., a → ..., (-a)
Types: VInt → VInt
```

### Float Arithmetic

#### FADD
Float addition.
```
Stack: ..., a, b → ..., (a +. b)
Types: VFloat, VFloat → VFloat
```

#### FSUB
Float subtraction.
```
Stack: ..., a, b → ..., (a -. b)
Types: VFloat, VFloat → VFloat
```

#### FMUL
Float multiplication.
```
Stack: ..., a, b → ..., (a *. b)
Types: VFloat, VFloat → VFloat
```

#### FDIV
Float division.
```
Stack: ..., a, b → ..., (a /. b)
Types: VFloat, VFloat → VFloat
Error: Division by zero if b = 0.0
```

#### FNEG
Float negation.
```
Stack: ..., a → ..., (-.a)
Types: VFloat → VFloat
```

### Comparison Operations

#### IEQ
Equality comparison.
```
Stack: ..., a, b → ..., (a = b)
Types: 'a, 'a → VBool
```
Works on ints, floats, bools, strings, unit.

#### INEQ
Inequality comparison.
```
Stack: ..., a, b → ..., (a ≠ b)
Types: 'a, 'a → VBool
```

#### ILT
Less than.
```
Stack: ..., a, b → ..., (a < b)
Types: VInt, VInt → VBool
```

#### IGT
Greater than.
```
Stack: ..., a, b → ..., (a > b)
Types: VInt, VInt → VBool
```

#### ILE
Less than or equal.
```
Stack: ..., a, b → ..., (a ≤ b)
Types: VInt, VInt → VBool
```

#### IGE
Greater than or equal.
```
Stack: ..., a, b → ..., (a ≥ b)
Types: VInt, VInt → VBool
```

### Logical Operations

#### AND
Logical AND.
```
Stack: ..., a, b → ..., (a && b)
Types: VBool, VBool → VBool
```

#### OR
Logical OR.
```
Stack: ..., a, b → ..., (a || b)
Types: VBool, VBool → VBool
```

#### NOT
Logical NOT.
```
Stack: ..., a → ..., (!a)
Types: VBool → VBool
```

### Control Flow

#### JUMP addr
Unconditional jump.
```
Effect: pc = addr
```

#### JUMP_IF_FALSE addr
Conditional jump.
```
Stack: ..., cond → ...
Effect: if !cond then pc = addr
Types: VBool → (consumed)
```

#### CALL n_args
Function call.
```
Stack: ..., arg₀, ..., argₙ₋₁, closure → ...
Effect:
  1. Save current frame
  2. Switch to closure's function
  3. Copy args to new locals
```

#### RETURN
Return from function.
```
Stack: ..., result → ... (in caller), result
Effect:
  1. Pop frame
  2. Restore caller state
  3. Push result on caller's stack
```

### Tensor Operations

#### TENSOR_CREATE shape
Create tensor with given shape.
```
Stack: ..., elem₀, ..., elemₙ₋₁ → ..., VTensor
```
Pops elements (total = product of shape), creates tensor.

#### TENSOR_DOT
Matrix/vector dot product.
```
Stack: ..., a, b → ..., result
Types: VTensor, VTensor → VTensor or VFloat
```
Result type depends on input shapes.

#### TENSOR_TRANSPOSE
Transpose 2D tensor.
```
Stack: ..., t → ..., transposed
Types: VTensor → VTensor
```

#### TENSOR_RESHAPE shape
Reshape tensor.
```
Stack: ..., t → ..., reshaped
Types: VTensor → VTensor
Error: if sizes don't match
```

### Debugging/Control

#### PRINT
Print top of stack (for debugging).
```
Stack: ..., v → ..., v
Effect: prints string_of_value(v)
```

#### HALT
Stop execution.
```
Effect: terminates VM execution loop
```

#### NOP
No operation.
```
Effect: none
```

## 9.4 Bytecode Examples

### Simple Expression

Source: `1 + 2`

```
PUSH_INT 1
PUSH_INT 2
IADD
RETURN
```

### Let Binding

Source: `let x = 5 in x + 1`

```
PUSH_INT 5
STORE_LOCAL 0
LOAD_LOCAL 0
PUSH_INT 1
IADD
RETURN
```

### Function Definition

Source: `fn x -> x + 1`

```
(* Main function *)
MAKE_CLOSURE 1 0    (* func_id=1, no captures *)
RETURN

(* Function 1: x -> x + 1 *)
LOAD_LOCAL 0        (* x *)
PUSH_INT 1
IADD
RETURN
```

### Function Call

Source: `(fn x -> x + 1) 5`

```
MAKE_CLOSURE 1 0    (* Create closure *)
PUSH_INT 5          (* Argument *)
CALL 1              (* Call with 1 arg *)
RETURN
```

### Conditional

Source: `if true then 1 else 2`

```
PUSH_BOOL true
JUMP_IF_FALSE 4     (* Jump to else *)
PUSH_INT 1
JUMP 5              (* Skip else *)
PUSH_INT 2          (* else branch *)
RETURN
```

### Closure with Capture

Source: `let y = 5 in fn x -> x + y`

```
(* Main *)
PUSH_INT 5
STORE_LOCAL 0       (* y = 5 *)
LOAD_LOCAL 0        (* Push y for capture *)
MAKE_CLOSURE 1 1    (* func_id=1, 1 capture *)
RETURN

(* Function 1 *)
LOAD_LOCAL 0        (* x *)
LOAD_CAPTURE 0      (* y *)
IADD
RETURN
```

## 9.5 Serialization Format

For `.baglc` bytecode files:

```
Header:
  magic: "BAGL" (4 bytes)
  version: uint32
  entry: uint32
  num_chunks: uint32

For each chunk:
  num_locals: uint32
  num_params: uint32
  num_captures: uint32
  code_length: uint32
  code: opcode[] (variable)
```

Opcodes are serialized as:
- Tag byte (opcode type)
- Operands (type-dependent)
