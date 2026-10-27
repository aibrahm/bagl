# 9. Bytecode specification

Chapter 9 describes the Bagl bytecode instruction set. Bytecode is the list of simple instructions that the compiler produces and the VM runs.

The chapter doesn't yet cover every opcode in `src/bytecode.ml`. It leaves out the following opcodes:
- The float comparisons `FLT`, `FGT`, `FLE`, and `FGE`
- The element-wise tensor operations `TADD`, `TSUB`, `TMUL`, and `TDIV`
- The math functions `MEXP`, `MLOG`, `MSQRT`, `MRELU`, and `MSTEP`

## 9.1 Bytecode format

### Program structure

A program is a list of chunks, with one chunk for each function, and the index of the function that runs first.

```text
Program = {
  chunks: Chunk[]    // One chunk per function
  entry: int         // Index of main function
}
```

### Chunk structure

A chunk holds the instructions of one function and three counts.

```text
Chunk = {
  code: Opcode[]     // Instruction sequence
  num_locals: int    // Local variable count
  num_params: int    // Parameter count
  num_captures: int  // Captured variable count
}
```

## 9.2 Instruction categories

### Stack operations
- `PUSH_*` pushes a value onto the stack.
- `POP` removes the top of the stack.
- `DUP` duplicates the top of the stack.

### Variable access
- `LOAD_LOCAL` and `STORE_LOCAL` read and write local variables.
- `LOAD_GLOBAL` and `STORE_GLOBAL` read and write global variables.
- `LOAD_CAPTURE` reads a value that a closure captured.

### Arithmetic
- The integer instructions are `IADD`, `ISUB`, `IMUL`, `IDIV`, and `INEG`.
- The float instructions are `FADD`, `FSUB`, `FMUL`, `FDIV`, and `FNEG`.

### Comparison
- `IEQ` and `INEQ` test equality.
- `ILT`, `IGT`, `ILE`, and `IGE` compare order.

### Logical
- The logical instructions are `AND`, `OR`, and `NOT`.

### Control flow
- `JUMP` and `JUMP_IF_FALSE` move to another instruction.
- `CALL` and `RETURN` enter and leave a function.

### Closures
- `MAKE_CLOSURE` and `MAKE_REC_CLOSURE` create closures.

### Tensors
- The tensor instructions are `TENSOR_CREATE`, `TENSOR_DOT`, `TENSOR_TRANSPOSE`, and `TENSOR_RESHAPE`.

## 9.3 Instruction reference

Each entry shows the stack before and after the instruction, with the top of the stack on the right.

### Stack operations

#### PUSH_INT n
Pushes the integer `n` onto the stack.
```text
Stack: ... → ..., VInt(n)
```

#### PUSH_FLOAT f
Pushes the float `f` onto the stack.
```text
Stack: ... → ..., VFloat(f)
```

#### PUSH_BOOL b
Pushes the boolean `b` onto the stack.
```text
Stack: ... → ..., VBool(b)
```

#### PUSH_STRING s
Pushes the string `s` onto the stack.
```text
Stack: ... → ..., VString(s)
```

#### PUSH_UNIT
Pushes the unit value onto the stack.
```text
Stack: ... → ..., VUnit
```

#### POP
Removes the top value from the stack.
```text
Stack: ..., v → ...
```

#### DUP
Duplicates the top value of the stack.
```text
Stack: ..., v → ..., v, v
```

### Local variable operations

#### LOAD_LOCAL i
Pushes the local variable at index `i`.
```text
Stack: ... → ..., locals[i]
```

#### STORE_LOCAL i
Pops a value and stores it in local `i`.
```text
Stack: ..., v → ...
Effect: locals[i] = v
```

### Global variable operations

#### LOAD_GLOBAL i
Pushes the global variable at index `i`.
```text
Stack: ... → ..., globals[i]
```
The VM doesn't implement `LOAD_GLOBAL` yet, and it raises a runtime error when it runs one.

#### STORE_GLOBAL i
Pops a value and stores it in global `i`.
```text
Stack: ..., v → ...
Effect: globals[i] = v
```
The VM doesn't implement `STORE_GLOBAL` yet, and it raises a runtime error when it runs one.

### Closure operations

#### MAKE_CLOSURE func_id num_captures
Creates a closure.
```text
Stack: ..., capture₀, ..., captureₙ₋₁ → ..., VClosure
```
The instruction pops `num_captures` values, and it creates a closure that refers to function `func_id` and holds the popped values.

#### MAKE_REC_CLOSURE func_id num_captures self_idx
Creates a recursive closure.
```text
Stack: ..., capture₀, ..., captureₙ₋₁ → ..., VClosure
```
The instruction works like `MAKE_CLOSURE`, and it also puts the closure itself into capture slot `self_idx`.

#### LOAD_CAPTURE i
Pushes the captured value at index `i` of the current closure.
```text
Stack: ... → ..., current_closure.captures[i]
```

### Integer arithmetic

#### IADD
Adds two integers.
```text
Stack: ..., a, b → ..., (a + b)
Types: VInt, VInt → VInt
```

#### ISUB
Subtracts two integers.
```text
Stack: ..., a, b → ..., (a - b)
Types: VInt, VInt → VInt
```

#### IMUL
Multiplies two integers.
```text
Stack: ..., a, b → ..., (a * b)
Types: VInt, VInt → VInt
```

#### IDIV
Divides two integers.
```text
Stack: ..., a, b → ..., (a / b)
Types: VInt, VInt → VInt
Error: Division by zero if b = 0
```

#### INEG
Negates an integer.
```text
Stack: ..., a → ..., (-a)
Types: VInt → VInt
```

### Float arithmetic

#### FADD
Adds two floats.
```text
Stack: ..., a, b → ..., (a +. b)
Types: VFloat, VFloat → VFloat
```

#### FSUB
Subtracts two floats.
```text
Stack: ..., a, b → ..., (a -. b)
Types: VFloat, VFloat → VFloat
```

#### FMUL
Multiplies two floats.
```text
Stack: ..., a, b → ..., (a *. b)
Types: VFloat, VFloat → VFloat
```

#### FDIV
Divides two floats.
```text
Stack: ..., a, b → ..., (a /. b)
Types: VFloat, VFloat → VFloat
Error: Division by zero if b = 0.0
```

#### FNEG
Negates a float.
```text
Stack: ..., a → ..., (-.a)
Types: VFloat → VFloat
```

### Comparison operations

#### IEQ
Tests whether two values are equal.
```text
Stack: ..., a, b → ..., (a = b)
Types: 'a, 'a → VBool
```
`IEQ` works on ints, floats, bools, strings, and the unit value. Two values of different kinds are never equal.

#### INEQ
Tests whether two values are not equal.
```text
Stack: ..., a, b → ..., (a ≠ b)
Types: 'a, 'a → VBool
```

#### ILT
Tests whether `a` is less than `b`.
```text
Stack: ..., a, b → ..., (a < b)
Types: VInt, VInt → VBool
```

#### IGT
Tests whether `a` is greater than `b`.
```text
Stack: ..., a, b → ..., (a > b)
Types: VInt, VInt → VBool
```

#### ILE
Tests whether `a` is less than or equal to `b`.
```text
Stack: ..., a, b → ..., (a ≤ b)
Types: VInt, VInt → VBool
```

#### IGE
Tests whether `a` is greater than or equal to `b`.
```text
Stack: ..., a, b → ..., (a ≥ b)
Types: VInt, VInt → VBool
```

### Logical operations

#### AND
Computes the logical and of two booleans.
```text
Stack: ..., a, b → ..., (a && b)
Types: VBool, VBool → VBool
```

#### OR
Computes the logical or of two booleans.
```text
Stack: ..., a, b → ..., (a || b)
Types: VBool, VBool → VBool
```

#### NOT
Computes the logical not of a boolean.
```text
Stack: ..., a → ..., (!a)
Types: VBool → VBool
```

### Control flow

#### JUMP addr
Jumps to `addr` every time.
```text
Effect: pc = addr
```

#### JUMP_IF_FALSE addr
Pops a boolean, and jumps to `addr` if the boolean is false.
```text
Stack: ..., cond → ...
Effect: if !cond then pc = addr
Types: VBool → (consumed)
```

#### CALL n_args
Calls a function.
```text
Stack: ..., arg₀, ..., argₙ₋₁, closure → ...
Effect:
  1. Save current frame
  2. Switch to closure's function
  3. Copy args to new locals
```

#### RETURN
Returns from a function.
```text
Stack: ..., result → ... (in caller), result
Effect:
  1. Pop frame
  2. Restore caller state
  3. Push result on caller's stack
```

### Tensor operations

#### TENSOR_CREATE shape
Creates a tensor with the given shape.
```text
Stack: ..., elem₀, ..., elemₙ₋₁ → ..., VTensor
```
The instruction pops as many elements as the shape holds, and it creates the tensor. The number of elements is the product of the dimensions.

#### TENSOR_DOT
Computes the dot product of two matrices or vectors.
```text
Stack: ..., a, b → ..., result
Types: VTensor, VTensor → VTensor or VFloat
```
The result is a float when both inputs are vectors, and a tensor otherwise.

#### TENSOR_TRANSPOSE
Transposes a 2D tensor.
```text
Stack: ..., t → ..., transposed
Types: VTensor → VTensor
```

#### TENSOR_RESHAPE shape
Reshapes a tensor.
```text
Stack: ..., t → ..., reshaped
Types: VTensor → VTensor
Error: if sizes don't match
```

### Debugging and control

#### PRINT
Prints the top of the stack, for debugging.
```text
Stack: ..., v → ..., v
Effect: prints string_of_value(v)
```

#### HALT
Stops execution.
```text
Effect: terminates VM execution loop
```

#### NOP
Does nothing.
```text
Effect: none
```

## 9.4 Bytecode examples

The listings in section 9.4 are simplified by hand to show how each construct works. The real compiler stores each intermediate result in a local, and its optimizer folds constant expressions such as `1 + 2` into one value. The `--dump-bytecode` option prints the real code, which is often longer or different.

### Simple expression

Source: `1 + 2`

```text
PUSH_INT 1
PUSH_INT 2
IADD
RETURN
```

### Let binding

Source: `let x = 5 in x + 1`

```text
PUSH_INT 5
STORE_LOCAL 0
LOAD_LOCAL 0
PUSH_INT 1
IADD
RETURN
```

### Function definition

Source: `fn x -> x + 1`

```text
// Main function
MAKE_CLOSURE 1 0    // func_id=1, no captures
RETURN

// Function 1: x -> x + 1
LOAD_LOCAL 0        // x
PUSH_INT 1
IADD
RETURN
```

### Function call

Source: `(fn x -> x + 1) 5`

```text
PUSH_INT 5          // Argument
MAKE_CLOSURE 1 0    // Create closure
CALL 1              // Call with 1 arg
RETURN
```

### Conditional

Source: `if true then 1 else 2`

```text
PUSH_BOOL true
JUMP_IF_FALSE 4     // Jump to else
PUSH_INT 1
JUMP 5              // Skip else
PUSH_INT 2          // else branch
RETURN
```

### Closure with capture

Source: `let y = 5 in fn x -> x + y`

```text
// Main
PUSH_INT 5
STORE_LOCAL 0       // y = 5
LOAD_LOCAL 0        // Push y for capture
MAKE_CLOSURE 1 1    // func_id=1, 1 capture
RETURN

// Function 1
LOAD_LOCAL 0        // x
LOAD_CAPTURE 0      // y
IADD
RETURN
```

## 9.5 Serialization format

A compiled program is saved as a `.baglc` file with the layout below. Every integer in the file, including each `uint32` in the layout, is written as 4 bytes in big-endian order, which puts the most significant byte first.

```text
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

Each opcode is written in two parts:
- One tag byte, which says which opcode it is.
- The operands, which depend on the opcode.
