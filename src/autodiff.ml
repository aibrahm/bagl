(** Source-to-source automatic differentiation.

    [grad (fn x -> body)] is rewritten, before type inference, into an ordinary
    Bagl function that computes the derivative of [body] with respect to [x].
    Because the result is a normal function, the rest of the pipeline (type
    inference, IR, optimizer, VM) handles it with no changes, and the derivative
    is shape/type-checked like any other code.

    This is forward-mode differentiation expressed as a symbolic transform. It
    covers the scalar float subset: literals, the parameter, [+ - * /], unary
    negation, [if], and [let] (chained through with the sum, product, and
    quotient rules). Differentiating through user function calls, tensor
    operations, or [letrec] is reported as an error rather than silently
    producing a wrong answer. *)

open Location
open Ast

exception Grad_error of string * span

(* Fresh names for the derivatives of let-bound variables. The leading marker
   cannot collide with a source identifier. *)
let counter = ref 0
let fresh base =
  incr counter;
  Printf.sprintf "_d.%s.%d" base !counter

let flit loc f = at loc (EFloat f)

let is_flit target e =
  match e.value with EFloat f -> f = target | _ -> false

(* Fold the constants that differentiation always introduces (0.0 and 1.0), so
   d/dx (x*x) comes out as [x + x] rather than [1.0*x + x*1.0]. Pure language,
   so dropping a zeroed-out subterm is sound. *)
let rec simplify e =
  let loc = e.loc in
  match e.value with
  | EBinop (op, a, b) ->
      let a = simplify a and b = simplify b in
      (match op with
       | Add when is_flit 0.0 a -> b
       | Add when is_flit 0.0 b -> a
       | Sub when is_flit 0.0 b -> a
       | Mul when is_flit 0.0 a || is_flit 0.0 b -> flit loc 0.0
       | Mul when is_flit 1.0 a -> b
       | Mul when is_flit 1.0 b -> a
       | Div when is_flit 1.0 b -> a
       | _ -> at loc (EBinop (op, a, b)))
  | EUnop (op, a) -> at loc (EUnop (op, simplify a))
  | ELet r -> at loc (ELet { r with value = simplify r.value; body = simplify r.body })
  | EIf { cond; then_branch; else_branch } ->
      at loc (EIf { cond; then_branch = simplify then_branch; else_branch = simplify else_branch })
  | _ -> e

(* [diff env e]: the derivative of [e]. [env] maps an in-scope variable to the
   expression giving its derivative (the parameter maps to 1.0; every other
   free variable is a constant with derivative 0.0). *)
let rec diff env e =
  let loc = e.loc in
  let d = diff env in
  match e.value with
  | EFloat _ | EInt _ -> flit loc 0.0
  | EVar y ->
      (match List.assoc_opt y env with Some deriv -> deriv | None -> flit loc 0.0)
  | EBinop (Add, a, b) -> at loc (EBinop (Add, d a, d b))
  | EBinop (Sub, a, b) -> at loc (EBinop (Sub, d a, d b))
  | EBinop (Mul, a, b) ->
      (* (a*b)' = a'*b + a*b' *)
      at loc (EBinop (Add,
        at loc (EBinop (Mul, d a, b)),
        at loc (EBinop (Mul, a, d b))))
  | EBinop (Div, a, b) ->
      (* (a/b)' = (a'*b - a*b') / (b*b) *)
      let num = at loc (EBinop (Sub,
        at loc (EBinop (Mul, d a, b)),
        at loc (EBinop (Mul, a, d b)))) in
      at loc (EBinop (Div, num, at loc (EBinop (Mul, b, b))))
  | EUnop (Neg, a) -> at loc (EUnop (Neg, d a))
  | EIf { cond; then_branch; else_branch } ->
      (* The condition is data, not differentiated; each branch is. *)
      at loc (EIf { cond; then_branch = d then_branch; else_branch = d else_branch })
  | ELet { name; annot = _; value; body } ->
      (* d/dx (let name = value in body)
         = let name  = value        in
           let dname = d(value)      in    (* value's derivative, chain rule *)
           d(body) with name |-> dname *)
      let dname = fresh name in
      let dvalue = diff env value in
      let env' = (name, at loc (EVar dname)) :: env in
      let dbody = diff env' body in
      at loc (ELet { name; annot = None; value;
        body = at loc (ELet { name = dname; annot = None; value = dvalue; body = dbody }) })
  | EApp _ ->
      raise (Grad_error
        ("grad cannot differentiate through a function call yet; the body must be arithmetic on the parameter", loc))
  | ETensorOp _ | ETensor _ ->
      raise (Grad_error ("grad currently differentiates scalar float functions, not tensor operations", loc))
  | ELetRec _ ->
      raise (Grad_error ("grad cannot differentiate a recursive binding", loc))
  | EFn _ ->
      raise (Grad_error ("grad cannot differentiate a nested function; the body must be a scalar expression", loc))
  | EUnop (Not, _) | EBool _ | EString _
  | EBinop ((Eq | Neq | Lt | Gt | Le | Ge | And | Or), _, _) ->
      raise (Grad_error ("grad expects a numeric expression, but this is boolean or comparison", loc))

(* Differentiate a lambda into its derivative lambda: fn x -> d(body)/dx. *)
let differentiate_fn loc param body =
  let env = [ (param, flit loc 1.0) ] in
  let dbody = simplify (diff env body) in
  at loc (EFn { param; param_annot = Some TAFloat; body = dbody })

(* Walk the tree bottom-up; rewrite every [grad (fn x -> ...)] application. *)
let rec expand_expr e =
  let loc = e.loc in
  match e.value with
  | EApp (f, arg) ->
      let f = expand_expr f and arg = expand_expr arg in
      (match f.value, arg.value with
       | EVar "grad", EFn { param; body; _ } -> differentiate_fn arg.loc param body
       | EVar "grad", _ ->
           raise (Grad_error ("grad must be applied directly to a function literal, e.g. grad (fn x -> x * x)", loc))
       | _ -> at loc (EApp (f, arg)))
  | EFn r -> at loc (EFn { r with body = expand_expr r.body })
  | ELet r -> at loc (ELet { r with value = expand_expr r.value; body = expand_expr r.body })
  | ELetRec r -> at loc (ELetRec { r with value = expand_expr r.value; body = expand_expr r.body })
  | EIf { cond; then_branch; else_branch } ->
      at loc (EIf { cond = expand_expr cond;
                    then_branch = expand_expr then_branch;
                    else_branch = expand_expr else_branch })
  | EBinop (op, a, b) -> at loc (EBinop (op, expand_expr a, expand_expr b))
  | EUnop (op, a) -> at loc (EUnop (op, expand_expr a))
  | ETensorOp (op, args) -> at loc (ETensorOp (op, List.map expand_expr args))
  | ETensor (rows, s) -> at loc (ETensor (List.map (List.map expand_expr) rows, s))
  | EInt _ | EFloat _ | EBool _ | EString _ | EVar _ -> e

let expand_decl d =
  match d.value with
  | DLet r -> at d.loc (DLet { r with value = expand_expr r.value })
  | DExpr e -> at d.loc (DExpr (expand_expr e))

let expand_program prog = List.map expand_decl prog
