(** Abstract Syntax Tree for Bagl *)

open Location

(** Shape dimensions for tensor types *)
type dim =
  | DimConst of int       (** Concrete dimension, e.g., 3 *)
  | DimVar of string      (** Dimension variable for polymorphism, e.g., 'n *)

(** Tensor shape - list of dimensions *)
type shape = dim list

(** Type annotations (user-written syntax) *)
type type_annot =
  | TAInt
  | TAFloat
  | TABool
  | TAString
  | TATensor of type_annot * shape   (** tensor<elem_type>[shape] *)
  | TAArrow of type_annot * type_annot  (** t1 -> t2 *)
  | TAVar of string                  (** Type variable 'a *)

type type_annot_opt = type_annot option

(** Binary operators *)
type binop =
  | Add       (** + *)
  | Sub       (** - *)
  | Mul       (** * *)
  | Div       (** / *)
  | Eq        (** == *)
  | Neq       (** != *)
  | Lt        (** < *)
  | Gt        (** > *)
  | Le        (** <= *)
  | Ge        (** >= *)
  | And       (** && *)
  | Or        (** || *)

(** Unary operators *)
type unop =
  | Neg       (** - (negation) *)
  | Not       (** ! (logical not) *)

(** Tensor operations *)
type tensor_op =
  | TensorDot                    (** Matrix/vector dot product *)
  | TensorTranspose              (** Transpose (swap last two dims) *)
  | TensorReshape of shape       (** Reshape to new shape *)

(** Math builtins: on a float they are the usual functions; on a tensor
    they apply element-wise. [step] is the Heaviside function (1.0 for
    x > 0, else 0.0), which is also relu's derivative. *)
type math_fn =
  | MExp
  | MLog
  | MSqrt
  | MRelu
  | MStep

let string_of_math_fn = function
  | MExp -> "exp"
  | MLog -> "log"
  | MSqrt -> "sqrt"
  | MRelu -> "relu"
  | MStep -> "step"

(** Expression AST node *)
type expr = expr_kind located

and expr_kind =
  (* Literals *)
  | EInt of int
  | EFloat of float
  | EBool of bool
  | EString of string
  | ETensor of expr list list * bool * shape option
      (** Tensor literal with nested lists, a flag recording whether the
          source used nested (matrix) brackets, and an optional shape
          annotation. [[1,2,3],[4,5,6]] : [2,3]. The flag is what makes
          [[1.0, 2.0]] a 1x2 matrix while [1.0, 2.0] is a vector. *)

  (* Variables and bindings *)
  | EVar of string
  | ELet of {
      name: string;
      annot: type_annot_opt;
      value: expr;
      body: expr;
    }
  | ELetRec of {
      name: string;
      annot: type_annot_opt;
      value: expr;      (** Must be a function (EFn) *)
      body: expr;
    }

  (* Functions *)
  | EFn of {
      param: string;
      param_annot: type_annot_opt;
      body: expr;
    }
  | EApp of expr * expr

  (* Control flow *)
  | EIf of {
      cond: expr;
      then_branch: expr;
      else_branch: expr;
    }

  (* Operations *)
  | EBinop of binop * expr * expr
  | EUnop of unop * expr
  | ETensorOp of tensor_op * expr list
  | EMath of math_fn * expr
      (** Math builtin applied to a scalar or element-wise to a tensor *)
      (** Tensor operations: dot(a,b), transpose(a), reshape(a, shape) *)

(** Top-level declarations *)
type decl = decl_kind located

and decl_kind =
  | DLet of {
      name: string;
      annot: type_annot_opt;
      value: expr;
    }
  | DExpr of expr   (** Expression at top level for REPL *)

(** A complete program *)
type program = decl list

(* Pretty printing *)

let pp_dim fmt = function
  | DimConst n -> Format.fprintf fmt "%d" n
  | DimVar s -> Format.fprintf fmt "'%s" s

let pp_shape fmt shape =
  Format.fprintf fmt "[%a]"
    (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ",") pp_dim)
    shape

let rec pp_type_annot fmt = function
  | TAInt -> Format.fprintf fmt "int"
  | TAFloat -> Format.fprintf fmt "float"
  | TABool -> Format.fprintf fmt "bool"
  | TAString -> Format.fprintf fmt "string"
  | TATensor (elem, shape) ->
      Format.fprintf fmt "tensor<%a>%a" pp_type_annot elem pp_shape shape
  | TAArrow (t1, t2) ->
      Format.fprintf fmt "(%a -> %a)" pp_type_annot t1 pp_type_annot t2
  | TAVar s -> Format.fprintf fmt "'%s" s

let pp_type_annot_opt fmt = function
  | None -> ()
  | Some t -> Format.fprintf fmt ": %a" pp_type_annot t

let pp_binop fmt = function
  | Add -> Format.fprintf fmt "+"
  | Sub -> Format.fprintf fmt "-"
  | Mul -> Format.fprintf fmt "*"
  | Div -> Format.fprintf fmt "/"
  | Eq -> Format.fprintf fmt "=="
  | Neq -> Format.fprintf fmt "!="
  | Lt -> Format.fprintf fmt "<"
  | Gt -> Format.fprintf fmt ">"
  | Le -> Format.fprintf fmt "<="
  | Ge -> Format.fprintf fmt ">="
  | And -> Format.fprintf fmt "&&"
  | Or -> Format.fprintf fmt "||"

let pp_unop fmt = function
  | Neg -> Format.fprintf fmt "-"
  | Not -> Format.fprintf fmt "!"

let pp_tensor_op fmt = function
  | TensorDot -> Format.fprintf fmt "dot"
  | TensorTranspose -> Format.fprintf fmt "transpose"
  | TensorReshape shape -> Format.fprintf fmt "reshape(..., %a)" pp_shape shape

let rec pp_expr fmt e =
  pp_expr_kind fmt e.value

and pp_expr_kind fmt = function
  | EInt n -> Format.fprintf fmt "%d" n
  | EFloat f -> Format.fprintf fmt "%f" f
  | EBool b -> Format.fprintf fmt "%b" b
  | EString s -> Format.fprintf fmt "%S" s
  | ETensor (rows, _matrix, shape_opt) ->
      Format.fprintf fmt "[%a]%a"
        (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ", ")
          (fun fmt row ->
            Format.fprintf fmt "[%a]"
              (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ", ") pp_expr)
              row))
        rows
        (fun fmt -> function
          | None -> ()
          | Some s -> Format.fprintf fmt " : %a" pp_shape s)
        shape_opt
  | EVar s -> Format.fprintf fmt "%s" s
  | ELet { name; annot; value; body } ->
      Format.fprintf fmt "let %s%a = %a in %a"
        name pp_type_annot_opt annot pp_expr value pp_expr body
  | ELetRec { name; annot; value; body } ->
      Format.fprintf fmt "letrec %s%a = %a in %a"
        name pp_type_annot_opt annot pp_expr value pp_expr body
  | EFn { param; param_annot; body } ->
      Format.fprintf fmt "fn %s%a -> %a"
        param pp_type_annot_opt param_annot pp_expr body
  | EApp (f, arg) ->
      Format.fprintf fmt "(%a %a)" pp_expr f pp_expr arg
  | EIf { cond; then_branch; else_branch } ->
      Format.fprintf fmt "if %a then %a else %a"
        pp_expr cond pp_expr then_branch pp_expr else_branch
  | EBinop (op, e1, e2) ->
      Format.fprintf fmt "(%a %a %a)" pp_expr e1 pp_binop op pp_expr e2
  | EUnop (op, e) ->
      Format.fprintf fmt "(%a%a)" pp_unop op pp_expr e
  | ETensorOp (TensorDot, [a; b]) ->
      Format.fprintf fmt "dot(%a, %a)" pp_expr a pp_expr b
  | ETensorOp (TensorTranspose, [a]) ->
      Format.fprintf fmt "transpose(%a)" pp_expr a
  | ETensorOp (TensorReshape shape, [a]) ->
      Format.fprintf fmt "reshape(%a, %a)" pp_expr a pp_shape shape
  | ETensorOp (_, _) ->
      Format.fprintf fmt "<invalid tensor op>"
  | EMath (f, a) ->
      Format.fprintf fmt "%s(%a)" (string_of_math_fn f) pp_expr a

let pp_decl fmt d =
  match d.value with
  | DLet { name; annot; value } ->
      Format.fprintf fmt "let %s%a = %a"
        name pp_type_annot_opt annot pp_expr value
  | DExpr e -> pp_expr fmt e

let pp_program fmt prog =
  Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt "\n\n")
    pp_decl fmt prog

let string_of_expr e = Format.asprintf "%a" pp_expr e
let string_of_decl d = Format.asprintf "%a" pp_decl d
let string_of_program p = Format.asprintf "%a" pp_program p
let string_of_type_annot t = Format.asprintf "%a" pp_type_annot t
