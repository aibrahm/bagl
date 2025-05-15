(** Rich error formatting with source code context *)

open Location

(** Error severity levels *)
type severity =
  | Error
  | Warning
  | Note

(** A diagnostic message with location and context *)
type diagnostic = {
  severity: severity;
  message: string;
  span: span;
  notes: string list;
  source: string option;  (** The source code, if available *)
}

(** ANSI color codes for terminal output *)
module Colors = struct
  let reset = "\027[0m"
  let bold = "\027[1m"
  let red = "\027[31m"
  let yellow = "\027[33m"
  let blue = "\027[34m"
  let cyan = "\027[36m"

  let enabled = ref true

  let apply color s =
    if !enabled then color ^ s ^ reset else s

  let bold_red s = apply (bold ^ red) s
  let bold_yellow s = apply (bold ^ yellow) s
  let bold_blue s = apply (bold ^ blue) s
  let cyan_text s = apply cyan s
  let bold_text s = apply bold s
end

(** Get lines from source code *)
let get_source_lines source start_line end_line =
  let lines = String.split_on_char '\n' source in
  let rec take_range acc n = function
    | [] -> List.rev acc
    | x :: xs ->
        if n > end_line then List.rev acc
        else if n >= start_line then take_range ((n, x) :: acc) (n + 1) xs
        else take_range acc (n + 1) xs
  in
  take_range [] 1 lines

(** Create a string of n spaces *)
let spaces n = String.make n ' '

(** Create underline characters *)
let underline char len = String.make len char

(** Calculate the width needed for line numbers *)
let line_num_width max_line =
  String.length (string_of_int max_line)

(** Format a diagnostic message with source context (Rust/Elm style) *)
let format_diagnostic diag =
  let buf = Buffer.create 256 in
  let add = Buffer.add_string buf in
  let addln s = add s; add "\n" in

  (* Severity label *)
  let severity_str = match diag.severity with
    | Error -> Colors.bold_red "error"
    | Warning -> Colors.bold_yellow "warning"
    | Note -> Colors.bold_blue "note"
  in

  (* Error header: "error: message" *)
  addln (severity_str ^ Colors.bold_text (": " ^ diag.message));

  (* Location: " --> file:line:col" *)
  let loc_str = Printf.sprintf "  %s %s:%d:%d"
    (Colors.bold_blue "-->")
    diag.span.filename
    diag.span.start_pos.pos_line
    diag.span.start_pos.pos_col
  in
  addln loc_str;

  (* Source context if available *)
  begin match diag.source with
  | Some source ->
      let start_line = diag.span.start_pos.pos_line in
      let end_line = diag.span.end_pos.pos_line in
      let context_start = max 1 (start_line - 1) in
      let context_end = end_line + 1 in
      let lines = get_source_lines source context_start context_end in
      let width = line_num_width context_end in

      (* Empty line with bar *)
      addln (Colors.bold_blue (spaces width ^ " |"));

      (* Source lines with highlighting *)
      List.iter (fun (line_num, line_content) ->
        (* Line number and content *)
        let num_str = Printf.sprintf "%*d" width line_num in
        add (Colors.bold_blue (num_str ^ " | "));
        addln line_content;

        (* Underline for error span *)
        if line_num >= start_line && line_num <= end_line then begin
          let underline_start =
            if line_num = start_line
            then diag.span.start_pos.pos_col - 1
            else 0
          in
          let underline_end =
            if line_num = end_line
            then diag.span.end_pos.pos_col - 1
            else String.length line_content
          in
          let underline_len = max 1 (underline_end - underline_start) in
          let prefix = spaces underline_start in
          let marker = Colors.bold_red (underline '^' underline_len) in
          add (Colors.bold_blue (spaces width ^ " | "));
          addln (prefix ^ marker)
        end
      ) lines;

      (* Empty line with bar *)
      addln (Colors.bold_blue (spaces width ^ " |"))
  | None -> ()
  end;

  (* Additional notes *)
  List.iter (fun note ->
    addln (Colors.bold_blue "  = " ^ Colors.bold_text "note: " ^ note)
  ) diag.notes;

  Buffer.contents buf

(** Create an error diagnostic *)
let error ~span ~message ?(notes=[]) ?source () =
  { severity = Error; message; span; notes; source }

(** Create a warning diagnostic *)
let warning ~span ~message ?(notes=[]) ?source () =
  { severity = Warning; message; span; notes; source }

(** Create a note diagnostic *)
let note ~span ~message ?(notes=[]) ?source () =
  { severity = Note; message; span; notes; source }

(** Exception for compiler errors *)
exception Compiler_error of diagnostic

(** Raise a compiler error *)
let raise_error ~span ~message ?(notes=[]) ?source () =
  raise (Compiler_error (error ~span ~message ~notes ?source ()))

(** Report an error and exit *)
let fatal diag =
  prerr_endline (format_diagnostic diag);
  exit 1

(** Report an error without exiting *)
let report diag =
  prerr_endline (format_diagnostic diag)

(** Disable colors for non-terminal output *)
let disable_colors () = Colors.enabled := false

(** Enable colors *)
let enable_colors () = Colors.enabled := true
