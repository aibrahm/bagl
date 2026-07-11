(** Bytecode serialization for .baglc files *)

open Bytecode

(** Magic number to identify bagl bytecode files *)
let magic = "BAGL"

(** Version number *)
let version = 1

(** Serialization error *)
exception Serialize_error of string

(** Write an integer as 4 bytes (big-endian) *)
let write_int32 oc n =
  output_char oc (Char.chr ((n lsr 24) land 0xff));
  output_char oc (Char.chr ((n lsr 16) land 0xff));
  output_char oc (Char.chr ((n lsr 8) land 0xff));
  output_char oc (Char.chr (n land 0xff))

(** Read an integer as 4 bytes (big-endian), sign-extending so negative
    integers round-trip correctly *)
let read_int32 ic =
  let b0 = Char.code (input_char ic) in
  let b1 = Char.code (input_char ic) in
  let b2 = Char.code (input_char ic) in
  let b3 = Char.code (input_char ic) in
  let n = (b0 lsl 24) lor (b1 lsl 16) lor (b2 lsl 8) lor b3 in
  if n land 0x80000000 <> 0 then n - 0x100000000 else n

(** Write a float as 8 bytes *)
let write_float oc f =
  let bits = Int64.bits_of_float f in
  for i = 7 downto 0 do
    output_char oc (Char.chr (Int64.to_int (Int64.shift_right bits (i * 8)) land 0xff))
  done

(** Read a float as 8 bytes *)
let read_float ic =
  let bits = ref Int64.zero in
  for i = 7 downto 0 do
    let b = Int64.of_int (Char.code (input_char ic)) in
    bits := Int64.logor !bits (Int64.shift_left b (i * 8))
  done;
  Int64.float_of_bits !bits

(** Write a string with length prefix *)
let write_string oc s =
  write_int32 oc (String.length s);
  output_string oc s

(** Read a string with length prefix *)
let read_string ic =
  let len = read_int32 ic in
  let buf = Bytes.create len in
  really_input ic buf 0 len;
  Bytes.to_string buf

(** Write a list of integers (shape) *)
let write_shape oc shape =
  write_int32 oc (List.length shape);
  List.iter (write_int32 oc) shape

(** Read a list of integers (shape) *)
let read_shape ic =
  let len = read_int32 ic in
  List.init len (fun _ -> read_int32 ic)

(** Opcode tags for serialization *)
type opcode_tag =
  | T_PUSH_INT | T_PUSH_FLOAT | T_PUSH_BOOL | T_PUSH_STRING | T_PUSH_UNIT
  | T_POP | T_DUP
  | T_LOAD_LOCAL | T_STORE_LOCAL | T_LOAD_GLOBAL | T_STORE_GLOBAL
  | T_MAKE_CLOSURE | T_LOAD_CAPTURE
  | T_IADD | T_ISUB | T_IMUL | T_IDIV | T_INEG
  | T_FADD | T_FSUB | T_FMUL | T_FDIV | T_FNEG
  | T_IEQ | T_INEQ | T_ILT | T_IGT | T_ILE | T_IGE
  | T_FLT | T_FGT | T_FLE | T_FGE
  | T_AND | T_OR | T_NOT
  | T_JUMP | T_JUMP_IF_FALSE | T_CALL | T_RETURN
  | T_TENSOR_CREATE | T_TENSOR_DOT | T_TENSOR_TRANSPOSE | T_TENSOR_RESHAPE
  | T_PRINT | T_HALT | T_NOP

let tag_of_opcode = function
  | PUSH_INT _ -> 0 | PUSH_FLOAT _ -> 1 | PUSH_BOOL _ -> 2
  | PUSH_STRING _ -> 3 | PUSH_UNIT -> 4
  | POP -> 5 | DUP -> 6
  | LOAD_LOCAL _ -> 7 | STORE_LOCAL _ -> 8
  | LOAD_GLOBAL _ -> 9 | STORE_GLOBAL _ -> 10
  | MAKE_CLOSURE _ -> 11 | LOAD_CAPTURE _ -> 12
  | IADD -> 13 | ISUB -> 14 | IMUL -> 15 | IDIV -> 16 | INEG -> 17
  | FADD -> 18 | FSUB -> 19 | FMUL -> 20 | FDIV -> 21 | FNEG -> 22
  | IEQ -> 23 | INEQ -> 24 | ILT -> 25 | IGT -> 26 | ILE -> 27 | IGE -> 28
  | FLT -> 44 | FGT -> 45 | FLE -> 46 | FGE -> 47
  | AND -> 29 | OR -> 30 | NOT -> 31
  | JUMP _ -> 32 | JUMP_IF_FALSE _ -> 33 | CALL _ -> 34 | RETURN -> 35
  | TENSOR_CREATE _ -> 36 | TENSOR_DOT -> 37
  | TENSOR_TRANSPOSE -> 38 | TENSOR_RESHAPE _ -> 39
  | PRINT -> 40 | HALT -> 41 | NOP -> 42
  | MAKE_REC_CLOSURE _ -> 43

(** Write an opcode *)
let write_opcode oc op =
  output_byte oc (tag_of_opcode op);
  match op with
  | PUSH_INT n -> write_int32 oc n
  | PUSH_FLOAT f -> write_float oc f
  | PUSH_BOOL b -> output_byte oc (if b then 1 else 0)
  | PUSH_STRING s -> write_string oc s
  | PUSH_UNIT | POP | DUP -> ()
  | LOAD_LOCAL i | STORE_LOCAL i -> write_int32 oc i
  | LOAD_GLOBAL i | STORE_GLOBAL i -> write_int32 oc i
  | MAKE_CLOSURE (fid, n) -> write_int32 oc fid; write_int32 oc n
  | MAKE_REC_CLOSURE (fid, n, self_idx) -> write_int32 oc fid; write_int32 oc n; write_int32 oc self_idx
  | LOAD_CAPTURE i -> write_int32 oc i
  | IADD | ISUB | IMUL | IDIV | INEG -> ()
  | FADD | FSUB | FMUL | FDIV | FNEG -> ()
  | IEQ | INEQ | ILT | IGT | ILE | IGE -> ()
  | FLT | FGT | FLE | FGE -> ()
  | AND | OR | NOT -> ()
  | JUMP addr -> write_int32 oc addr
  | JUMP_IF_FALSE addr -> write_int32 oc addr
  | CALL n -> write_int32 oc n
  | RETURN -> ()
  | TENSOR_CREATE shape -> write_shape oc shape
  | TENSOR_DOT | TENSOR_TRANSPOSE -> ()
  | TENSOR_RESHAPE shape -> write_shape oc shape
  | PRINT | HALT | NOP -> ()

(** Read an opcode *)
let read_opcode ic =
  let tag = input_byte ic in
  match tag with
  | 0 -> PUSH_INT (read_int32 ic)
  | 1 -> PUSH_FLOAT (read_float ic)
  | 2 -> PUSH_BOOL (input_byte ic <> 0)
  | 3 -> PUSH_STRING (read_string ic)
  | 4 -> PUSH_UNIT
  | 5 -> POP
  | 6 -> DUP
  | 7 -> LOAD_LOCAL (read_int32 ic)
  | 8 -> STORE_LOCAL (read_int32 ic)
  | 9 -> LOAD_GLOBAL (read_int32 ic)
  | 10 -> STORE_GLOBAL (read_int32 ic)
  | 11 -> let fid = read_int32 ic in let n = read_int32 ic in MAKE_CLOSURE (fid, n)
  | 12 -> LOAD_CAPTURE (read_int32 ic)
  | 13 -> IADD
  | 14 -> ISUB
  | 15 -> IMUL
  | 16 -> IDIV
  | 17 -> INEG
  | 18 -> FADD
  | 19 -> FSUB
  | 20 -> FMUL
  | 21 -> FDIV
  | 22 -> FNEG
  | 23 -> IEQ
  | 24 -> INEQ
  | 25 -> ILT
  | 26 -> IGT
  | 27 -> ILE
  | 28 -> IGE
  | 29 -> AND
  | 30 -> OR
  | 31 -> NOT
  | 32 -> JUMP (read_int32 ic)
  | 33 -> JUMP_IF_FALSE (read_int32 ic)
  | 34 -> CALL (read_int32 ic)
  | 35 -> RETURN
  | 36 -> TENSOR_CREATE (read_shape ic)
  | 37 -> TENSOR_DOT
  | 38 -> TENSOR_TRANSPOSE
  | 39 -> TENSOR_RESHAPE (read_shape ic)
  | 40 -> PRINT
  | 41 -> HALT
  | 42 -> NOP
  | 43 -> let fid = read_int32 ic in let n = read_int32 ic in let self_idx = read_int32 ic in MAKE_REC_CLOSURE (fid, n, self_idx)
  | 44 -> FLT
  | 45 -> FGT
  | 46 -> FLE
  | 47 -> FGE
  | n -> raise (Serialize_error (Printf.sprintf "Unknown opcode tag: %d" n))

(** Write a chunk *)
let write_chunk oc chunk =
  write_int32 oc chunk.num_locals;
  write_int32 oc chunk.num_params;
  write_int32 oc chunk.num_captures;
  write_int32 oc (Array.length chunk.code);
  Array.iter (write_opcode oc) chunk.code

(** Read a chunk *)
let read_chunk ic =
  let num_locals = read_int32 ic in
  let num_params = read_int32 ic in
  let num_captures = read_int32 ic in
  let code_len = read_int32 ic in
  let code = Array.init code_len (fun _ -> read_opcode ic) in
  { num_locals; num_params; num_captures; code }

(** Write a program to a file *)
let write_file filename program =
  let oc = open_out_bin filename in
  try
    (* Write header *)
    output_string oc magic;
    write_int32 oc version;
    write_int32 oc program.entry;
    write_int32 oc (Array.length program.chunks);
    (* Write chunks *)
    Array.iter (write_chunk oc) program.chunks;
    close_out oc
  with e ->
    close_out oc;
    raise e

(** Read a program from a file *)
let read_file filename =
  let ic = open_in_bin filename in
  try
    (* Read and verify header *)
    let file_magic = really_input_string ic 4 in
    if file_magic <> magic then
      raise (Serialize_error "Invalid file: wrong magic number");
    let file_version = read_int32 ic in
    if file_version <> version then
      raise (Serialize_error (Printf.sprintf "Version mismatch: expected %d, got %d"
        version file_version));
    let entry = read_int32 ic in
    let num_chunks = read_int32 ic in
    let chunks = Array.init num_chunks (fun _ -> read_chunk ic) in
    close_in ic;
    { entry; chunks }
  with e ->
    close_in ic;
    raise e

(** Check if a file is a valid bytecode file *)
let is_bytecode_file filename =
  try
    let ic = open_in_bin filename in
    let result =
      try
        let file_magic = really_input_string ic 4 in
        file_magic = magic
      with _ -> false
    in
    close_in ic;
    result
  with _ -> false
