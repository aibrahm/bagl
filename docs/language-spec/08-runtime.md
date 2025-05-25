# 8. Runtime System

This chapter describes the BAGL virtual machine and runtime execution model.

## 8.1 Virtual Machine Architecture

BAGL uses a **stack-based virtual machine** for program execution.

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

### Initial State

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

## 8.2 Runtime Values

### Value Types

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

### Tensor Values

```ocaml
type tensor = {
  data: float array;      (* Flat element storage *)
  shape: int list;        (* Dimension sizes *)
  strides: int list;      (* Access strides *)
}
```

### Closure Values

```ocaml
type closure = {
  func_id: int;           (* Function chunk index *)
  captures: value array;  (* Captured variables *)
}
```

## 8.3 Stack Operations

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

### Stack Discipline

The stack holds:
- Intermediate computation results
- Function arguments
- Temporary values

## 8.4 Call Frames

### Frame Structure

```ocaml
type frame = {
  return_addr: int;         (* Where to resume *)
  return_chunk: int;        (* Which function *)
  base_ptr: int;            (* Not currently used *)
  closure: closure option;  (* For captured vars *)
  saved_locals: value array; (* Caller's locals *)
}
```

### Function Call

1. Pop closure from stack
2. Pop arguments from stack
3. Save current state in new frame
4. Push frame onto call stack
5. Switch to callee's chunk
6. Initialize locals with arguments

### Function Return

1. Pop return value from stack
2. Pop frame from call stack
3. Restore caller's state
4. Push return value onto stack

## 8.5 Closures

### Closure Creation

When a function is defined:
1. Identify free variables (captured from enclosing scope)
2. Copy captured values from current environment
3. Create closure with function ID and captures

### Closure Invocation

When a closure is called:
1. Store closure in frame
2. Access captures via `LOAD_CAPTURE` instruction

### Recursive Closures

Self-referencing closures use a special mechanism:
1. Create closure with placeholder for self
2. Fill in self-reference after creation
3. Store self-capture index in bytecode

## 8.6 Execution Model

### Fetch-Execute Cycle

```
while running:
  instr = chunk.code[pc]
  pc = pc + 1
  execute(instr)
```

### Instruction Execution

Each instruction:
1. Reads operands from stack/locals
2. Performs computation
3. Pushes result to stack
4. Returns whether to continue

### Termination

Execution ends when:
- `HALT` instruction is executed
- `RETURN` with empty call stack
- Runtime error occurs

## 8.7 Memory Management

### Stack Allocation

- Fixed-size stack (1024 elements)
- Stack overflow causes runtime error

### Local Variables

- Fixed-size local array (256 per frame)
- Locals preserved on call stack during calls

### Garbage Collection

Current implementation:
- No garbage collection
- Values live for program duration
- Suitable for short-running programs

## 8.8 Tensor Operations at Runtime

### Tensor Creation

1. Pop elements from stack
2. Allocate flat array
3. Compute strides
4. Return tensor value

### Dot Product

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

## 8.9 Error Handling

### Runtime Errors

```ocaml
exception Runtime_error of string
```

Errors include:
- Stack overflow/underflow
- Division by zero
- Type mismatch at runtime
- Invalid tensor shapes
- PC out of bounds

### Error Messages

```
Runtime error: Stack overflow
Runtime error: Division by zero
Runtime error: Expected int, got bool
Runtime error: Invalid shapes for dot: 2x3 and 4x2
```

## 8.10 Debugging Support

### Instruction Tracing

Debug builds can trace each instruction:

```
0000: PUSH_INT 5
0001: STORE_LOCAL 0
0002: LOAD_LOCAL 0
0003: PUSH_INT 1
0004: IADD
0005: RETURN
```

### Stack Inspection

```
Stack: [VInt 5, VInt 1]
Locals: [VInt 5, VUnit, ...]
```

### Bytecode Disassembly

```
=== Function 0 (locals=2, params=0, captures=0) ===
   0: PUSH_INT 5
   1: STORE_LOCAL 0
   2: LOAD_LOCAL 0
   3: PUSH_INT 1
   4: IADD
   5: RETURN
```

## 8.11 Performance Characteristics

### Time Complexity

| Operation | Complexity |
|-----------|------------|
| Stack push/pop | O(1) |
| Local access | O(1) |
| Closure capture | O(1) |
| Function call | O(captures) |
| Tensor dot | O(m×n×k) |
| Tensor transpose | O(m×n) |

### Space Complexity

| Resource | Limit |
|----------|-------|
| Stack | 1024 values |
| Locals | 256 per frame |
| Call depth | Limited by memory |
