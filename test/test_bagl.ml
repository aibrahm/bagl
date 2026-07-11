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
  let program = Autodiff.expand_program program in
  let typed = Typeinfer.infer_program program in
  let ir = Ir.lower_program typed in
  let optimized = Optimize.optimize_default ir in
  let bytecode = Codegen.generate optimized in
  Vm.execute bytecode

(* Helper: run and expect a tensor result *)
let run_tensor s =
  match run s with
  | Vm.VTensor t -> t
  | v -> Alcotest.failf "Expected tensor, got %s" (Vm.string_of_value v)

(* Helper: true when the program is rejected by the type checker *)
let is_rejected s =
  try ignore (typecheck s); false
  with Typeinfer.Type_error _ -> true

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
      | Types.TArrow (dom, cod) ->
          begin match Types.find_ty dom, Types.find_ty cod with
          | Types.TInt, Types.TInt -> ()
          | d, c ->
              Alcotest.failf "Expected int -> int, got %s -> %s"
                (Types.string_of_ty d) (Types.string_of_ty c)
          end
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

(* ===== Top-level `if` execution (regression: cross-block codegen) ===== *)

(* A top-level `if` whose branches read a variable bound in an earlier block
   used to crash codegen ("Variable vN not allocated"). These assert the
   VM result, not just that it runs. *)

let test_run_if_toplevel_var () =
  let result = run "let a = 5 in if true then a + 1 else a - 1" in
  match result with
  | Vm.VInt 6 -> ()
  | _ -> Alcotest.fail "Expected VInt 6"

let test_run_if_toplevel_var_false () =
  let result = run "let a = 5 in if false then a + 1 else a - 1" in
  match result with
  | Vm.VInt 4 -> ()
  | _ -> Alcotest.fail "Expected VInt 4"

let test_run_if_arith_branch () =
  let result = run "let a = 10 in let b = 3 in if a > b then a - b else b - a" in
  match result with
  | Vm.VInt 7 -> ()
  | _ -> Alcotest.fail "Expected VInt 7"

let test_run_if_call_branch () =
  let result = run "let f = fn x -> x + 100 in if true then f 5 else f 6" in
  match result with
  | Vm.VInt 105 -> ()
  | _ -> Alcotest.fail "Expected VInt 105"

let test_run_if_nested () =
  let result = run "let a = 2 in if true then (if a > 1 then a * 10 else a) else 0" in
  match result with
  | Vm.VInt 20 -> ()
  | _ -> Alcotest.fail "Expected VInt 20"

(* ===== Recursion through the full pipeline ===== *)

let test_run_letrec_factorial () =
  let result = run "letrec fact = fn n -> if n == 0 then 1 else n * fact (n - 1) in fact 5" in
  match result with
  | Vm.VInt 120 -> ()
  | _ -> Alcotest.fail "Expected VInt 120"

let test_run_letrec_sum () =
  let result = run "letrec sum = fn n -> if n == 0 then 0 else n + sum (n - 1) in sum 10" in
  match result with
  | Vm.VInt 55 -> ()
  | _ -> Alcotest.fail "Expected VInt 55"

(* ===== Regression: type-directed lowering and annotations ===== *)

(* A float parameter used on its own must lower to float opcodes even
   without an annotation; this used to crash the VM with "Expected int". *)
let test_run_float_param () =
  let result = run "let f = fn x -> (x + 1.0) + x in f 2.0" in
  match result with
  | Vm.VFloat f -> Alcotest.(check (float 1e-9)) "float param" 5.0 f
  | v -> Alcotest.failf "Expected VFloat, got %s" (Vm.string_of_value v)

(* Parameter annotations used to be unparseable: the type parser consumed
   the fn's own arrow. *)
let test_run_annotated_param () =
  let result = run "let f = fn x: int -> x + 1 in f 2" in
  match result with
  | Vm.VInt 3 -> ()
  | v -> Alcotest.failf "Expected VInt 3, got %s" (Vm.string_of_value v)

let test_run_annotated_float_param () =
  let result = run "let f = fn x: float -> x + x in f 2.5" in
  match result with
  | Vm.VFloat f -> Alcotest.(check (float 1e-9)) "annotated float" 5.0 f
  | v -> Alcotest.failf "Expected VFloat, got %s" (Vm.string_of_value v)

(* An arrow-typed parameter is still expressible with parentheses. *)
let test_run_arrow_annotated_param () =
  let result = run "let apply = fn f: (int -> int) -> f 4 in apply (fn y -> y + 1)" in
  match result with
  | Vm.VInt 5 -> ()
  | v -> Alcotest.failf "Expected VInt 5, got %s" (Vm.string_of_value v)

(* Functions over tensors: the tensor op unifies its argument instead of
   demanding an already-concrete tensor. *)
let test_run_tensor_param () =
  let t = run_tensor
    "let f = fn a -> dot(a, [[1.0, 0.0], [0.0, 1.0]]) in f [[1.0, 2.0], [3.0, 4.0]]" in
  Alcotest.(check (list int)) "shape" [2; 2] t.Vm.shape;
  Alcotest.(check (list (float 0.0))) "data"
    [1.0; 2.0; 3.0; 4.0] (Array.to_list t.Vm.data)

(* Repeated dimension variables constrain: ['n,'n] means square. *)
let test_reject_dim_var_mismatch () =
  Alcotest.(check bool) "2x3 into ['n,'n] is rejected" true
    (is_rejected "let m: tensor<float>['n,'n] = [[1.0,2.0,3.0],[4.0,5.0,6.0]] in m")

let test_accept_dim_var_square () =
  let t = run_tensor "let m: tensor<float>['n,'n] = [[1.0,2.0],[3.0,4.0]] in m" in
  Alcotest.(check (list int)) "shape" [2; 2] t.Vm.shape

(* Element-wise arithmetic is implemented, but only for matching shapes. *)
let test_reject_tensor_arith_mismatch () =
  Alcotest.(check bool) "mismatched element-wise add is rejected" true
    (is_rejected "[1.0, 2.0] + [3.0, 4.0, 5.0]")

let test_reject_tensor_eq () =
  Alcotest.(check bool) "tensor equality is rejected" true
    (is_rejected "[1.0, 2.0] == [1.0, 2.0]")

let test_reject_fn_eq () =
  Alcotest.(check bool) "function equality is rejected" true
    (is_rejected "(fn x -> x) == (fn x -> x)")

(* Serialization round-trip: negative ints must sign-extend. *)
let test_serialize_negative_int () =
  let program = parse_program "0 - 5" in
  let typed = Typeinfer.infer_program program in
  let ir = Ir.lower_program typed in
  let bytecode = Codegen.generate ir in
  let path = Filename.temp_file "bagl_test" ".baglc" in
  Serialize.write_file path bytecode;
  let loaded = Serialize.read_file path in
  Sys.remove path;
  match Vm.execute loaded with
  | Vm.VInt (-5) -> ()
  | v -> Alcotest.failf "Expected VInt -5, got %s" (Vm.string_of_value v)

(* Locals are sized from the chunk: many bindings must not overflow the
   fixed default, including unoptimized where nothing is folded away. *)
let test_run_many_locals_unoptimized () =
  let buf = Buffer.create 4096 in
  for i = 0 to 299 do
    Buffer.add_string buf (Printf.sprintf "let v%d = %d in\n" i i)
  done;
  Buffer.add_string buf "v299";
  let program = parse_program (Buffer.contents buf) in
  let typed = Typeinfer.infer_program program in
  let ir = Ir.lower_program typed in
  let bytecode = Codegen.generate ir in
  match Vm.execute bytecode with
  | Vm.VInt 299 -> ()
  | v -> Alcotest.failf "Expected VInt 299, got %s" (Vm.string_of_value v)

(* ===== Automatic differentiation ===== *)

let run_float s =
  match run s with
  | Vm.VFloat f -> f
  | v -> Alcotest.failf "Expected float, got %s" (Vm.string_of_value v)

(* d/dx (x*x) = 2x, so at x=3 -> 6 *)
let test_grad_square () =
  Alcotest.(check (float 1e-9)) "2x at 3" 6.0
    (run_float "grad (fn x -> x * x) 3.0")

(* d/dx (x*x*x) = 3x^2, so at x=2 -> 12 *)
let test_grad_cube () =
  Alcotest.(check (float 1e-9)) "3x^2 at 2" 12.0
    (run_float "grad (fn x -> x * x * x) 2.0")

(* d/dx (x*x + x) = 2x + 1, so at x=3 -> 7 *)
let test_grad_poly () =
  Alcotest.(check (float 1e-9)) "2x+1 at 3" 7.0
    (run_float "grad (fn x -> x * x + x) 3.0")

(* d/dx (1/x) = -1/x^2, so at x=2 -> -0.25 *)
let test_grad_reciprocal () =
  Alcotest.(check (float 1e-9)) "-1/x^2 at 2" (-0.25)
    (run_float "grad (fn x -> 1.0 / x) 2.0")

(* d/dx (x/(x+1)) = 1/(x+1)^2, so at x=1 -> 0.25 *)
let test_grad_quotient () =
  Alcotest.(check (float 1e-9)) "1/(x+1)^2 at 1" 0.25
    (run_float "grad (fn x -> x / (x + 1.0)) 1.0")

(* d/dx -(x*x) = -2x, so at x=3 -> -6 *)
let test_grad_neg () =
  Alcotest.(check (float 1e-9)) "-2x at 3" (-6.0)
    (run_float "grad (fn x -> 0.0 - x * x) 3.0")

(* Chain rule through a let: x*x*x, derivative 3x^2 at 2 -> 12 *)
let test_grad_let () =
  Alcotest.(check (float 1e-9)) "let chain at 2" 12.0
    (run_float "grad (fn x -> let y = x * x in y * x) 2.0")

(* Each if branch differentiates; condition is data. x>0 branch is x*x -> 2x at 4 = 8 *)
let test_grad_if () =
  Alcotest.(check (float 1e-9)) "if branch at 4" 8.0
    (run_float "grad (fn x -> if x > 0.0 then x * x else x) 4.0")

(* Numeric defaulting is deferred, so a float constraint wins regardless of
   operand order: (x + x) + 1.0 used to fail because x*x committed to int. *)
let test_float_op_order () =
  Alcotest.(check (float 1e-9)) "(x+x)+1.0 at 2" 5.0
    (run_float "let f = fn x -> (x + x) + 1.0 in f 2.0")

(* The result of a recursive call must lower with its real type: this used to
   emit int opcodes for x and crash the VM. *)
let test_letrec_float_rec_call () =
  Alcotest.(check (float 1e-9)) "float through rec call" 8.0
    (run_float "letrec pow = fn n -> if n < 0.5 then 1.0 else 2.0 * pow (n - 1.0) in pow 3.0")

(* End to end: Newton's method for sqrt(2) with a compiler-derived derivative. *)
let test_grad_newton () =
  Alcotest.(check (float 1e-9)) "sqrt 2" (sqrt 2.0)
    (run_float
      "let f = fn x -> x * x - 2.0 in \
       let df = grad (fn x -> x * x - 2.0) in \
       letrec newton = fn n -> \
         if n < 0.5 then 1.0 else \
         let x = newton (n - 1.0) in \
         x - f x / df x \
       in newton 6.0")

(* End to end: gradient descent on (x-3)^2 converges to 3. *)
let test_grad_descent () =
  Alcotest.(check (float 1e-4)) "argmin" 3.0
    (run_float
      "let df = grad (fn x -> (x - 3.0) * (x - 3.0)) in \
       letrec go = fn n -> \
         if n < 0.5 then 0.0 else \
         let x = go (n - 1.0) in \
         x - 0.2 * df x \
       in go 30.0")

let grad_raises s =
  try ignore (run s); false
  with Autodiff.Grad_error _ -> true

let test_grad_reject_call () =
  Alcotest.(check bool) "grad through a call is rejected" true
    (grad_raises "grad (fn x -> f x) 3.0")

let test_grad_reject_nonfn () =
  Alcotest.(check bool) "grad on a non-function is rejected" true
    (grad_raises "grad 3.0")

(* ===== Tensor numeric results end to end ===== *)

let test_run_matmul () =
  let t = run_tensor
    "let a = [[1.0, 2.0], [3.0, 4.0]] in \
     let b = [[5.0, 6.0], [7.0, 8.0]] in dot(a, b)" in
  Alcotest.(check (list int)) "shape" [2; 2] t.Vm.shape;
  Alcotest.(check (list (float 0.0))) "data"
    [19.0; 22.0; 43.0; 50.0] (Array.to_list t.Vm.data)

let test_run_dot_scalar () =
  let result = run "dot([1.0, 2.0, 3.0], [4.0, 5.0, 6.0])" in
  match result with
  | Vm.VFloat f -> Alcotest.(check (float 0.0)) "dot" 32.0 f
  | _ -> Alcotest.fail "Expected VFloat 32.0"

let test_run_transpose () =
  let t = run_tensor "transpose([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])" in
  Alcotest.(check (list int)) "shape" [3; 2] t.Vm.shape;
  Alcotest.(check (list (float 0.0))) "data"
    [1.0; 4.0; 2.0; 5.0; 3.0; 6.0] (Array.to_list t.Vm.data)

(* ===== Element-wise tensor arithmetic ===== *)

let check_tensor msg expected_shape expected_data t =
  Alcotest.(check (list int)) (msg ^ " shape") expected_shape t.Vm.shape;
  Alcotest.(check (list (float 1e-9))) (msg ^ " data")
    expected_data (Array.to_list t.Vm.data)

let test_elementwise_add () =
  check_tensor "add" [2] [4.0; 6.0] (run_tensor "[1.0, 2.0] + [3.0, 4.0]")

let test_elementwise_sub () =
  check_tensor "sub" [3] [4.0; 3.0; 2.0]
    (run_tensor "[5.0, 5.0, 5.0] - [1.0, 2.0, 3.0]")

let test_elementwise_mul () =
  check_tensor "hadamard" [2] [3.0; 8.0] (run_tensor "[1.0, 2.0] * [3.0, 4.0]")

let test_elementwise_div () =
  check_tensor "div" [2] [2.0; 3.0] (run_tensor "[8.0, 9.0] / [4.0, 3.0]")

let test_elementwise_matrix_add () =
  check_tensor "matrix add" [2; 2] [6.0; 8.0; 10.0; 12.0]
    (run_tensor "[[1.0, 2.0], [3.0, 4.0]] + [[5.0, 6.0], [7.0, 8.0]]")

let test_scalar_broadcast_mul () =
  check_tensor "s * t" [2] [2.0; 4.0] (run_tensor "2.0 * [1.0, 2.0]");
  check_tensor "t * s" [2] [3.0; 6.0] (run_tensor "[1.0, 2.0] * 3.0")

let test_scalar_broadcast_add () =
  check_tensor "s + t" [2] [2.0; 3.0] (run_tensor "1.0 + [1.0, 2.0]");
  check_tensor "t + s" [2] [2.0; 3.0] (run_tensor "[1.0, 2.0] + 1.0")

(* Subtraction and division are not commutative: both operand orders. *)
let test_scalar_broadcast_sub_directions () =
  check_tensor "t - s" [2] [2.0; 3.0] (run_tensor "[3.0, 4.0] - 1.0");
  check_tensor "s - t" [2] [7.0; 6.0] (run_tensor "10.0 - [3.0, 4.0]")

let test_scalar_broadcast_div_directions () =
  check_tensor "t / s" [2] [1.0; 2.0] (run_tensor "[2.0, 4.0] / 2.0");
  check_tensor "s / t" [2] [4.0; 2.0] (run_tensor "8.0 / [2.0, 4.0]")

(* Element-wise arithmetic flows through function parameters too. *)
let test_elementwise_through_fn () =
  check_tensor "fn" [2] [4.0; 6.0]
    (run_tensor
      "let scale = fn a: tensor<float>[2] -> 2.0 * a in scale [2.0, 3.0]")

let test_reject_elementwise_rank_mismatch () =
  Alcotest.(check bool) "matrix + vector is rejected" true
    (is_rejected "[[1.0, 2.0], [3.0, 4.0]] + [1.0, 2.0]")

let test_reject_int_scalar_broadcast () =
  Alcotest.(check bool) "int + tensor is rejected" true
    (is_rejected "1 + [1.0, 2.0]")

(* Serialization round-trip through .baglc for the new opcodes. *)
let test_serialize_tensor_arith () =
  let program = parse_program "([1.0, 2.0] + [3.0, 4.0]) * 2.0" in
  let typed = Typeinfer.infer_program program in
  let ir = Ir.lower_program typed in
  let optimized = Optimize.optimize_default ir in
  let bytecode = Codegen.generate optimized in
  let path = Filename.temp_file "bagl_test" ".baglc" in
  Serialize.write_file path bytecode;
  let loaded = Serialize.read_file path in
  Sys.remove path;
  match Vm.execute loaded with
  | Vm.VTensor t -> check_tensor "round-trip" [2] [8.0; 12.0] t
  | v -> Alcotest.failf "Expected tensor, got %s" (Vm.string_of_value v)

(* The compiler cannot emit mismatched element-wise shapes (checked
   statically), so feed the VM a hand-built chunk to prove the runtime
   defense holds on its own. *)
let test_runtime_shape_defense () =
  let code = [|
    Bytecode.PUSH_FLOAT 1.0; Bytecode.PUSH_FLOAT 2.0;
    Bytecode.TENSOR_CREATE [2];
    Bytecode.PUSH_FLOAT 1.0; Bytecode.PUSH_FLOAT 2.0; Bytecode.PUSH_FLOAT 3.0;
    Bytecode.TENSOR_CREATE [3];
    Bytecode.TADD;
    Bytecode.RETURN;
  |] in
  let chunk = { Bytecode.code; num_locals = 0; num_params = 0; num_captures = 0 } in
  let program = { Bytecode.chunks = [| chunk |]; entry = 0 } in
  match Vm.execute program with
  | exception Vm.Runtime_error _ -> ()
  | v -> Alcotest.failf "Expected runtime shape error, got %s" (Vm.string_of_value v)

(* ===== Negative tests: programs that must be rejected ===== *)

let test_reject_shape_mismatch () =
  Alcotest.(check bool) "dot with incompatible inner dims is rejected" true
    (is_rejected "dot([[1.0, 2.0], [3.0, 4.0]], [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])")

let test_reject_unbound_var () =
  Alcotest.(check bool) "unbound variable is rejected" true
    (is_rejected "x + 1")

let test_reject_non_bool_cond () =
  Alcotest.(check bool) "non-bool if condition is rejected" true
    (is_rejected "if 5 then 1 else 2")

let test_reject_int_tensor () =
  Alcotest.(check bool) "int tensor literal is rejected" true
    (is_rejected "let v = [1, 2, 3] in v")

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
  "if_toplevel_var", `Quick, test_run_if_toplevel_var;
  "if_toplevel_var_false", `Quick, test_run_if_toplevel_var_false;
  "if_arith_branch", `Quick, test_run_if_arith_branch;
  "if_call_branch", `Quick, test_run_if_call_branch;
  "if_nested", `Quick, test_run_if_nested;
  "letrec_factorial", `Quick, test_run_letrec_factorial;
  "letrec_sum", `Quick, test_run_letrec_sum;
]

let tensor_tests = [
  "matmul", `Quick, test_run_matmul;
  "dot_scalar", `Quick, test_run_dot_scalar;
  "transpose", `Quick, test_run_transpose;
]

let negative_tests = [
  "shape_mismatch", `Quick, test_reject_shape_mismatch;
  "unbound_var", `Quick, test_reject_unbound_var;
  "non_bool_cond", `Quick, test_reject_non_bool_cond;
  "int_tensor", `Quick, test_reject_int_tensor;
]

let lowering_tests = [
  "float_param", `Quick, test_run_float_param;
  "annotated_param", `Quick, test_run_annotated_param;
  "annotated_float_param", `Quick, test_run_annotated_float_param;
  "arrow_annotated_param", `Quick, test_run_arrow_annotated_param;
  "tensor_param", `Quick, test_run_tensor_param;
  "dim_var_mismatch", `Quick, test_reject_dim_var_mismatch;
  "dim_var_square", `Quick, test_accept_dim_var_square;
  "reject_tensor_arith_mismatch", `Quick, test_reject_tensor_arith_mismatch;
  "reject_tensor_eq", `Quick, test_reject_tensor_eq;
  "reject_fn_eq", `Quick, test_reject_fn_eq;
  "serialize_negative_int", `Quick, test_serialize_negative_int;
  "many_locals_unoptimized", `Quick, test_run_many_locals_unoptimized;
]

(* ===== Tensor-mode automatic differentiation ===== *)

(* d/dw dot(w, w) = 2w *)
let test_tgrad_dot_self () =
  check_tensor "2w" [3] [2.0; 4.0; 6.0]
    (run_tensor "grad (fn w: tensor<float>[3] -> dot(w, w)) [1.0, 2.0, 3.0]")

(* Least-squares gradient: dL/dw = 2 X^T (Xw - y). At w = 0 with
   X = [[1,2],[3,4]] and y = [1,2] this is exactly [-14, -20]. *)
let test_tgrad_matvec_loss () =
  check_tensor "2XT(Xw-y)" [2] [-14.0; -20.0]
    (run_tensor
      "let x = [[1.0, 2.0], [3.0, 4.0]] in \
       let y = [1.0, 2.0] in \
       grad (fn w: tensor<float>[2] -> \
         let e = dot(x, w) - y in dot(e, e)) [0.0, 0.0]")

(* Element-wise and scalar-broadcast pullbacks:
   d/dw dot(3.0 * w, w) = 6w. *)
let test_tgrad_scaled () =
  check_tensor "6w" [2] [6.0; 12.0]
    (run_tensor "grad (fn w: tensor<float>[2] -> dot(3.0 * w, w)) [1.0, 2.0]")

(* Numerical check: central finite differences elementwise against the
   compiler's gradient for a non-trivial loss. *)
let test_tgrad_numerical () =
  let loss_src w0 w1 =
    Printf.sprintf
      "let x = [[1.0, 2.0], [3.0, 4.0]] in \
       let y = [5.0, 6.0] in \
       let w = [%.17g, %.17g] in \
       let e = dot(x, w) - y in dot(e, e) + dot(w, w)" w0 w1
  in
  let eval w0 w1 = run_float (loss_src w0 w1) in
  let w0 = 0.3 and w1 = -0.7 and h = 1e-5 in
  let fd0 = (eval (w0 +. h) w1 -. eval (w0 -. h) w1) /. (2.0 *. h) in
  let fd1 = (eval w0 (w1 +. h) -. eval w0 (w1 -. h)) /. (2.0 *. h) in
  let g = run_tensor
    (Printf.sprintf
      "let x = [[1.0, 2.0], [3.0, 4.0]] in \
       let y = [5.0, 6.0] in \
       grad (fn w: tensor<float>[2] -> \
         let e = dot(x, w) - y in dot(e, e) + dot(w, w)) [%.17g, %.17g]" w0 w1)
  in
  Alcotest.(check (float 1e-4)) "d/dw0" fd0 g.Vm.data.(0);
  Alcotest.(check (float 1e-4)) "d/dw1" fd1 g.Vm.data.(1)

(* Training end to end: gradient descent on the feature-mapped XOR
   problem converges to the exact solution [1, 1, -2]. *)
let test_tgrad_xor_training () =
  let w = run_tensor
    "let x = [[0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [1.0, 0.0, 0.0], [1.0, 1.0, 1.0]] in \
     let y = [0.0, 1.0, 1.0, 0.0] in \
     let dloss = grad (fn w: tensor<float>[3] -> \
       let e = dot(x, w) - y in dot(e, e)) in \
     letrec train = fn n -> \
       if n < 0.5 then [0.0, 0.0, 0.0] else \
       let w = train (n - 1.0) in \
       w - 0.1 * dloss w \
     in train 200.0"
  in
  Alcotest.(check (float 1e-3)) "w0" 1.0 w.Vm.data.(0);
  Alcotest.(check (float 1e-3)) "w1" 1.0 w.Vm.data.(1);
  Alcotest.(check (float 1e-3)) "w2" (-2.0) w.Vm.data.(2)

let tgrad_raises s =
  try ignore (run s); false
  with Autodiff.Grad_error _ -> true

(* Tensor bodies without the annotation cannot be ranked; rejected. *)
let test_tgrad_reject_unannotated () =
  Alcotest.(check bool) "unannotated tensor grad is rejected" true
    (tgrad_raises "grad (fn w -> dot(w, w)) [1.0, 2.0]")

(* The matrix side of a matrix-vector dot needs an outer product. *)
let test_tgrad_reject_outer_product () =
  Alcotest.(check bool) "matrix-side pullback is rejected" true
    (tgrad_raises
      "let v = [1.0, 2.0] in \
       grad (fn m: tensor<float>[2,2] -> dot(dot(m, v), v)) [[1.0, 0.0], [0.0, 1.0]]")

(* Loss must be scalar. *)
let test_tgrad_reject_tensor_valued () =
  Alcotest.(check bool) "tensor-valued body is rejected" true
    (tgrad_raises "grad (fn w: tensor<float>[2] -> 2.0 * w) [1.0, 2.0]")

let tensor_grad_tests = [
  "dot_self", `Quick, test_tgrad_dot_self;
  "matvec_loss", `Quick, test_tgrad_matvec_loss;
  "scaled", `Quick, test_tgrad_scaled;
  "numerical_check", `Quick, test_tgrad_numerical;
  "xor_training", `Quick, test_tgrad_xor_training;
  "reject_unannotated", `Quick, test_tgrad_reject_unannotated;
  "reject_outer_product", `Quick, test_tgrad_reject_outer_product;
  "reject_tensor_valued", `Quick, test_tgrad_reject_tensor_valued;
]

let tensor_arith_tests = [
  "elementwise_add", `Quick, test_elementwise_add;
  "elementwise_sub", `Quick, test_elementwise_sub;
  "elementwise_mul", `Quick, test_elementwise_mul;
  "elementwise_div", `Quick, test_elementwise_div;
  "elementwise_matrix_add", `Quick, test_elementwise_matrix_add;
  "scalar_broadcast_mul", `Quick, test_scalar_broadcast_mul;
  "scalar_broadcast_add", `Quick, test_scalar_broadcast_add;
  "scalar_broadcast_sub_directions", `Quick, test_scalar_broadcast_sub_directions;
  "scalar_broadcast_div_directions", `Quick, test_scalar_broadcast_div_directions;
  "elementwise_through_fn", `Quick, test_elementwise_through_fn;
  "reject_rank_mismatch", `Quick, test_reject_elementwise_rank_mismatch;
  "reject_int_broadcast", `Quick, test_reject_int_scalar_broadcast;
  "serialize_round_trip", `Quick, test_serialize_tensor_arith;
  "runtime_shape_defense", `Quick, test_runtime_shape_defense;
]

let autodiff_tests = [
  "square", `Quick, test_grad_square;
  "cube", `Quick, test_grad_cube;
  "poly", `Quick, test_grad_poly;
  "reciprocal", `Quick, test_grad_reciprocal;
  "quotient", `Quick, test_grad_quotient;
  "neg", `Quick, test_grad_neg;
  "let_chain", `Quick, test_grad_let;
  "if_branch", `Quick, test_grad_if;
  "float_op_order", `Quick, test_float_op_order;
  "letrec_float_rec_call", `Quick, test_letrec_float_rec_call;
  "newton_sqrt2", `Quick, test_grad_newton;
  "gradient_descent", `Quick, test_grad_descent;
  "reject_call", `Quick, test_grad_reject_call;
  "reject_nonfn", `Quick, test_grad_reject_nonfn;
]

let () =
  Alcotest.run "Bagl" [
    "Lexer", lexer_tests;
    "Parser", parser_tests;
    "Types", type_tests;
    "Run", run_tests;
    "Tensor", tensor_tests;
    "Negative", negative_tests;
    "Lowering", lowering_tests;
    "TensorArith", tensor_arith_tests;
    "TensorGrad", tensor_grad_tests;
    "Autodiff", autodiff_tests;
  ]
