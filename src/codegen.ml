(** Bytecode generation from IR *)

open Ir
open Bytecode

(** Code generation state for a single function *)
type func_state = {
  mutable code: opcode list;
  var_to_local: (var_id, int) Hashtbl.t;
  mutable next_local: int;
  block_addrs: (block_id, int) Hashtbl.t;
  mutable pending_jumps: (int * block_id) list;  (* (code_idx, target_block) *)
}

(** Create a new function state *)
let create_func_state num_params _num_captures =
  let var_to_local = Hashtbl.create 32 in
  (* Parameters are locals 0..num_params-1 *)
  (* Captures are accessed via LOAD_CAPTURE *)
  {
    code = [];
    var_to_local;
    next_local = num_params;
    block_addrs = Hashtbl.create 16;
    pending_jumps = [];
  }

(** Emit an opcode *)
let emit state op =
  state.code <- op :: state.code

(** Get current code position *)
let code_pos state = List.length state.code

(** Allocate a local for a variable *)
let alloc_local state var =
  match Hashtbl.find_opt state.var_to_local var with
  | Some local -> local
  | None ->
      let local = state.next_local in
      Hashtbl.add state.var_to_local var local;
      state.next_local <- local + 1;
      local

(** Get local index for a variable *)
let get_local state var =
  match Hashtbl.find_opt state.var_to_local var with
  | Some local -> local
  | None -> failwith (Printf.sprintf "Variable v%d not allocated" var)

(** Emit code to load a variable onto the stack *)
let emit_load state var =
  let local = get_local state var in
  emit state (LOAD_LOCAL local)

(** Emit code to store top of stack to a variable *)
let emit_store state var =
  let local = alloc_local state var in
  emit state (STORE_LOCAL local)

(** Convert IR binop to bytecode *)
let emit_binop state op =
  let opcode = match op with
    | IrAdd -> IADD
    | IrSub -> ISUB
    | IrMul -> IMUL
    | IrDiv -> IDIV
    | IrFAdd -> FADD
    | IrFSub -> FSUB
    | IrFMul -> FMUL
    | IrFDiv -> FDIV
    | IrEq -> IEQ
    | IrNeq -> INEQ
    | IrLt -> ILT
    | IrGt -> IGT
    | IrLe -> ILE
    | IrGe -> IGE
    | IrFLt -> FLT
    | IrFGt -> FGT
    | IrFLe -> FLE
    | IrFGe -> FGE
    | IrAnd -> AND
    | IrOr -> OR
  in
  emit state opcode

(** Convert IR unop to bytecode *)
let emit_unop state op =
  let opcode = match op with
    | IrNeg -> INEG
    | IrFNeg -> FNEG
    | IrNot -> NOT
  in
  emit state opcode

(** Convert IR tensor op to bytecode *)
let emit_tensor_op state op =
  match op with
  | IrTensorDot -> emit state TENSOR_DOT
  | IrTensorTranspose -> emit state TENSOR_TRANSPOSE
  | IrTensorReshape shape -> emit state (TENSOR_RESHAPE shape)
  | IrTensorCreate shape -> emit state (TENSOR_CREATE shape)

(** Emit an instruction *)
let emit_instr state instr =
  match instr with
  | IConst (dst, c) ->
      let opcode = match c with
        | CInt n -> PUSH_INT n
        | CFloat f -> PUSH_FLOAT f
        | CBool b -> PUSH_BOOL b
        | CString s -> PUSH_STRING s
        | CUnit -> PUSH_UNIT
      in
      emit state opcode;
      emit_store state dst

  | IBinop (dst, op, a, b) ->
      emit_load state a;
      emit_load state b;
      emit_binop state op;
      emit_store state dst

  | IUnop (dst, op, a) ->
      emit_load state a;
      emit_unop state op;
      emit_store state dst

  | ICopy (dst, src) ->
      emit_load state src;
      emit_store state dst

  | ICall (dst, func, args) ->
      (* Push arguments in order *)
      List.iter (emit_load state) args;
      (* Push function/closure *)
      emit_load state func;
      (* Call with number of arguments *)
      emit state (CALL (List.length args));
      (* Store result *)
      emit_store state dst

  | IClosure (dst, func_id, captures) ->
      (* Push captured values *)
      List.iter (emit_load state) captures;
      (* Create closure *)
      emit state (MAKE_CLOSURE (func_id, List.length captures));
      emit_store state dst

  | IRecClosure (dst, func_id, captures, self_idx) ->
      (* Push captured values (excluding self) *)
      List.iter (emit_load state) captures;
      (* Create recursive closure - VM will fill in self reference *)
      emit state (MAKE_REC_CLOSURE (func_id, List.length captures, self_idx));
      emit_store state dst

  | ILoadCapture (dst, idx) ->
      emit state (LOAD_CAPTURE idx);
      emit_store state dst

  | ITensorOp (dst, op, args) ->
      List.iter (emit_load state) args;
      emit_tensor_op state op;
      emit_store state dst

  | ITensorLit (dst, elems, shape) ->
      (* Push all elements *)
      List.iter (emit_load state) elems;
      (* Create tensor *)
      emit state (TENSOR_CREATE shape);
      emit_store state dst

(** Emit a terminator *)
let emit_terminator state term =
  match term with
  | TReturn var ->
      emit_load state var;
      emit state RETURN

  | TJump target ->
      let pos = code_pos state in
      emit state (JUMP 0);  (* Placeholder *)
      state.pending_jumps <- (pos, target) :: state.pending_jumps

  | TBranch (cond, then_target, else_target) ->
      emit_load state cond;
      let false_pos = code_pos state in
      emit state (JUMP_IF_FALSE 0);  (* Placeholder for else *)
      let true_pos = code_pos state in
      emit state (JUMP 0);  (* Placeholder for then *)
      state.pending_jumps <- (false_pos, else_target) :: state.pending_jumps;
      state.pending_jumps <- (true_pos, then_target) :: state.pending_jumps

(** Emit a basic block *)
let emit_block state (block : Ir.basic_block) =
  (* Record block address *)
  Hashtbl.add state.block_addrs block.id (code_pos state);
  (* Emit instructions *)
  List.iter (emit_instr state) block.instrs;
  (* Emit terminator *)
  match block.terminator with
  | Some term -> emit_terminator state term
  | None -> failwith "Block missing terminator"

(** Resolve pending jumps *)
let resolve_jumps state code_array =
  List.iter (fun (pos, target) ->
    match Hashtbl.find_opt state.block_addrs target with
    | Some addr ->
        (* pos is the array index after reversal (list length when recorded) *)
        begin match code_array.(pos) with
        | JUMP _ -> code_array.(pos) <- JUMP addr
        | JUMP_IF_FALSE _ -> code_array.(pos) <- JUMP_IF_FALSE addr
        | _ -> failwith "Expected jump instruction at pending position"
        end
    | None ->
        failwith (Printf.sprintf "Unknown block target: bb%d" target)
  ) state.pending_jumps

(** Generate bytecode for a function *)
let generate_func (ir_func : Ir.ir_func) : Bytecode.chunk =
  let state = create_func_state
    (List.length ir_func.params)
    ir_func.num_captures
  in

  (* Allocate locals for parameters *)
  List.iteri (fun i param ->
    Hashtbl.add state.var_to_local param i
  ) ir_func.params;

  (* Sort blocks to emit entry first, then others by block ID *)
  let sorted_blocks : Ir.basic_block list =
    let entry = List.find (fun (b : Ir.basic_block) -> b.id = ir_func.entry) ir_func.blocks in
    let others = List.filter (fun (b : Ir.basic_block) -> b.id <> ir_func.entry) ir_func.blocks in
    let sorted_others = List.sort (fun (a : Ir.basic_block) (b : Ir.basic_block) -> compare a.id b.id) others in
    entry :: sorted_others
  in

  (* First pass: emit all blocks to get addresses *)
  List.iter (emit_block state) sorted_blocks;

  (* Convert to array (reversing since we built in reverse) *)
  let code_array = Array.of_list (List.rev state.code) in

  (* Second pass: resolve jump targets *)
  resolve_jumps state code_array;

  {
    code = code_array;
    num_locals = state.next_local;
    num_params = List.length ir_func.params;
    num_captures = ir_func.num_captures;
  }

(** Generate bytecode for entire program *)
let generate ir_program =
  (* Generate chunks for all functions *)
  (* Functions are stored in reverse order in IR, so reverse them *)
  let ir_funcs = List.rev ir_program.funcs in
  let chunks = Array.of_list (List.map generate_func ir_funcs) in

  {
    chunks;
    entry = ir_program.main_func;
  }
