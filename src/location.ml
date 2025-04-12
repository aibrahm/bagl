(** Source location tracking for error messages *)

(** A position in source code *)
type position = {
  pos_line: int;    (** 1-indexed line number *)
  pos_col: int;     (** 1-indexed column number *)
  pos_offset: int;  (** 0-indexed byte offset from start of file *)
}

(** A span of source code from start to end position *)
type span = {
  start_pos: position;
  end_pos: position;
  filename: string;
}

(** A value with its source location *)
type 'a located = {
  value: 'a;
  loc: span;
}

(** Dummy span for generated/synthetic nodes *)
let dummy_pos = { pos_line = 0; pos_col = 0; pos_offset = 0 }
let dummy_span = { start_pos = dummy_pos; end_pos = dummy_pos; filename = "<unknown>" }

(** Create a position *)
let make_pos ~line ~col ~offset =
  { pos_line = line; pos_col = col; pos_offset = offset }

(** Create a span *)
let make_span ~start_pos ~end_pos ~filename =
  { start_pos; end_pos; filename }

(** Merge two spans into one that covers both *)
let merge_spans s1 s2 =
  let start_pos =
    if s1.start_pos.pos_offset <= s2.start_pos.pos_offset
    then s1.start_pos
    else s2.start_pos
  in
  let end_pos =
    if s1.end_pos.pos_offset >= s2.end_pos.pos_offset
    then s1.end_pos
    else s2.end_pos
  in
  { start_pos; end_pos; filename = s1.filename }

(** Create a located value *)
let at loc value = { value; loc }

(** Extract the value from a located *)
let value l = l.value

(** Extract the location from a located *)
let loc l = l.loc

(** Map a function over a located value *)
let map f l = { l with value = f l.value }

(** Pretty print a position *)
let pp_position fmt pos =
  Format.fprintf fmt "%d:%d" pos.pos_line pos.pos_col

(** Pretty print a span *)
let pp_span fmt span =
  Format.fprintf fmt "%s:%a" span.filename pp_position span.start_pos

(** Convert position to string *)
let string_of_position pos =
  Format.asprintf "%a" pp_position pos

(** Convert span to string *)
let string_of_span span =
  Format.asprintf "%a" pp_span span
