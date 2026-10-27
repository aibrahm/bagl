# 8. Runtime system

Chapter 8 describes the Bagl virtual machine (VM) and how it runs a program.

## 8.1 Virtual machine architecture

Bagl runs programs on a stack-based virtual machine. A stack-based VM takes the operands of each instruction from the top of a stack, and it pushes the result back onto the stack.

### Components

```
┌─────────────────────────────────────────┐
│              VM State                    │
├─────────────────────────────────────────┤
│  Program    │ Bytecode chunks (one per  │
│             │ function)                  │
├─────────────┼───────────────────────────┤
│  Stack      │ Operand stack for         │
│             │ computation                │
├─────────────┼───────────────────────────┤
│  Locals     │ Local variable storage    │
│             │ for current frame          │
├─────────────┼───────────────────────────┤
│  Frames     │ Call stack for function   │
│             │ returns                    │
├─────────────┼───────────────────────────┤
│  PC         │ Program counter           │
├─────────────┼───────────────────────────┤
│  Chunk ID   │ Current function index    │
└─────────────┴───────────────────────────┘
```

### Initial state

The VM starts with the following state. The locals array has 256 slots, or more if the entry function needs more.

```ocaml
{
  program;                    (* Loaded bytecode *)
  stack = Array.make 1024 VUnit;
  sp = 0;                     (* Stack pointer *)
  frames = [];                (* Call stack *)
  pc = 0;                     (* Program counter *)
  chunk_id = program.entry;   (* Start at entry point *)
  locals = Array.make 256 VUnit;
}
```

## 8.2 Runtime values

### Value types

```ocaml
type value =
  | VInt of int           (* Integer *)
  | VFloat of float       (* Float *)
  | VBool of bool         (* Boolean *)
  | VString of string     (* String *)
  | VUnit                 (* Unit value *)
  | VTensor of tensor     (* Tensor *)
  | VClosure of closure   (* Function closure *)
```

### Tensor values

```ocaml
type tensor = {
  data: float array;      (* Flat element storage *)
  shape: int list;        (* Dimension sizes *)
  strides: int list;      (* Access strides *)
}
```

### Closure values

```ocaml
type closure = {
  func_id: int;           (* Function chunk index *)
  captures: value array;  (* Captured variables *)
}
```

## 8.3 Stack operations

### Push

```
push(value):
  stack[sp] = value
  sp = sp + 1
```

### Pop

```
pop():
  sp = sp - 1
  return stack[sp]
```

### Stack discipline

The stack holds the following kinds of values:
- The intermediate results of a computation
- Function arguments
- Temporary values

## 8.4 Call frames

A call frame records what the VM needs in order to return from a function call.

### Frame structure

```ocaml
type frame = {
  return_addr: int;         (* Where to resume *)
  return_chunk: int;        (* Which function *)
  base_ptr: int;            (* Not currently used *)
  closure: closure option;  (* For captured vars *)
  saved_locals: value array; (* Caller's locals *)
}
```

### Function call

A function call takes the following steps.
1. The VM pops the closure from the stack.
2. It pops the arguments from the stack.
3. It saves the current state in a new frame.
4. It pushes the frame onto the call stack.
5. It switches to the chunk of the called function. A chunk is the bytecode of one function.
6. It creates a new locals array and copies the arguments into it.

### Function return

A function return takes the following steps.
1. The VM pops the return value from the stack.
2. It pops the frame from the call stack.
3. It restores the state of the caller.
4. It pushes the return value onto the stack.

## 8.5 Closures

### Closure creation

A closure is created in the following steps.
1. The compiler finds the free variables of the function, which are the variables it uses from the enclosing scope.
2. At run time, the VM copies the values of the free variables from the current environment.
3. The VM creates a closure that holds the function ID and the copied values, which are called the captures.

### Closure invocation

When the VM calls a closure, it stores the closure in the new frame. The function body then reads its captures with the `LOAD_CAPTURE` instruction.

### Recursive closures

A recursive closure needs to capture itself, so the VM builds it in the following steps.
1. The bytecode stores the index of the capture that will hold the closure itself.
2. The VM creates the closure with an empty slot at that index.
3. The VM then puts the closure into its own empty slot.

## 8.6 Execution model

### Fetch-execute cycle

The VM runs a loop that fetches the next instruction and then executes it.

```
while running:
  instr = chunk.code[pc]
  pc = pc + 1
  execute(instr)
```

### Instruction execution

Each instruction takes the following steps.
1. It reads its operands from the stack or the locals.
2. It does its computation.
3. It pushes the result onto the stack.
4. It tells the loop whether to continue.

### Termination

Execution ends in any of the following cases:
- The VM executes a `HALT` instruction.
- The VM executes `RETURN` when the call stack is empty.
- A runtime error occurs.

## 8.7 Memory management

### Stack allocation

- The stack has a fixed size of 1024 values.
- A stack overflow raises a runtime error.

### Local variables

- Each frame gets its own locals array, with 256 slots or more if the function needs more.
- During a call, the frame keeps the locals of the caller, and the VM restores them on return.

### Garbage collection

The VM has no garbage collector of its own. It is written in OCaml, and its values are ordinary OCaml values. The OCaml garbage collector frees a value once nothing refers to it.

## 8.8 Tensor operations at runtime

### Tensor creation

The VM creates a tensor in the following steps.
1. It pops the elements from the stack.
2. It puts them in a flat array.
3. It computes the strides.
4. It pushes the tensor value onto the stack.

### Dot product

The code below is a simplified form of the matrix case. The VM also handles a vector times a matrix, a matrix times a vector, and two vectors. For two vectors, it pushes the result as a float.

```ocaml
let tensor_dot a b =
  match a.shape, b.shape with
  | [m; k1], [k2; n] when k1 = k2 ->
      let result = create_tensor [m; n] 0.0 in
      for i = 0 to m - 1 do
        for j = 0 to n - 1 do
          let sum = ref 0.0 in
          for k = 0 to k1 - 1 do
            sum := !sum +. a[i,k] *. b[k,j]
          done;
          result[i,j] <- !sum
        done
      done;
      result
```

### Transpose

```ocaml
let tensor_transpose t =
  let [m; n] = t.shape in
  let result = create_tensor [n; m] 0.0 in
  for i = 0 to m - 1 do
    for j = 0 to n - 1 do
      result[j,i] <- t[i,j]
    done
  done;
  result
```

## 8.9 Error handling

### Runtime errors

```ocaml
exception Runtime_error of string
```

The runtime errors include the following:
- Stack overflow or stack underflow
- Division by zero
- A value of the wrong type at run time
- Tensor shapes that don't fit the operation
- A program counter outside the code of the current function
- `log` of a number that isn't positive, or `sqrt` of a negative number

### Error messages

```
Runtime error: Stack overflow
Runtime error: Division by zero
Runtime error: Expected int, got bool
Runtime error: Invalid shapes for dot: 2x3 and 4x2
```

## 8.10 Debugging support

### Instruction tracing

The VM has no instruction tracer. The listing below is an example of what a trace would show for `let x = 5 in x + 1`, with one line for each instruction the VM runs.

```
0000: PUSH_INT 5
0001: STORE_LOCAL 0
0002: LOAD_LOCAL 0
0003: PUSH_INT 1
0004: IADD
0005: RETURN
```

### Stack inspection

The VM has no command that prints the stack or the locals. The listing below is an example of what such a printout would show.

```
Stack: [VInt 5, VInt 1]
Locals: [VInt 5, VUnit, ...]
```

### Bytecode disassembly

The `--dump-bytecode` option prints the bytecode of each function in the following format. The listing below is simplified. The real listing for a program is often longer, because the compiler stores each intermediate result in a local.

```
=== Function 0 (locals=2, params=0, captures=0) ===
   0: PUSH_INT 5
   1: STORE_LOCAL 0
   2: LOAD_LOCAL 0
   3: PUSH_INT 1
   4: IADD
   5: RETURN
```

## 8.11 Performance characteristics

### Time complexity

| Operation | Complexity |
|-----------|------------|
| Stack push/pop | O(1) |
| Local access | O(1) |
| Closure capture | O(1) |
| Function call | O(captures) |
| Tensor dot | O(m×n×k) |
| Tensor transpose | O(m×n) |

### Space complexity

| Resource | Limit |
|----------|-------|
| Stack | 1024 values |
| Locals | At least 256 per frame |
| Call depth | Limited by memory |
