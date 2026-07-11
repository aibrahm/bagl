(** Bagl language server: LSP over stdio with Content-Length framed JSON-RPC *)

open Bagl

(* JSON helpers *)

let member key = function
  | `Assoc fields -> (match List.assoc_opt key fields with Some v -> v | None -> `Null)
  | _ -> `Null

let to_string_opt = function `String s -> Some s | _ -> None

let to_int_default d = function `Int n -> n | _ -> d

(* Wire protocol *)

let read_message ic =
  let strip_cr line =
    let n = String.length line in
    if n > 0 && line.[n - 1] = '\r' then String.sub line 0 (n - 1) else line
  in
  let rec read_headers len =
    let line = strip_cr (input_line ic) in
    if line = "" then len
    else
      match String.index_opt line ':' with
      | Some i when String.lowercase_ascii (String.sub line 0 i) = "content-length" ->
          let v = String.trim (String.sub line (i + 1) (String.length line - i - 1)) in
          read_headers (match int_of_string_opt v with Some n -> n | None -> len)
      | _ -> read_headers len
  in
  match read_headers 0 with
  | exception End_of_file -> None
  | 0 -> Some ""
  | len -> (match really_input_string ic len with
            | s -> Some s
            | exception End_of_file -> None)

let write_message json =
  let s = Yojson.Safe.to_string json in
  Printf.printf "Content-Length: %d\r\n\r\n%s" (String.length s) s;
  flush stdout

let respond id result =
  write_message (`Assoc [ ("jsonrpc", `String "2.0"); ("id", id); ("result", result) ])

let respond_error id code message =
  write_message
    (`Assoc
       [ ("jsonrpc", `String "2.0");
         ("id", id);
         ("error", `Assoc [ ("code", `Int code); ("message", `String message) ]) ])

let notify meth params =
  write_message
    (`Assoc [ ("jsonrpc", `String "2.0"); ("method", `String meth); ("params", params) ])

(* Span conversion: Bagl positions are 1-based, LSP is 0-based. The end
   position of a span already points one past the last character, which
   matches LSP's exclusive range end. *)

let json_of_position (p : Location.position) =
  `Assoc
    [ ("line", `Int (max 0 (p.Location.pos_line - 1)));
      ("character", `Int (max 0 (p.Location.pos_col - 1))) ]

let json_of_span (s : Location.span) =
  `Assoc
    [ ("start", json_of_position s.Location.start_pos);
      ("end", json_of_position s.Location.end_pos) ]

(* Compilation front end. The pipeline stops at type inference; IR and
   codegen are not needed for diagnostics. *)

type analysis =
  | Typed of (Ast.decl * Types.ty) list
  | Failed of string * Location.span

(* The parser produces one DExpr per top-level let chain, so a whole program
   is usually a single decl. For hover we split the chain into DLet decls so
   type inference reports a type per binding. Each synthetic decl keeps a
   span from the [let] keyword to the end of the bound value. Letrec and
   other expressions stay whole. *)
let flatten_decl (decl : Ast.decl) =
  let open Location in
  let rec split (e : Ast.expr) acc =
    match e.value with
    | Ast.ELet { name; annot; value; body } ->
        let loc = { e.loc with end_pos = value.loc.end_pos } in
        split body ({ value = Ast.DLet { name; annot; value }; loc } :: acc)
    | _ -> List.rev ({ value = Ast.DExpr e; loc = e.loc } :: acc)
  in
  match decl.value with
  | Ast.DExpr e -> split e []
  | Ast.DLet _ -> [ decl ]

let flatten_program program = List.concat_map flatten_decl program

let analyze ?(flatten = false) ~filename source =
  try
    let lexer = Lexer.create ~filename source in
    let parser = Parser.create lexer in
    let ast = Parser.parse_program parser in
    let ast = if flatten then flatten_program ast else ast in
    let ast = Autodiff.expand_program ast in
    Typed (Typeinfer.infer_program ast)
  with
  | Lexer.Lexer_error (msg, span)
  | Parser.Parse_error (msg, span)
  | Typeinfer.Type_error (msg, span)
  | Autodiff.Grad_error (msg, span) -> Failed (msg, span)
  | exn -> Failed ("internal error: " ^ Printexc.to_string exn, Location.dummy_span)

(* Document state and diagnostics *)

let documents : (string, string) Hashtbl.t = Hashtbl.create 16

let publish_diagnostics uri diagnostics =
  notify "textDocument/publishDiagnostics"
    (`Assoc [ ("uri", `String uri); ("diagnostics", `List diagnostics) ])

let check_document uri source =
  let diagnostics =
    match analyze ~filename:uri source with
    | Typed _ -> []
    | Failed (msg, span) ->
        [ `Assoc
            [ ("range", json_of_span span);
              ("severity", `Int 1);
              ("source", `String "bagl");
              ("message", `String msg) ] ]
  in
  publish_diagnostics uri diagnostics

(* Hover *)

let span_contains (s : Location.span) ~line ~col =
  let open Location in
  let after_start =
    s.start_pos.pos_line < line
    || (s.start_pos.pos_line = line && s.start_pos.pos_col <= col)
  in
  let before_end =
    line < s.end_pos.pos_line || (line = s.end_pos.pos_line && col < s.end_pos.pos_col)
  in
  after_start && before_end

let hover_result uri ~line ~col =
  match Hashtbl.find_opt documents uri with
  | None -> `Null
  | Some source -> (
      match analyze ~flatten:true ~filename:uri source with
      | Failed _ -> `Null
      | Typed typed -> (
          let matching =
            List.filter
              (fun ((d : Ast.decl), _) -> span_contains d.Location.loc ~line ~col)
              typed
          in
          (* Later decls start later in the file, so the last match is the
             most specific one. *)
          match List.rev matching with
          | [] -> `Null
          | (d, ty) :: _ ->
              let label =
                match d.Location.value with
                | Ast.DLet { name; _ } -> name ^ " : " ^ Types.string_of_ty ty
                | Ast.DExpr _ -> "_ : " ^ Types.string_of_ty ty
              in
              `Assoc
                [ ("contents",
                   `Assoc
                     [ ("kind", `String "markdown");
                       ("value", `String ("```bagl\n" ^ label ^ "\n```")) ]);
                  ("range", json_of_span d.Location.loc) ]))

(* Dispatch *)

let shutdown_requested = ref false

let handle_request id meth params =
  match meth with
  | "initialize" ->
      respond id
        (`Assoc
           [ ("capabilities",
              `Assoc [ ("textDocumentSync", `Int 1); ("hoverProvider", `Bool true) ]);
             ("serverInfo",
              `Assoc [ ("name", `String "bagl-lsp"); ("version", `String "0.1") ]) ])
  | "shutdown" ->
      shutdown_requested := true;
      respond id `Null
  | "textDocument/hover" ->
      let uri = member "textDocument" params |> member "uri" |> to_string_opt in
      let pos = member "position" params in
      let line = to_int_default 0 (member "line" pos) + 1 in
      let col = to_int_default 0 (member "character" pos) + 1 in
      (match uri with
       | Some uri -> respond id (hover_result uri ~line ~col)
       | None -> respond id `Null)
  | _ -> respond_error id (-32601) ("method not found: " ^ meth)

let handle_notification meth params =
  match meth with
  | "initialized" -> ()
  | "exit" -> exit (if !shutdown_requested then 0 else 1)
  | "textDocument/didOpen" -> (
      let doc = member "textDocument" params in
      match to_string_opt (member "uri" doc), to_string_opt (member "text" doc) with
      | Some uri, Some text ->
          Hashtbl.replace documents uri text;
          check_document uri text
      | _ -> ())
  | "textDocument/didChange" -> (
      let uri = member "textDocument" params |> member "uri" |> to_string_opt in
      let text =
        match member "contentChanges" params with
        | `List changes ->
            (* Full sync: the last full-text change wins. *)
            List.fold_left
              (fun acc change ->
                match to_string_opt (member "text" change) with
                | Some t -> Some t
                | None -> acc)
              None changes
        | _ -> None
      in
      match uri, text with
      | Some uri, Some text ->
          Hashtbl.replace documents uri text;
          check_document uri text
      | _ -> ())
  | "textDocument/didClose" -> (
      match member "textDocument" params |> member "uri" |> to_string_opt with
      | Some uri ->
          Hashtbl.remove documents uri;
          publish_diagnostics uri []
      | None -> ())
  | _ -> ()

let handle_message json =
  let id = member "id" json in
  match to_string_opt (member "method" json), id with
  | Some meth, `Null -> handle_notification meth (member "params" json)
  | Some meth, id -> (
      try handle_request id meth (member "params" json)
      with exn -> respond_error id (-32603) (Printexc.to_string exn))
  | None, _ -> ()  (* a response to a server-initiated request; none are sent *)

let () =
  set_binary_mode_in stdin true;
  set_binary_mode_out stdout true;
  let rec loop () =
    match read_message stdin with
    | None -> ()
    | Some raw ->
        (match Yojson.Safe.from_string raw with
         | exception _ -> ()
         | json -> (try handle_message json with _ -> ()));
        loop ()
  in
  loop ()
