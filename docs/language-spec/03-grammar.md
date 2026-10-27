# 3. Formal grammar

Chapter 3 gives the complete grammar of Bagl in Extended Backus-Naur Form (EBNF). EBNF is a standard notation for grammars, and each rule in it names a piece of syntax and lists what that piece can contain.

## 3.1 Notation

```
::=     Definition
|       Alternative
[ ]     Optional (0 or 1)
{ }     Repetition (0 or more)
( )     Grouping
'x'     Terminal symbol
```

## 3.2 Complete grammar

### Program structure

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

fn_expr     ::= 'fn' IDENT [':' simple_type] '->' expr

if_expr     ::= 'if' expr 'then' expr 'else' expr

binary_expr ::= unary_expr { binop unary_expr }

unary_expr  ::= '-' unary_expr
              | '!' unary_expr
              | application

application ::= primary { argument }

argument    ::= INT_LIT
              | FLOAT_LIT
              | BOOL_LIT
              | STRING_LIT
              | IDENT
              | '(' expr ')'
              | tensor_lit

primary     ::= INT_LIT
              | FLOAT_LIT
              | BOOL_LIT
              | STRING_LIT
              | IDENT
              | '(' expr ')'
              | tensor_lit
              | tensor_op
              | math_op

grad_expr   ::= 'grad' '(' fn_expr ')'
```

The annotation on a `fn` parameter is a `simple_type`, so an arrow type there needs parentheses, e.g., `fn f: (int -> int) -> f 5`. Without the parentheses, the parser would read the arrow of the type as the arrow of the function.

An `argument` is a smaller set than `primary`. To pass the result of `dot`, `transpose`, `reshape`, or a math function to a function, put it in parentheses, e.g., `f (dot(a, b))`.

The parser has no separate rule for `grad_expr`. It reads `grad` as an ordinary `IDENT` and `grad (fn x -> e)` as an application. The `grad` pass then requires the argument to be a function literal in parentheses, as `grad_expr` shows, and it reports a compile error otherwise. Section 5.12 describes `grad`.

### Binary operators

```ebnf
binop       ::= '||' | '&&'
              | '==' | '!='
              | '<' | '>' | '<=' | '>='
              | '+' | '-'
              | '*' | '/'
```

### Tensor literals and operations

```ebnf
tensor_lit  ::= '[' [tensor_contents] ']' [':' shape]

tensor_contents ::= tensor_row { ',' tensor_row }
                  | expr { ',' expr }

tensor_row  ::= '[' expr { ',' expr } ']'

tensor_op   ::= 'dot' '(' expr ',' expr ')'
              | 'transpose' '(' expr ')'
              | 'reshape' '(' expr ',' shape ')'

math_op     ::= ('exp' | 'log' | 'sqrt' | 'relu' | 'step') '(' expr ')'
```

### Type annotations

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

### Lexical elements

```ebnf
INT_LIT     ::= digit { digit }

FLOAT_LIT   ::= digit { digit } '.' digit { digit } [ exponent ]
              | digit { digit } exponent

exponent    ::= ('e' | 'E') ['+' | '-'] digit { digit }

BOOL_LIT    ::= 'true' | 'false'

STRING_LIT  ::= '"' { string_char } '"'

string_char ::= <any character except '"', '\', or a newline>
              | '\' escape_char

escape_char ::= 'n' | 't' | 'r' | '\\' | '"'

IDENT       ::= letter { letter | digit | '_' }

letter      ::= 'a'..'z' | 'A'..'Z' | '_'

digit       ::= '0'..'9'
```

## 3.3 Grammar properties

### Precedence climbing

The parser reads binary operators with precedence climbing, which gives each operator the right precedence and associativity. Precedence climbing is a parsing method that uses the precedence of each operator to decide how to group the operands. The levels are listed below.

```
Precedence 1: ||          (left-associative)
Precedence 2: &&          (left-associative)
Precedence 3: == !=       (left-associative)
Precedence 4: < > <= >=   (left-associative)
Precedence 5: + -         (left-associative)
Precedence 6: * /         (left-associative)
```

### Function application

Function application has the highest precedence, and it groups to the left. The example below shows the grouping.

```text
f x y z   // Parsed as ((f x) y) z
```

### Arrow types

The arrow in a function type groups to the right. The example below shows the grouping.

```text
int -> int -> int   // Parsed as int -> (int -> int)
```

## 3.4 Example parses

### Let expression

```bagl
let x: int = 5 in x + 1
```

The parser builds the following tree.
```
ELet
├── name: "x"
├── annot: TAInt
├── value: EInt(5)
└── body: EBinop(Add)
    ├── EVar("x")
    └── EInt(1)
```

### Function definition

```bagl
fn x -> fn y -> x + y
```

The parser builds the following tree.
```
EFn
├── param: "x"
└── body: EFn
    ├── param: "y"
    └── body: EBinop(Add)
        ├── EVar("x")
        └── EVar("y")
```

### Tensor operation

```text
dot(a, b)
```

The parser builds the following tree.
```
ETensorOp(TensorDot)
├── EVar("a")
└── EVar("b")
```

## 3.5 Syntactic sugar

Bagl has very little syntactic sugar, which is syntax that the compiler rewrites into other syntax. Each construct maps directly to one node of the abstract syntax tree (AST), as the table shows.

| Syntax | AST Node |
|--------|----------|
| `let x = e1 in e2` | `ELet { name="x"; value=e1; body=e2 }` |
| `fn x -> e` | `EFn { param="x"; body=e }` |
| `if c then t else e` | `EIf { cond=c; then_branch=t; else_branch=e }` |
| `e1 + e2` | `EBinop(Add, e1, e2)` |
| `-e` | `EUnop(Neg, e)` |
| `f x` | `EApp(f, x)` |
