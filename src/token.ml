(** Token definitions for the lexer *)

(** Token kinds - the type of each lexical unit *)
type token_kind =
  (* Literals *)
  | INT_LIT of int
  | FLOAT_LIT of float
  | BOOL_LIT of bool
  | STRING_LIT of string

  (* Keywords *)
  | LET
  | LETREC
  | IN
  | FN
  | IF
  | THEN
  | ELSE
  | TRUE
  | FALSE

  (* Type keywords *)
  | INT_TYPE
  | FLOAT_TYPE
  | BOOL_TYPE
  | STRING_TYPE
  | TENSOR

  (* Tensor operation keywords *)
  | DOT
  | TRANSPOSE
  | RESHAPE

  (* Math builtin keywords; scalar or element-wise on tensors *)
  | EXP
  | LOG
  | SQRT
  | RELU
  | STEP

  (* Identifiers *)
  | IDENT of string

  (* Operators *)
  | PLUS        (* + *)
  | MINUS       (* - *)
  | STAR        (* * *)
  | SLASH       (* / *)
  | EQ          (* = *)
  | EQEQ        (* == *)
  | NEQ         (* != *)
  | LT          (* < *)
  | GT          (* > *)
  | LE          (* <= *)
  | GE          (* >= *)
  | AMPAMP      (* && *)
  | PIPEPIPE    (* || *)
  | BANG        (* ! *)
  | ARROW       (* -> *)

  (* Delimiters *)
  | LPAREN      (* ( *)
  | RPAREN      (* ) *)
  | LBRACKET    (* [ *)
  | RBRACKET    (* ] *)
  | LANGLE      (* < *)
  | RANGLE      (* > *)
  | COMMA       (* , *)
  | COLON       (* : *)
  | SEMI        (* ; *)
  | QUOTE       (* ' for type variables *)

  (* Special *)
  | EOF
  | NEWLINE     (* for REPL line handling *)

(** A token with its location *)
type token = token_kind Location.located

(** Keywords table *)
let keywords = [
  ("let", LET);
  ("letrec", LETREC);
  ("in", IN);
  ("fn", FN);
  ("if", IF);
  ("then", THEN);
  ("else", ELSE);
  ("true", BOOL_LIT true);
  ("false", BOOL_LIT false);
  ("int", INT_TYPE);
  ("float", FLOAT_TYPE);
  ("bool", BOOL_TYPE);
  ("string", STRING_TYPE);
  ("tensor", TENSOR);
  ("dot", DOT);
  ("transpose", TRANSPOSE);
  ("reshape", RESHAPE);
  ("exp", EXP);
  ("log", LOG);
  ("sqrt", SQRT);
  ("relu", RELU);
  ("step", STEP);
]

(** Look up a keyword, returning IDENT if not found *)
let lookup_keyword s =
  match List.assoc_opt s keywords with
  | Some kw -> kw
  | None -> IDENT s

(** Pretty print a token kind *)
let pp_token_kind fmt = function
  | INT_LIT n -> Format.fprintf fmt "INT(%d)" n
  | FLOAT_LIT f -> Format.fprintf fmt "FLOAT(%f)" f
  | BOOL_LIT b -> Format.fprintf fmt "BOOL(%b)" b
  | STRING_LIT s -> Format.fprintf fmt "STRING(%S)" s
  | LET -> Format.fprintf fmt "LET"
  | LETREC -> Format.fprintf fmt "LETREC"
  | IN -> Format.fprintf fmt "IN"
  | FN -> Format.fprintf fmt "FN"
  | IF -> Format.fprintf fmt "IF"
  | THEN -> Format.fprintf fmt "THEN"
  | ELSE -> Format.fprintf fmt "ELSE"
  | TRUE -> Format.fprintf fmt "TRUE"
  | FALSE -> Format.fprintf fmt "FALSE"
  | INT_TYPE -> Format.fprintf fmt "INT_TYPE"
  | FLOAT_TYPE -> Format.fprintf fmt "FLOAT_TYPE"
  | BOOL_TYPE -> Format.fprintf fmt "BOOL_TYPE"
  | STRING_TYPE -> Format.fprintf fmt "STRING_TYPE"
  | TENSOR -> Format.fprintf fmt "TENSOR"
  | DOT -> Format.fprintf fmt "DOT"
  | TRANSPOSE -> Format.fprintf fmt "TRANSPOSE"
  | RESHAPE -> Format.fprintf fmt "RESHAPE"
  | EXP -> Format.fprintf fmt "EXP"
  | LOG -> Format.fprintf fmt "LOG"
  | SQRT -> Format.fprintf fmt "SQRT"
  | RELU -> Format.fprintf fmt "RELU"
  | STEP -> Format.fprintf fmt "STEP"
  | IDENT s -> Format.fprintf fmt "IDENT(%s)" s
  | PLUS -> Format.fprintf fmt "PLUS"
  | MINUS -> Format.fprintf fmt "MINUS"
  | STAR -> Format.fprintf fmt "STAR"
  | SLASH -> Format.fprintf fmt "SLASH"
  | EQ -> Format.fprintf fmt "EQ"
  | EQEQ -> Format.fprintf fmt "EQEQ"
  | NEQ -> Format.fprintf fmt "NEQ"
  | LT -> Format.fprintf fmt "LT"
  | GT -> Format.fprintf fmt "GT"
  | LE -> Format.fprintf fmt "LE"
  | GE -> Format.fprintf fmt "GE"
  | AMPAMP -> Format.fprintf fmt "AMPAMP"
  | PIPEPIPE -> Format.fprintf fmt "PIPEPIPE"
  | BANG -> Format.fprintf fmt "BANG"
  | ARROW -> Format.fprintf fmt "ARROW"
  | LPAREN -> Format.fprintf fmt "LPAREN"
  | RPAREN -> Format.fprintf fmt "RPAREN"
  | LBRACKET -> Format.fprintf fmt "LBRACKET"
  | RBRACKET -> Format.fprintf fmt "RBRACKET"
  | LANGLE -> Format.fprintf fmt "LANGLE"
  | RANGLE -> Format.fprintf fmt "RANGLE"
  | COMMA -> Format.fprintf fmt "COMMA"
  | COLON -> Format.fprintf fmt "COLON"
  | SEMI -> Format.fprintf fmt "SEMI"
  | QUOTE -> Format.fprintf fmt "QUOTE"
  | EOF -> Format.fprintf fmt "EOF"
  | NEWLINE -> Format.fprintf fmt "NEWLINE"

(** Pretty print a token *)
let pp_token fmt tok =
  Format.fprintf fmt "%a at %a"
    pp_token_kind tok.Location.value
    Location.pp_span tok.Location.loc

(** Convert token kind to string *)
let string_of_token_kind tk =
  Format.asprintf "%a" pp_token_kind tk

(** Convert token to string *)
let string_of_token tok =
  Format.asprintf "%a" pp_token tok

(** Check if two token kinds are equal (ignoring payload for some) *)
let token_kind_equal a b =
  match a, b with
  | INT_LIT _, INT_LIT _ -> true
  | FLOAT_LIT _, FLOAT_LIT _ -> true
  | BOOL_LIT x, BOOL_LIT y -> x = y
  | STRING_LIT _, STRING_LIT _ -> true
  | IDENT _, IDENT _ -> true
  | a, b -> a = b
