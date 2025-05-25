# 2. Lexical Structure

This chapter defines the lexical elements (tokens) of the BAGL language.

## 2.1 Source Encoding

BAGL source files are UTF-8 encoded text. The file extension is `.bagl`.

## 2.2 Whitespace and Comments

### Whitespace

Whitespace characters (space, tab, newline, carriage return) separate tokens but are otherwise ignored.

### Comments

BAGL supports two comment styles:

**Line Comments**: Start with `//` and extend to end of line
```bagl
let x = 5  // This is a comment
```

**Block Comments**: Enclosed in `/* */`
```bagl
/* This is a
   multi-line comment */
let x = 5
```

Block comments do not nest.

## 2.3 Keywords

The following identifiers are reserved keywords:

| Keyword | Description |
|---------|-------------|
| `let` | Variable binding |
| `letrec` | Recursive binding |
| `in` | Body of let expression |
| `fn` | Function definition |
| `if` | Conditional |
| `then` | Conditional branch |
| `else` | Conditional branch |
| `true` | Boolean literal |
| `false` | Boolean literal |

### Type Keywords

| Keyword | Description |
|---------|-------------|
| `int` | Integer type |
| `float` | Float type |
| `bool` | Boolean type |
| `string` | String type |
| `tensor` | Tensor type constructor |

### Tensor Operation Keywords

| Keyword | Description |
|---------|-------------|
| `dot` | Matrix/vector dot product |
| `transpose` | Matrix transpose |
| `reshape` | Tensor reshape |

## 2.4 Literals

### Integer Literals

Integer literals are sequences of decimal digits, optionally preceded by a minus sign:

```
INT_LIT ::= '-'? [0-9]+
```

Examples: `0`, `42`, `-17`, `1000`

### Float Literals

Float literals include a decimal point and optional exponent:

```
FLOAT_LIT ::= '-'? [0-9]+ '.' [0-9]+ ([eE] [+-]? [0-9]+)?
```

Examples: `3.14`, `-0.5`, `1.0e10`, `2.5e-3`

### Boolean Literals

```
BOOL_LIT ::= 'true' | 'false'
```

### String Literals

String literals are enclosed in double quotes with escape sequences:

```
STRING_LIT ::= '"' (char | escape)* '"'
escape     ::= '\\' ('n' | 't' | 'r' | '\\' | '"')
```

Examples: `"hello"`, `"line\nbreak"`, `"say \"hi\""`

## 2.5 Identifiers

Identifiers start with a letter or underscore, followed by letters, digits, or underscores:

```
IDENT ::= [a-zA-Z_] [a-zA-Z0-9_]*
```

Identifiers cannot be keywords.

Examples: `x`, `myVar`, `matrix_2d`, `_helper`

## 2.6 Operators

### Arithmetic Operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `PLUS` | `+` | Addition |
| `MINUS` | `-` | Subtraction |
| `STAR` | `*` | Multiplication |
| `SLASH` | `/` | Division |

### Comparison Operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `EQEQ` | `==` | Equal |
| `NEQ` | `!=` | Not equal |
| `LT` | `<` | Less than |
| `GT` | `>` | Greater than |
| `LE` | `<=` | Less or equal |
| `GE` | `>=` | Greater or equal |

### Logical Operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `AMPAMP` | `&&` | Logical AND |
| `PIPEPIPE` | `\|\|` | Logical OR |
| `BANG` | `!` | Logical NOT |

### Other Operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `EQ` | `=` | Assignment/binding |
| `ARROW` | `->` | Function arrow |

## 2.7 Delimiters

| Token | Symbol | Description |
|-------|--------|-------------|
| `LPAREN` | `(` | Left parenthesis |
| `RPAREN` | `)` | Right parenthesis |
| `LBRACKET` | `[` | Left bracket |
| `RBRACKET` | `]` | Right bracket |
| `LANGLE` | `<` | Left angle (in types) |
| `RANGLE` | `>` | Right angle (in types) |
| `COMMA` | `,` | Comma |
| `COLON` | `:` | Type annotation |
| `SEMI` | `;` | Statement separator |
| `QUOTE` | `'` | Type/dimension variable |

## 2.8 Operator Precedence

From lowest to highest precedence:

| Level | Operators | Associativity |
|-------|-----------|---------------|
| 1 | `\|\|` | Left |
| 2 | `&&` | Left |
| 3 | `==` `!=` | Left |
| 4 | `<` `>` `<=` `>=` | Left |
| 5 | `+` `-` | Left |
| 6 | `*` `/` | Left |
| 7 | `-` `!` (unary) | Right |
| 8 | Function application | Left |

## 2.9 Token Examples

```bagl
let sum: int = 1 + 2 in sum
```

Tokenizes to:
```
LET IDENT("sum") COLON INT_TYPE EQ INT_LIT(1) PLUS INT_LIT(2) IN IDENT("sum") EOF
```
