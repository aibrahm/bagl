(** Stack-based virtual machine for Bagl bytecode *)

open Bytecode

(** Runtime values *)
type value =
  | VInt of int
  | VFloat of float
  | VBool of bool
  | VString of string
  | VUnit
  | VTensor of tensor
  | VClosure of closure

and tensor = {
  data: float array;
  shape: int list;
  strides: int list;
}

and closure = {
  func_id: int;
  captures: value array;
}

(** Call frame *)
type frame = {
  return_addr: int;       (** Instruction to return to *)
  return_chunk: int;      (** Function to return to *)
  base_ptr: int;          (** Base of locals on stack *)
  closure: closure option; (** Current closure (for captures) *)
  saved_locals: value array; (** Saved locals from caller *)
}

(** VM state *)
type t = {
  program: program;
  mutable stack: value array;
  mutable sp: int;              (** Stack pointer *)
  mutable frames: frame list;   (** Call stack *)
  mutable pc: int;              (** Program counter *)
  mutable chunk_id: int;        (** Current function *)
  mutable locals: value array;  (** Local variables for current frame *)
}

(** Runtime error *)
exception Runtime_error of string

(** Create initial VM state *)
let create program =
  let stack_size = 1024 in
  let locals_size = 256 in
  {
    program;
    stack = Array.make stack_size VUnit;
    sp = 0;
    frames = [];
    pc = 0;
    chunk_id = program.entry;
    locals = Array.make locals_size VUnit;
  }

(** Get current chunk *)
let current_chunk vm =
  vm.program.chunks.(vm.chunk_id)

(** Push a value onto the stack *)
let push vm value =
  if vm.sp >= Array.length vm.stack then
    raise (Runtime_error "Stack overflow");
  vm.stack.(vm.sp) <- value;
  vm.sp <- vm.sp + 1

(** Pop a value from the stack *)
let pop vm =
  if vm.sp <= 0 then
    raise (Runtime_error "Stack underflow");
  vm.sp <- vm.sp - 1;
  vm.stack.(vm.sp)

(** Peek at top of stack *)
let peek vm =
  if vm.sp <= 0 then
    raise (Runtime_error "Stack underflow");
  vm.stack.(vm.sp - 1)

(** Convert value to string *)
let rec string_of_value = function
  | VInt n -> string_of_int n
  | VFloat f -> string_of_float f
  | VBool b -> string_of_bool b
  | VString s -> "\"" ^ String.escaped s ^ "\""
  | VUnit -> "()"
  | VTensor t -> string_of_tensor t
  | VClosure c -> Printf.sprintf "<closure@%d>" c.func_id

and string_of_tensor t =
  let shape_str =
    "[" ^ String.concat "," (List.map string_of_int t.shape) ^ "]"
  in
  Printf.sprintf "tensor%s" shape_str

(** Pop an integer *)
let pop_int vm =
  match pop vm with
  | VInt n -> n
  | v -> raise (Runtime_error ("Expected int, got " ^ string_of_value v))

(** Pop a float *)
let pop_float vm =
  match pop vm with
  | VFloat f -> f
  | v -> raise (Runtime_error ("Expected float, got " ^ string_of_value v))

(** Pop a bool *)
let pop_bool vm =
  match pop vm with
  | VBool b -> b
  | v -> raise (Runtime_error ("Expected bool, got " ^ string_of_value v))

(** Pop a tensor *)
let pop_tensor vm =
  match pop vm with
  | VTensor t -> t
  | v -> raise (Runtime_error ("Expected tensor, got " ^ string_of_value v))

(** Pop a closure *)
let pop_closure vm =
  match pop vm with
  | VClosure c -> c
  | v -> raise (Runtime_error ("Expected closure, got " ^ string_of_value v))

(** Compute strides for a shape *)
let compute_strides shape =
  let rec aux acc = function
    | [] -> List.rev acc
    | [_] -> List.rev (1 :: acc)
    | _ :: rest ->
        let stride = List.fold_left ( * ) 1 rest in
        aux (stride :: acc) rest
  in
  aux [] shape

(** Create a tensor with given shape *)
let create_tensor shape init_val =
  let size = List.fold_left ( * ) 1 shape in
  {
    data = Array.make size init_val;
    shape;
    strides = compute_strides shape;
  }

(** Flatten index for tensor access *)
let flat_index indices strides =
  List.fold_left2 (fun acc i s -> acc + i * s) 0 indices strides

(** Get tensor element *)
let tensor_get t indices =
  t.data.(flat_index indices t.strides)

(** Set tensor element *)
let tensor_set t indices v =
  t.data.(flat_index indices t.strides) <- v

(** Matrix multiplication *)
let tensor_dot a b =
  match a.shape, b.shape with
  | [m; k1], [k2; n] when k1 = k2 ->
      let result = create_tensor [m; n] 0.0 in
      for i = 0 to m - 1 do
        for j = 0 to n - 1 do
          let sum = ref 0.0 in
          for k = 0 to k1 - 1 do
            sum := !sum +. (tensor_get a [i; k]) *. (tensor_get b [k; j])
          done;
          tensor_set result [i; j] !sum
        done
      done;
      result

  | [k1], [k2; n] when k1 = k2 ->
      (* Vector-matrix multiply *)
      let result = create_tensor [n] 0.0 in
      for j = 0 to n - 1 do
        let sum = ref 0.0 in
        for k = 0 to k1 - 1 do
          sum := !sum +. (tensor_get a [k]) *. (tensor_get b [k; j])
        done;
        tensor_set result [j] !sum
      done;
      result

  | [m; k1], [k2] when k1 = k2 ->
      (* Matrix-vector multiply *)
      let result = create_tensor [m] 0.0 in
      for i = 0 to m - 1 do
        let sum = ref 0.0 in
        for k = 0 to k1 - 1 do
          sum := !sum +. (tensor_get a [i; k]) *. (tensor_get b [k])
        done;
        tensor_set result [i] !sum
      done;
      result

  | [k1], [k2] when k1 = k2 ->
      (* Vector dot product - returns scalar *)
      let sum = ref 0.0 in
      for k = 0 to k1 - 1 do
        sum := !sum +. (tensor_get a [k]) *. (tensor_get b [k])
      done;
      (* Return as 0D tensor *)
      { data = [| !sum |]; shape = []; strides = [] }

  | _ ->
      raise (Runtime_error (Printf.sprintf "Invalid shapes for dot: %s and %s"
        (String.concat "x" (List.map string_of_int a.shape))
        (String.concat "x" (List.map string_of_int b.shape))))

(** Transpose a 2D tensor *)
let tensor_transpose t =
  match t.shape with
  | [m; n] ->
      let result = create_tensor [n; m] 0.0 in
      for i = 0 to m - 1 do
        for j = 0 to n - 1 do
          tensor_set result [j; i] (tensor_get t [i; j])
        done
      done;
      result
  | _ ->
      raise (Runtime_error "Transpose requires 2D tensor")

(** Reshape a tensor *)
let tensor_reshape t new_shape =
  let old_size = List.fold_left ( * ) 1 t.shape in
  let new_size = List.fold_left ( * ) 1 new_shape in
  if old_size <> new_size then
    raise (Runtime_error (Printf.sprintf "Reshape size mismatch: %d vs %d"
      old_size new_size));
  { t with shape = new_shape; strides = compute_strides new_shape }

(** Execute one instruction, return false if halted *)
let step vm =
  let chunk = current_chunk vm in
  if vm.pc >= Array.length chunk.code then
    raise (Runtime_error "PC out of bounds");

  let instr = chunk.code.(vm.pc) in
  vm.pc <- vm.pc + 1;

  match instr with
  | PUSH_INT n -> push vm (VInt n); true
  | PUSH_FLOAT f -> push vm (VFloat f); true
  | PUSH_BOOL b -> push vm (VBool b); true
  | PUSH_STRING s -> push vm (VString s); true
  | PUSH_UNIT -> push vm VUnit; true

  | POP -> ignore (pop vm); true
  | DUP -> push vm (peek vm); true

  | LOAD_LOCAL i ->
      push vm vm.locals.(i);
      true

  | STORE_LOCAL i ->
      vm.locals.(i) <- pop vm;
      true

  | LOAD_GLOBAL _ ->
      raise (Runtime_error "Globals not implemented")

  | STORE_GLOBAL _ ->
      raise (Runtime_error "Globals not implemented")

  | MAKE_CLOSURE (func_id, num_captures) ->
      (* Pop captured values in reverse order *)
      let captures = Array.init num_captures (fun _ -> pop vm) in
      (* Reverse to get correct order *)
      let captures = Array.of_list (List.rev (Array.to_list captures)) in
      push vm (VClosure { func_id; captures });
      true

  | MAKE_REC_CLOSURE (func_id, num_captures, self_idx) ->
      (* Pop captured values in reverse order (excluding self) *)
      let other_captures = Array.init num_captures (fun _ -> pop vm) in
      let other_captures = Array.of_list (List.rev (Array.to_list other_captures)) in
      (* Create captures array with space for self-reference *)
      let total_captures = num_captures + 1 in
      let captures = Array.make total_captures VUnit in
      (* Fill in other captures, leaving room for self at self_idx *)
      let other_idx = ref 0 in
      for i = 0 to total_captures - 1 do
        if i <> self_idx then begin
          captures.(i) <- other_captures.(!other_idx);
          incr other_idx
        end
      done;
      (* Create the closure *)
      let closure = { func_id; captures } in
      (* Fill in self-reference *)
      captures.(self_idx) <- VClosure closure;
      push vm (VClosure closure);
      true

  | LOAD_CAPTURE i ->
      begin match vm.frames with
      | frame :: _ ->
          begin match frame.closure with
          | Some c -> push vm c.captures.(i)
          | None -> raise (Runtime_error "No closure for LOAD_CAPTURE")
          end
      | [] ->
          raise (Runtime_error "No frame for LOAD_CAPTURE")
      end;
      true

  | IADD ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VInt (a + b));
      true

  | ISUB ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VInt (a - b));
      true

  | IMUL ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VInt (a * b));
      true

  | IDIV ->
      let b = pop_int vm in
      let a = pop_int vm in
      if b = 0 then raise (Runtime_error "Division by zero");
      push vm (VInt (a / b));
      true

  | INEG ->
      let a = pop_int vm in
      push vm (VInt (-a));
      true

  | FADD ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VFloat (a +. b));
      true

  | FSUB ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VFloat (a -. b));
      true

  | FMUL ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VFloat (a *. b));
      true

  | FDIV ->
      let b = pop_float vm in
      let a = pop_float vm in
      if b = 0.0 then raise (Runtime_error "Division by zero");
      push vm (VFloat (a /. b));
      true

  | FNEG ->
      let a = pop_float vm in
      push vm (VFloat (-.a));
      true

  | IEQ ->
      let b = pop vm in
      let a = pop vm in
      let result = match a, b with
        | VInt x, VInt y -> x = y
        | VFloat x, VFloat y -> x = y
        | VBool x, VBool y -> x = y
        | VString x, VString y -> x = y
        | VUnit, VUnit -> true
        | _ -> false
      in
      push vm (VBool result);
      true

  | INEQ ->
      let b = pop vm in
      let a = pop vm in
      let result = match a, b with
        | VInt x, VInt y -> x <> y
        | VFloat x, VFloat y -> x <> y
        | VBool x, VBool y -> x <> y
        | VString x, VString y -> x <> y
        | VUnit, VUnit -> false
        | _ -> true
      in
      push vm (VBool result);
      true

  | ILT ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VBool (a < b));
      true

  | IGT ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VBool (a > b));
      true

  | ILE ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VBool (a <= b));
      true

  | IGE ->
      let b = pop_int vm in
      let a = pop_int vm in
      push vm (VBool (a >= b));
      true

  | FLT ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VBool (a < b));
      true

  | FGT ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VBool (a > b));
      true

  | FLE ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VBool (a <= b));
      true

  | FGE ->
      let b = pop_float vm in
      let a = pop_float vm in
      push vm (VBool (a >= b));
      true

  | AND ->
      let b = pop_bool vm in
      let a = pop_bool vm in
      push vm (VBool (a && b));
      true

  | OR ->
      let b = pop_bool vm in
      let a = pop_bool vm in
      push vm (VBool (a || b));
      true

  | NOT ->
      let a = pop_bool vm in
      push vm (VBool (not a));
      true

  | JUMP addr ->
      vm.pc <- addr;
      true

  | JUMP_IF_FALSE addr ->
      let cond = pop_bool vm in
      if not cond then vm.pc <- addr;
      true

  | CALL n_args ->
      let closure = pop_closure vm in
      (* Pop arguments *)
      let args = Array.init n_args (fun _ -> pop vm) in
      let args = Array.of_list (List.rev (Array.to_list args)) in

      (* Save current frame with locals *)
      let frame = {
        return_addr = vm.pc;
        return_chunk = vm.chunk_id;
        base_ptr = 0;  (* Not using stack-based locals *)
        closure = Some closure;
        saved_locals = vm.locals;  (* Save caller's locals *)
      } in
      vm.frames <- frame :: vm.frames;

      (* Set up new frame *)
      vm.chunk_id <- closure.func_id;
      vm.pc <- 0;
      vm.locals <- Array.make 256 VUnit;

      (* Copy arguments to locals *)
      Array.iteri (fun i arg -> vm.locals.(i) <- arg) args;

      true

  | RETURN ->
      let result = pop vm in
      begin match vm.frames with
      | frame :: rest ->
          vm.frames <- rest;
          vm.pc <- frame.return_addr;
          vm.chunk_id <- frame.return_chunk;
          vm.locals <- frame.saved_locals;  (* Restore caller's locals *)
          push vm result;
          true
      | [] ->
          (* Returning from main - halt *)
          push vm result;
          false
      end

  | TENSOR_CREATE shape ->
      (* Pop elements in reverse order *)
      let size = List.fold_left ( * ) 1 shape in
      let elements = Array.init size (fun _ ->
        match pop vm with
        | VFloat f -> f
        | VInt n -> float_of_int n
        | v -> raise (Runtime_error ("Expected numeric value in tensor, got " ^
            string_of_value v))
      ) in
      (* Reverse to get correct order *)
      let data = Array.of_list (List.rev (Array.to_list elements)) in
      let tensor = {
        data;
        shape;
        strides = compute_strides shape;
      } in
      push vm (VTensor tensor);
      true

  | TENSOR_DOT ->
      let b = pop_tensor vm in
      let a = pop_tensor vm in
      let result = tensor_dot a b in
      (* If result is scalar (0D), return as float *)
      if result.shape = [] then
        push vm (VFloat result.data.(0))
      else
        push vm (VTensor result);
      true

  | TENSOR_TRANSPOSE ->
      let t = pop_tensor vm in
      push vm (VTensor (tensor_transpose t));
      true

  | TENSOR_RESHAPE shape ->
      let t = pop_tensor vm in
      push vm (VTensor (tensor_reshape t shape));
      true

  | PRINT ->
      let v = peek vm in
      print_endline (string_of_value v);
      true

  | HALT -> false

  | NOP -> true

(** Run the VM to completion *)
let run vm =
  while step vm do () done;
  if vm.sp > 0 then peek vm
  else VUnit

(** Run and return result *)
let execute program =
  let vm = create program in
  run vm

(** Pretty print a value *)
let pp_value fmt v =
  Format.fprintf fmt "%s" (string_of_value v)
