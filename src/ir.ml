(** Graph-based intermediate representation with basic blocks *)

open Location

(** Unique identifiers *)
type var_id = int
type block_id = int
type func_id = int

(** IR constants *)
type constant =
  | CInt of int
  | CFloat of float
  | CBool of bool
  | CString of string
  | CUnit

(** IR binary operations *)
type ir_binop =
  | IrAdd | IrSub | IrMul | IrDiv  (* Integer arithmetic *)
  | IrFAdd | IrFSub | IrFMul | IrFDiv  (* Float arithmetic *)
  | IrEq | IrNeq | IrLt | IrGt | IrLe | IrGe  (* Integer comparison *)
  | IrFLt | IrFGt | IrFLe | IrFGe  (* Float comparison *)
  | IrAnd | IrOr  (* Logical *)

(** IR unary operations *)
type ir_unop =
  | IrNeg | IrFNeg
  | IrNot

(** IR tensor operations *)
type ir_tensor_op =
  | IrTensorDot
  | IrTensorTranspose
  | IrTensorReshape of int list
  | IrTensorCreate of int list

(** IR instructions *)
type ir_instr =
  | IConst of var_id * constant
      (** dst = constant *)
  | IBinop of var_id * ir_binop * var_id * var_id
      (** dst = left op right *)
  | IUnop of var_id * ir_unop * var_id
      (** dst = op src *)
  | ICopy of var_id * var_id
      (** dst = src *)
  | ICall of var_id * var_id * var_id list
      (** dst = func(args) *)
  | IClosure of var_id * func_id * var_id list
      (** dst = closure(func, captures) *)
  | IRecClosure of var_id * func_id * var_id list * int
      (** dst = recursive closure(func, captures, self_capture_idx) *)
  | ILoadCapture of var_id * int
      (** dst = captures[i] *)
  | ITensorOp of var_id * ir_tensor_op * var_id list
      (** dst = tensor_op(args) *)
  | ITensorLit of var_id * var_id list * int list
      (** dst = tensor literal from values with shape *)

(** Block terminators *)
type terminator =
  | TReturn of var_id
      (** Return value *)
  | TJump of block_id
      (** Unconditional jump *)
  | TBranch of var_id * block_id * block_id
      (** if cond then block1 else block2 *)

(** Basic block *)
type basic_block = {
  id: block_id;
  mutable instrs: ir_instr list;
  mutable terminator: terminator option;
  mutable preds: block_id list;
  mutable succs: block_id list;
}

(** Function definition *)
type ir_func = {
  id: func_id;
  name: string;
  params: var_id list;
  num_captures: int;
  mutable entry: block_id;
  mutable blocks: basic_block list;
  mutable next_var: var_id;
  mutable next_block: block_id;
}

(** IR program *)
type ir_program = {
  mutable funcs: ir_func list;
  mutable main_func: func_id;
  mutable next_func: func_id;
}

(** Create a new empty program *)
let create_program () =
  { funcs = []; main_func = 0; next_func = 0 }

(** Create a new function *)
let create_func program name params num_captures =
  let id = program.next_func in
  program.next_func <- id + 1;
  let entry_block = {
    id = 0;
    instrs = [];
    terminator = None;
    preds = [];
    succs = [];
  } in
  let func = {
    id;
    name;
    params;
    num_captures;
    entry = 0;
    blocks = [entry_block];
    next_var = List.length params;
    next_block = 1;
  } in
  program.funcs <- func :: program.funcs;
  func

(** Get entry block of a function *)
let get_entry_block (func : ir_func) : basic_block =
  Stdlib.List.find (fun (b : basic_block) -> b.id = func.entry) func.blocks

(** Create a new basic block in a function *)
let create_block (func : ir_func) : basic_block =
  let id = func.next_block in
  func.next_block <- id + 1;
  let block = {
    id;
    instrs = [];
    terminator = None;
    preds = [];
    succs = [];
  } in
  func.blocks <- block :: func.blocks;
  block

(** Get a block by id *)
let get_block (func : ir_func) (id : block_id) : basic_block =
  Stdlib.List.find (fun (b : basic_block) -> b.id = id) func.blocks

(** Allocate a fresh variable *)
let fresh_var (func : ir_func) : var_id =
  let v = func.next_var in
  func.next_var <- v + 1;
  v

(** Add an instruction to a block (prepends for O(1), reversed later) *)
let add_instr (block : basic_block) (instr : ir_instr) : unit =
  block.instrs <- instr :: block.instrs

(** Finalize a block by reversing instructions to correct order *)
let finalize_block (block : basic_block) : unit =
  block.instrs <- List.rev block.instrs

(** Finalize all blocks in a function *)
let finalize_func (func : ir_func) : unit =
  List.iter finalize_block func.blocks

(** Finalize all functions in a program *)
let finalize_program (program : ir_program) : unit =
  List.iter finalize_func program.funcs

(** Set the terminator of a block *)
let set_terminator (block : basic_block) (term : terminator) : unit =
  block.terminator <- Some term

(** Connect two blocks (add edge) *)
let connect_blocks (from_block : basic_block) (to_block : basic_block) : unit =
  from_block.succs <- to_block.id :: from_block.succs;
  to_block.preds <- from_block.id :: to_block.preds

(* IR building context.
   [block] is a shared ref so that advancing the current block inside a
   sub-expression (e.g. an [if] opening a merge block) is visible to the
   caller even when the caller threaded a functionally-copied ctx (env
   extension). A fresh ref is only taken when a genuinely independent
   cursor is wanted, e.g. the then/else arms of an [if]. *)
type build_ctx = {
  program: ir_program;
  func: ir_func;
  block: basic_block ref;
  mutable env: (string * var_id) list;
  mutable captures: (string * var_id) list;  (* Captured variables *)
  type_env: Typeinfer.env;  (* Type environment for determining float vs int *)
}

(** Create a new build context for a function *)
let create_ctx program func type_env =
  {
    program;
    func;
    block = ref (get_entry_block func);
    env = [];
    captures = [];
    type_env;
  }

(** Check if an expression has float type *)
let is_float_expr ctx expr =
  try
    let ty = Typeinfer.infer_expr ctx.type_env expr in
    match Types.find_ty ty with
    | Types.TFloat -> true
    | _ -> false
  with Typeinfer.Type_error _ -> false

(** Look up a variable in the build context *)
let lookup_var ctx name =
  match List.assoc_opt name ctx.env with
  | Some v -> v
  | None ->
      (* Check captures *)
      match List.assoc_opt name ctx.captures with
      | Some v -> v
      | None -> failwith ("Unbound variable in IR: " ^ name)

(** Extend environment with a binding *)
let extend_env ctx name var_id =
  { ctx with env = (name, var_id) :: ctx.env }

(** Extend both variable and type environments *)
let extend_env_typed ctx name var_id ty =
  let scheme = Types.mono_scheme ty in
  { ctx with
    env = (name, var_id) :: ctx.env;
    type_env = (name, scheme) :: ctx.type_env
  }

(** Lower AST binop to IR binop based on operand types *)
let lower_binop is_float = function
  | Ast.Add -> if is_float then IrFAdd else IrAdd
  | Ast.Sub -> if is_float then IrFSub else IrSub
  | Ast.Mul -> if is_float then IrFMul else IrMul
  | Ast.Div -> if is_float then IrFDiv else IrDiv
  | Ast.Eq -> IrEq
  | Ast.Neq -> IrNeq
  | Ast.Lt -> if is_float then IrFLt else IrLt
  | Ast.Gt -> if is_float then IrFGt else IrGt
  | Ast.Le -> if is_float then IrFLe else IrLe
  | Ast.Ge -> if is_float then IrFGe else IrGe
  | Ast.And -> IrAnd
  | Ast.Or -> IrOr

(** Lower AST unop to IR unop *)
let lower_unop is_float = function
  | Ast.Neg -> if is_float then IrFNeg else IrNeg
  | Ast.Not -> IrNot

(** Lower an expression to IR, returning the result variable *)
let rec lower_expr ctx expr =
  match expr.value with
  | Ast.EInt n ->
      let v = fresh_var ctx.func in
      add_instr !(ctx.block) (IConst (v, CInt n));
      v

  | Ast.EFloat f ->
      let v = fresh_var ctx.func in
      add_instr !(ctx.block) (IConst (v, CFloat f));
      v

  | Ast.EBool b ->
      let v = fresh_var ctx.func in
      add_instr !(ctx.block) (IConst (v, CBool b));
      v

  | Ast.EString s ->
      let v = fresh_var ctx.func in
      add_instr !(ctx.block) (IConst (v, CString s));
      v

  | Ast.EVar name ->
      lookup_var ctx name

  | Ast.ETensor (rows, _shape_opt) ->
      (* Flatten tensor elements *)
      let elements = List.concat rows in
      let elem_vars = List.map (lower_expr ctx) elements in
      let num_rows = List.length rows in
      let num_cols = if rows = [] then 0 else List.length (List.hd rows) in
      let shape = if num_rows = 1 then [num_cols] else [num_rows; num_cols] in
      let v = fresh_var ctx.func in
      add_instr !(ctx.block) (ITensorLit (v, elem_vars, shape));
      v

  | Ast.ELet { name; value; body; _ } ->
      let value_var = lower_expr ctx value in
      (* Get the type of the value for the type environment *)
      let value_ty = try Typeinfer.infer_expr ctx.type_env value with Typeinfer.Type_error _ -> Types.TInt in
      let ctx' = extend_env_typed ctx name value_var value_ty in
      lower_expr ctx' body

  | Ast.ELetRec { name; value; body; _ } ->
      (* For recursive bindings, the function must capture itself *)
      let rec_var = fresh_var ctx.func in
      (* Get the type of the recursive binding *)
      let rec_ty = try Typeinfer.infer_expr ctx.type_env value with Typeinfer.Type_error _ -> Types.TInt in
      (* Add it to the environment so the function body can reference it *)
      let ctx' = extend_env_typed ctx name rec_var rec_ty in
      (* Now lower the function value with the recursive binding in scope *)
      begin match value.value with
      | Ast.EFn { param; body = fn_body; _ } ->
          (* Collect free vars from the function body *)
          let free_vars = collect_free_vars [param] fn_body in
          (* Find position of self-reference in free vars, or add it *)
          let self_idx =
            match List.find_index (fun n -> n = name) free_vars with
            | Some idx -> idx
            | None -> List.length free_vars  (* Will be added at end *)
          in
          (* Ensure self is in free_vars for the nested function's capture count *)
          let free_vars =
            if List.mem name free_vars then free_vars
            else free_vars @ [name]
          in
          (* Get capture vars - EXCLUDING self (it will be filled by VM) *)
          let other_captures = List.filter (fun fname -> fname <> name) free_vars in
          let capture_vars = List.map (lookup_var ctx) other_captures in

          (* Create the nested function *)
          let param_var = 0 in
          let nested_func = create_func ctx.program "<lambda>" [param_var] (List.length free_vars) in

          (* Set up captures in nested function. Seed the parameter's type
             from the recursive binding's arrow type so float-vs-int opcode
             selection is correct inside the body. *)
          let nested_ctx = create_ctx ctx.program nested_func ctx.type_env in
          let param_env = match Types.find_ty rec_ty with
            | Types.TArrow (pt, _) -> [(param, Types.mono_scheme pt)]
            | _ -> []
          in
          let nested_ctx = { nested_ctx with env = [(param, param_var)];
                                             type_env = param_env @ nested_ctx.type_env } in

          (* Add capture loads - all free vars including self *)
          let nested_ctx = List.fold_left2 (fun nctx fname idx ->
            let v = fresh_var nctx.func in
            add_instr !(nctx.block) (ILoadCapture (v, idx));
            { nctx with env = (fname, v) :: nctx.env }
          ) nested_ctx free_vars (List.init (List.length free_vars) Fun.id) in

          (* Lower the function body *)
          let result = lower_expr nested_ctx fn_body in
          set_terminator !(nested_ctx.block) (TReturn result);

          (* Create recursive closure - VM will fill self_idx with the closure itself *)
          add_instr !(ctx.block) (IRecClosure (rec_var, nested_func.id, capture_vars, self_idx));

          (* Continue with body *)
          lower_expr ctx' body
      | _ ->
          failwith "letrec requires a function value"
      end

  | Ast.EFn { param; param_annot; body } ->
      (* Create a new function for the lambda *)
      let free_vars = collect_free_vars [param] body in
      let capture_vars = List.map (lookup_var ctx) free_vars in

      (* Create the nested function *)
      let param_var = 0 in  (* Parameter is always var 0 *)
      let nested_func = create_func ctx.program "<lambda>" [param_var] (List.length free_vars) in

      (* Set up captures in nested function. Seed the type environment with
         the parameter's type so float-vs-int opcode selection is correct for
         a body that mentions only the parameter: use the annotation if there
         is one, otherwise infer the lambda itself in the enclosing type
         environment and take the arrow's domain. *)
      let nested_ctx = create_ctx ctx.program nested_func ctx.type_env in
      let param_ty = match param_annot with
        | Some annot -> Some (Typeinfer.type_annot_to_ty annot)
        | None ->
            (try
              match Types.find_ty (Typeinfer.infer_expr ctx.type_env expr) with
              | Types.TArrow (pt, _) -> Some pt
              | _ -> None
            with Typeinfer.Type_error _ -> None)
      in
      let param_env = match param_ty with
        | Some ty -> [(param, Types.mono_scheme ty)]
        | None -> []
      in
      let nested_ctx = { nested_ctx with env = [(param, param_var)];
                                         type_env = param_env @ nested_ctx.type_env } in

      (* Add capture loads *)
      let nested_ctx = List.fold_left2 (fun ctx name idx ->
        let v = fresh_var ctx.func in
        add_instr !(ctx.block) (ILoadCapture (v, idx));
        { ctx with env = (name, v) :: ctx.env }
      ) nested_ctx free_vars (List.init (List.length free_vars) Fun.id) in

      (* Lower the body *)
      let result = lower_expr nested_ctx body in
      set_terminator !(nested_ctx.block) (TReturn result);

      (* Create closure in current context *)
      let closure_var = fresh_var ctx.func in
      add_instr !(ctx.block) (IClosure (closure_var, nested_func.id, capture_vars));
      closure_var

  | Ast.EApp (func, arg) ->
      let func_var = lower_expr ctx func in
      let arg_var = lower_expr ctx arg in
      let result = fresh_var ctx.func in
      add_instr !(ctx.block) (ICall (result, func_var, [arg_var]));
      result

  | Ast.EIf { cond; then_branch; else_branch } ->
      let cond_var = lower_expr ctx cond in

      (* Allocate shared result variable before branching *)
      let result = fresh_var ctx.func in

      (* Create blocks for branches *)
      let then_block = create_block ctx.func in
      let else_block = create_block ctx.func in
      let merge_block = create_block ctx.func in

      (* Set up branches *)
      set_terminator !(ctx.block) (TBranch (cond_var, then_block.id, else_block.id));
      connect_blocks !(ctx.block) then_block;
      connect_blocks !(ctx.block) else_block;

      (* Lower then branch - write result to shared variable *)
      let then_ctx = { ctx with block = ref then_block } in
      let then_result = lower_expr then_ctx then_branch in
      add_instr !(then_ctx.block) (ICopy (result, then_result));
      set_terminator !(then_ctx.block) (TJump merge_block.id);
      connect_blocks !(then_ctx.block) merge_block;

      (* Lower else branch - write result to same shared variable *)
      let else_ctx = { ctx with block = ref else_block } in
      let else_result = lower_expr else_ctx else_branch in
      add_instr !(else_ctx.block) (ICopy (result, else_result));
      set_terminator !(else_ctx.block) (TJump merge_block.id);
      connect_blocks !(else_ctx.block) merge_block;

      (* Continue in merge block with result variable *)
      ctx.block := merge_block;
      result

  | Ast.EBinop (op, e1, e2) ->
      let v1 = lower_expr ctx e1 in
      let v2 = lower_expr ctx e2 in
      let result = fresh_var ctx.func in
      (* Float if either operand is float: mirrors the type checker, which
         resolves an operation to float when either side is float. *)
      let is_float = is_float_expr ctx e1 || is_float_expr ctx e2 in
      let ir_op = lower_binop is_float op in
      add_instr !(ctx.block) (IBinop (result, ir_op, v1, v2));
      result

  | Ast.EUnop (op, e) ->
      let v = lower_expr ctx e in
      let result = fresh_var ctx.func in
      (* Determine if float based on type info *)
      let is_float = is_float_expr ctx e in
      let ir_op = lower_unop is_float op in
      add_instr !(ctx.block) (IUnop (result, ir_op, v));
      result

  | Ast.ETensorOp (op, args) ->
      let arg_vars = List.map (lower_expr ctx) args in
      let result = fresh_var ctx.func in
      let ir_op = match op with
        | Ast.TensorDot -> IrTensorDot
        | Ast.TensorTranspose -> IrTensorTranspose
        | Ast.TensorReshape shape ->
            let dims = List.map (function
              | Ast.DimConst n -> n
              | Ast.DimVar _ -> failwith "Dynamic shape not supported in IR"
            ) shape in
            IrTensorReshape dims
      in
      add_instr !(ctx.block) (ITensorOp (result, ir_op, arg_vars));
      result

(** Collect free variables in an expression *)
and collect_free_vars bound expr =
  let rec collect bound = function
    | Ast.EInt _ | Ast.EFloat _ | Ast.EBool _ | Ast.EString _ -> []
    | Ast.EVar name ->
        if List.mem name bound then [] else [name]
    | Ast.ETensor (rows, _) ->
        List.concat (List.map (fun row ->
          List.concat (List.map (fun e -> collect bound e.value) row)
        ) rows)
    | Ast.ELet { name; value; body; _ } ->
        let value_free = collect bound value.value in
        let body_free = collect (name :: bound) body.value in
        value_free @ body_free
    | Ast.ELetRec { name; value; body; _ } ->
        (* For letrec, name is bound in both value and body *)
        let bound' = name :: bound in
        let value_free = collect bound' value.value in
        let body_free = collect bound' body.value in
        value_free @ body_free
    | Ast.EFn { param; body; _ } ->
        collect (param :: bound) body.value
    | Ast.EApp (f, arg) ->
        collect bound f.value @ collect bound arg.value
    | Ast.EIf { cond; then_branch; else_branch } ->
        collect bound cond.value @
        collect bound then_branch.value @
        collect bound else_branch.value
    | Ast.EBinop (_, e1, e2) ->
        collect bound e1.value @ collect bound e2.value
    | Ast.EUnop (_, e) ->
        collect bound e.value
    | Ast.ETensorOp (_, args) ->
        List.concat (List.map (fun e -> collect bound e.value) args)
  in
  (* Remove duplicates *)
  let free = collect bound expr.value in
  List.sort_uniq String.compare free

(** Lower a declaration, returning (ctx, optional_result_var) *)
let lower_decl ctx decl =
  match decl.value with
  | Ast.DLet { name; value; _ } ->
      let var_id = lower_expr ctx value in
      (extend_env ctx name var_id, None)
  | Ast.DExpr e ->
      let result = lower_expr ctx e in
      (ctx, Some result)

(** Lower a complete program *)
let lower_program typed_program =
  let program = create_program () in

  (* Create main function *)
  let main_func = create_func program "main" [] 0 in
  program.main_func <- main_func.id;

  (* Start with initial type environment *)
  let initial_type_env = Typeinfer.initial_env () in
  let ctx = create_ctx program main_func initial_type_env in

  (* Lower all declarations, keeping track of the last expression result *)
  let (final_ctx, last_result) = List.fold_left (fun (ctx, _last) (decl, _ty) ->
    lower_decl ctx decl
  ) (ctx, None) typed_program in

  (* Return the last expression result, or unit if none *)
  let result_var = match last_result with
    | Some v -> v
    | None ->
        let v = fresh_var final_ctx.func in
        add_instr !(final_ctx.block) (IConst (v, CUnit));
        v
  in
  set_terminator !(final_ctx.block) (TReturn result_var);

  (* Finalize all blocks - reverse instruction lists to correct order *)
  finalize_program program;

  program

(* Pretty printing *)

let pp_constant fmt = function
  | CInt n -> Format.fprintf fmt "%d" n
  | CFloat f -> Format.fprintf fmt "%f" f
  | CBool b -> Format.fprintf fmt "%b" b
  | CString s -> Format.fprintf fmt "%S" s
  | CUnit -> Format.fprintf fmt "()"

let pp_binop fmt = function
  | IrAdd -> Format.fprintf fmt "add"
  | IrSub -> Format.fprintf fmt "sub"
  | IrMul -> Format.fprintf fmt "mul"
  | IrDiv -> Format.fprintf fmt "div"
  | IrFAdd -> Format.fprintf fmt "fadd"
  | IrFSub -> Format.fprintf fmt "fsub"
  | IrFMul -> Format.fprintf fmt "fmul"
  | IrFDiv -> Format.fprintf fmt "fdiv"
  | IrEq -> Format.fprintf fmt "eq"
  | IrNeq -> Format.fprintf fmt "neq"
  | IrLt -> Format.fprintf fmt "lt"
  | IrGt -> Format.fprintf fmt "gt"
  | IrLe -> Format.fprintf fmt "le"
  | IrGe -> Format.fprintf fmt "ge"
  | IrFLt -> Format.fprintf fmt "flt"
  | IrFGt -> Format.fprintf fmt "fgt"
  | IrFLe -> Format.fprintf fmt "fle"
  | IrFGe -> Format.fprintf fmt "fge"
  | IrAnd -> Format.fprintf fmt "and"
  | IrOr -> Format.fprintf fmt "or"

let pp_unop fmt = function
  | IrNeg -> Format.fprintf fmt "neg"
  | IrFNeg -> Format.fprintf fmt "fneg"
  | IrNot -> Format.fprintf fmt "not"

let pp_tensor_op fmt = function
  | IrTensorDot -> Format.fprintf fmt "tensor.dot"
  | IrTensorTranspose -> Format.fprintf fmt "tensor.transpose"
  | IrTensorReshape dims ->
      Format.fprintf fmt "tensor.reshape[%a]"
        (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ",")
          Format.pp_print_int) dims
  | IrTensorCreate dims ->
      Format.fprintf fmt "tensor.create[%a]"
        (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ",")
          Format.pp_print_int) dims

let pp_var fmt v = Format.fprintf fmt "v%d" v

let pp_vars fmt vs =
  Format.fprintf fmt "(%a)"
    (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ", ") pp_var) vs

let pp_instr fmt = function
  | IConst (dst, c) ->
      Format.fprintf fmt "%a = %a" pp_var dst pp_constant c
  | IBinop (dst, op, l, r) ->
      Format.fprintf fmt "%a = %a %a %a" pp_var dst pp_binop op pp_var l pp_var r
  | IUnop (dst, op, src) ->
      Format.fprintf fmt "%a = %a %a" pp_var dst pp_unop op pp_var src
  | ICopy (dst, src) ->
      Format.fprintf fmt "%a = %a" pp_var dst pp_var src
  | ICall (dst, func, args) ->
      Format.fprintf fmt "%a = call %a%a" pp_var dst pp_var func pp_vars args
  | IClosure (dst, func_id, captures) ->
      Format.fprintf fmt "%a = closure @%d%a" pp_var dst func_id pp_vars captures
  | IRecClosure (dst, func_id, captures, self_idx) ->
      Format.fprintf fmt "%a = rec_closure @%d%a [self=%d]" pp_var dst func_id pp_vars captures self_idx
  | ILoadCapture (dst, idx) ->
      Format.fprintf fmt "%a = load_capture %d" pp_var dst idx
  | ITensorOp (dst, op, args) ->
      Format.fprintf fmt "%a = %a%a" pp_var dst pp_tensor_op op pp_vars args
  | ITensorLit (dst, elems, shape) ->
      Format.fprintf fmt "%a = tensor_lit%a [%a]" pp_var dst pp_vars elems
        (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ",")
          Format.pp_print_int) shape

let pp_terminator fmt = function
  | TReturn v -> Format.fprintf fmt "return %a" pp_var v
  | TJump bid -> Format.fprintf fmt "jump bb%d" bid
  | TBranch (cond, t, f) ->
      Format.fprintf fmt "branch %a ? bb%d : bb%d" pp_var cond t f

let pp_block fmt (block : basic_block) =
  Format.fprintf fmt "bb%d:@." block.id;
  List.iter (fun instr ->
    Format.fprintf fmt "  %a@." pp_instr instr
  ) block.instrs;
  match block.terminator with
  | Some t -> Format.fprintf fmt "  %a@." pp_terminator t
  | None -> Format.fprintf fmt "  <no terminator>@."

let pp_func fmt (func : ir_func) =
  Format.fprintf fmt "func @%d %s(%a):@."
    func.id func.name
    (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ", ") pp_var)
    func.params;
  (* Sort blocks by id for consistent output *)
  let sorted_blocks = List.sort (fun (a : basic_block) (b : basic_block) -> compare a.id b.id) func.blocks in
  List.iter (pp_block fmt) sorted_blocks

let pp_program fmt program =
  List.iter (fun func ->
    pp_func fmt func;
    Format.fprintf fmt "@."
  ) (List.rev program.funcs)

let string_of_program p = Format.asprintf "%a" pp_program p
