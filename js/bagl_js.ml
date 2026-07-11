(** JavaScript entry point for the browser playground.

    Compiles and runs a Bagl program entirely in the browser via
    js_of_ocaml. Exposed to JavaScript as [bagl.run(source)], returning a
    plain object:

      { ok: true,  value: string, type: string }
      { ok: false, error: string, line, col, endLine, endCol }   (compile)
      { ok: false, error: string, runtime: true }                (runtime)

    Lines and columns are 1-indexed, matching the compiler's diagnostics. *)

open Js_of_ocaml
open Bagl

let obj = Js.Unsafe.obj

let js_string s = Js.Unsafe.inject (Js.string s)
let js_bool b = Js.Unsafe.inject (Js.bool b)
let js_int n = Js.Unsafe.inject n

let error_result msg (span : Location.span) =
  obj [|
    "ok", js_bool false;
    "error", js_string msg;
    "line", js_int span.Location.start_pos.Location.pos_line;
    "col", js_int span.Location.start_pos.Location.pos_col;
    "endLine", js_int span.Location.end_pos.Location.pos_line;
    "endCol", js_int span.Location.end_pos.Location.pos_col;
  |]

let runtime_error_result msg =
  obj [|
    "ok", js_bool false;
    "error", js_string msg;
    "runtime", js_bool true;
  |]

let run source =
  let source = Js.to_string source in
  try
    let lexer = Lexer.create ~filename:"<playground>" source in
    let parser = Parser.create lexer in
    let ast = Parser.parse_program parser in
    let ast = Autodiff.expand_program ast in
    let typed = Typeinfer.infer_program ast in
    let ir = Ir.lower_program typed in
    let ir = Optimize.optimize_default ir in
    let bytecode = Codegen.generate ir in
    let result = Vm.execute bytecode in
    let ty = match List.rev typed with
      | (_, t) :: _ -> Types.string_of_ty t
      | [] -> "unit"
    in
    obj [|
      "ok", js_bool true;
      "value", js_string (Vm.string_of_value result);
      "type", js_string ty;
    |]
  with
  | Lexer.Lexer_error (msg, span) -> error_result msg span
  | Parser.Parse_error (msg, span) -> error_result msg span
  | Typeinfer.Type_error (msg, span) -> error_result msg span
  | Autodiff.Grad_error (msg, span) -> error_result msg span
  | Vm.Runtime_error msg -> runtime_error_result msg
  | e -> runtime_error_result (Printexc.to_string e)

let () =
  Js.export "bagl" (obj [| "run", Js.Unsafe.inject (Js.wrap_callback run) |])
