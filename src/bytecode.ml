(** Bytecode instruction definitions *)

(** Bytecode opcodes *)
type opcode =
  (* Stack operations *)
  | PUSH_INT of int
  | PUSH_FLOAT of float
  | PUSH_BOOL of bool
  | PUSH_STRING of string
  | PUSH_UNIT
  | POP
  | DUP

  (* Local variable access *)
  | LOAD_LOCAL of int    (** Push local[i] onto stack *)
  | STORE_LOCAL of int   (** Pop stack to local[i] *)

  (* Global variable access *)
  | LOAD_GLOBAL of int   (** Push global[i] onto stack *)
  | STORE_GLOBAL of int  (** Pop stack to global[i] *)

  (* Closure operations *)
  | MAKE_CLOSURE of int * int  (** func_id, num_captures *)
  | MAKE_REC_CLOSURE of int * int * int  (** func_id, num_captures, self_capture_idx *)
  | LOAD_CAPTURE of int  (** Load from closure environment *)

  (* Integer arithmetic *)
  | IADD
  | ISUB
  | IMUL
  | IDIV
  | INEG

  (* Float arithmetic *)
  | FADD
  | FSUB
  | FMUL
  | FDIV
  | FNEG

  (* Integer comparison *)
  | IEQ
  | INEQ
  | ILT
  | IGT
  | ILE
  | IGE

  (* Float comparison *)
  | FLT
  | FGT
  | FLE
  | FGE

  (* Boolean operations *)
  | AND
  | OR
  | NOT

  (* Control flow *)
  | JUMP of int          (** Absolute address *)
  | JUMP_IF_FALSE of int (** Conditional jump *)
  | CALL of int          (** Call with n args *)
  | RETURN

  (* Tensor operations *)
  | TENSOR_CREATE of int list  (** Create tensor with shape *)
  | TENSOR_DOT           (** Matrix multiplication *)
  | TENSOR_TRANSPOSE     (** Transpose 2D tensor *)
  | TENSOR_RESHAPE of int list  (** Reshape tensor *)

  (* Debugging and control *)
  | PRINT
  | HALT

  (* No-op for padding *)
  | NOP

(** A chunk of bytecode for a single function *)
type chunk = {
  code: opcode array;
  num_locals: int;
  num_params: int;
  num_captures: int;
}

(** A complete bytecode program *)
type program = {
  chunks: chunk array;   (** One chunk per function *)
  entry: int;            (** Index of main function *)
}

(** Pretty print an opcode *)
let pp_opcode fmt = function
  | PUSH_INT n -> Format.fprintf fmt "PUSH_INT %d" n
  | PUSH_FLOAT f -> Format.fprintf fmt "PUSH_FLOAT %f" f
  | PUSH_BOOL b -> Format.fprintf fmt "PUSH_BOOL %b" b
  | PUSH_STRING s -> Format.fprintf fmt "PUSH_STRING %S" s
  | PUSH_UNIT -> Format.fprintf fmt "PUSH_UNIT"
  | POP -> Format.fprintf fmt "POP"
  | DUP -> Format.fprintf fmt "DUP"
  | LOAD_LOCAL i -> Format.fprintf fmt "LOAD_LOCAL %d" i
  | STORE_LOCAL i -> Format.fprintf fmt "STORE_LOCAL %d" i
  | LOAD_GLOBAL i -> Format.fprintf fmt "LOAD_GLOBAL %d" i
  | STORE_GLOBAL i -> Format.fprintf fmt "STORE_GLOBAL %d" i
  | MAKE_CLOSURE (fid, n) -> Format.fprintf fmt "MAKE_CLOSURE %d %d" fid n
  | MAKE_REC_CLOSURE (fid, n, self_idx) -> Format.fprintf fmt "MAKE_REC_CLOSURE %d %d %d" fid n self_idx
  | LOAD_CAPTURE i -> Format.fprintf fmt "LOAD_CAPTURE %d" i
  | IADD -> Format.fprintf fmt "IADD"
  | ISUB -> Format.fprintf fmt "ISUB"
  | IMUL -> Format.fprintf fmt "IMUL"
  | IDIV -> Format.fprintf fmt "IDIV"
  | INEG -> Format.fprintf fmt "INEG"
  | FADD -> Format.fprintf fmt "FADD"
  | FSUB -> Format.fprintf fmt "FSUB"
  | FMUL -> Format.fprintf fmt "FMUL"
  | FDIV -> Format.fprintf fmt "FDIV"
  | FNEG -> Format.fprintf fmt "FNEG"
  | IEQ -> Format.fprintf fmt "IEQ"
  | INEQ -> Format.fprintf fmt "INEQ"
  | ILT -> Format.fprintf fmt "ILT"
  | IGT -> Format.fprintf fmt "IGT"
  | ILE -> Format.fprintf fmt "ILE"
  | IGE -> Format.fprintf fmt "IGE"
  | FLT -> Format.fprintf fmt "FLT"
  | FGT -> Format.fprintf fmt "FGT"
  | FLE -> Format.fprintf fmt "FLE"
  | FGE -> Format.fprintf fmt "FGE"
  | AND -> Format.fprintf fmt "AND"
  | OR -> Format.fprintf fmt "OR"
  | NOT -> Format.fprintf fmt "NOT"
  | JUMP addr -> Format.fprintf fmt "JUMP %d" addr
  | JUMP_IF_FALSE addr -> Format.fprintf fmt "JUMP_IF_FALSE %d" addr
  | CALL n -> Format.fprintf fmt "CALL %d" n
  | RETURN -> Format.fprintf fmt "RETURN"
  | TENSOR_CREATE shape ->
      Format.fprintf fmt "TENSOR_CREATE [%a]"
        (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ",")
          Format.pp_print_int) shape
  | TENSOR_DOT -> Format.fprintf fmt "TENSOR_DOT"
  | TENSOR_TRANSPOSE -> Format.fprintf fmt "TENSOR_TRANSPOSE"
  | TENSOR_RESHAPE shape ->
      Format.fprintf fmt "TENSOR_RESHAPE [%a]"
        (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ",")
          Format.pp_print_int) shape
  | PRINT -> Format.fprintf fmt "PRINT"
  | HALT -> Format.fprintf fmt "HALT"
  | NOP -> Format.fprintf fmt "NOP"

(** Disassemble a chunk *)
let disassemble_chunk fmt idx chunk =
  Format.fprintf fmt "=== Function %d (locals=%d, params=%d, captures=%d) ===@."
    idx chunk.num_locals chunk.num_params chunk.num_captures;
  Array.iteri (fun i op ->
    Format.fprintf fmt "%4d: %a@." i pp_opcode op
  ) chunk.code

(** Disassemble a program *)
let disassemble fmt program =
  Format.fprintf fmt "Entry: function %d@.@." program.entry;
  Array.iteri (fun i chunk ->
    disassemble_chunk fmt i chunk;
    Format.fprintf fmt "@."
  ) program.chunks

let string_of_program p = Format.asprintf "%a" disassemble p
