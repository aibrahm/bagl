(** Hand-written lexer for Bagl *)

open Location
open Token

(** Lexer state *)
type t = {
  source: string;
  filename: string;
  mutable pos: int;       (** Current byte offset *)
  mutable line: int;      (** Current line (1-indexed) *)
  mutable col: int;       (** Current column (1-indexed) *)
  mutable line_start: int; (** Byte offset of current line start *)
}

(** Lexer errors *)
exception Lexer_error of string * span

(** Create a new lexer *)
let create ~filename source =
  { source; filename; pos = 0; line = 1; col = 1; line_start = 0 }

(** Get the source code *)
let get_source lexer = lexer.source

(** Check if we're at end of input *)
let is_at_end lexer = lexer.pos >= String.length lexer.source

(** Get the current character without advancing *)
let peek lexer =
  if is_at_end lexer then '\000'
  else lexer.source.[lexer.pos]

(** Get the next character without advancing *)
let peek_next lexer =
  if lexer.pos + 1 >= String.length lexer.source then '\000'
  else lexer.source.[lexer.pos + 1]

(** Advance and return the current character *)
let advance lexer =
  let c = peek lexer in
  lexer.pos <- lexer.pos + 1;
  if c = '\n' then begin
    lexer.line <- lexer.line + 1;
    lexer.col <- 1;
    lexer.line_start <- lexer.pos
  end else
    lexer.col <- lexer.col + 1;
  c

(** Get current position *)
let current_position lexer =
  make_pos ~line:lexer.line ~col:lexer.col ~offset:lexer.pos

(** Make a span from a start position to current position *)
let make_span_from lexer start_pos =
  make_span ~start_pos ~end_pos:(current_position lexer) ~filename:lexer.filename

(** Raise a lexer error *)
let error lexer start_pos msg =
  raise (Lexer_error (msg, make_span_from lexer start_pos))

(** Check if character is a digit *)
let is_digit c = c >= '0' && c <= '9'

(** Check if character is alphabetic *)
let is_alpha c = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c = '_'

(** Check if character is alphanumeric *)
let is_alphanum c = is_alpha c || is_digit c

(** Check if character is whitespace *)
let is_whitespace c = c = ' ' || c = '\t' || c = '\r' || c = '\n'

(** Skip whitespace and comments *)
let rec skip_whitespace_and_comments lexer =
  while not (is_at_end lexer) && is_whitespace (peek lexer) do
    ignore (advance lexer)
  done;
  (* Check for line comment *)
  if peek lexer = '/' && peek_next lexer = '/' then begin
    (* Skip until end of line *)
    while not (is_at_end lexer) && peek lexer <> '\n' do
      ignore (advance lexer)
    done;
    skip_whitespace_and_comments lexer
  end
  (* Check for block comment *)
  else if peek lexer = '/' && peek_next lexer = '*' then begin
    let start_pos = current_position lexer in
    ignore (advance lexer); (* skip / *)
    ignore (advance lexer); (* skip * *)
    let rec skip_block () =
      if is_at_end lexer then
        error lexer start_pos "Unterminated block comment"
      else if peek lexer = '*' && peek_next lexer = '/' then begin
        ignore (advance lexer);
        ignore (advance lexer)
      end else begin
        ignore (advance lexer);
        skip_block ()
      end
    in
    skip_block ();
    skip_whitespace_and_comments lexer
  end

(** Read a number (integer or float) *)
let read_number lexer =
  let start_pos = current_position lexer in
  let buf = Buffer.create 16 in

  (* Read integer part *)
  while not (is_at_end lexer) && is_digit (peek lexer) do
    Buffer.add_char buf (advance lexer)
  done;

  (* Check for decimal point *)
  let is_float =
    if peek lexer = '.' && is_digit (peek_next lexer) then begin
      Buffer.add_char buf (advance lexer); (* consume . *)
      while not (is_at_end lexer) && is_digit (peek lexer) do
        Buffer.add_char buf (advance lexer)
      done;
      true
    end else
      false
  in

  (* Check for exponent *)
  let is_float =
    if peek lexer = 'e' || peek lexer = 'E' then begin
      Buffer.add_char buf (advance lexer);
      if peek lexer = '+' || peek lexer = '-' then
        Buffer.add_char buf (advance lexer);
      if not (is_digit (peek lexer)) then
        error lexer start_pos "Expected digit in exponent";
      while not (is_at_end lexer) && is_digit (peek lexer) do
        Buffer.add_char buf (advance lexer)
      done;
      true
    end else
      is_float
  in

  let str = Buffer.contents buf in
  let span = make_span_from lexer start_pos in
  if is_float then
    { value = FLOAT_LIT (float_of_string str); loc = span }
  else
    match int_of_string_opt str with
    | Some n -> { value = INT_LIT n; loc = span }
    | None -> error lexer start_pos "Integer literal out of range"

(** Read an identifier or keyword *)
let read_identifier lexer =
  let start_pos = current_position lexer in
  let buf = Buffer.create 16 in

  while not (is_at_end lexer) && is_alphanum (peek lexer) do
    Buffer.add_char buf (advance lexer)
  done;

  let str = Buffer.contents buf in
  let kind = Token.lookup_keyword str in
  let span = make_span_from lexer start_pos in
  { value = kind; loc = span }

(** Read a string literal *)
let read_string lexer =
  let start_pos = current_position lexer in
  ignore (advance lexer); (* consume opening quote *)
  let buf = Buffer.create 64 in

  while not (is_at_end lexer) && peek lexer <> '"' do
    let c = advance lexer in
    if c = '\\' then begin
      if is_at_end lexer then
        error lexer start_pos "Unterminated string";
      let escaped = advance lexer in
      let actual = match escaped with
        | 'n' -> '\n'
        | 't' -> '\t'
        | 'r' -> '\r'
        | '\\' -> '\\'
        | '"' -> '"'
        | _ -> error lexer start_pos (Printf.sprintf "Unknown escape sequence: \\%c" escaped)
      in
      Buffer.add_char buf actual
    end else if c = '\n' then
      error lexer start_pos "Unterminated string (newline in string)"
    else
      Buffer.add_char buf c
  done;

  if is_at_end lexer then
    error lexer start_pos "Unterminated string";

  ignore (advance lexer); (* consume closing quote *)

  let span = make_span_from lexer start_pos in
  { value = STRING_LIT (Buffer.contents buf); loc = span }

(** Match a specific character and advance if it matches *)
let match_char lexer c =
  if not (is_at_end lexer) && peek lexer = c then begin
    ignore (advance lexer);
    true
  end else
    false

(** Read the next token *)
let next_token lexer =
  skip_whitespace_and_comments lexer;

  if is_at_end lexer then
    { value = EOF; loc = make_span_from lexer (current_position lexer) }
  else begin
    let start_pos = current_position lexer in
    let c = advance lexer in

    let kind = match c with
      (* Single character tokens *)
      | '(' -> LPAREN
      | ')' -> RPAREN
      | '[' -> LBRACKET
      | ']' -> RBRACKET
      | ',' -> COMMA
      | ':' -> COLON
      | ';' -> SEMI
      | '\'' -> QUOTE
      | '+' -> PLUS
      | '*' -> STAR
      | '/' -> SLASH

      (* Two-character tokens or single *)
      | '-' ->
          if match_char lexer '>' then ARROW
          else MINUS
      | '=' ->
          if match_char lexer '=' then EQEQ
          else EQ
      | '!' ->
          if match_char lexer '=' then NEQ
          else BANG
      | '<' ->
          if match_char lexer '=' then LE
          else LT
      | '>' ->
          if match_char lexer '=' then GE
          else GT
      | '&' ->
          if match_char lexer '&' then AMPAMP
          else error lexer start_pos "Expected '&&'"
      | '|' ->
          if match_char lexer '|' then PIPEPIPE
          else error lexer start_pos "Expected '||'"

      (* String literal *)
      | '"' ->
          (* Back up and let read_string handle it *)
          lexer.pos <- lexer.pos - 1;
          lexer.col <- lexer.col - 1;
          (read_string lexer).value

      (* Number *)
      | c when is_digit c ->
          (* Back up and let read_number handle it *)
          lexer.pos <- lexer.pos - 1;
          lexer.col <- lexer.col - 1;
          (read_number lexer).value

      (* Identifier or keyword *)
      | c when is_alpha c ->
          (* Back up and let read_identifier handle it *)
          lexer.pos <- lexer.pos - 1;
          lexer.col <- lexer.col - 1;
          (read_identifier lexer).value

      | c ->
          error lexer start_pos (Printf.sprintf "Unexpected character: '%c'" c)
    in

    { value = kind; loc = make_span_from lexer start_pos }
  end

(** Peek at the next token without consuming it *)
let peek_token lexer =
  let saved_pos = lexer.pos in
  let saved_line = lexer.line in
  let saved_col = lexer.col in
  let saved_line_start = lexer.line_start in

  let tok = next_token lexer in

  lexer.pos <- saved_pos;
  lexer.line <- saved_line;
  lexer.col <- saved_col;
  lexer.line_start <- saved_line_start;

  tok

(** Tokenize entire input *)
let tokenize_all lexer =
  let rec loop acc =
    let tok = next_token lexer in
    match tok.value with
    | EOF -> List.rev (tok :: acc)
    | _ -> loop (tok :: acc)
  in
  loop []
