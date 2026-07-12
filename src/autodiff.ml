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
  | EMath (f, a) -> at loc (EMath (f, simplify a))
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
  | EMath (MExp, a) ->
      (* (exp a)' = a' * exp a *)
      at loc (EBinop (Mul, d a, at loc (EMath (MExp, a))))
  | EMath (MLog, a) ->
      (* (log a)' = a' / a *)
      at loc (EBinop (Div, d a, a))
  | EMath (MSqrt, a) ->
      (* (sqrt a)' = a' / (2 * sqrt a) *)
      at loc (EBinop (Div, d a,
        at loc (EBinop (Mul, flit loc 2.0, at loc (EMath (MSqrt, a))))))
  | EMath (MRelu, a) ->
      (* (relu a)' = a' * step a *)
      at loc (EBinop (Mul, d a, at loc (EMath (MStep, a))))
  | EMath (MStep, _) ->
      (* Piecewise constant: derivative 0 almost everywhere *)
      flit loc 0.0
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

(* ===== Tensor mode: reverse-mode differentiation =====

   [grad (fn w: tensor<float>[...] -> loss)] where [loss] is a scalar is
   rewritten into a function returning dloss/dw with w's shape. Reverse
   mode as a source transform: [pull e cbar] produces the expression for
   the gradient contribution of subexpression [e], given the cotangent
   [cbar] (an expression with e's rank). Contributions from independent
   uses of w are summed; subterms that do not mention w contribute
   nothing and are dropped before any code is generated.

   The pullback of [dot] depends on the operands' ranks, and this
   transform runs before type inference, so tensor mode requires the
   parameter annotation (that is how the mode is selected) and infers
   ranks for the supported expression family itself, mirroring the shape
   rules in typeinfer. Anything whose rank cannot be determined, or whose
   pullback would need an operation Bagl cannot express (outer products,
   reductions of a scalar-from-tensor), is a Grad_error rather than a
   wrong gradient. *)

(* Does [e] mention [param], following let bindings in [lets]? *)
let rec occurs param lets e =
  match e.value with
  | EVar y when y = param -> true
  | EVar y ->
      (match List.assoc_opt y lets with
       | Some defn -> occurs param lets defn
       | None -> false)
  | EInt _ | EFloat _ | EBool _ | EString _ -> false
  | EBinop (_, a, b) | EApp (a, b) -> occurs param lets a || occurs param lets b
  | EUnop (_, a) -> occurs param lets a
  | EIf { cond; then_branch; else_branch } ->
      occurs param lets cond || occurs param lets then_branch
      || occurs param lets else_branch
  | ELet { name; value; body; _ } | ELetRec { name; value; body; _ } ->
      occurs param lets value
      || (name <> param && occurs param ((name, value) :: lets) body)
  | EFn { param = p; body; _ } -> p <> param && occurs param lets body
  | ETensorOp (_, args) -> List.exists (occurs param lets) args
  | EMath (_, a) -> occurs param lets a
  | ETensor (rows, _, _) -> List.exists (List.exists (occurs param lets)) rows

(* Rank of [e]'s value (0 scalar, 1 vector, 2 matrix), mirroring the
   shape rules in typeinfer over the supported family. *)
let rec rank_of param param_rank lets e =
  let loc = e.loc in
  match e.value with
  | EInt _ | EFloat _ -> 0
  | EVar y when y = param -> param_rank
  | EVar y ->
      (match List.assoc_opt y lets with
       | Some defn -> rank_of param param_rank lets defn
       | None -> 0)  (* free variables are scalar constants to grad *)
  | ETensor (rows, matrix, _) ->
      if List.length rows = 1 && not matrix then 1 else 2
  | EBinop ((Add | Sub | Mul | Div), a, b) ->
      max (rank_of param param_rank lets a) (rank_of param param_rank lets b)
  | EUnop (Neg, a) -> rank_of param param_rank lets a
  | EIf { then_branch; _ } -> rank_of param param_rank lets then_branch
  | ELet { name; value; body; _ } ->
      rank_of param param_rank ((name, value) :: lets) body
  | ETensorOp (TensorDot, [a; b]) ->
      (match rank_of param param_rank lets a, rank_of param param_rank lets b with
       | 2, 2 -> 2
       | 1, 2 | 2, 1 -> 1
       | 1, 1 -> 0
       | ra, rb ->
           raise (Grad_error
             (Printf.sprintf "grad cannot rank dot of rank-%d and rank-%d operands" ra rb, loc)))
  | ETensorOp (TensorTranspose, [_]) -> 2
  | EMath (_, a) -> rank_of param param_rank lets a
  | _ ->
      raise (Grad_error
        ("grad cannot determine the tensor rank of this expression", loc))

let neg loc e = at loc (EBinop (Sub, flit loc 0.0, e))
let mul loc a b = at loc (EBinop (Mul, a, b))
let div loc a b = at loc (EBinop (Div, a, b))
let dot loc a b = at loc (ETensorOp (TensorDot, [a; b]))
let tr loc a = at loc (ETensorOp (TensorTranspose, [a]))

(* Fold the multiplications by the seed cotangent 1.0. *)
let mul_s loc a b =
  if is_flit 1.0 a then b else if is_flit 1.0 b then a else mul loc a b

(* Sum two optional gradient contributions. *)
let opt_add loc a b =
  match a, b with
  | None, x | x, None -> x
  | Some a, Some b -> Some (at loc (EBinop (Add, a, b)))

(* [pull param param_rank lets e cbar]: optional expression for the
   gradient contribution of [e] w.r.t. [param] under cotangent [cbar].
   Invariant: rank(cbar) = rank(e). *)
let rec pull param param_rank lets e cbar =
  let loc = e.loc in
  let rank x = rank_of param param_rank lets x in
  let occ x = occurs param lets x in
  let pull_e = pull param param_rank lets in
  (* Ones with the same shape as [x], built from x itself so no static
     shape is needed: 0.0 * x + 1.0. Used to express sum-reductions of a
     rank-1 cotangent as a dot product. *)
  let ones_like x = at loc (EBinop (Add, mul loc (flit loc 0.0) x, flit loc 1.0)) in
  (* Pull one operand of a binop. When the operand's rank matches the
     result, the cotangent passes through as [cot_full]. When the operand
     is a broadcast scalar that mentions w, its cotangent is the SUM of
     the element-wise cotangent, which is expressible as a dot product
     for rank-1 results ([scalar_cot]); for rank-2 results a double
     reduction would be needed, which Bagl cannot express. *)
  let pull_side side r_side r_result ~cot_full ~scalar_cot =
    if r_side = r_result then pull_e side (cot_full ())
    else if not (occ side) then None
    else if r_result = 1 then pull_e side (scalar_cot ())
    else
      raise (Grad_error
        ("grad of a scalar built from the parameter, broadcast against a matrix, needs a double reduction that Bagl cannot express", loc))
  in
  match e.value with
  | EVar y when y = param -> Some cbar
  | EVar y ->
      (match List.assoc_opt y lets with
       | Some defn -> pull_e defn cbar
       | None -> None)
  | EInt _ | EFloat _ | EBool _ | EString _ -> None
  | ETensor (rows, _, _) ->
      if List.exists (List.exists occ) rows then
        raise (Grad_error
          ("grad cannot differentiate a tensor literal whose elements mention the parameter", loc))
      else None
  | EBinop (Add, a, b) ->
      let ra = rank a and rb = rank b in
      let r = max ra rb in
      opt_add loc
        (pull_side a ra r
           ~cot_full:(fun () -> cbar)
           ~scalar_cot:(fun () -> dot loc cbar (ones_like b)))
        (pull_side b rb r
           ~cot_full:(fun () -> cbar)
           ~scalar_cot:(fun () -> dot loc cbar (ones_like a)))
  | EBinop (Sub, a, b) ->
      let ra = rank a and rb = rank b in
      let r = max ra rb in
      opt_add loc
        (pull_side a ra r
           ~cot_full:(fun () -> cbar)
           ~scalar_cot:(fun () -> dot loc cbar (ones_like b)))
        (pull_side b rb r
           ~cot_full:(fun () -> neg loc cbar)
           ~scalar_cot:(fun () -> neg loc (dot loc cbar (ones_like a))))
  | EBinop (Mul, a, b) ->
      let ra = rank a and rb = rank b in
      let r = max ra rb in
      opt_add loc
        (pull_side a ra r
           ~cot_full:(fun () -> mul_s loc cbar b)
           ~scalar_cot:(fun () -> dot loc cbar b))
        (pull_side b rb r
           ~cot_full:(fun () -> mul_s loc a cbar)
           ~scalar_cot:(fun () -> dot loc a cbar))
  | EBinop (Div, a, b) ->
      let ra = rank a and rb = rank b in
      let r = max ra rb in
      opt_add loc
        (pull_side a ra r
           ~cot_full:(fun () -> div loc cbar b)
           (* d(a/b_i)/da = 1/b_i, summed: dot(cbar, ones/b) *)
           ~scalar_cot:(fun () -> dot loc cbar (div loc (ones_like b) b)))
        (pull_side b rb r
           ~cot_full:(fun () -> neg loc (div loc (mul_s loc cbar a) (mul loc b b)))
           (* d(a_i/b)/db = -a_i/b^2, summed: -dot(cbar, a)/b^2 *)
           ~scalar_cot:(fun () -> neg loc (div loc (dot loc cbar a) (mul loc b b))))
  | EUnop (Neg, a) -> pull_e a (neg loc cbar)
  | EIf { cond; then_branch; else_branch } ->
      if occ cond then
        raise (Grad_error
          ("grad cannot differentiate through a condition that mentions the parameter", loc));
      let dt = pull_e then_branch cbar in
      let de = pull_e else_branch cbar in
      (match dt, de with
       | None, None -> None
       | _ ->
           let zero () = mul loc (flit loc 0.0) (at loc (EVar param)) in
           let materialize = function Some g -> g | None -> zero () in
           Some (at loc (EIf { cond;
                               then_branch = materialize dt;
                               else_branch = materialize de })))
  | ELet { name; value; body; _ } ->
      let lets' = (name, value) :: lets in
      (match pull param param_rank lets' body cbar with
       | None -> None
       | Some g -> Some (at loc (ELet { name; annot = None; value; body = g })))
  | ETensorOp (TensorDot, [a; b]) ->
      let ra = rank a and rb = rank b in
      let da =
        if not (occ a) then None
        else begin
          let ca = match ra, rb with
            | 2, 2 -> dot loc cbar (tr loc b)          (* [m,n].[n,k] -> [m,k] *)
            | 1, 1 -> mul_s loc cbar b                 (* scalar cbar broadcast *)
            | 1, 2 -> dot loc b cbar                   (* [k,n].[n] -> [k] *)
            | 2, 1 ->
                raise (Grad_error
                  ("grad of the matrix side of a matrix-vector dot needs an outer product, which Bagl cannot express", loc))
            | _ ->
                raise (Grad_error ("grad cannot rank this dot", loc))
          in
          pull_e a ca
        end
      in
      let db =
        if not (occ b) then None
        else begin
          let cb = match ra, rb with
            | 2, 2 -> dot loc (tr loc a) cbar
            | 1, 1 -> mul_s loc a cbar
            | 2, 1 -> dot loc (tr loc a) cbar          (* [k,m].[m] -> [k] *)
            | 1, 2 ->
                raise (Grad_error
                  ("grad of the matrix side of a vector-matrix dot needs an outer product, which Bagl cannot express", loc))
            | _ ->
                raise (Grad_error ("grad cannot rank this dot", loc))
          in
          pull_e b cb
        end
      in
      opt_add loc da db
  | ETensorOp (TensorTranspose, [a]) -> pull_e a (tr loc cbar)
  | EMath (MExp, a) ->
      (* pullback: cbar (.) exp a *)
      pull_e a (mul loc cbar (at loc (EMath (MExp, a))))
  | EMath (MLog, a) ->
      pull_e a (div loc cbar a)
  | EMath (MSqrt, a) ->
      pull_e a (div loc cbar
        (mul loc (flit loc 2.0) (at loc (EMath (MSqrt, a)))))
  | EMath (MRelu, a) ->
      (* pullback: cbar (.) step a *)
      pull_e a (mul loc cbar (at loc (EMath (MStep, a))))
  | EMath (MStep, _) -> None
  | ETensorOp (TensorReshape _, _) ->
      raise (Grad_error
        ("grad cannot differentiate through reshape; the original shape is not recoverable at expansion time", loc))
  | ETensorOp _ ->
      raise (Grad_error ("grad does not support this tensor operation", loc))
  | EApp _ ->
      raise (Grad_error
        ("grad cannot differentiate through a function call yet; the body must be tensor arithmetic on the parameter", loc))
  | ELetRec _ ->
      raise (Grad_error ("grad cannot differentiate a recursive binding", loc))
  | EFn _ ->
      raise (Grad_error ("grad cannot differentiate a nested function", loc))
  | EUnop (Not, _) | EBinop ((Eq | Neq | Lt | Gt | Le | Ge | And | Or), _, _) ->
      raise (Grad_error ("grad expects a numeric expression, but this is boolean or comparison", loc))

(* Differentiate a lambda with a tensor-annotated parameter into its
   gradient lambda: fn w -> dloss/dw, with w's shape. [outer] carries the
   let bindings enclosing the grad call, so the rank analysis can see
   tensors bound outside the lambda (the data the loss closes over). *)
let differentiate_tensor_fn loc param annot body ~outer =
  let param_rank = match annot with
    | TATensor (_, shape) -> List.length shape
    | TAFloat -> 0  (* scalar parameter differentiated through tensor code *)
    | _ -> raise (Grad_error ("tensor grad requires a tensor or float parameter annotation", loc))
  in
  let lets = List.remove_assoc param outer in
  let body_rank = rank_of param param_rank lets body in
  if body_rank <> 0 then
    raise (Grad_error
      (Printf.sprintf
         "grad expects a scalar-valued function, but this body has tensor rank %d" body_rank, loc));
  let dbody = match pull param param_rank lets body (flit loc 1.0) with
    | Some g -> g
    | None -> mul loc (flit loc 0.0) (at loc (EVar param))
  in
  at loc (EFn { param; param_annot = Some annot; body = dbody })

(* Does the expression contain any tensor syntax? Used to pick the grad
   mode for annotated parameters and to reject unannotated tensor grads. *)
let rec has_tensor e =
  match e.value with
  | ETensor _ | ETensorOp _ -> true
  | EBinop (_, a, b) | EApp (a, b) -> has_tensor a || has_tensor b
  | EUnop (_, a) | EMath (_, a) -> has_tensor a
  | EIf { cond; then_branch; else_branch } ->
      has_tensor cond || has_tensor then_branch || has_tensor else_branch
  | ELet { value; body; _ } | ELetRec { value; body; _ } ->
      has_tensor value || has_tensor body
  | EFn { body; _ } -> has_tensor body
  | EInt _ | EFloat _ | EBool _ | EString _ | EVar _ -> false

(* Walk the tree bottom-up; rewrite every [grad (fn x -> ...)] application.
   [lets] tracks the enclosing let bindings for tensor-mode rank analysis. *)
let rec expand_expr lets e =
  let loc = e.loc in
  let expand_expr' = expand_expr lets in
  match e.value with
  | EApp (f, arg) ->
      let f = expand_expr' f and arg = expand_expr' arg in
      (match f.value, arg.value with
       | EVar "grad", EFn { param; param_annot = Some (TATensor _ as annot); body } ->
           (* Tensor mode is selected by the parameter annotation, which
              also supplies the rank the pullback rules need. *)
           differentiate_tensor_fn arg.loc param annot body ~outer:lets
       | EVar "grad", EFn { param; param_annot = Some TAFloat; body }
         when has_tensor body ->
           (* Scalar parameter differentiated through tensor code: the
              reverse-mode rules reduce rank-1 cotangents with dot. *)
           differentiate_tensor_fn arg.loc param TAFloat body ~outer:lets
       | EVar "grad", EFn { param; body; _ } ->
           if occurs param [] body && has_tensor body then
             raise (Grad_error
               ("grad over tensors requires an annotated parameter: tensor<float>[...] for a tensor, float for a scalar differentiated through tensor code", loc))
           else differentiate_fn arg.loc param body
       | EVar "grad", _ ->
           raise (Grad_error ("grad must be applied directly to a function literal, e.g. grad (fn x -> x * x)", loc))
       | _ -> at loc (EApp (f, arg)))
  | EFn r ->
      at loc (EFn { r with body = expand_expr (List.remove_assoc r.param lets) r.body })
  | ELet r ->
      let value = expand_expr lets r.value in
      at loc (ELet { r with value; body = expand_expr ((r.name, value) :: lets) r.body })
  | ELetRec r ->
      let value = expand_expr lets r.value in
      at loc (ELetRec { r with value; body = expand_expr ((r.name, value) :: lets) r.body })
  | EIf { cond; then_branch; else_branch } ->
      at loc (EIf { cond = expand_expr' cond;
                    then_branch = expand_expr' then_branch;
                    else_branch = expand_expr' else_branch })
  | EBinop (op, a, b) -> at loc (EBinop (op, expand_expr' a, expand_expr' b))
  | EUnop (op, a) -> at loc (EUnop (op, expand_expr' a))
  | ETensorOp (op, args) -> at loc (ETensorOp (op, List.map expand_expr' args))
  | EMath (f, a) -> at loc (EMath (f, expand_expr' a))
  | ETensor (rows, m, s) -> at loc (ETensor (List.map (List.map expand_expr') rows, m, s))
  | EInt _ | EFloat _ | EBool _ | EString _ | EVar _ -> e

let expand_decl d =
  match d.value with
  | DLet r -> at d.loc (DLet { r with value = expand_expr [] r.value })
  | DExpr e -> at d.loc (DExpr (expand_expr [] e))

let expand_program prog = List.map expand_decl prog
