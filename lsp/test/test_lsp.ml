(** Protocol test for bagl-lsp: spawns the server, speaks LSP over pipes and
    checks diagnostics, hover and robustness. The server path is argv.(1). *)

let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n" name
  end

let member key = function
  | `Assoc fields -> (match List.assoc_opt key fields with Some v -> v | None -> `Null)
  | _ -> `Null

let send oc json =
  let s = Yojson.Safe.to_string json in
  Printf.fprintf oc "Content-Length: %d\r\n\r\n%s" (String.length s) s;
  flush oc

let send_raw oc s =
  Printf.fprintf oc "Content-Length: %d\r\n\r\n%s" (String.length s) s;
  flush oc

let receive ic =
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
          read_headers
            (int_of_string (String.trim (String.sub line (i + 1) (String.length line - i - 1))))
      | _ -> read_headers len
  in
  let len = read_headers 0 in
  Yojson.Safe.from_string (really_input_string ic len)

(* Skip notifications until the response with the given id arrives. *)
let rec receive_response ic id =
  let json = receive ic in
  if member "id" json = `Int id then json else receive_response ic id

(* Skip other traffic until a publishDiagnostics notification arrives. *)
let rec receive_diagnostics ic =
  let json = receive ic in
  if member "method" json = `String "textDocument/publishDiagnostics" then
    member "params" json
  else receive_diagnostics ic

let request oc counter meth params =
  incr counter;
  send oc
    (`Assoc
       [ ("jsonrpc", `String "2.0");
         ("id", `Int !counter);
         ("method", `String meth);
         ("params", params) ]);
  !counter

let notify oc meth params =
  send oc
    (`Assoc [ ("jsonrpc", `String "2.0"); ("method", `String meth); ("params", params) ])

let shape_error_program =
  "let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in\n\
   let b = [[1.0, 2.0], [3.0, 4.0]] in\n\
   dot(a, b)\n"

let valid_program = "let double = fn x -> x * 2 in\ndouble 5\n"

let uri = "file:///protocol_test.bagl"

let () =
  (* A stuck read means a protocol bug; do not hang CI. *)
  Sys.set_signal Sys.sigalrm
    (Sys.Signal_handle (fun _ -> prerr_endline "FAIL - timed out"; exit 1));
  ignore (Unix.alarm 60);

  let server = Sys.argv.(1) in
  let server_stdin_r, server_stdin_w = Unix.pipe ~cloexec:false () in
  let server_stdout_r, server_stdout_w = Unix.pipe ~cloexec:false () in
  let pid =
    Unix.create_process server [| server |] server_stdin_r server_stdout_w Unix.stderr
  in
  Unix.close server_stdin_r;
  Unix.close server_stdout_w;
  let oc = Unix.out_channel_of_descr server_stdin_w in
  let ic = Unix.in_channel_of_descr server_stdout_r in
  let counter = ref 0 in

  (* initialize *)
  let id = request oc counter "initialize" (`Assoc []) in
  let init = receive_response ic id in
  let capabilities = member "result" init |> member "capabilities" in
  check "initialize: full textDocumentSync" (member "textDocumentSync" capabilities = `Int 1);
  check "initialize: hoverProvider" (member "hoverProvider" capabilities = `Bool true);
  notify oc "initialized" (`Assoc []);

  (* didOpen with a shape error *)
  notify oc "textDocument/didOpen"
    (`Assoc
       [ ("textDocument",
          `Assoc
            [ ("uri", `String uri);
              ("languageId", `String "bagl");
              ("version", `Int 1);
              ("text", `String shape_error_program) ]) ]);
  let params = receive_diagnostics ic in
  Printf.printf "received: %s\n" (Yojson.Safe.to_string params);
  check "didOpen: diagnostics for the right uri" (member "uri" params = `String uri);
  (match member "diagnostics" params with
   | `List [ diag ] ->
       let start = member "range" diag |> member "start" in
       check "didOpen: error on the dot(a, b) line" (member "line" start = `Int 2);
       check "didOpen: dimension mismatch message"
         (member "message" diag = `String "Dimension mismatch: 3 vs 2");
       check "didOpen: severity error" (member "severity" diag = `Int 1)
   | _ -> check "didOpen: exactly one diagnostic" false);

  (* didChange to a valid program clears diagnostics *)
  notify oc "textDocument/didChange"
    (`Assoc
       [ ("textDocument", `Assoc [ ("uri", `String uri); ("version", `Int 2) ]);
         ("contentChanges", `List [ `Assoc [ ("text", `String valid_program) ] ]) ]);
  let params = receive_diagnostics ic in
  check "didChange: diagnostics cleared" (member "diagnostics" params = `List []);

  (* hover on the double binding *)
  let id =
    request oc counter "textDocument/hover"
      (`Assoc
         [ ("textDocument", `Assoc [ ("uri", `String uri) ]);
           ("position", `Assoc [ ("line", `Int 0); ("character", `Int 6) ]) ])
  in
  let hover = receive_response ic id in
  let value = member "result" hover |> member "contents" |> member "value" in
  check "hover: inferred type of double"
    (value = `String "```bagl\ndouble : int -> int\n```");

  (* malformed JSON and unknown methods must not kill the server *)
  send_raw oc "{this is not json";
  notify oc "some/unknownNotification" (`Assoc []);
  let id = request oc counter "some/unknownRequest" (`Assoc []) in
  let resp = receive_response ic id in
  check "unknown request: method-not-found error"
    (member "error" resp |> member "code" = `Int (-32601));

  (* shutdown and exit *)
  let id = request oc counter "shutdown" `Null in
  ignore (receive_response ic id);
  notify oc "exit" `Null;
  let _, status = Unix.waitpid [] pid in
  check "exit: clean shutdown" (status = Unix.WEXITED 0);

  if !failures > 0 then exit 1;
  print_endline "all protocol checks passed"
