(** Hindley-Milner type inference with tensor shape tracking *)

open Location
open Ast
open Types

(** Type environment: maps variable names to type schemes *)
type env = (string * scheme) list

(** Type error exception *)
exception Type_error of string * span

(** Raise a type error with source information *)
let type_error span msg =
  raise (Type_error (msg, span))

(** Look up a variable in the environment *)
let lookup_var env name span =
  match List.assoc_opt name env with
  | Some scheme -> instantiate_scheme scheme
  | None -> type_error span (Printf.sprintf "Unbound variable: %s" name)

(** Extend the environment with a new binding *)
let extend_env env name scheme =
  (name, scheme) :: env

(** Current level for generalization *)
let current_level = ref 0

let enter_level () = incr current_level
let leave_level () = decr current_level
let get_level () = !current_level

(** Unification of dimensions *)
let rec unify_dim span d1 d2 =
  let d1 = find_dim d1 in
  let d2 = find_dim d2 in
  match d1, d2 with
  | SDimConst n1, SDimConst n2 when n1 = n2 -> ()
  | SDimConst n1, SDimConst n2 ->
      type_error span (Printf.sprintf "Dimension mismatch: %d vs %d" n1 n2)

  | SDimVar r1, SDimVar r2 when r1 == r2 -> ()

  | SDimVar ({ contents = DUnbound id } as r), d
  | d, SDimVar ({ contents = DUnbound id } as r) ->
      (* Occurs check for dimensions *)
      begin match d with
      | SDimVar { contents = DUnbound id' } when id = id' -> ()
      | _ ->
          if occurs_check_dim_id id d then
            type_error span "Recursive dimension detected";
          r := DLink d
      end

  | SDimVar { contents = DLink d1' }, d2' -> unify_dim span d1' d2'
  | d1', SDimVar { contents = DLink d2' } -> unify_dim span d1' d2'

(** Unification of shapes *)
let unify_shape span s1 s2 =
  if List.length s1 <> List.length s2 then
    type_error span (Printf.sprintf "Shape rank mismatch: %d dimensions vs %d dimensions"
      (List.length s1) (List.length s2));
  List.iter2 (unify_dim span) s1 s2

(** Unification of types *)
let rec unify span t1 t2 =
  let t1 = find_ty t1 in
  let t2 = find_ty t2 in
  match t1, t2 with
  | TInt, TInt -> ()
  | TFloat, TFloat -> ()
  | TBool, TBool -> ()
  | TString, TString -> ()
  | TUnit, TUnit -> ()

  | TVar r1, TVar r2 when r1 == r2 -> ()

  | TVar ({ contents = Unbound (id, level) } as r), t
  | t, TVar ({ contents = Unbound (id, level) } as r) ->
      if occurs_check_ty id t then
        type_error span "Recursive type detected";
      update_ty_levels level t;
      r := Link t

  | TArrow (a1, r1), TArrow (a2, r2) ->
      unify span a1 a2;
      unify span r1 r2

  | TTensor (elem1, shape1), TTensor (elem2, shape2) ->
      unify span elem1 elem2;
      unify_shape span shape1 shape2

  | _ ->
      type_error span (Printf.sprintf "Cannot unify %s with %s"
        (string_of_ty t1) (string_of_ty t2))

(** Convert AST type annotation to internal type *)
let rec type_annot_to_ty annot =
  match annot with
  | TAInt -> TInt
  | TAFloat -> TFloat
  | TABool -> TBool
  | TAString -> TString
  | TAVar _ ->
      (* Type variables in annotations become fresh type variables *)
      fresh_ty_var (get_level ())
  | TAArrow (t1, t2) ->
      TArrow (type_annot_to_ty t1, type_annot_to_ty t2)
  | TATensor (elem, shape) ->
      TTensor (type_annot_to_ty elem, ast_shape_to_shape shape)

and ast_shape_to_shape shape =
  List.map ast_dim_to_dim shape

and ast_dim_to_dim = function
  | DimConst n -> SDimConst n
  | DimVar _ -> fresh_dim_var ()

(** Infer type for binary operators *)
let infer_binop span op t1 t2 =
  match op with
  | Add | Sub | Mul | Div ->
      (* Arithmetic: both operands must be same numeric type *)
      begin match find_ty t1, find_ty t2 with
      | TInt, TInt -> TInt
      | TFloat, TFloat -> TFloat
      | TInt, _ ->
          unify span t2 TInt;
          TInt
      | TFloat, _ ->
          unify span t2 TFloat;
          TFloat
      | TTensor (elem1, shape1), TTensor (elem2, shape2) ->
          (* Element-wise operations on tensors *)
          unify span elem1 elem2;
          unify_shape span shape1 shape2;
          TTensor (elem1, shape1)
      | _ ->
          (* Try to unify both with int first *)
          unify span t1 TInt;
          unify span t2 TInt;
          TInt
      end

  | Eq | Neq ->
      (* Equality: both operands must have same type, result is bool *)
      unify span t1 t2;
      TBool

  | Lt | Gt | Le | Ge ->
      (* Comparison: both operands must be same numeric type *)
      begin match find_ty t1, find_ty t2 with
      | TInt, TInt -> TBool
      | TFloat, TFloat -> TBool
      | TInt, _ ->
          unify span t2 TInt;
          TBool
      | TFloat, _ ->
          unify span t2 TFloat;
          TBool
      | _ ->
          unify span t1 TInt;
          unify span t2 TInt;
          TBool
      end

  | And | Or ->
      (* Logical: both must be bool *)
      unify span t1 TBool;
      unify span t2 TBool;
      TBool

(** Infer type for unary operators *)
let infer_unop span op t =
  match op with
  | Neg ->
      begin match find_ty t with
      | TInt -> TInt
      | TFloat -> TFloat
      | _ ->
          unify span t TInt;
          TInt
      end
  | Not ->
      unify span t TBool;
      TBool

(** Infer shape for dot product *)
let infer_dot_shape span shape1 shape2 =
  match shape1, shape2 with
  | [m; k1], [k2; n] ->
      (* Matrix-matrix: [m,k] . [k,n] = [m,n] *)
      unify_dim span k1 k2;
      [m; n]
  | [k1], [k2; n] ->
      (* Vector-matrix: [k] . [k,n] = [n] *)
      unify_dim span k1 k2;
      [n]
  | [m; k1], [k2] ->
      (* Matrix-vector: [m,k] . [k] = [m] *)
      unify_dim span k1 k2;
      [m]
  | [k1], [k2] ->
      (* Vector-vector: [k] . [k] = scalar (empty shape) *)
      unify_dim span k1 k2;
      []
  | _ ->
      type_error span "dot requires 1D or 2D tensors"

(** Infer shape for transpose *)
let infer_transpose_shape span shape =
  match shape with
  | [m; n] -> [n; m]
  | _ -> type_error span "transpose requires 2D tensor"

(** Check reshape validity *)
let infer_reshape_shape span old_shape new_shape =
  (* Calculate total elements for concrete dimensions *)
  let product dims =
    List.fold_left (fun acc d ->
      match find_dim d with
      | SDimConst n -> acc * n
      | SDimVar _ -> -1  (* Unknown size *)
    ) 1 dims
  in
  let old_size = product old_shape in
  let new_size = product new_shape in
  (* Only error if both sizes are known and different *)
  if old_size > 0 && new_size > 0 && old_size <> new_size then
    type_error span (Printf.sprintf "Reshape size mismatch: %d elements vs %d elements"
      old_size new_size);
  new_shape

(** Infer type for tensor operations *)
let infer_tensor_op span op args elem_ty =
  match op, args with
  | TensorDot, [shape1; shape2] ->
      let result_shape = infer_dot_shape span shape1 shape2 in
      if result_shape = [] then elem_ty  (* Scalar result *)
      else TTensor (elem_ty, result_shape)

  | TensorTranspose, [shape] ->
      let result_shape = infer_transpose_shape span shape in
      TTensor (elem_ty, result_shape)

  | TensorReshape new_shape, [old_shape] ->
      let new_shape' = ast_shape_to_shape new_shape in
      let result_shape = infer_reshape_shape span old_shape new_shape' in
      TTensor (elem_ty, result_shape)

  | _ -> type_error span "Invalid tensor operation"

(** Infer the type of an expression *)
let rec infer env expr =
  let span = expr.loc in
  match expr.value with
  | EInt _ -> TInt
  | EFloat _ -> TFloat
  | EBool _ -> TBool
  | EString _ -> TString

  | EVar name -> lookup_var env name span

  | ETensor (rows, shape_annot) ->
      (* Infer element type from contents *)
      let elem_ty =
        if rows = [] || List.hd rows = [] then
          TFloat  (* Default to float for empty tensors *)
        else
          infer env (List.hd (List.hd rows))
      in
      (* Verify all elements have same type *)
      List.iter (fun row ->
        List.iter (fun e ->
          let t = infer env e in
          unify e.loc elem_ty t
        ) row
      ) rows;
      (* Infer shape from structure *)
      let num_rows = List.length rows in
      let num_cols = if rows = [] then 0 else List.length (List.hd rows) in
      (* Verify all rows have same length *)
      List.iter (fun row ->
        if List.length row <> num_cols then
          type_error span "Tensor rows have inconsistent lengths"
      ) rows;
      let inferred_shape =
        if num_rows = 1 then [SDimConst num_cols]  (* 1D tensor *)
        else [SDimConst num_rows; SDimConst num_cols]  (* 2D tensor *)
      in
      let final_shape = match shape_annot with
        | Some annot_shape ->
            let annot_shape' = ast_shape_to_shape annot_shape in
            unify_shape span inferred_shape annot_shape';
            annot_shape'
        | None -> inferred_shape
      in
      TTensor (elem_ty, final_shape)

  | ELet { name; annot; value; body } ->
      enter_level ();
      let value_ty = infer env value in
      leave_level ();
      (* Check annotation if provided *)
      begin match annot with
      | Some annot_ty ->
          let expected = type_annot_to_ty annot_ty in
          unify value.loc expected value_ty
      | None -> ()
      end;
      (* Generalize the value type *)
      let scheme = generalize (get_level ()) value_ty in
      let env' = extend_env env name scheme in
      infer env' body

  | ELetRec { name; annot; value; body } ->
      (* For recursive bindings, add name to env before inferring value *)
      enter_level ();
      (* Create a type variable for the recursive binding *)
      let rec_ty = match annot with
        | Some annot_ty -> type_annot_to_ty annot_ty
        | None -> fresh_ty_var (get_level ())
      in
      (* Add binding to environment (monomorphic during inference) *)
      let env' = extend_env env name (mono_scheme rec_ty) in
      (* Infer the value type with recursive binding in scope *)
      let value_ty = infer env' value in
      (* Unify the recursive type with inferred type *)
      unify value.loc rec_ty value_ty;
      leave_level ();
      (* Generalize and add to environment for body *)
      let scheme = generalize (get_level ()) rec_ty in
      let env'' = extend_env env name scheme in
      infer env'' body

  | EFn { param; param_annot; body } ->
      let param_ty = match param_annot with
        | Some annot -> type_annot_to_ty annot
        | None -> fresh_ty_var (get_level ())
      in
      let env' = extend_env env param (mono_scheme param_ty) in
      let body_ty = infer env' body in
      TArrow (param_ty, body_ty)

  | EApp (func, arg) ->
      let func_ty = infer env func in
      let arg_ty = infer env arg in
      let result_ty = fresh_ty_var (get_level ()) in
      unify func.loc func_ty (TArrow (arg_ty, result_ty));
      result_ty

  | EIf { cond; then_branch; else_branch } ->
      let cond_ty = infer env cond in
      unify cond.loc cond_ty TBool;
      let then_ty = infer env then_branch in
      let else_ty = infer env else_branch in
      unify else_branch.loc then_ty else_ty;
      then_ty

  | EBinop (op, e1, e2) ->
      let t1 = infer env e1 in
      let t2 = infer env e2 in
      infer_binop span op t1 t2

  | EUnop (op, e) ->
      let t = infer env e in
      infer_unop span op t

  | ETensorOp (op, args) ->
      (* Infer types of all arguments *)
      let arg_types = List.map (infer env) args in
      (* Extract shapes from tensor arguments *)
      let shapes = List.map (fun t ->
        match find_ty t with
        | TTensor (_, shape) -> shape
        | _ -> type_error span "Tensor operation requires tensor arguments"
      ) arg_types in
      (* Get element type (all tensors should have same element type) *)
      let elem_ty = match arg_types with
        | [] -> type_error span "Tensor operation requires arguments"
        | t :: rest ->
            let elem = match find_ty t with
              | TTensor (e, _) -> e
              | _ -> type_error span "Expected tensor"
            in
            List.iter (fun t' ->
              match find_ty t' with
              | TTensor (e', _) -> unify span elem e'
              | _ -> ()
            ) rest;
            elem
      in
      infer_tensor_op span op shapes elem_ty

(** Infer type for a declaration *)
let infer_decl env decl =
  match decl.value with
  | DLet { name; annot; value } ->
      enter_level ();
      let value_ty = infer env value in
      leave_level ();
      begin match annot with
      | Some annot_ty ->
          let expected = type_annot_to_ty annot_ty in
          unify value.loc expected value_ty
      | None -> ()
      end;
      let scheme = generalize (get_level ()) value_ty in
      let env' = extend_env env name scheme in
      (env', value_ty)
  | DExpr e ->
      let ty = infer env e in
      (env, ty)

(** Infer types for a complete program *)
let infer_program program =
  Types.reset_counters ();
  current_level := 0;
  let env = [] in
  let rec loop env results = function
    | [] -> List.rev results
    | decl :: rest ->
        let (env', ty) = infer_decl env decl in
        loop env' ((decl, ty) :: results) rest
  in
  loop env [] program

(** Infer type for a single expression (for REPL) *)
let infer_expr env expr =
  infer env expr

(** Get initial environment with built-in bindings *)
let initial_env () =
  []  (* Can add built-in functions here *)
