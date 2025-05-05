(** Optimization passes for IR *)

open Ir

(** Optimization configuration *)
type config = {
  const_fold: bool;
  dead_code: bool;
  cse: bool;
  copy_prop: bool;
}

let default_config = {
  const_fold = true;
  dead_code = true;
  cse = true;
  copy_prop = true;
}

(** Evaluate integer binary operation *)
let eval_int_binop op a b =
  match op with
  | IrAdd -> Some (CInt (a + b))
  | IrSub -> Some (CInt (a - b))
  | IrMul -> Some (CInt (a * b))
  | IrDiv -> if b = 0 then None else Some (CInt (a / b))
  | IrEq -> Some (CBool (a = b))
  | IrNeq -> Some (CBool (a <> b))
  | IrLt -> Some (CBool (a < b))
  | IrGt -> Some (CBool (a > b))
  | IrLe -> Some (CBool (a <= b))
  | IrGe -> Some (CBool (a >= b))
  | _ -> None

(** Evaluate float binary operation *)
let eval_float_binop op a b =
  match op with
  | IrFAdd -> Some (CFloat (a +. b))
  | IrFSub -> Some (CFloat (a -. b))
  | IrFMul -> Some (CFloat (a *. b))
  | IrFDiv -> if b = 0.0 then None else Some (CFloat (a /. b))
  | _ -> None

(** Evaluate boolean binary operation *)
let eval_bool_binop op a b =
  match op with
  | IrAnd -> Some (CBool (a && b))
  | IrOr -> Some (CBool (a || b))
  | IrEq -> Some (CBool (a = b))
  | IrNeq -> Some (CBool (a <> b))
  | _ -> None

(** Evaluate unary operation *)
let eval_unop op c =
  match op, c with
  | IrNeg, CInt n -> Some (CInt (-n))
  | IrFNeg, CFloat f -> Some (CFloat (-.f))
  | IrNot, CBool b -> Some (CBool (not b))
  | _ -> None

(** Get the variable defined by an instruction, if any *)
let instr_def = function
  | IConst (v, _) | IBinop (v, _, _, _) | IUnop (v, _, _)
  | ICopy (v, _) | ICall (v, _, _) | IClosure (v, _, _)
  | IRecClosure (v, _, _, _)
  | ILoadCapture (v, _) | ITensorOp (v, _, _) | ITensorLit (v, _, _) ->
      Some v

(** Get variables used by an instruction *)
let instr_uses = function
  | IConst _ -> []
  | IBinop (_, _, a, b) -> [a; b]
  | IUnop (_, _, a) -> [a]
  | ICopy (_, a) -> [a]
  | ICall (_, f, args) -> f :: args
  | IClosure (_, _, caps) -> caps
  | IRecClosure (_, _, caps, _) -> caps
  | ILoadCapture _ -> []
  | ITensorOp (_, _, args) -> args
  | ITensorLit (_, elems, _) -> elems

(** Get variables used by a terminator *)
let terminator_uses = function
  | TReturn v -> [v]
  | TJump _ -> []
  | TBranch (v, _, _) -> [v]

(** Constant folding pass *)
let constant_fold_func func =
  (* Map from variable to constant value *)
  let const_map = Hashtbl.create 32 in

  let fold_instr instr =
    match instr with
    | IConst (dst, c) ->
        Hashtbl.add const_map dst c;
        instr

    | IBinop (dst, op, a, b) ->
        begin match Hashtbl.find_opt const_map a, Hashtbl.find_opt const_map b with
        | Some (CInt x), Some (CInt y) ->
            begin match eval_int_binop op x y with
            | Some result ->
                Hashtbl.add const_map dst result;
                IConst (dst, result)
            | None -> instr
            end
        | Some (CFloat x), Some (CFloat y) ->
            begin match eval_float_binop op x y with
            | Some result ->
                Hashtbl.add const_map dst result;
                IConst (dst, result)
            | None -> instr
            end
        | Some (CBool x), Some (CBool y) ->
            begin match eval_bool_binop op x y with
            | Some result ->
                Hashtbl.add const_map dst result;
                IConst (dst, result)
            | None -> instr
            end
        | _ -> instr
        end

    | IUnop (dst, op, a) ->
        begin match Hashtbl.find_opt const_map a with
        | Some c ->
            begin match eval_unop op c with
            | Some result ->
                Hashtbl.add const_map dst result;
                IConst (dst, result)
            | None -> instr
            end
        | None -> instr
        end

    | ICopy (dst, src) ->
        begin match Hashtbl.find_opt const_map src with
        | Some c -> Hashtbl.add const_map dst c
        | None -> ()
        end;
        instr

    | _ -> instr
  in

  List.iter (fun block ->
    block.instrs <- List.map fold_instr block.instrs
  ) func.blocks

let constant_fold program =
  List.iter constant_fold_func program.funcs;
  program

(** Dead code elimination pass *)
let dead_code_elim_func func =
  (* Collect all used variables *)
  let used = Hashtbl.create 32 in

  let mark_used vars =
    List.iter (fun v -> Hashtbl.replace used v true) vars
  in

  (* First pass: mark variables used by terminators *)
  List.iter (fun block ->
    match block.terminator with
    | Some term -> mark_used (terminator_uses term)
    | None -> ()
  ) func.blocks;

  (* Iterate until fixed point *)
  let changed = ref true in
  while !changed do
    changed := false;
    List.iter (fun block ->
      (* Process instructions in reverse *)
      List.iter (fun instr ->
        match instr_def instr with
        | Some def when Hashtbl.mem used def ->
            (* This instruction's result is used, mark its inputs *)
            let uses = instr_uses instr in
            List.iter (fun v ->
              if not (Hashtbl.mem used v) then begin
                Hashtbl.add used v true;
                changed := true
              end
            ) uses
        | _ -> ()
      ) (List.rev block.instrs)
    ) func.blocks
  done;

  (* Second pass: remove dead instructions *)
  List.iter (fun block ->
    block.instrs <- List.filter (fun instr ->
      match instr_def instr with
      | Some def -> Hashtbl.mem used def
      | None -> true  (* Keep instructions without definitions *)
    ) block.instrs
  ) func.blocks

let dead_code_elim program =
  List.iter dead_code_elim_func program.funcs;
  program

(** Copy propagation pass *)
let copy_prop_func func =
  (* Map from variable to its source (if it's a copy) *)
  let copy_map = Hashtbl.create 32 in

  (* Find the ultimate source of a variable *)
  let rec find_source v =
    match Hashtbl.find_opt copy_map v with
    | Some src -> find_source src
    | None -> v
  in

  (* Replace uses with their sources *)
  let replace_uses vars =
    List.map find_source vars
  in

  let replace_instr = function
    | ICopy (dst, src) ->
        let src' = find_source src in
        Hashtbl.add copy_map dst src';
        ICopy (dst, src')
    | IBinop (dst, op, a, b) ->
        IBinop (dst, op, find_source a, find_source b)
    | IUnop (dst, op, a) ->
        IUnop (dst, op, find_source a)
    | ICall (dst, f, args) ->
        ICall (dst, find_source f, replace_uses args)
    | IClosure (dst, fid, caps) ->
        IClosure (dst, fid, replace_uses caps)
    | ITensorOp (dst, op, args) ->
        ITensorOp (dst, op, replace_uses args)
    | ITensorLit (dst, elems, shape) ->
        ITensorLit (dst, replace_uses elems, shape)
    | instr -> instr
  in

  let replace_term = function
    | TReturn v -> TReturn (find_source v)
    | TBranch (v, t, f) -> TBranch (find_source v, t, f)
    | term -> term
  in

  List.iter (fun block ->
    block.instrs <- List.map replace_instr block.instrs;
    block.terminator <- Option.map replace_term block.terminator
  ) func.blocks

let copy_prop program =
  List.iter copy_prop_func program.funcs;
  program

(** Common subexpression elimination *)
module ExprKey = struct
  type t =
    | BinopExpr of ir_binop * var_id * var_id
    | UnopExpr of ir_unop * var_id

  let equal a b = a = b

  let hash = function
    | BinopExpr (op, a, b) ->
        Hashtbl.hash (0, op, a, b)
    | UnopExpr (op, a) ->
        Hashtbl.hash (1, op, a)
end

module ExprTable = Hashtbl.Make(ExprKey)

let cse_func func =
  let expr_map = ExprTable.create 32 in

  let process_instr = function
    | IBinop (dst, op, a, b) as instr ->
        let key = ExprKey.BinopExpr (op, a, b) in
        begin match ExprTable.find_opt expr_map key with
        | Some existing -> ICopy (dst, existing)
        | None ->
            ExprTable.add expr_map key dst;
            instr
        end
    | IUnop (dst, op, a) as instr ->
        let key = ExprKey.UnopExpr (op, a) in
        begin match ExprTable.find_opt expr_map key with
        | Some existing -> ICopy (dst, existing)
        | None ->
            ExprTable.add expr_map key dst;
            instr
        end
    | instr -> instr
  in

  (* Note: This is a simplified CSE that only works within a basic block
     and doesn't consider control flow. A full implementation would need
     dominator analysis. *)
  List.iter (fun block ->
    ExprTable.clear expr_map;
    block.instrs <- List.map process_instr block.instrs
  ) func.blocks

let cse program =
  List.iter cse_func program.funcs;
  program

(** Run all enabled optimizations *)
let optimize config program =
  let program = if config.const_fold then constant_fold program else program in
  let program = if config.copy_prop then copy_prop program else program in
  let program = if config.cse then cse program else program in
  let program = if config.dead_code then dead_code_elim program else program in
  (* Run copy propagation and DCE again after CSE *)
  let program = if config.copy_prop then copy_prop program else program in
  let program = if config.dead_code then dead_code_elim program else program in
  program

(** Optimize with default settings *)
let optimize_default = optimize default_config
