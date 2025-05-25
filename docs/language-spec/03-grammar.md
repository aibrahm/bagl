# 3. Formal Grammar

This chapter presents the complete formal grammar of BAGL in Extended Backus-Naur Form (EBNF).

## 3.1 Notation

```
::=     Definition
|       Alternative
[ ]     Optional (0 or 1)
{ }     Repetition (0 or more)
( )     Grouping
'x'     Terminal symbol
```

## 3.2 Complete Grammar

### Program Structure

```ebnf
program     ::= { decl [';'] }

decl        ::= expr
```

### Expressions

```ebnf
expr        ::= let_expr
              | letrec_expr
              | fn_expr
              | if_expr
              | binary_expr

let_expr    ::= 'let' IDENT [':' type_annot] '=' expr 'in' expr

letrec_expr ::= 'letrec' IDENT [':' type_annot] '=' expr 'in' expr

fn_expr     ::= 'fn' IDENT [':' type_annot] '->' expr

if_expr     ::= 'if' expr 'then' expr 'else' expr

binary_expr ::= unary_expr { binop unary_expr }

unary_expr  ::= '-' unary_expr
              | '!' unary_expr
              | application

application ::= primary { primary }

primary     ::= INT_LIT
              | FLOAT_LIT
              | BOOL_LIT
              | STRING_LIT
              | IDENT
              | '(' expr ')'
              | tensor_lit
              | tensor_op
```

### Binary Operators

```ebnf
binop       ::= '||' | '&&'
              | '==' | '!='
              | '<' | '>' | '<=' | '>='
              | '+' | '-'
              | '*' | '/'
```

### Tensor Literals and Operations

```ebnf
tensor_lit  ::= '[' [tensor_contents] ']' [':' shape]

tensor_contents ::= tensor_row { ',' tensor_row }
                  | expr { ',' expr }

tensor_row  ::= '[' expr { ',' expr } ']'

tensor_op   ::= 'dot' '(' expr ',' expr ')'
              | 'transpose' '(' expr ')'
              | 'reshape' '(' expr ',' shape ')'
```

### Type Annotations

```ebnf
type_annot  ::= arrow_type

arrow_type  ::= simple_type [ '->' arrow_type ]

simple_type ::= 'int'
              | 'float'
              | 'bool'
              | 'string'
              | tensor_type
              | type_var
              | '(' type_annot ')'

tensor_type ::= 'tensor' '<' type_annot '>' shape

type_var    ::= "'" IDENT

shape       ::= '[' [ dim { ',' dim } ] ']'

dim         ::= INT_LIT
              | "'" IDENT
```

### Lexical Elements

```ebnf
INT_LIT     ::= digit { digit }

FLOAT_LIT   ::= digit { digit } '.' digit { digit } [ exponent ]

exponent    ::= ('e' | 'E') ['+' | '-'] digit { digit }

BOOL_LIT    ::= 'true' | 'false'

STRING_LIT  ::= '"' { string_char } '"'

string_char ::= <any character except '"' or '\'>
              | '\' escape_char

escape_char ::= 'n' | 't' | 'r' | '\\' | '"'

IDENT       ::= letter { letter | digit | '_' }

letter      ::= 'a'..'z' | 'A'..'Z' | '_'

digit       ::= '0'..'9'
```

## 3.3 Grammar Properties

### Precedence Climbing

Binary operators use precedence climbing for correct associativity:

```
Precedence 1: ||          (left-associative)
Precedence 2: &&          (left-associative)
Precedence 3: == !=       (left-associative)
Precedence 4: < > <= >=   (left-associative)
Precedence 5: + -         (left-associative)
Precedence 6: * /         (left-associative)
```

### Function Application

Function application is left-associative with highest precedence:

```bagl
f x y z   (* Parsed as ((f x) y) z *)
```

### Arrow Types

Function types are right-associative:

```bagl
int -> int -> int   (* Parsed as int -> (int -> int) *)
```

## 3.4 Example Parses

### Let Expression

```bagl
let x: int = 5 in x + 1
```

Parse tree:
```
ELet
├── name: "x"
├── annot: TAInt
├── value: EInt(5)
└── body: EBinop(Add)
    ├── EVar("x")
    └── EInt(1)
```

### Function Definition

```bagl
fn x -> fn y -> x + y
```

Parse tree:
```
EFn
├── param: "x"
└── body: EFn
    ├── param: "y"
    └── body: EBinop(Add)
        ├── EVar("x")
        └── EVar("y")
```

### Tensor Operation

```bagl
dot(a, b)
```

Parse tree:
```
ETensorOp(TensorDot)
├── EVar("a")
└── EVar("b")
```

## 3.5 Syntactic Sugar

BAGL has minimal syntactic sugar. All constructs map directly to AST nodes:

| Syntax | AST Node |
|--------|----------|
| `let x = e1 in e2` | `ELet { name="x"; value=e1; body=e2 }` |
| `fn x -> e` | `EFn { param="x"; body=e }` |
| `if c then t else e` | `EIf { cond=c; then_branch=t; else_branch=e }` |
| `e1 + e2` | `EBinop(Add, e1, e2)` |
| `-e` | `EUnop(Neg, e)` |
| `f x` | `EApp(f, x)` |
