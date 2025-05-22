(** Tests for Bagl compiler *)

open Bagl

(* Helper to create a lexer from string *)
let lexer_of_string s = Lexer.create ~filename:"<test>" s

(* Helper to tokenize a string *)
let tokenize s =
  let lexer = lexer_of_string s in
  Lexer.tokenize_all lexer

(* Helper to parse a string *)
let parse_expr s =
  let lexer = lexer_of_string s in
  let parser = Parser.create lexer in
  Parser.parse_single_expr parser

(* Helper to parse a program *)
let parse_program s =
  let lexer = lexer_of_string s in
  let parser = Parser.create lexer in
  Parser.parse_program parser

(* Helper to type check a string *)
let typecheck s =
  let program = parse_program s in
  Typeinfer.infer_program program

(* Helper to compile and run *)
let run s =
  let program = parse_program s in
  let typed = Typeinfer.infer_program program in
  let ir = Ir.lower_program typed in
  let optimized = Optimize.optimize_default ir in
  let bytecode = Codegen.generate optimized in
  Vm.execute bytecode

(* ===== Lexer Tests ===== *)

let test_lexer_integers () =
  let tokens = tokenize "42 0 123" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  Alcotest.(check int) "token count" 4 (List.length kinds);
  match kinds with
  | [Token.INT_LIT 42; Token.INT_LIT 0; Token.INT_LIT 123; Token.EOF] -> ()
  | _ -> Alcotest.fail "Unexpected tokens"

let test_lexer_floats () =
  let tokens = tokenize "3.14 0.5 1e10" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  match kinds with
  | [Token.FLOAT_LIT _; Token.FLOAT_LIT _; Token.FLOAT_LIT _; Token.EOF] -> ()
  | _ -> Alcotest.fail "Unexpected tokens"

let test_lexer_keywords () =
  let tokens = tokenize "let in fn if then else" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  match kinds with
  | [Token.LET; Token.IN; Token.FN; Token.IF; Token.THEN; Token.ELSE; Token.EOF] -> ()
  | _ -> Alcotest.fail "Unexpected tokens"

let test_lexer_operators () =
  let tokens = tokenize "+ - * / == < > && ||" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  match kinds with
  | [Token.PLUS; Token.MINUS; Token.STAR; Token.SLASH; Token.EQEQ;
     Token.LT; Token.GT; Token.AMPAMP; Token.PIPEPIPE; Token.EOF] -> ()
  | _ -> Alcotest.fail "Unexpected tokens"

let test_lexer_arrow () =
  let tokens = tokenize "->" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  match kinds with
  | [Token.ARROW; Token.EOF] -> ()
  | _ -> Alcotest.fail "Expected arrow token"

let test_lexer_string () =
  let tokens = tokenize "\"hello world\"" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  match kinds with
  | [Token.STRING_LIT "hello world"; Token.EOF] -> ()
  | _ -> Alcotest.fail "Unexpected tokens"

let test_lexer_comments () =
  let tokens = tokenize "1 // comment\n2" in
  let kinds = List.map (fun t -> t.Location.value) tokens in
  match kinds with
  | [Token.INT_LIT 1; Token.INT_LIT 2; Token.EOF] -> ()
  | _ -> Alcotest.fail "Comments not skipped properly"

(* ===== Parser Tests ===== *)

let test_parser_int () =
  let expr = parse_expr "42" in
  match expr.Location.value with
  | Ast.EInt 42 -> ()
  | _ -> Alcotest.fail "Expected EInt 42"

let test_parser_binop () =
  let expr = parse_expr "1 + 2" in
  match expr.Location.value with
  | Ast.EBinop (Ast.Add, _, _) -> ()
  | _ -> Alcotest.fail "Expected EBinop Add"

let test_parser_precedence () =
  let expr = parse_expr "1 + 2 * 3" in
  match expr.Location.value with
  | Ast.EBinop (Ast.Add, _, { Location.value = Ast.EBinop (Ast.Mul, _, _); _ }) -> ()
  | _ -> Alcotest.fail "Wrong precedence"

let test_parser_let () =
  let expr = parse_expr "let x = 5 in x" in
  match expr.Location.value with
  | Ast.ELet { name = "x"; _ } -> ()
  | _ -> Alcotest.fail "Expected ELet"

let test_parser_fn () =
  let expr = parse_expr "fn x -> x + 1" in
  match expr.Location.value with
  | Ast.EFn { param = "x"; _ } -> ()
  | _ -> Alcotest.fail "Expected EFn"

let test_parser_app () =
  let expr = parse_expr "f x" in
  match expr.Location.value with
  | Ast.EApp (_, _) -> ()
  | _ -> Alcotest.fail "Expected EApp"

let test_parser_if () =
  let expr = parse_expr "if true then 1 else 2" in
  match expr.Location.value with
  | Ast.EIf _ -> ()
  | _ -> Alcotest.fail "Expected EIf"

(* ===== Type Inference Tests ===== *)

let test_type_int () =
  let typed = typecheck "42" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TInt -> ()
      | _ -> Alcotest.fail "Expected TInt"
      end
  | _ -> Alcotest.fail "Expected one declaration"

let test_type_float () =
  let typed = typecheck "3.14" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TFloat -> ()
      | _ -> Alcotest.fail "Expected TFloat"
      end
  | _ -> Alcotest.fail "Expected one declaration"

let test_type_bool () =
  let typed = typecheck "true" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TBool -> ()
      | _ -> Alcotest.fail "Expected TBool"
      end
  | _ -> Alcotest.fail "Expected one declaration"

let test_type_add_int () =
  let typed = typecheck "1 + 2" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TInt -> ()
      | _ -> Alcotest.fail "Expected TInt"
      end
  | _ -> Alcotest.fail "Expected one declaration"

let test_type_comparison () =
  let typed = typecheck "1 < 2" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TBool -> ()
      | _ -> Alcotest.fail "Expected TBool"
      end
  | _ -> Alcotest.fail "Expected one declaration"

let test_type_fn () =
  let typed = typecheck "fn x -> x + 1" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TArrow (Types.TInt, Types.TInt) -> ()
      | Types.TArrow _ -> ()  (* Could have type variable *)
      | _ -> Alcotest.fail "Expected TArrow"
      end
  | _ -> Alcotest.fail "Expected one declaration"

let test_type_let_poly () =
  (* let id = fn x -> x in id 5 should work with polymorphism *)
  let typed = typecheck "let id = fn x -> x in id 5" in
  match typed with
  | [(_, ty)] ->
      begin match Types.find_ty ty with
      | Types.TInt -> ()
      | _ -> Alcotest.fail "Expected TInt from polymorphic id"
      end
  | _ -> Alcotest.fail "Expected one declaration"

(* ===== VM Execution Tests ===== *)

let test_run_int () =
  let result = run "42" in
  match result with
  | Vm.VInt 42 -> ()
  | _ -> Alcotest.fail "Expected VInt 42"

let test_run_add () =
  let result = run "1 + 2" in
  match result with
  | Vm.VInt 3 -> ()
  | _ -> Alcotest.fail "Expected VInt 3"

let test_run_mul () =
  let result = run "3 * 4" in
  match result with
  | Vm.VInt 12 -> ()
  | _ -> Alcotest.fail "Expected VInt 12"

let test_run_precedence () =
  let result = run "1 + 2 * 3" in
  match result with
  | Vm.VInt 7 -> ()
  | _ -> Alcotest.fail "Expected VInt 7"

let test_run_let () =
  let result = run "let x = 5 in x + 1" in
  match result with
  | Vm.VInt 6 -> ()
  | _ -> Alcotest.fail "Expected VInt 6"

let test_run_nested_let () =
  let result = run "let x = 5 in let y = 10 in x + y" in
  match result with
  | Vm.VInt 15 -> ()
  | _ -> Alcotest.fail "Expected VInt 15"

let test_run_if_true () =
  let result = run "if true then 1 else 2" in
  match result with
  | Vm.VInt 1 -> ()
  | _ -> Alcotest.fail "Expected VInt 1"

let test_run_if_false () =
  let result = run "if false then 1 else 2" in
  match result with
  | Vm.VInt 2 -> ()
  | _ -> Alcotest.fail "Expected VInt 2"

let test_run_comparison () =
  let result = run "if 5 > 3 then 1 else 0" in
  match result with
  | Vm.VInt 1 -> ()
  | _ -> Alcotest.fail "Expected VInt 1"

let test_run_fn_app () =
  let result = run "let f = fn x -> x + 1 in f 10" in
  match result with
  | Vm.VInt 11 -> ()
  | _ -> Alcotest.fail "Expected VInt 11"

let test_run_curried () =
  let result = run "let add = fn x -> fn y -> x + y in add 3 4" in
  match result with
  | Vm.VInt 7 -> ()
  | _ -> Alcotest.fail "Expected VInt 7"

(* ===== Test Suite ===== *)

let lexer_tests = [
  "integers", `Quick, test_lexer_integers;
  "floats", `Quick, test_lexer_floats;
  "keywords", `Quick, test_lexer_keywords;
  "operators", `Quick, test_lexer_operators;
  "arrow", `Quick, test_lexer_arrow;
  "string", `Quick, test_lexer_string;
  "comments", `Quick, test_lexer_comments;
]

let parser_tests = [
  "int", `Quick, test_parser_int;
  "binop", `Quick, test_parser_binop;
  "precedence", `Quick, test_parser_precedence;
  "let", `Quick, test_parser_let;
  "fn", `Quick, test_parser_fn;
  "app", `Quick, test_parser_app;
  "if", `Quick, test_parser_if;
]

let type_tests = [
  "int", `Quick, test_type_int;
  "float", `Quick, test_type_float;
  "bool", `Quick, test_type_bool;
  "add_int", `Quick, test_type_add_int;
  "comparison", `Quick, test_type_comparison;
  "fn", `Quick, test_type_fn;
  "let_poly", `Quick, test_type_let_poly;
]

let run_tests = [
  "int", `Quick, test_run_int;
  "add", `Quick, test_run_add;
  "mul", `Quick, test_run_mul;
  "precedence", `Quick, test_run_precedence;
  "let", `Quick, test_run_let;
  "nested_let", `Quick, test_run_nested_let;
  "if_true", `Quick, test_run_if_true;
  "if_false", `Quick, test_run_if_false;
  "comparison", `Quick, test_run_comparison;
  "fn_app", `Quick, test_run_fn_app;
  "curried", `Quick, test_run_curried;
]

let () =
  Alcotest.run "Bagl" [
    "Lexer", lexer_tests;
    "Parser", parser_tests;
    "Types", type_tests;
    "Run", run_tests;
  ]
