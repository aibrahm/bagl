# 2. Lexical structure

Chapter 2 defines the tokens of Bagl. A token is the smallest unit the lexer reads from the source text, e.g., a keyword, a number, or an operator.

## 2.1 Source encoding

Bagl source files are UTF-8 text, and their file extension is `.bagl`.

## 2.2 Whitespace and comments

### Whitespace

The whitespace characters are space, tab, newline, and carriage return. Whitespace separates tokens, and the lexer otherwise ignores it.

### Comments

Bagl has two kinds of comments.

A line comment starts with `//` and runs to the end of the line.
```bagl
let x = 5 in x  // This is a comment
```

A block comment starts with `/*` and ends with `*/`.
```bagl
/* This is a
   multi-line comment */
let x = 5 in x
```

Block comments do not nest, so the first `*/` ends the comment.

## 2.3 Keywords

The identifiers in the table below are reserved keywords.

| Keyword | Description |
|---------|-------------|
| `let` | Binds a variable |
| `letrec` | Binds a recursive variable |
| `in` | Starts the body of a let expression |
| `fn` | Starts a function definition |
| `if` | Starts a conditional |
| `then` | Starts the first branch of a conditional |
| `else` | Starts the second branch of a conditional |
| `true` | Boolean literal |
| `false` | Boolean literal |

### Type keywords

| Keyword | Description |
|---------|-------------|
| `int` | Integer type |
| `float` | Float type |
| `bool` | Boolean type |
| `string` | String type |
| `tensor` | Builds a tensor type |

### Tensor operation keywords

| Keyword | Description |
|---------|-------------|
| `dot` | Dot product of matrices or vectors |
| `transpose` | Matrix transpose |
| `reshape` | Gives a tensor a new shape |

The lexer also reserves `exp`, `log`, `sqrt`, `relu`, and `step` as keywords. Each of them takes a float or a tensor, and on a tensor it works on each element.

## 2.4 Literals

### Integer literals

An integer literal is a sequence of decimal digits.

```
INT_LIT ::= [0-9]+
```

A literal never includes a minus sign. A leading minus sign is a separate `MINUS` token, which the parser reads as negation. For example, `-17` is the negation of `17`.

Examples: `0`, `42`, `-17`, `1000`

### Float literals

A float literal has a decimal point, an exponent, or both.

```
FLOAT_LIT ::= [0-9]+ ('.' [0-9]+)? ([eE] [+-]? [0-9]+)?
```

A number with neither a decimal point nor an exponent is an integer literal instead. As with integers, a leading minus sign is a separate token.

Examples: `3.14`, `-0.5`, `1.0e10`, `2.5e-3`

### Boolean literals

```
BOOL_LIT ::= 'true' | 'false'
```

### String literals

A string literal is text between double quotes. It can contain escape sequences, which are a backslash followed by one character.

```
STRING_LIT ::= '"' (char | escape)* '"'
escape     ::= '\\' ('n' | 't' | 'r' | '\\' | '"')
```

A string literal can't contain a newline.

Examples: `"hello"`, `"line\nbreak"`, `"say \"hi\""`

## 2.5 Identifiers

An identifier starts with a letter or an underscore. The rest of it can be letters, digits, and underscores.

```
IDENT ::= [a-zA-Z_] [a-zA-Z0-9_]*
```

A keyword can't be used as an identifier. The name `grad` is not a keyword, but the compiler gives special meaning to `grad` applied to a function, as section 5.12 describes.

Examples: `x`, `myVar`, `matrix_2d`, `_helper`

## 2.6 Operators

### Arithmetic operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `PLUS` | `+` | Addition |
| `MINUS` | `-` | Subtraction |
| `STAR` | `*` | Multiplication |
| `SLASH` | `/` | Division |

### Comparison operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `EQEQ` | `==` | Equal |
| `NEQ` | `!=` | Not equal |
| `LT` | `<` | Less than |
| `GT` | `>` | Greater than |
| `LE` | `<=` | Less than or equal |
| `GE` | `>=` | Greater than or equal |

### Logical operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `AMPAMP` | `&&` | Logical and |
| `PIPEPIPE` | `\|\|` | Logical or |
| `BANG` | `!` | Logical not |

### Other operators

| Token | Symbol | Description |
|-------|--------|-------------|
| `EQ` | `=` | Binds a name in `let` and `letrec` |
| `ARROW` | `->` | Function arrow |

## 2.7 Delimiters

| Token | Symbol | Description |
|-------|--------|-------------|
| `LPAREN` | `(` | Left parenthesis |
| `RPAREN` | `)` | Right parenthesis |
| `LBRACKET` | `[` | Left bracket |
| `RBRACKET` | `]` | Right bracket |
| `LANGLE` | `<` | Left angle bracket. The lexer never produces `LANGLE`, and tensor types use `LT` instead |
| `RANGLE` | `>` | Right angle bracket. The lexer never produces `RANGLE`, and tensor types use `GT` instead |
| `COMMA` | `,` | Comma |
| `COLON` | `:` | Starts a type annotation |
| `SEMI` | `;` | Separates top-level declarations |
| `QUOTE` | `'` | Starts a type variable or a dimension variable |

## 2.8 Operator precedence

The table lists the operators from the lowest precedence to the highest. An operator with higher precedence binds more tightly, so `1 + 2 * 3` means `1 + (2 * 3)`.

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

## 2.9 Token examples

```bagl
let sum: int = 1 + 2 in sum
```

The lexer turns the line above into the following tokens.
```
LET IDENT("sum") COLON INT_TYPE EQ INT_LIT(1) PLUS INT_LIT(2) IN IDENT("sum") EOF
```
