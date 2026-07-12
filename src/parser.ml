(** Recursive descent parser for Bagl *)

open Location
open Token
open Ast

(** Parser state *)
type t = {
  lexer: Lexer.t;
  mutable current: token;
}

(** Parser errors *)
exception Parse_error of string * span

(** Create a new parser *)
let create lexer =
  let current = Lexer.next_token lexer in
  { lexer; current }

(** Get current token *)
let current p = p.current

(** Advance to next token *)
let advance p =
  p.current <- Lexer.next_token p.lexer

(** Check if current token matches a kind *)
let check p kind =
  Token.token_kind_equal p.current.value kind

(** Check if at end of input *)
let is_at_end p =
  match p.current.value with
  | EOF -> true
  | _ -> false

(** Raise a parse error *)
let error p msg =
  raise (Parse_error (msg, p.current.loc))

(** Expect a specific token, error if not found *)
let expect p kind msg =
  if check p kind then begin
    let tok = p.current in
    advance p;
    tok
  end else
    error p msg

(** Match a token if present, advancing if matched *)
let match_token p kind =
  if check p kind then begin
    advance p;
    true
  end else
    false

(** Operator precedence levels (higher = binds tighter) *)
let precedence = function
  | PIPEPIPE -> 1
  | AMPAMP -> 2
  | EQEQ | NEQ -> 3
  | LT | GT | LE | GE -> 4
  | PLUS | MINUS -> 5
  | STAR | SLASH -> 6
  | _ -> 0

(** Convert token to binop *)
let token_to_binop = function
  | PLUS -> Some Add
  | MINUS -> Some Sub
  | STAR -> Some Mul
  | SLASH -> Some Div
  | EQEQ -> Some Eq
  | NEQ -> Some Neq
  | LT -> Some Lt
  | GT -> Some Gt
  | LE -> Some Le
  | GE -> Some Ge
  | AMPAMP -> Some And
  | PIPEPIPE -> Some Or
  | _ -> None

(** Is the token a binary operator? *)
let is_binop tok =
  match token_to_binop tok with
  | Some _ -> true
  | None -> false

(* Forward declarations for mutual recursion *)
let parse_expr : (t -> expr) ref = ref (fun _ -> failwith "not initialized")
let parse_type_annot : (t -> type_annot) ref = ref (fun _ -> failwith "not initialized")

(** Parse a dimension in a shape: integer or 'n *)
let parse_dim p =
  match p.current.value with
  | INT_LIT n ->
      advance p;
      DimConst n
  | QUOTE ->
      advance p;
      begin match p.current.value with
      | IDENT s ->
          advance p;
          DimVar s
      | _ -> error p "Expected identifier after ' in dimension"
      end
  | _ -> error p "Expected dimension (integer or 'name)"

(** Parse a shape: [dim, dim, ...] *)
let parse_shape p =
  ignore (expect p LBRACKET "Expected '[' to start shape");
  if check p RBRACKET then begin
    advance p;
    []  (* Empty shape = scalar *)
  end else begin
    let dims = ref [parse_dim p] in
    while match_token p COMMA do
      dims := parse_dim p :: !dims
    done;
    ignore (expect p RBRACKET "Expected ']' to end shape");
    List.rev !dims
  end

(** Parse a type annotation *)
let rec parse_arrow_type p =
  let left = parse_simple_type p in
  if match_token p ARROW then
    TAArrow (left, parse_arrow_type p)
  else
    left

and parse_simple_type p =
  match p.current.value with
  | INT_TYPE ->
      advance p;
      TAInt
  | FLOAT_TYPE ->
      advance p;
      TAFloat
  | BOOL_TYPE ->
      advance p;
      TABool
  | STRING_TYPE ->
      advance p;
      TAString
  | TENSOR ->
      advance p;
      (* tensor<elem>[shape] *)
      ignore (expect p LT "Expected '<' after 'tensor'");
      let elem = parse_arrow_type p in
      ignore (expect p GT "Expected '>' after element type");
      let shape = parse_shape p in
      TATensor (elem, shape)
  | QUOTE ->
      advance p;
      begin match p.current.value with
      | IDENT s ->
          advance p;
          TAVar s
      | _ -> error p "Expected identifier after ' in type variable"
      end
  | LPAREN ->
      advance p;
      let t = parse_arrow_type p in
      ignore (expect p RPAREN "Expected ')' after type");
      t
  | _ -> error p "Expected type"

let parse_type_annot_impl = parse_arrow_type

let () = parse_type_annot := parse_type_annot_impl

(** Parse optional type annotation *)
let parse_type_annot_opt p =
  if match_token p COLON then
    Some (!parse_type_annot p)
  else
    None

(** Parse an optional parameter annotation. A parameter annotation must not
    consume the fn's own '->', so it parses a non-arrow type; an arrow type
    is still expressible with parentheses: [fn f: (int -> int) -> ...]. *)
let parse_param_annot_opt p =
  if match_token p COLON then
    Some (parse_simple_type p)
  else
    None

(** Parse a tensor row: [expr, expr, ...] *)
let parse_tensor_row p =
  ignore (expect p LBRACKET "Expected '[' to start tensor row");
  if check p RBRACKET then begin
    advance p;
    []
  end else begin
    let exprs = ref [!parse_expr p] in
    while match_token p COMMA do
      exprs := !parse_expr p :: !exprs
    done;
    ignore (expect p RBRACKET "Expected ']' to end tensor row");
    List.rev !exprs
  end

(** Parse a tensor literal: [[1,2],[3,4]] or [1,2,3] *)
let parse_tensor_literal p start_pos =
  advance p;  (* consume '[' *)

  if check p RBRACKET then begin
    (* Empty tensor [] *)
    advance p;
    let shape_opt =
      if match_token p COLON then Some (parse_shape p)
      else None
    in
    let span = merge_spans start_pos p.current.loc in
    { value = ETensor ([], false, shape_opt); loc = span }
  end else if check p LBRACKET then begin
    (* 2D tensor [[...], [...]] *)
    let rows = ref [parse_tensor_row p] in
    while match_token p COMMA do
      if check p LBRACKET then
        rows := parse_tensor_row p :: !rows
      else
        error p "Expected '[' for tensor row"
    done;
    ignore (expect p RBRACKET "Expected ']' to end tensor");
    let shape_opt =
      if match_token p COLON then Some (parse_shape p)
      else None
    in
    let span = merge_spans start_pos p.current.loc in
    { value = ETensor (List.rev !rows, true, shape_opt); loc = span }
  end else begin
    (* 1D tensor [1, 2, 3] *)
    let exprs = ref [!parse_expr p] in
    while match_token p COMMA do
      exprs := !parse_expr p :: !exprs
    done;
    ignore (expect p RBRACKET "Expected ']' to end tensor");
    let shape_opt =
      if match_token p COLON then Some (parse_shape p)
      else None
    in
    let span = merge_spans start_pos p.current.loc in
    (* Wrap as single row for 1D tensor *)
    { value = ETensor ([List.rev !exprs], false, shape_opt); loc = span }
  end

(** Parse a primary expression *)
let parse_primary p =
  let start_pos = p.current.loc in
  match p.current.value with
  | INT_LIT n ->
      advance p;
      { value = EInt n; loc = start_pos }
  | FLOAT_LIT f ->
      advance p;
      { value = EFloat f; loc = start_pos }
  | BOOL_LIT b ->
      advance p;
      { value = EBool b; loc = start_pos }
  | STRING_LIT s ->
      advance p;
      { value = EString s; loc = start_pos }
  | IDENT s ->
      advance p;
      { value = EVar s; loc = start_pos }
  | LPAREN ->
      advance p;
      let e = !parse_expr p in
      ignore (expect p RPAREN "Expected ')' after expression");
      e
  | LBRACKET ->
      parse_tensor_literal p start_pos
  | DOT ->
      (* dot(a, b) *)
      advance p;
      ignore (expect p LPAREN "Expected '(' after 'dot'");
      let a = !parse_expr p in
      ignore (expect p COMMA "Expected ',' in dot arguments");
      let b = !parse_expr p in
      ignore (expect p RPAREN "Expected ')' after dot arguments");
      let span = merge_spans start_pos p.current.loc in
      { value = ETensorOp (TensorDot, [a; b]); loc = span }
  | (EXP | LOG | SQRT | RELU | STEP) as tok ->
      (* Math builtin with call syntax: exp(a), log(a), ... *)
      let f = match tok with
        | EXP -> MExp | LOG -> MLog | SQRT -> MSqrt
        | RELU -> MRelu | STEP -> MStep
        | _ -> assert false
      in
      let name = string_of_math_fn f in
      advance p;
      ignore (expect p LPAREN (Printf.sprintf "Expected '(' after '%s'" name));
      let a = !parse_expr p in
      ignore (expect p RPAREN (Printf.sprintf "Expected ')' after %s argument" name));
      let span = merge_spans start_pos p.current.loc in
      { value = EMath (f, a); loc = span }
  | TRANSPOSE ->
      (* transpose(a) *)
      advance p;
      ignore (expect p LPAREN "Expected '(' after 'transpose'");
      let a = !parse_expr p in
      ignore (expect p RPAREN "Expected ')' after transpose argument");
      let span = merge_spans start_pos p.current.loc in
      { value = ETensorOp (TensorTranspose, [a]); loc = span }
  | RESHAPE ->
      (* reshape(a, [shape]) *)
      advance p;
      ignore (expect p LPAREN "Expected '(' after 'reshape'");
      let a = !parse_expr p in
      ignore (expect p COMMA "Expected ',' in reshape arguments");
      let shape = parse_shape p in
      ignore (expect p RPAREN "Expected ')' after reshape arguments");
      let span = merge_spans start_pos p.current.loc in
      { value = ETensorOp (TensorReshape shape, [a]); loc = span }
  | _ ->
      error p "Expected expression"

(** Parse unary expression *)
let rec parse_unary p =
  let start_pos = p.current.loc in
  match p.current.value with
  | MINUS ->
      advance p;
      let e = parse_unary p in
      let span = merge_spans start_pos e.loc in
      { value = EUnop (Neg, e); loc = span }
  | BANG ->
      advance p;
      let e = parse_unary p in
      let span = merge_spans start_pos e.loc in
      { value = EUnop (Not, e); loc = span }
  | _ ->
      parse_application p

(** Parse function application (left-associative) *)
and parse_application p =
  let start_pos = p.current.loc in
  let func = parse_primary p in

  (* Check if next token could start an argument *)
  let rec loop f =
    match p.current.value with
    | INT_LIT _ | FLOAT_LIT _ | BOOL_LIT _ | STRING_LIT _
    | IDENT _ | LPAREN | LBRACKET ->
        let arg = parse_primary p in
        let span = merge_spans start_pos arg.loc in
        loop { value = EApp (f, arg); loc = span }
    | _ -> f
  in
  loop func

(** Parse binary expression with precedence climbing *)
let rec parse_binary p min_prec left =
  if not (is_binop p.current.value) || precedence p.current.value < min_prec then
    left
  else begin
    let op_tok = p.current in
    let op = match token_to_binop op_tok.value with
      | Some op -> op
      | None -> error p "Expected binary operator"
    in
    let op_prec = precedence op_tok.value in
    advance p;
    let right = parse_unary p in
    (* Handle right-associativity for higher precedence *)
    let right = parse_binary p (op_prec + 1) right in
    let span = merge_spans left.loc right.loc in
    let new_left = { value = EBinop (op, left, right); loc = span } in
    parse_binary p min_prec new_left
  end

(** Parse an if expression *)
let parse_if p =
  let start_pos = p.current.loc in
  advance p;  (* consume 'if' *)
  let cond = !parse_expr p in
  ignore (expect p THEN "Expected 'then' after if condition");
  let then_branch = !parse_expr p in
  ignore (expect p ELSE "Expected 'else' after then branch");
  let else_branch = !parse_expr p in
  let span = merge_spans start_pos else_branch.loc in
  { value = EIf { cond; then_branch; else_branch }; loc = span }

(** Parse a function expression *)
let parse_fn p =
  let start_pos = p.current.loc in
  advance p;  (* consume 'fn' *)
  let param = match p.current.value with
    | IDENT s -> advance p; s
    | _ -> error p "Expected parameter name after 'fn'"
  in
  let param_annot = parse_param_annot_opt p in
  ignore (expect p ARROW "Expected '->' after function parameter");
  let body = !parse_expr p in
  let span = merge_spans start_pos body.loc in
  { value = EFn { param; param_annot; body }; loc = span }

(** Parse a let expression *)
let parse_let_expr p =
  let start_pos = p.current.loc in
  advance p;  (* consume 'let' *)
  let name = match p.current.value with
    | IDENT s -> advance p; s
    | _ -> error p "Expected identifier after 'let'"
  in
  let annot = parse_type_annot_opt p in
  ignore (expect p EQ "Expected '=' after let binding name");
  let value = !parse_expr p in
  ignore (expect p IN "Expected 'in' after let binding value");
  let body = !parse_expr p in
  let span = merge_spans start_pos body.loc in
  { value = ELet { name; annot; value; body }; loc = span }

(** Parse a letrec expression (recursive binding) *)
let parse_letrec_expr p =
  let start_pos = p.current.loc in
  advance p;  (* consume 'letrec' *)
  let name = match p.current.value with
    | IDENT s -> advance p; s
    | _ -> error p "Expected identifier after 'letrec'"
  in
  let annot = parse_type_annot_opt p in
  ignore (expect p EQ "Expected '=' after letrec binding name");
  let value = !parse_expr p in
  ignore (expect p IN "Expected 'in' after letrec binding value");
  let body = !parse_expr p in
  let span = merge_spans start_pos body.loc in
  { value = ELetRec { name; annot; value; body }; loc = span }

(** Parse a complete expression *)
let parse_expr_impl p =
  match p.current.value with
  | LET -> parse_let_expr p
  | LETREC -> parse_letrec_expr p
  | FN -> parse_fn p
  | IF -> parse_if p
  | _ ->
      let left = parse_unary p in
      if is_binop p.current.value then
        parse_binary p 1 left
      else
        left

let () = parse_expr := parse_expr_impl

(** Parse a top-level declaration *)
let parse_decl p =
  (* Try parsing as expression first - handles let...in expressions *)
  let e = !parse_expr p in
  { value = DExpr e; loc = e.loc }

(** Parse a complete program *)
let parse_program p =
  let decls = ref [] in
  while not (is_at_end p) do
    decls := parse_decl p :: !decls;
    (* Optional semicolon between declarations *)
    ignore (match_token p SEMI)
  done;
  List.rev !decls

(** Parse a single expression (for REPL) *)
let parse_single_expr p =
  !parse_expr p
