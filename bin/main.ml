(** Bagl compiler CLI and REPL *)

open Bagl

(** Command-line options *)
type options = {
  mutable input_file: string option;
  mutable output_file: string option;
  mutable mode: [ `Compile | `Run | `Repl ];
  mutable dump_ast: bool;
  mutable dump_types: bool;
  mutable dump_ir: bool;
  mutable dump_bytecode: bool;
  mutable no_optimize: bool;
}

let default_options () = {
  input_file = None;
  output_file = None;
  mode = `Repl;
  dump_ast = false;
  dump_types = false;
  dump_ir = false;
  dump_bytecode = false;
  no_optimize = false;
}

(** Read entire file contents *)
let read_file filename =
  let ic = open_in filename in
  let n = in_channel_length ic in
  let s = really_input_string ic n in
  close_in ic;
  s

(** Compile source code to bytecode *)
let compile ~filename source ~optimize =
  (* Lex *)
  let lexer = Lexer.create ~filename source in

  (* Parse *)
  let parser = Parser.create lexer in
  let ast = Parser.parse_program parser in

  (* Expand grad(...) into ordinary derivative functions before inference *)
  let ast = Autodiff.expand_program ast in

  (* Type check *)
  let typed = Typeinfer.infer_program ast in

  (* Lower to IR *)
  let ir = Ir.lower_program typed in

  (* Optimize *)
  let ir = if optimize then Optimize.optimize_default ir else ir in

  (* Generate bytecode *)
  let bytecode = Codegen.generate ir in

  (ast, typed, ir, bytecode)

(** Compile a source file *)
let compile_file options filename =
  let source = read_file filename in

  try
    let (ast, typed, ir, bytecode) = compile ~filename source
      ~optimize:(not options.no_optimize) in

    if options.dump_ast then begin
      print_endline "=== AST ===";
      print_endline (Ast.string_of_program ast);
      print_newline ()
    end;

    if options.dump_types then begin
      print_endline "=== Typed AST ===";
      List.iter (fun (decl, ty) ->
        Printf.printf "%s : %s\n" (Ast.string_of_decl decl) (Types.string_of_ty ty)
      ) typed;
      print_newline ()
    end;

    if options.dump_ir then begin
      print_endline "=== IR ===";
      print_endline (Ir.string_of_program ir);
      print_newline ()
    end;

    if options.dump_bytecode then begin
      print_endline "=== Bytecode ===";
      print_endline (Bytecode.string_of_program bytecode);
      print_newline ()
    end;

    bytecode
  with
  | Lexer.Lexer_error (msg, span) ->
      let source = Lexer.get_source (Lexer.create ~filename source) in
      let diag = Errors.error ~span ~message:msg ~source () in
      Errors.fatal diag
  | Parser.Parse_error (msg, span) ->
      let diag = Errors.error ~span ~message:msg ~source () in
      Errors.fatal diag
  | Typeinfer.Type_error (msg, span) ->
      let diag = Errors.error ~span ~message:msg ~source () in
      Errors.fatal diag
  | Autodiff.Grad_error (msg, span) ->
      let diag = Errors.error ~span ~message:msg ~source () in
      Errors.fatal diag

(** Run a source file *)
let run_file options filename =
  let bytecode = compile_file options filename in
  let result = Vm.execute bytecode in
  print_endline (Vm.string_of_value result)

(** Compile to .baglc file *)
let compile_to_file options filename =
  let bytecode = compile_file options filename in
  let output = match options.output_file with
    | Some f -> f
    | None ->
        if Filename.check_suffix filename ".bagl" then
          Filename.chop_suffix filename ".bagl" ^ ".baglc"
        else
          filename ^ ".baglc"
  in
  Serialize.write_file output bytecode;
  Printf.printf "Compiled to %s\n" output

(** Run a .baglc file *)
let run_bytecode_file filename =
  let bytecode = Serialize.read_file filename in
  let result = Vm.execute bytecode in
  print_endline (Vm.string_of_value result)

(** REPL state *)
type repl_state = {
  mutable env: Typeinfer.env;
}

(** Process a REPL command *)
let process_repl_command state line =
  if String.length line > 5 && String.sub line 0 5 = ":type" then begin
    (* Type query *)
    let expr_str = String.trim (String.sub line 5 (String.length line - 5)) in
    try
      let lexer = Lexer.create ~filename:"<repl>" expr_str in
      let parser = Parser.create lexer in
      let expr = Parser.parse_single_expr parser in
      let ty = Typeinfer.infer_expr state.env expr in
      Printf.printf ": %s\n" (Types.string_of_ty ty);
      true
    with
    | Lexer.Lexer_error (msg, span) ->
        let diag = Errors.error ~span ~message:msg () in
        Errors.report diag;
        true
    | Parser.Parse_error (msg, span) ->
        let diag = Errors.error ~span ~message:msg () in
        Errors.report diag;
        true
    | Typeinfer.Type_error (msg, span) ->
        let diag = Errors.error ~span ~message:msg () in
        Errors.report diag;
        true
  end else
    false

(** REPL loop *)
let repl options =
  let state = { env = Typeinfer.initial_env () } in

  print_endline "Bagl REPL v0.1";
  print_endline "Type :quit to exit, :type <expr> to show type";
  print_newline ();

  let rec loop () =
    print_string "> ";
    flush stdout;
    match input_line stdin with
    | exception End_of_file -> print_newline ()
    | ":quit" | ":q" -> ()
    | ":help" | ":h" ->
        print_endline "Commands:";
        print_endline "  :quit, :q     Exit the REPL";
        print_endline "  :type <expr>  Show the type of an expression";
        print_endline "  :help, :h     Show this help";
        loop ()
    | line when String.length line = 0 ->
        loop ()
    | line when String.get line 0 = ':' && process_repl_command state line ->
        loop ()
    | line ->
        begin try
          let (ast, typed, ir, bytecode) = compile ~filename:"<repl>" line
            ~optimize:(not options.no_optimize) in

          if options.dump_ast then begin
            print_endline "=== AST ===";
            print_endline (Ast.string_of_program ast)
          end;

          if options.dump_types then begin
            print_endline "=== Typed ===";
            List.iter (fun (decl, ty) ->
              Printf.printf "%s : %s\n" (Ast.string_of_decl decl)
                (Types.string_of_ty ty)
            ) typed
          end;

          if options.dump_ir then begin
            print_endline "=== IR ===";
            print_endline (Ir.string_of_program ir)
          end;

          if options.dump_bytecode then begin
            print_endline "=== Bytecode ===";
            print_endline (Bytecode.string_of_program bytecode)
          end;

          let result = Vm.execute bytecode in
          let ty = match typed with
            | [] -> Types.TUnit
            | (_, t) :: _ -> t
          in
          Printf.printf "= %s : %s\n" (Vm.string_of_value result)
            (Types.string_of_ty ty)
        with
        | Lexer.Lexer_error (msg, span) ->
            let diag = Errors.error ~span ~message:msg ~source:line () in
            Errors.report diag
        | Parser.Parse_error (msg, span) ->
            let diag = Errors.error ~span ~message:msg ~source:line () in
            Errors.report diag
        | Typeinfer.Type_error (msg, span) ->
            let diag = Errors.error ~span ~message:msg ~source:line () in
            Errors.report diag
        | Vm.Runtime_error msg ->
            Printf.printf "Runtime error: %s\n" msg
        end;
        loop ()
  in
  loop ()

(** Parse command-line arguments *)
let parse_args () =
  let options = default_options () in
  let specs = [
    ("-c", Arg.Unit (fun () -> options.mode <- `Compile),
     "Compile to .baglc file");
    ("-r", Arg.Unit (fun () -> options.mode <- `Run),
     "Compile and run");
    ("-o", Arg.String (fun s -> options.output_file <- Some s),
     "Output file (for -c)");
    ("--dump-ast", Arg.Unit (fun () -> options.dump_ast <- true),
     "Dump the AST");
    ("--dump-types", Arg.Unit (fun () -> options.dump_types <- true),
     "Dump typed AST");
    ("--dump-ir", Arg.Unit (fun () -> options.dump_ir <- true),
     "Dump the IR");
    ("--dump-bytecode", Arg.Unit (fun () -> options.dump_bytecode <- true),
     "Dump the bytecode");
    ("-O0", Arg.Unit (fun () -> options.no_optimize <- true),
     "Disable optimizations");
  ] in
  let anon_fun s = options.input_file <- Some s in
  let usage = "baglc [options] [file.bagl]" in
  Arg.parse specs anon_fun usage;
  options

(** Main entry point *)
let () =
  let options = parse_args () in
  match options.input_file with
  | None ->
      (* No input file - start REPL *)
      repl options
  | Some filename ->
      if Serialize.is_bytecode_file filename then
        (* Run bytecode file directly *)
        run_bytecode_file filename
      else begin
        match options.mode with
        | `Compile -> compile_to_file options filename
        | `Run -> run_file options filename
        | `Repl -> run_file options filename
      end
