(** Type representation for Bagl type inference *)

(** Shape dimension - can be a constant or a unification variable *)
type shape_dim =
  | SDimConst of int
  | SDimVar of dim_var ref

and dim_var =
  | DUnbound of int    (** Unbound dimension variable with unique id *)
  | DLink of shape_dim (** Linked to another dimension *)

(** Tensor shape - list of dimensions *)
type shape = shape_dim list

(** Type representation *)
type ty =
  | TInt
  | TFloat
  | TBool
  | TString
  | TUnit                        (** Unit type for statements *)
  | TTensor of ty * shape        (** Tensor with element type and shape *)
  | TArrow of ty * ty            (** Function type *)
  | TVar of tvar ref             (** Type variable for unification *)

and tvar =
  | Unbound of int * int         (** id, level - for generalization *)
  | Link of ty                   (** Linked to another type *)

(** Type scheme for let-polymorphism *)
type scheme = {
  ty_vars: int list;             (** Bound type variable ids *)
  dim_vars: int list;            (** Bound dimension variable ids *)
  body: ty;
}

(** Global counters for fresh variables *)
let ty_var_counter = ref 0
let dim_var_counter = ref 0

(** Reset counters (for testing) *)
let reset_counters () =
  ty_var_counter := 0;
  dim_var_counter := 0

(** Generate a fresh type variable *)
let fresh_ty_var level =
  let id = !ty_var_counter in
  incr ty_var_counter;
  TVar (ref (Unbound (id, level)))

(** Generate a fresh dimension variable *)
let fresh_dim_var () =
  let id = !dim_var_counter in
  incr dim_var_counter;
  SDimVar (ref (DUnbound id))

(** Follow links in a type to find the representative *)
let rec find_ty = function
  | TVar ({ contents = Link t } as r) ->
      let t' = find_ty t in
      r := Link t';  (* Path compression *)
      t'
  | t -> t

(** Follow links in a dimension to find the representative *)
let rec find_dim = function
  | SDimVar ({ contents = DLink d } as r) ->
      let d' = find_dim d in
      r := DLink d';  (* Path compression *)
      d'
  | d -> d

(** Check if a type variable id occurs in a type (for occurs check) *)
let rec occurs_check_ty id = function
  | TInt | TFloat | TBool | TString | TUnit -> false
  | TVar { contents = Unbound (id', _) } -> id = id'
  | TVar { contents = Link t } -> occurs_check_ty id t
  | TArrow (t1, t2) -> occurs_check_ty id t1 || occurs_check_ty id t2
  | TTensor (elem, _shape) ->
      (* A type variable cannot occur inside a shape: shapes contain only
         dimension variables, which live in a separate namespace. The
         dimension occurs-check is [occurs_check_dim_id], used in unify_dim. *)
      occurs_check_ty id elem

(** Check if a dimension variable id occurs in a shape *)
let rec occurs_check_dim_id id = function
  | SDimConst _ -> false
  | SDimVar { contents = DUnbound id' } -> id = id'
  | SDimVar { contents = DLink d } -> occurs_check_dim_id id d

let occurs_check_shape_dim_id id shape =
  List.exists (occurs_check_dim_id id) shape

(** Update levels of type variables (for proper generalization) *)
let rec update_ty_levels level = function
  | TInt | TFloat | TBool | TString | TUnit -> ()
  | TVar ({ contents = Unbound (id, level') } as r) ->
      if level' > level then r := Unbound (id, level)
  | TVar { contents = Link t } -> update_ty_levels level t
  | TArrow (t1, t2) ->
      update_ty_levels level t1;
      update_ty_levels level t2
  | TTensor (elem, _) ->
      update_ty_levels level elem

(** Get the string name for a type variable id *)
let ty_var_name id =
  if id < 26 then
    String.make 1 (Char.chr (Char.code 'a' + id))
  else
    "t" ^ string_of_int id

(** Get the string name for a dimension variable id *)
let dim_var_name id =
  if id < 26 then
    String.make 1 (Char.chr (Char.code 'n' + (id mod 13)))
  else
    "d" ^ string_of_int id

(** Pretty print a shape dimension *)
let rec pp_shape_dim fmt d =
  match find_dim d with
  | SDimConst n -> Format.fprintf fmt "%d" n
  | SDimVar { contents = DUnbound id } ->
      Format.fprintf fmt "'%s" (dim_var_name id)
  | SDimVar { contents = DLink d' } -> pp_shape_dim fmt d'

(** Pretty print a shape *)
let pp_shape fmt shape =
  Format.fprintf fmt "[%a]"
    (Format.pp_print_list ~pp_sep:(fun fmt () -> Format.fprintf fmt ", ") pp_shape_dim)
    shape

(** Pretty print a type *)
let rec pp_ty fmt t =
  match find_ty t with
  | TInt -> Format.fprintf fmt "int"
  | TFloat -> Format.fprintf fmt "float"
  | TBool -> Format.fprintf fmt "bool"
  | TString -> Format.fprintf fmt "string"
  | TUnit -> Format.fprintf fmt "()"
  | TTensor (elem, shape) ->
      Format.fprintf fmt "tensor<%a>%a" pp_ty elem pp_shape shape
  | TArrow (t1, t2) ->
      let parens = match find_ty t1 with TArrow _ -> true | _ -> false in
      if parens then
        Format.fprintf fmt "(%a) -> %a" pp_ty t1 pp_ty t2
      else
        Format.fprintf fmt "%a -> %a" pp_ty t1 pp_ty t2
  | TVar { contents = Unbound (id, _) } ->
      Format.fprintf fmt "'%s" (ty_var_name id)
  | TVar { contents = Link t' } -> pp_ty fmt t'

(** Pretty print a type scheme *)
let pp_scheme fmt { ty_vars; dim_vars; body } =
  if ty_vars = [] && dim_vars = [] then
    pp_ty fmt body
  else begin
    Format.fprintf fmt "forall";
    List.iter (fun id -> Format.fprintf fmt " '%s" (ty_var_name id)) ty_vars;
    List.iter (fun id -> Format.fprintf fmt " '%s" (dim_var_name id)) dim_vars;
    Format.fprintf fmt ". %a" pp_ty body
  end

(** Convert to string *)
let string_of_ty t = Format.asprintf "%a" pp_ty t
let string_of_shape s = Format.asprintf "%a" pp_shape s
let string_of_scheme s = Format.asprintf "%a" pp_scheme s

(** Create a monomorphic scheme (no quantified variables) *)
let mono_scheme ty = { ty_vars = []; dim_vars = []; body = ty }

(** Copy a type, replacing bound variables with fresh ones *)
let instantiate_scheme scheme =
  let ty_subst = Hashtbl.create 8 in
  let dim_subst = Hashtbl.create 8 in

  (* Create fresh variables for each bound variable *)
  List.iter (fun id ->
    Hashtbl.add ty_subst id (fresh_ty_var 0)  (* level doesn't matter for instances *)
  ) scheme.ty_vars;

  List.iter (fun id ->
    Hashtbl.add dim_subst id (fresh_dim_var ())
  ) scheme.dim_vars;

  (* Apply substitution *)
  let rec subst_ty = function
    | TInt -> TInt
    | TFloat -> TFloat
    | TBool -> TBool
    | TString -> TString
    | TUnit -> TUnit
    | TVar { contents = Unbound (id, _) } as t ->
        begin match Hashtbl.find_opt ty_subst id with
        | Some t' -> t'
        | None -> t
        end
    | TVar { contents = Link t } -> subst_ty t
    | TArrow (t1, t2) -> TArrow (subst_ty t1, subst_ty t2)
    | TTensor (elem, shape) -> TTensor (subst_ty elem, subst_shape shape)

  and subst_shape shape = List.map subst_dim shape

  and subst_dim = function
    | SDimConst n -> SDimConst n
    | SDimVar { contents = DUnbound id } as d ->
        begin match Hashtbl.find_opt dim_subst id with
        | Some d' -> d'
        | None -> d
        end
    | SDimVar { contents = DLink d } -> subst_dim d
  in

  subst_ty scheme.body

(** Generalize a type at a given level *)
let generalize level ty =
  let ty_vars = ref [] in
  let dim_vars = ref [] in

  let rec collect_ty = function
    | TInt | TFloat | TBool | TString | TUnit -> ()
    | TVar { contents = Unbound (id, level') } ->
        if level' > level && not (List.mem id !ty_vars) then
          ty_vars := id :: !ty_vars
    | TVar { contents = Link t } -> collect_ty t
    | TArrow (t1, t2) -> collect_ty t1; collect_ty t2
    | TTensor (elem, shape) -> collect_ty elem; collect_shape shape

  and collect_shape shape = List.iter collect_dim shape

  and collect_dim = function
    | SDimConst _ -> ()
    | SDimVar { contents = DUnbound id } ->
        if not (List.mem id !dim_vars) then
          dim_vars := id :: !dim_vars
    | SDimVar { contents = DLink d } -> collect_dim d
  in

  collect_ty ty;
  { ty_vars = !ty_vars; dim_vars = !dim_vars; body = ty }

(** Check if two types are equal (after following links) *)
let rec types_equal t1 t2 =
  match find_ty t1, find_ty t2 with
  | TInt, TInt | TFloat, TFloat | TBool, TBool | TString, TString | TUnit, TUnit -> true
  | TVar { contents = Unbound (id1, _) }, TVar { contents = Unbound (id2, _) } ->
      id1 = id2
  | TArrow (a1, r1), TArrow (a2, r2) ->
      types_equal a1 a2 && types_equal r1 r2
  | TTensor (e1, s1), TTensor (e2, s2) ->
      types_equal e1 e2 && shapes_equal s1 s2
  | _ -> false

and shapes_equal s1 s2 =
  List.length s1 = List.length s2 &&
  List.for_all2 dims_equal s1 s2

and dims_equal d1 d2 =
  match find_dim d1, find_dim d2 with
  | SDimConst n1, SDimConst n2 -> n1 = n2
  | SDimVar { contents = DUnbound id1 }, SDimVar { contents = DUnbound id2 } ->
      id1 = id2
  | _ -> false
