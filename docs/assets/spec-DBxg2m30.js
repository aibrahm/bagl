import{j as e}from"./preload-helper-CkyS6jwL.js";import{t as r}from"./_virtual_toc-Dm_Ky1bC.js";import{D as t}from"./doc-page-CxP1cBkI.js";import"./shell-Cdyk8OT_.js";import"./examples-CwxgrFpf.js";import"./compiler-Dl0UKjtR.js";function i(s){const n={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",li:"li",ol:"ol",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"language-specification",children:"Language specification"}),`
`,e.jsxs(n.p,{children:["The specification gives the full rules of Bagl, chapter by chapter. ",e.jsx(n.a,{href:"/bagl/reference/",children:"The language reference"})," covers the same ground with runnable examples, and it is the better place to start."]}),`
`,e.jsx(n.h2,{id:"1-introduction",children:"1. Introduction"}),`
`,e.jsx(n.h3,{id:"11-overview",children:"1.1 Overview"}),`
`,e.jsx(n.p,{children:"Bagl (Basic Array/Graph Language) is a small functional programming language with static types and built-in tensors. A tensor is an array with one or more dimensions, e.g., a vector or a matrix. The type of a tensor includes its shape, so the compiler checks that tensor shapes fit together before the program runs. Bagl is meant for numerical code that works on arrays."}),`
`,e.jsx(n.h3,{id:"12-key-features",children:"1.2 Key features"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Bagl uses Hindley-Milner type inference with let-polymorphism. Hindley-Milner is the standard method for working out types without annotations, and let-polymorphism means a function bound with ",e.jsx(n.code,{children:"let"})," can be used at more than one type."]}),`
`,e.jsx(n.li,{children:"Tensors are built into the language, and the compiler checks their shapes at compile time."}),`
`,e.jsx(n.li,{children:"Functions are values, so you can pass them as arguments and return them from other functions. A function can also capture variables from the place where it was defined, and the function together with the captured variables is called a closure."}),`
`,e.jsxs(n.li,{children:["Shapes can contain dimension variables, e.g., ",e.jsx(n.code,{children:"'n"}),", so one function can work on tensors of many sizes."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"grad"})," turns a function into a new function that computes its derivative, which is called automatic differentiation."]}),`
`,e.jsx(n.li,{children:"The compiler reports a shape mismatch at compile time, before the program runs."}),`
`]}),`
`,e.jsx(n.h3,{id:"13-design-goals",children:"1.3 Design goals"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"Safety means that the compiler catches dimension mismatches and type errors at compile time."}),`
`,e.jsx(n.li,{children:"Expressiveness means that the language supports the common patterns of functional programming."}),`
`,e.jsx(n.li,{children:"Simplicity means that the core of the language is small, but complete."}),`
`,e.jsx(n.li,{children:"Predictability means that every construct has clear and deterministic behavior."}),`
`]}),`
`,e.jsx(n.h3,{id:"14-implementation",children:"1.4 Implementation"}),`
`,e.jsxs(n.p,{children:["The Bagl compiler is written in OCaml, and its source in ",e.jsx(n.code,{children:"src/"})," is about 5,200 lines. It runs a program through the following stages:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Source Code → Lexer → Parser → AST → grad Expansion → Type Inference → IR → Optimization → Bytecode → VM
`})}),`
`,e.jsx(n.p,{children:"The implementation has the following parts:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"A lexer written by hand, which records the source location of every token."}),`
`,e.jsx(n.li,{children:"A recursive descent parser, which has one function for each grammar rule."}),`
`,e.jsxs(n.li,{children:["A ",e.jsx(n.code,{children:"grad"})," expansion pass, which rewrites each ",e.jsx(n.code,{children:"grad (fn x -> ...)"})," into an ordinary function that computes the derivative. The pass runs before type inference, so the derivative is type checked like any other code."]}),`
`,e.jsx(n.li,{children:"Hindley-Milner type inference, extended with dimension variables."}),`
`,e.jsx(n.li,{children:"An intermediate representation (IR) built from basic blocks. A basic block is a run of instructions with no jumps into or out of its middle."}),`
`,e.jsx(n.li,{children:"Four optimization passes, which are constant folding, dead code elimination (DCE), copy propagation, and common subexpression elimination (CSE)."}),`
`,e.jsx(n.li,{children:"A virtual machine (VM) that keeps its working values on a stack and supports closures."}),`
`]}),`
`,e.jsx(n.h3,{id:"15-example-program",children:"1.5 Example program"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`// Matrix multiplication with compile-time shape checking
let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]] in
let c = dot(a, b) in  // Result has shape [2,2]
transpose(c)          // Result has shape [2,2]
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`// Higher-order functions
let compose = fn f -> fn g -> fn x -> f (g x) in
let double = fn x -> x * 2 in
let inc = fn x -> x + 1 in
compose double inc 5  // Result: 12
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`// Recursive functions
letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 5  // Result: 120
`})}),`
`,e.jsx(n.h3,{id:"16-document-structure",children:"1.6 Document structure"}),`
`,e.jsx(n.p,{children:"The specification has nine chapters, listed in the table below."}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Chapter"}),e.jsx(n.th,{children:"Content"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"02, Lexical structure"}),e.jsx(n.td,{children:"Tokens, keywords, literals, and comments"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"03, Grammar"}),e.jsx(n.td,{children:"The formal grammar in EBNF"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"04, Types"}),e.jsx(n.td,{children:"The type system and tensor types"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"05, Expressions"}),e.jsx(n.td,{children:"Every kind of expression"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"06, Type inference"}),e.jsx(n.td,{children:"The Hindley-Milner algorithm"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"07, Tensor semantics"}),e.jsx(n.td,{children:"Shape checking and tensor operations"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"08, Runtime"}),e.jsx(n.td,{children:"How the VM is built and how it runs a program"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"09, Bytecode"}),e.jsx(n.td,{children:"The instruction set"})]})]})]}),`
`,e.jsx(n.h3,{id:"17-notation-conventions",children:"1.7 Notation conventions"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Text in ",e.jsx(n.code,{children:"code"})," font is literal syntax or an identifier."]}),`
`,e.jsxs(n.li,{children:["Text in ",e.jsx(n.em,{children:"italics"})," is a metavariable, which is a placeholder for any piece of syntax of the named kind."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"[...]"})," marks an optional element."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"{...}"})," marks an element that can repeat zero or more times."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"|"})," separates alternatives."]}),`
`]}),`
`,e.jsx(n.h2,{id:"2-lexical-structure",children:"2. Lexical structure"}),`
`,e.jsx(n.p,{children:"Chapter 2 defines the tokens of Bagl. A token is the smallest unit the lexer reads from the source text, e.g., a keyword, a number, or an operator."}),`
`,e.jsx(n.h3,{id:"21-source-encoding",children:"2.1 Source encoding"}),`
`,e.jsxs(n.p,{children:["Bagl source files are UTF-8 text, and their file extension is ",e.jsx(n.code,{children:".bagl"}),"."]}),`
`,e.jsx(n.h3,{id:"22-whitespace-and-comments",children:"2.2 Whitespace and comments"}),`
`,e.jsx(n.h4,{id:"whitespace",children:"Whitespace"}),`
`,e.jsx(n.p,{children:"The whitespace characters are space, tab, newline, and carriage return. Whitespace separates tokens, and the lexer otherwise ignores it."}),`
`,e.jsx(n.h4,{id:"comments",children:"Comments"}),`
`,e.jsx(n.p,{children:"Bagl has two kinds of comments."}),`
`,e.jsxs(n.p,{children:["A line comment starts with ",e.jsx(n.code,{children:"//"})," and runs to the end of the line."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x = 5 in x  // This is a comment
`})}),`
`,e.jsxs(n.p,{children:["A block comment starts with ",e.jsx(n.code,{children:"/*"})," and ends with ",e.jsx(n.code,{children:"*/"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`/* This is a
   multi-line comment */
let x = 5 in x
`})}),`
`,e.jsxs(n.p,{children:["Block comments do not nest, so the first ",e.jsx(n.code,{children:"*/"})," ends the comment."]}),`
`,e.jsx(n.h3,{id:"23-keywords",children:"2.3 Keywords"}),`
`,e.jsx(n.p,{children:"The identifiers in the table below are reserved keywords."}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Keyword"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"let"})}),e.jsx(n.td,{children:"Binds a variable"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"letrec"})}),e.jsx(n.td,{children:"Binds a recursive variable"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"in"})}),e.jsx(n.td,{children:"Starts the body of a let expression"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"fn"})}),e.jsx(n.td,{children:"Starts a function definition"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"if"})}),e.jsx(n.td,{children:"Starts a conditional"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"then"})}),e.jsx(n.td,{children:"Starts the first branch of a conditional"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"else"})}),e.jsx(n.td,{children:"Starts the second branch of a conditional"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"true"})}),e.jsx(n.td,{children:"Boolean literal"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"false"})}),e.jsx(n.td,{children:"Boolean literal"})]})]})]}),`
`,e.jsx(n.h4,{id:"type-keywords",children:"Type keywords"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Keyword"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"int"})}),e.jsx(n.td,{children:"Integer type"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"float"})}),e.jsx(n.td,{children:"Float type"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"bool"})}),e.jsx(n.td,{children:"Boolean type"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"string"})}),e.jsx(n.td,{children:"String type"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"tensor"})}),e.jsx(n.td,{children:"Builds a tensor type"})]})]})]}),`
`,e.jsx(n.h4,{id:"tensor-operation-keywords",children:"Tensor operation keywords"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Keyword"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"dot"})}),e.jsx(n.td,{children:"Dot product of matrices or vectors"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"transpose"})}),e.jsx(n.td,{children:"Matrix transpose"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"reshape"})}),e.jsx(n.td,{children:"Gives a tensor a new shape"})]})]})]}),`
`,e.jsxs(n.p,{children:["The lexer also reserves ",e.jsx(n.code,{children:"exp"}),", ",e.jsx(n.code,{children:"log"}),", ",e.jsx(n.code,{children:"sqrt"}),", ",e.jsx(n.code,{children:"relu"}),", and ",e.jsx(n.code,{children:"step"})," as keywords. Each of them takes a float or a tensor, and on a tensor it works on each element."]}),`
`,e.jsx(n.h3,{id:"24-literals",children:"2.4 Literals"}),`
`,e.jsx(n.h4,{id:"integer-literals",children:"Integer literals"}),`
`,e.jsx(n.p,{children:"An integer literal is a sequence of decimal digits."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`INT_LIT ::= [0-9]+
`})}),`
`,e.jsxs(n.p,{children:["A literal never includes a minus sign. A leading minus sign is a separate ",e.jsx(n.code,{children:"MINUS"})," token, which the parser reads as negation. For example, ",e.jsx(n.code,{children:"-17"})," is the negation of ",e.jsx(n.code,{children:"17"}),"."]}),`
`,e.jsxs(n.p,{children:["Examples: ",e.jsx(n.code,{children:"0"}),", ",e.jsx(n.code,{children:"42"}),", ",e.jsx(n.code,{children:"-17"}),", ",e.jsx(n.code,{children:"1000"})]}),`
`,e.jsx(n.h4,{id:"float-literals",children:"Float literals"}),`
`,e.jsx(n.p,{children:"A float literal has a decimal point, an exponent, or both."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`FLOAT_LIT ::= [0-9]+ ('.' [0-9]+)? ([eE] [+-]? [0-9]+)?
`})}),`
`,e.jsx(n.p,{children:"A number with neither a decimal point nor an exponent is an integer literal instead. As with integers, a leading minus sign is a separate token."}),`
`,e.jsxs(n.p,{children:["Examples: ",e.jsx(n.code,{children:"3.14"}),", ",e.jsx(n.code,{children:"-0.5"}),", ",e.jsx(n.code,{children:"1.0e10"}),", ",e.jsx(n.code,{children:"2.5e-3"})]}),`
`,e.jsx(n.h4,{id:"boolean-literals",children:"Boolean literals"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`BOOL_LIT ::= 'true' | 'false'
`})}),`
`,e.jsx(n.h4,{id:"string-literals",children:"String literals"}),`
`,e.jsx(n.p,{children:"A string literal is text between double quotes. It can contain escape sequences, which are a backslash followed by one character."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`STRING_LIT ::= '"' (char | escape)* '"'
escape     ::= '\\\\' ('n' | 't' | 'r' | '\\\\' | '"')
`})}),`
`,e.jsx(n.p,{children:"A string literal can't contain a newline."}),`
`,e.jsxs(n.p,{children:["Examples: ",e.jsx(n.code,{children:'"hello"'}),", ",e.jsx(n.code,{children:'"line\\nbreak"'}),", ",e.jsx(n.code,{children:'"say \\"hi\\""'})]}),`
`,e.jsx(n.h3,{id:"25-identifiers",children:"2.5 Identifiers"}),`
`,e.jsx(n.p,{children:"An identifier starts with a letter or an underscore. The rest of it can be letters, digits, and underscores."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`IDENT ::= [a-zA-Z_] [a-zA-Z0-9_]*
`})}),`
`,e.jsxs(n.p,{children:["A keyword can't be used as an identifier. The name ",e.jsx(n.code,{children:"grad"})," is not a keyword, but the compiler gives special meaning to ",e.jsx(n.code,{children:"grad"})," applied to a function, as section 5.12 describes."]}),`
`,e.jsxs(n.p,{children:["Examples: ",e.jsx(n.code,{children:"x"}),", ",e.jsx(n.code,{children:"myVar"}),", ",e.jsx(n.code,{children:"matrix_2d"}),", ",e.jsx(n.code,{children:"_helper"})]}),`
`,e.jsx(n.h3,{id:"26-operators",children:"2.6 Operators"}),`
`,e.jsx(n.h4,{id:"arithmetic-operators",children:"Arithmetic operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Token"}),e.jsx(n.th,{children:"Symbol"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"PLUS"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"+"})}),e.jsx(n.td,{children:"Addition"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"MINUS"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"-"})}),e.jsx(n.td,{children:"Subtraction"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"STAR"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"*"})}),e.jsx(n.td,{children:"Multiplication"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"SLASH"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"/"})}),e.jsx(n.td,{children:"Division"})]})]})]}),`
`,e.jsx(n.h4,{id:"comparison-operators",children:"Comparison operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Token"}),e.jsx(n.th,{children:"Symbol"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"EQEQ"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"=="})}),e.jsx(n.td,{children:"Equal"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"NEQ"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"!="})}),e.jsx(n.td,{children:"Not equal"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"LT"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"<"})}),e.jsx(n.td,{children:"Less than"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"GT"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:">"})}),e.jsx(n.td,{children:"Greater than"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"LE"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"<="})}),e.jsx(n.td,{children:"Less than or equal"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"GE"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:">="})}),e.jsx(n.td,{children:"Greater than or equal"})]})]})]}),`
`,e.jsx(n.h4,{id:"logical-operators",children:"Logical operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Token"}),e.jsx(n.th,{children:"Symbol"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"AMPAMP"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"&&"})}),e.jsx(n.td,{children:"Logical and"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"PIPEPIPE"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"||"})}),e.jsx(n.td,{children:"Logical or"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"BANG"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"!"})}),e.jsx(n.td,{children:"Logical not"})]})]})]}),`
`,e.jsx(n.h4,{id:"other-operators",children:"Other operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Token"}),e.jsx(n.th,{children:"Symbol"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"EQ"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"="})}),e.jsxs(n.td,{children:["Binds a name in ",e.jsx(n.code,{children:"let"})," and ",e.jsx(n.code,{children:"letrec"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"ARROW"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"->"})}),e.jsx(n.td,{children:"Function arrow"})]})]})]}),`
`,e.jsx(n.h3,{id:"27-delimiters",children:"2.7 Delimiters"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Token"}),e.jsx(n.th,{children:"Symbol"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"LPAREN"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"("})}),e.jsx(n.td,{children:"Left parenthesis"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"RPAREN"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:")"})}),e.jsx(n.td,{children:"Right parenthesis"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"LBRACKET"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"["})}),e.jsx(n.td,{children:"Left bracket"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"RBRACKET"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"]"})}),e.jsx(n.td,{children:"Right bracket"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"LANGLE"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"<"})}),e.jsxs(n.td,{children:["Left angle bracket. The lexer never produces ",e.jsx(n.code,{children:"LANGLE"}),", and tensor types use ",e.jsx(n.code,{children:"LT"})," instead"]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"RANGLE"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:">"})}),e.jsxs(n.td,{children:["Right angle bracket. The lexer never produces ",e.jsx(n.code,{children:"RANGLE"}),", and tensor types use ",e.jsx(n.code,{children:"GT"})," instead"]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"COMMA"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:","})}),e.jsx(n.td,{children:"Comma"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"COLON"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:":"})}),e.jsx(n.td,{children:"Starts a type annotation"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"SEMI"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:";"})}),e.jsx(n.td,{children:"Separates top-level declarations"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"QUOTE"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"'"})}),e.jsx(n.td,{children:"Starts a type variable or a dimension variable"})]})]})]}),`
`,e.jsx(n.h3,{id:"28-operator-precedence",children:"2.8 Operator precedence"}),`
`,e.jsxs(n.p,{children:["The table lists the operators from the lowest precedence to the highest. An operator with higher precedence binds more tightly, so ",e.jsx(n.code,{children:"1 + 2 * 3"})," means ",e.jsx(n.code,{children:"1 + (2 * 3)"}),"."]}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Level"}),e.jsx(n.th,{children:"Operators"}),e.jsx(n.th,{children:"Associativity"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"1"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"||"})}),e.jsx(n.td,{children:"Left"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"2"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"&&"})}),e.jsx(n.td,{children:"Left"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"3"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"=="})," ",e.jsx(n.code,{children:"!="})]}),e.jsx(n.td,{children:"Left"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"4"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"<"})," ",e.jsx(n.code,{children:">"})," ",e.jsx(n.code,{children:"<="})," ",e.jsx(n.code,{children:">="})]}),e.jsx(n.td,{children:"Left"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"5"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"+"})," ",e.jsx(n.code,{children:"-"})]}),e.jsx(n.td,{children:"Left"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"6"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"*"})," ",e.jsx(n.code,{children:"/"})]}),e.jsx(n.td,{children:"Left"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"7"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"-"})," ",e.jsx(n.code,{children:"!"})," (unary)"]}),e.jsx(n.td,{children:"Right"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"8"}),e.jsx(n.td,{children:"Function application"}),e.jsx(n.td,{children:"Left"})]})]})]}),`
`,e.jsx(n.h3,{id:"29-token-examples",children:"2.9 Token examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let sum: int = 1 + 2 in sum
`})}),`
`,e.jsx(n.p,{children:"The lexer turns the line above into the following tokens."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`LET IDENT("sum") COLON INT_TYPE EQ INT_LIT(1) PLUS INT_LIT(2) IN IDENT("sum") EOF
`})}),`
`,e.jsx(n.h2,{id:"3-formal-grammar",children:"3. Formal grammar"}),`
`,e.jsx(n.p,{children:"Chapter 3 gives the complete grammar of Bagl in Extended Backus-Naur Form (EBNF). EBNF is a standard notation for grammars, and each rule in it names a piece of syntax and lists what that piece can contain."}),`
`,e.jsx(n.h3,{id:"31-notation",children:"3.1 Notation"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`::=     Definition
|       Alternative
[ ]     Optional (0 or 1)
{ }     Repetition (0 or more)
( )     Grouping
'x'     Terminal symbol
`})}),`
`,e.jsx(n.h3,{id:"32-complete-grammar",children:"3.2 Complete grammar"}),`
`,e.jsx(n.h4,{id:"program-structure",children:"Program structure"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ebnf",children:`program     ::= { decl [';'] }

decl        ::= expr
`})}),`
`,e.jsx(n.h4,{id:"expressions",children:"Expressions"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ebnf",children:`expr        ::= let_expr
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
`})}),`
`,e.jsxs(n.p,{children:["The annotation on a ",e.jsx(n.code,{children:"fn"})," parameter is a ",e.jsx(n.code,{children:"simple_type"}),", so an arrow type there needs parentheses, e.g., ",e.jsx(n.code,{children:"fn f: (int -> int) -> f 5"}),". Without the parentheses, the parser would read the arrow of the type as the arrow of the function."]}),`
`,e.jsxs(n.p,{children:["An ",e.jsx(n.code,{children:"argument"})," is a smaller set than ",e.jsx(n.code,{children:"primary"}),". To pass the result of ",e.jsx(n.code,{children:"dot"}),", ",e.jsx(n.code,{children:"transpose"}),", ",e.jsx(n.code,{children:"reshape"}),", or a math function to a function, put it in parentheses, e.g., ",e.jsx(n.code,{children:"f (dot(a, b))"}),"."]}),`
`,e.jsxs(n.p,{children:["The parser has no separate rule for ",e.jsx(n.code,{children:"grad_expr"}),". It reads ",e.jsx(n.code,{children:"grad"})," as an ordinary ",e.jsx(n.code,{children:"IDENT"})," and ",e.jsx(n.code,{children:"grad (fn x -> e)"})," as an application. The ",e.jsx(n.code,{children:"grad"})," pass then requires the argument to be a function literal in parentheses, as ",e.jsx(n.code,{children:"grad_expr"})," shows, and it reports a compile error otherwise. Section 5.12 describes ",e.jsx(n.code,{children:"grad"}),"."]}),`
`,e.jsx(n.h4,{id:"binary-operators",children:"Binary operators"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ebnf",children:`binop       ::= '||' | '&&'
              | '==' | '!='
              | '<' | '>' | '<=' | '>='
              | '+' | '-'
              | '*' | '/'
`})}),`
`,e.jsx(n.h4,{id:"tensor-literals-and-operations",children:"Tensor literals and operations"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ebnf",children:`tensor_lit  ::= '[' [tensor_contents] ']' [':' shape]

tensor_contents ::= tensor_row { ',' tensor_row }
                  | expr { ',' expr }

tensor_row  ::= '[' expr { ',' expr } ']'

tensor_op   ::= 'dot' '(' expr ',' expr ')'
              | 'transpose' '(' expr ')'
              | 'reshape' '(' expr ',' shape ')'

math_op     ::= ('exp' | 'log' | 'sqrt' | 'relu' | 'step') '(' expr ')'
`})}),`
`,e.jsx(n.h4,{id:"type-annotations",children:"Type annotations"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ebnf",children:`type_annot  ::= arrow_type

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
`})}),`
`,e.jsx(n.h4,{id:"lexical-elements",children:"Lexical elements"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ebnf",children:`INT_LIT     ::= digit { digit }

FLOAT_LIT   ::= digit { digit } '.' digit { digit } [ exponent ]
              | digit { digit } exponent

exponent    ::= ('e' | 'E') ['+' | '-'] digit { digit }

BOOL_LIT    ::= 'true' | 'false'

STRING_LIT  ::= '"' { string_char } '"'

string_char ::= <any character except '"', '\\', or a newline>
              | '\\' escape_char

escape_char ::= 'n' | 't' | 'r' | '\\\\' | '"'

IDENT       ::= letter { letter | digit | '_' }

letter      ::= 'a'..'z' | 'A'..'Z' | '_'

digit       ::= '0'..'9'
`})}),`
`,e.jsx(n.h3,{id:"33-grammar-properties",children:"3.3 Grammar properties"}),`
`,e.jsx(n.h4,{id:"precedence-climbing",children:"Precedence climbing"}),`
`,e.jsx(n.p,{children:"The parser reads binary operators with precedence climbing, which gives each operator the right precedence and associativity. Precedence climbing is a parsing method that uses the precedence of each operator to decide how to group the operands. The levels are listed below."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Precedence 1: ||          (left-associative)
Precedence 2: &&          (left-associative)
Precedence 3: == !=       (left-associative)
Precedence 4: < > <= >=   (left-associative)
Precedence 5: + -         (left-associative)
Precedence 6: * /         (left-associative)
`})}),`
`,e.jsx(n.h4,{id:"function-application",children:"Function application"}),`
`,e.jsx(n.p,{children:"Function application has the highest precedence, and it groups to the left. The example below shows the grouping."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`f x y z   // Parsed as ((f x) y) z
`})}),`
`,e.jsx(n.h4,{id:"arrow-types",children:"Arrow types"}),`
`,e.jsx(n.p,{children:"The arrow in a function type groups to the right. The example below shows the grouping."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`int -> int -> int   // Parsed as int -> (int -> int)
`})}),`
`,e.jsx(n.h3,{id:"34-example-parses",children:"3.4 Example parses"}),`
`,e.jsx(n.h4,{id:"let-expression",children:"Let expression"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x: int = 5 in x + 1
`})}),`
`,e.jsx(n.p,{children:"The parser builds the following tree."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`ELet
├── name: "x"
├── annot: TAInt
├── value: EInt(5)
└── body: EBinop(Add)
    ├── EVar("x")
    └── EInt(1)
`})}),`
`,e.jsx(n.h4,{id:"function-definition",children:"Function definition"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`fn x -> fn y -> x + y
`})}),`
`,e.jsx(n.p,{children:"The parser builds the following tree."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`EFn
├── param: "x"
└── body: EFn
    ├── param: "y"
    └── body: EBinop(Add)
        ├── EVar("x")
        └── EVar("y")
`})}),`
`,e.jsx(n.h4,{id:"tensor-operation",children:"Tensor operation"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`dot(a, b)
`})}),`
`,e.jsx(n.p,{children:"The parser builds the following tree."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`ETensorOp(TensorDot)
├── EVar("a")
└── EVar("b")
`})}),`
`,e.jsx(n.h3,{id:"35-syntactic-sugar",children:"3.5 Syntactic sugar"}),`
`,e.jsx(n.p,{children:"Bagl has very little syntactic sugar, which is syntax that the compiler rewrites into other syntax. Each construct maps directly to one node of the abstract syntax tree (AST), as the table shows."}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Syntax"}),e.jsx(n.th,{children:"AST Node"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"let x = e1 in e2"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:'ELet { name="x"; value=e1; body=e2 }'})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"fn x -> e"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:'EFn { param="x"; body=e }'})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"if c then t else e"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"EIf { cond=c; then_branch=t; else_branch=e }"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"e1 + e2"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"EBinop(Add, e1, e2)"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-e"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"EUnop(Neg, e)"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"f x"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"EApp(f, x)"})})]})]})]}),`
`,e.jsx(n.h2,{id:"4-type-system",children:"4. Type system"}),`
`,e.jsx(n.p,{children:"Bagl has a static type system based on Hindley-Milner, with two extensions. The first extension adds tensor types. The second adds dimension polymorphism, which lets one function accept tensors of many sizes."}),`
`,e.jsx(n.h3,{id:"41-base-types",children:"4.1 Base types"}),`
`,e.jsx(n.h4,{id:"primitive-types",children:"Primitive types"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Type"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Examples"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"int"})}),e.jsxs(n.td,{children:["Integers, stored as OCaml ",e.jsx(n.code,{children:"int"})," values"]}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"0"}),", ",e.jsx(n.code,{children:"42"}),", ",e.jsx(n.code,{children:"-17"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"float"})}),e.jsx(n.td,{children:"IEEE 754 double-precision numbers"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"3.14"}),", ",e.jsx(n.code,{children:"-0.5"}),", ",e.jsx(n.code,{children:"1e10"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"bool"})}),e.jsx(n.td,{children:"Boolean values"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"true"}),", ",e.jsx(n.code,{children:"false"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"string"})}),e.jsx(n.td,{children:"UTF-8 text"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:'"hello"'}),", ",e.jsx(n.code,{children:'""'})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"()"})}),e.jsx(n.td,{children:"Unit type, used only inside the compiler"}),e.jsx(n.td,{children:"The unit value"})]})]})]}),`
`,e.jsx(n.h4,{id:"type-syntax",children:"Type syntax"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`int                    // Integer type
float                  // Float type
bool                   // Boolean type
string                 // String type
`})}),`
`,e.jsx(n.h3,{id:"42-function-types",children:"4.2 Function types"}),`
`,e.jsxs(n.p,{children:["A function type is written with an arrow, ",e.jsx(n.code,{children:"->"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`T1 -> T2
`})}),`
`,e.jsxs(n.p,{children:["In the type above, ",e.jsx(n.code,{children:"T1"})," is the parameter type, and ",e.jsx(n.code,{children:"T2"})," is the return type."]}),`
`,e.jsx(n.h4,{id:"properties",children:"Properties"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The arrow groups to the right, so ",e.jsx(n.code,{children:"A -> B -> C"})," means ",e.jsx(n.code,{children:"A -> (B -> C)"}),"."]}),`
`,e.jsx(n.li,{children:"Functions are curried. A function of several arguments is a function of one argument that returns another function, which takes the next argument."}),`
`]}),`
`,e.jsx(n.h4,{id:"examples",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`int -> int                      // int to int function
int -> int -> int               // Curried two-argument function
(int -> int) -> int             // Function taking a function
tensor<float>[2,3] -> float     // Tensor to scalar
`})}),`
`,e.jsx(n.h3,{id:"43-tensor-types",children:"4.3 Tensor types"}),`
`,e.jsx(n.p,{children:"A tensor is an array of numbers, and the compiler knows its shape at compile time. A tensor type has the following form."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`tensor<E>[D1, D2, ..., Dn]
`})}),`
`,e.jsxs(n.p,{children:["In the form above, ",e.jsx(n.code,{children:"E"})," is the element type, and each ",e.jsx(n.code,{children:"Di"})," gives the size of one dimension. The element type must be ",e.jsx(n.code,{children:"float"}),", because the type checker requires float elements in every tensor value. The VM also stores every tensor element as a float."]}),`
`,e.jsx(n.h4,{id:"dimension-specifications",children:"Dimension specifications"}),`
`,e.jsx(n.p,{children:"A dimension can take one of two forms:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["A concrete size, which is an integer constant, e.g., ",e.jsx(n.code,{children:"2"}),", ",e.jsx(n.code,{children:"3"}),", or ",e.jsx(n.code,{children:"100"}),"."]}),`
`,e.jsxs(n.li,{children:["A dimension variable, e.g., ",e.jsx(n.code,{children:"'n"})," or ",e.jsx(n.code,{children:"'m"}),", which stands for a size that the compiler works out from how the tensor is used."]}),`
`]}),`
`,e.jsx(n.h4,{id:"examples-1",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`tensor<float>[3]           // 1D tensor with 3 elements
tensor<float>[2, 3]        // 2x3 matrix
tensor<float>[4, 4, 4]     // 3D tensor
tensor<float>['n, 'm]      // Matrix with variable dimensions
tensor<float>['n, 'n]      // Square matrix
`})}),`
`,e.jsx(n.h4,{id:"shape-rank",children:"Shape rank"}),`
`,e.jsx(n.p,{children:"The rank of a tensor is the number of its dimensions."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["A tensor of rank 0 is a scalar, and its shape is empty, ",e.jsx(n.code,{children:"[]"}),"."]}),`
`,e.jsxs(n.li,{children:["A tensor of rank 1 is a vector, with shape ",e.jsx(n.code,{children:"[n]"}),"."]}),`
`,e.jsxs(n.li,{children:["A tensor of rank 2 is a matrix, with shape ",e.jsx(n.code,{children:"[m, n]"}),"."]}),`
`,e.jsx(n.li,{children:"A tensor of rank 3 or more has no special name."}),`
`]}),`
`,e.jsx(n.h3,{id:"44-type-variables",children:"4.4 Type variables"}),`
`,e.jsx(n.p,{children:"A type variable stands for any type. Type variables make polymorphism possible, which means one function can work on values of different types."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`'a                    // Type variable
'a -> 'a              // Identity function type
'a -> 'b -> 'a        // Constant function type
`})}),`
`,e.jsx(n.h4,{id:"type-variable-naming",children:"Type variable naming"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["A type variable starts with a quote, e.g., ",e.jsx(n.code,{children:"'a"}),", ",e.jsx(n.code,{children:"'b"}),", or ",e.jsx(n.code,{children:"'foo"}),"."]}),`
`,e.jsxs(n.li,{children:["By convention, the name after the quote is a single letter, e.g., ",e.jsx(n.code,{children:"'a"}),", ",e.jsx(n.code,{children:"'b"}),", or ",e.jsx(n.code,{children:"'c"}),"."]}),`
`]}),`
`,e.jsx(n.h3,{id:"45-type-schemes-polymorphism",children:"4.5 Type schemes (polymorphism)"}),`
`,e.jsxs(n.p,{children:["A type scheme is a type with a list of type variables that can each be replaced by any type. The ",e.jsx(n.code,{children:"forall"})," in front lists the variables."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`forall 'a 'b 'n. T
`})}),`
`,e.jsxs(n.p,{children:["The compiler creates a type scheme when it checks a ",e.jsx(n.code,{children:"let"})," binding. The process is called let-polymorphism, and the example below shows it."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let id = fn x -> x in      // id : forall 'a. 'a -> 'a
let _ = id 5 in            // Instantiated to int -> int
let _ = id true in         // Instantiated to bool -> bool
id
`})}),`
`,e.jsx(n.h4,{id:"generalization-rules",children:"Generalization rules"}),`
`,e.jsx(n.p,{children:"Generalization is the step that turns a type into a type scheme. A type variable is generalized when both of the following hold:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"The variable is not free in the surrounding environment, which means no variable already in scope has it in its type."}),`
`,e.jsx(n.li,{children:"The variable was created at a deeper level than the current binding."}),`
`]}),`
`,e.jsx(n.h3,{id:"46-type-annotations",children:"4.6 Type annotations"}),`
`,e.jsx(n.p,{children:"A type annotation limits the type that the compiler infers. If the inferred type doesn't match the annotation, the compiler reports an error."}),`
`,e.jsx(n.h4,{id:"binding-annotations",children:"Binding annotations"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x: int = 5 in
let f: int -> int = fn x -> x + 1 in
f x  // Result: 6
`})}),`
`,e.jsx(n.h4,{id:"parameter-annotations",children:"Parameter annotations"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let inc = fn x: int -> x + 1 in
let apply5 = fn f: (int -> int) -> f 5 in
apply5 inc  // Result: 6
`})}),`
`,e.jsx(n.h4,{id:"tensor-annotations",children:"Tensor annotations"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let v: tensor<float>[3] = [1.0, 2.0, 3.0] in
let m: tensor<float>[2, 3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
dot(m, v)  // Result: [14, 32], with type tensor<float>[2]
`})}),`
`,e.jsx(n.h3,{id:"47-type-compatibility",children:"4.7 Type compatibility"}),`
`,e.jsx(n.h4,{id:"subtyping",children:"Subtyping"}),`
`,e.jsx(n.p,{children:"Bagl does not have subtyping, so two types must match exactly after unification. Unification is the step that makes two types equal by filling in their type variables."}),`
`,e.jsx(n.h4,{id:"numeric-coercion",children:"Numeric coercion"}),`
`,e.jsxs(n.p,{children:["Bagl never converts between ",e.jsx(n.code,{children:"int"})," and ",e.jsx(n.code,{children:"float"})," on its own. For scalars, both operands of an arithmetic operator must have the same type. The first example adds two ints and then two floats, and the second example mixes an int with a float."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = 1 + 2 in      // int + int = int
let b = 1.0 + 2.0 in  // float + float = float
b                     // Result: 3.0
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`1 + 2.0  // Error: Cannot unify int with float
`})}),`
`,e.jsx(n.h4,{id:"tensor-element-types",children:"Tensor element types"}),`
`,e.jsx(n.p,{children:"Tensor operations keep the element type of their operands."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]] in
dot(a, b)      // Result: tensor<float>[2,2]
`})}),`
`,e.jsx(n.h3,{id:"48-type-equality",children:"4.8 Type equality"}),`
`,e.jsx(n.p,{children:"Two types are equal when they have the same structure, as the table shows."}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Type 1"}),e.jsx(n.th,{children:"Type 2"}),e.jsx(n.th,{children:"Equal?"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"int"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int"})}),e.jsx(n.td,{children:"Yes"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"int"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"float"})}),e.jsx(n.td,{children:"No"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int"})}),e.jsx(n.td,{children:"Yes"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> float"})}),e.jsx(n.td,{children:"No"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"tensor<float>[2,3]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"tensor<float>[2,3]"})}),e.jsx(n.td,{children:"Yes"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"tensor<float>[2,3]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"tensor<float>[3,2]"})}),e.jsx(n.td,{children:"No"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"'a -> 'a"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"'b -> 'b"})}),e.jsx(n.td,{children:"Yes, after renaming the variables"})]})]})]}),`
`,e.jsx(n.h3,{id:"49-type-errors",children:"4.9 Type errors"}),`
`,e.jsx(n.p,{children:"The sections below show the most common type errors."}),`
`,e.jsx(n.h4,{id:"type-mismatch",children:"Type mismatch"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x: int = true in x  // Error: Cannot unify int with bool
`})}),`
`,e.jsx(n.h4,{id:"dimension-mismatch",children:"Dimension mismatch"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[2,3] = [[1.0, 2.0], [3.0, 4.0]] in
a  // Error: Dimension mismatch: 3 vs 2
`})}),`
`,e.jsx(n.h4,{id:"unbound-variable",children:"Unbound variable"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`x + 1    // Error: Unbound variable: x
`})}),`
`,e.jsx(n.h4,{id:"shape-rank-mismatch",children:"Shape rank mismatch"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let v: tensor<float>[3] = [1.0, 2.0, 3.0] in
transpose(v)    // Error: transpose requires 2D tensor
`})}),`
`,e.jsx(n.h3,{id:"410-type-representation-internal",children:"4.10 Type representation (internal)"}),`
`,e.jsx(n.p,{children:"The compiler stores types with the following OCaml definitions."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`type ty =
  | TInt
  | TFloat
  | TBool
  | TString
  | TUnit
  | TTensor of ty * shape
  | TArrow of ty * ty
  | TVar of tvar ref        (* Unification variable *)

type shape_dim =
  | SDimConst of int        (* Concrete dimension *)
  | SDimVar of dim_var ref  (* Dimension variable *)
`})}),`
`,e.jsx(n.p,{children:"Each type variable is a mutable reference. When unification solves a variable, the compiler points the reference at the solution. Path compression then shortens chains of such links, so later lookups are fast."}),`
`,e.jsx(n.h2,{id:"5-expressions",children:"5. Expressions"}),`
`,e.jsx(n.p,{children:"Every Bagl program is an expression, and running the program evaluates the expression to a value. Chapter 5 describes each kind of expression."}),`
`,e.jsx(n.h3,{id:"51-literals",children:"5.1 Literals"}),`
`,e.jsx(n.p,{children:"Each line in the blocks of section 5.1 is a separate literal, and each literal on its own is a complete program."}),`
`,e.jsx(n.h4,{id:"integer-literals-1",children:"Integer literals"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`42
-17
0
`})}),`
`,e.jsxs(n.p,{children:["The type is ",e.jsx(n.code,{children:"int"}),". The ",e.jsx(n.code,{children:"-17"})," line is the negation of the literal ",e.jsx(n.code,{children:"17"}),", as section 2.4 explains."]}),`
`,e.jsx(n.h4,{id:"float-literals-1",children:"Float literals"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`3.14
-0.5
1.0e10
2.5e-3
`})}),`
`,e.jsxs(n.p,{children:["The type is ",e.jsx(n.code,{children:"float"}),"."]}),`
`,e.jsx(n.h4,{id:"boolean-literals-1",children:"Boolean literals"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`true
false
`})}),`
`,e.jsxs(n.p,{children:["The type is ",e.jsx(n.code,{children:"bool"}),"."]}),`
`,e.jsx(n.h4,{id:"string-literals-1",children:"String literals"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`"hello"
"line\\nbreak"
""
`})}),`
`,e.jsxs(n.p,{children:["The type is ",e.jsx(n.code,{children:"string"}),"."]}),`
`,e.jsx(n.h4,{id:"tensor-literals",children:"Tensor literals"}),`
`,e.jsx(n.p,{children:"Tensor elements must be floats, and the type checker rejects a tensor literal with int elements."}),`
`,e.jsx(n.p,{children:"A literal with one level of brackets is a 1D tensor, which is a vector."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1.0, 2.0, 3.0]  // Type: tensor<float>[3]
`})}),`
`,e.jsx(n.p,{children:"A literal with two levels of brackets is a 2D tensor, which is a matrix."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[[1.0, 2.0], [3.0, 4.0]]  // Type: tensor<float>[2, 2]
`})}),`
`,e.jsx(n.p,{children:"A literal can also carry an explicit shape annotation."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] : [2, 3]
`})}),`
`,e.jsx(n.p,{children:"A literal with int elements fails to type check."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1, 2, 3]  // Error: Cannot unify int with float
`})}),`
`,e.jsx(n.h3,{id:"52-variables",children:"5.2 Variables"}),`
`,e.jsx(n.p,{children:"A variable refers to a value that has been bound to a name. The names below are examples of variables."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`x
myVariable
_helper
`})}),`
`,e.jsxs(n.p,{children:["A variable must be bound before it is used. A ",e.jsx(n.code,{children:"let"})," binding, a ",e.jsx(n.code,{children:"letrec"})," binding, or a function parameter can bind it."]}),`
`,e.jsx(n.h3,{id:"53-let-expressions",children:"5.3 Let expressions"}),`
`,e.jsx(n.p,{children:"A let expression binds a value to a name. It has one of the two forms below."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`let name = value in body
let name: type = value in body
`})}),`
`,e.jsx(n.h4,{id:"semantics",children:"Semantics"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["The program evaluates ",e.jsx(n.code,{children:"value"}),"."]}),`
`,e.jsxs(n.li,{children:["It binds the result to ",e.jsx(n.code,{children:"name"}),"."]}),`
`,e.jsxs(n.li,{children:["It evaluates ",e.jsx(n.code,{children:"body"}),", with ",e.jsx(n.code,{children:"name"})," in scope."]}),`
`,e.jsxs(n.li,{children:["The result of ",e.jsx(n.code,{children:"body"})," is the result of the whole expression."]}),`
`]}),`
`,e.jsx(n.h4,{id:"examples-2",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x = 5 in x + 1  // Result: 6
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x = 5 in
let y = 10 in
x + y  // Result: 15
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let double = fn x -> x * 2 in
double 21  // Result: 42
`})}),`
`,e.jsx(n.h4,{id:"let-polymorphism",children:"Let-polymorphism"}),`
`,e.jsxs(n.p,{children:["A value bound with ",e.jsx(n.code,{children:"let"})," can be used at more than one type, as the example shows."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let id = fn x -> x in
let a = id 5 in     // id used at int -> int
let b = id true in  // id used at bool -> bool
a                   // Result: 5
`})}),`
`,e.jsx(n.h3,{id:"54-recursive-let-letrec",children:"5.4 Recursive let (letrec)"}),`
`,e.jsxs(n.p,{children:["A ",e.jsx(n.code,{children:"letrec"})," expression binds a recursive function. It has one of the two forms below."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`letrec name = value in body
letrec name: type = value in body
`})}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.code,{children:"value"})," must be a function, written with ",e.jsx(n.code,{children:"fn"}),", and the function can call itself by ",e.jsx(n.code,{children:"name"}),"."]}),`
`,e.jsx(n.h4,{id:"examples-3",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 5  // Result: 120
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`letrec fib = fn n ->
  if n <= 1 then n
  else fib (n - 1) + fib (n - 2)
in fib 10  // Result: 55
`})}),`
`,e.jsx(n.h3,{id:"55-function-expressions",children:"5.5 Function expressions"}),`
`,e.jsx(n.p,{children:"A function expression defines a function that has no name. It has one of the two forms below."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`fn param -> body
fn param: type -> body
`})}),`
`,e.jsx(n.h4,{id:"semantics-1",children:"Semantics"}),`
`,e.jsx(n.p,{children:"A function expression creates a closure. The closure keeps the values of the variables that the function body uses from the surrounding scope."}),`
`,e.jsx(n.h4,{id:"examples-4",children:"Examples"}),`
`,e.jsx(n.p,{children:"Each example binds the function to a name and returns it, so the result is the function and its type."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let inc = fn x -> x + 1 in inc  // Type: int -> int
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let add = fn x -> fn y -> x + y in add  // Type: int -> int -> int
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let twice = fn f -> fn x -> f (f x) in twice  // Type: ('a -> 'a) -> 'a -> 'a
`})}),`
`,e.jsx(n.p,{children:"The compiler may print a different letter for the type variable in the last example."}),`
`,e.jsx(n.h4,{id:"currying",children:"Currying"}),`
`,e.jsx(n.p,{children:"A function of several arguments is written as nested functions of one argument each. Applying such a function to fewer arguments than it takes is called partial application, and the result is a function that takes the remaining arguments."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let add = fn x -> fn y -> x + y in
add 3 5  // Result: 8
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let add = fn x -> fn y -> x + y in
let add3 = add 3 in  // Partial application
add3 5               // Result: 8
`})}),`
`,e.jsx(n.h3,{id:"56-function-application",children:"5.6 Function application"}),`
`,e.jsx(n.p,{children:"To apply a function, write the function followed by its argument. Application groups to the left."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`f x
f x y z  // Same as ((f x) y) z
`})}),`
`,e.jsx(n.h4,{id:"semantics-2",children:"Semantics"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"The program evaluates the function expression."}),`
`,e.jsx(n.li,{children:"It evaluates the argument expression."}),`
`,e.jsx(n.li,{children:"It binds the argument to the parameter."}),`
`,e.jsx(n.li,{children:"It evaluates the function body."}),`
`,e.jsx(n.li,{children:"The result of the body is the result of the application."}),`
`]}),`
`,e.jsx(n.h4,{id:"examples-5",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let double = fn x -> x * 2 in
double 21  // Result: 42
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let double = fn x -> x * 2 in
let compose = fn f -> fn g -> fn x -> f (g x) in
let inc = fn x -> x + 1 in
compose double inc 5  // Result: 12
`})}),`
`,e.jsx(n.h3,{id:"57-conditional-expressions",children:"5.7 Conditional expressions"}),`
`,e.jsx(n.p,{children:"A conditional expression has the form below."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`if condition then expr1 else expr2
`})}),`
`,e.jsx(n.h4,{id:"semantics-3",children:"Semantics"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["The program evaluates ",e.jsx(n.code,{children:"condition"}),", which must have type ",e.jsx(n.code,{children:"bool"}),"."]}),`
`,e.jsxs(n.li,{children:["If the condition is true, the program evaluates ",e.jsx(n.code,{children:"expr1"})," and returns its value."]}),`
`,e.jsxs(n.li,{children:["If the condition is false, the program evaluates ",e.jsx(n.code,{children:"expr2"})," and returns its value."]}),`
`]}),`
`,e.jsx(n.p,{children:"Both branches must have the same type."}),`
`,e.jsx(n.h4,{id:"examples-6",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`if true then 1 else 2  // Result: 1
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let max = fn x -> fn y ->
  if x > y then x else y
in max 5 3  // Result: 5
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let abs = fn x ->
  if x < 0 then -x else x
in abs (-5)  // Result: 5
`})}),`
`,e.jsx(n.h3,{id:"58-binary-operators",children:"5.8 Binary operators"}),`
`,e.jsx(n.p,{children:"A binary operator goes between its two operands."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`expr1 op expr2
`})}),`
`,e.jsx(n.h4,{id:"arithmetic-operators-1",children:"Arithmetic operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Operator"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Types"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"+"})}),e.jsx(n.td,{children:"Addition"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"int -> int -> int"})," or ",e.jsx(n.code,{children:"float -> float -> float"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-"})}),e.jsx(n.td,{children:"Subtraction"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"int -> int -> int"})," or ",e.jsx(n.code,{children:"float -> float -> float"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"*"})}),e.jsx(n.td,{children:"Multiplication"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"int -> int -> int"})," or ",e.jsx(n.code,{children:"float -> float -> float"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"/"})}),e.jsx(n.td,{children:"Division"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"int -> int -> int"})," or ",e.jsx(n.code,{children:"float -> float -> float"})]})]})]})]}),`
`,e.jsx(n.p,{children:"Division by zero raises a runtime error. The arithmetic operators also work element by element on two tensors of the same shape, and on a tensor and a float scalar, as chapter 7 describes."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`1 / 0  // Runtime error: Division by zero
`})}),`
`,e.jsx(n.h4,{id:"comparison-operators-1",children:"Comparison operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Operator"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Types"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"=="})}),e.jsx(n.td,{children:"Equal"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"'a -> 'a -> bool"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"!="})}),e.jsx(n.td,{children:"Not equal"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"'a -> 'a -> bool"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"<"})}),e.jsx(n.td,{children:"Less than"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int -> bool"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:">"})}),e.jsx(n.td,{children:"Greater than"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int -> bool"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"<="})}),e.jsx(n.td,{children:"Less or equal"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int -> bool"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:">="})}),e.jsx(n.td,{children:"Greater or equal"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"int -> int -> bool"})})]})]})]}),`
`,e.jsxs(n.p,{children:["The table shows the int form of ",e.jsx(n.code,{children:"<"}),", ",e.jsx(n.code,{children:">"}),", ",e.jsx(n.code,{children:"<="}),", and ",e.jsx(n.code,{children:">="}),", and the same operators also accept two floats. The operators ",e.jsx(n.code,{children:"=="})," and ",e.jsx(n.code,{children:"!="})," don't accept tensors or functions."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1.0] == [1.0]  // Error: Equality is not defined for tensors
`})}),`
`,e.jsx(n.h4,{id:"logical-operators-1",children:"Logical operators"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Operator"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Types"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"&&"})}),e.jsx(n.td,{children:"Logical and"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"bool -> bool -> bool"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"||"})}),e.jsx(n.td,{children:"Logical or"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"bool -> bool -> bool"})})]})]})]}),`
`,e.jsx(n.p,{children:"In the current implementation, the logical operators always evaluate both operands. They don't stop early when the left operand already decides the result."}),`
`,e.jsx(n.h4,{id:"examples-7",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`1 + 2 * 3  // Result: 7, because * binds more tightly than +
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`(1 + 2) * 3  // Result: 9
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`5 == 5  // Result: true
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`3 < 5 && 5 < 10  // Result: true
`})}),`
`,e.jsx(n.h3,{id:"59-unary-operators",children:"5.9 Unary operators"}),`
`,e.jsx(n.p,{children:"A unary operator goes before its operand."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`-expr
!expr
`})}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Operator"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Types"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-"})}),e.jsx(n.td,{children:"Negation"}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"int -> int"})," or ",e.jsx(n.code,{children:"float -> float"})]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"!"})}),e.jsx(n.td,{children:"Logical not"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"bool -> bool"})})]})]})]}),`
`,e.jsx(n.h4,{id:"examples-8",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`-5  // Result: -5
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`-3.14  // Result: -3.14
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`!true  // Result: false
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`!(5 > 3)  // Result: false
`})}),`
`,e.jsx(n.h3,{id:"510-tensor-operations",children:"5.10 Tensor operations"}),`
`,e.jsx(n.h4,{id:"dot-product",children:"Dot product"}),`
`,e.jsx(n.p,{children:"The dot product has the form below."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`dot(a, b)
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"dot"})," multiplies matrices and vectors. The compiler works out the result shape from the operand shapes, as the table shows."]}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"A Shape"}),e.jsx(n.th,{children:"B Shape"}),e.jsx(n.th,{children:"Result Shape"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[m, k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k, n]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[m, n]"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k, n]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[n]"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[m, k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[m]"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:"A float scalar"})]})]})]}),`
`,e.jsx(n.h4,{id:"transpose",children:"Transpose"}),`
`,e.jsx(n.p,{children:"The transpose has the form below."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`transpose(a)
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"transpose"})," swaps the two dimensions of a 2D tensor, so shape ",e.jsx(n.code,{children:"[m, n]"})," becomes ",e.jsx(n.code,{children:"[n, m]"}),"."]}),`
`,e.jsx(n.h4,{id:"reshape",children:"Reshape"}),`
`,e.jsx(n.p,{children:"A reshape has the form below, where the second argument is a shape."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`reshape(a, [d1, d2])
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"reshape"})," gives a tensor new dimensions. The new shape must have the same total number of elements as the old one."]}),`
`,e.jsx(n.h4,{id:"examples-9",children:"Examples"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in       // [2,3]
let b = [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]] in  // [3,2]
dot(a, b)  // Result: [[58.0, 64.0], [139.0, 154.0]], a [2,2] matrix
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let m = [[1.0, 2.0], [3.0, 4.0]] in
transpose(m)  // Result: [[1.0, 3.0], [2.0, 4.0]]
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let v = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in
reshape(v, [2, 3])  // Result: [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], a 2x3 matrix
`})}),`
`,e.jsx(n.h3,{id:"511-parentheses",children:"5.11 Parentheses"}),`
`,e.jsx(n.p,{children:"Parentheses override the usual precedence, as the examples show."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`(1 + 2) * 3  // Result: 9, not 7
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`(fn x -> x + 1) 5  // Applies a function that has no name. Result: 6
`})}),`
`,e.jsx(n.h3,{id:"512-automatic-differentiation-with-grad",children:"5.12 Automatic differentiation with grad"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"grad"})," does automatic differentiation, which means that it computes the derivative of a function. The expression ",e.jsx(n.code,{children:"grad (fn x -> e)"})," is a new function, and that function returns the derivative of ",e.jsx(n.code,{children:"e"})," with respect to ",e.jsx(n.code,{children:"x"}),". The compiler implements ",e.jsx(n.code,{children:"grad"})," as a source-to-source transform. A pass rewrites each ",e.jsx(n.code,{children:"grad"})," expression into ordinary Bagl code before type inference, and the rest of the compiler then checks and runs the derivative like any other function."]}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"grad"})," must be applied directly to a function literal in parentheses. The name ",e.jsx(n.code,{children:"grad"})," is not a value, so ",e.jsx(n.code,{children:"grad"})," on its own is an unbound variable. If you write ",e.jsx(n.code,{children:"grad f"})," for a function ",e.jsx(n.code,{children:"f"}),' bound elsewhere, the compiler reports "grad must be applied directly to a function literal".']}),`
`,e.jsx(n.h4,{id:"modes",children:"Modes"}),`
`,e.jsx(n.p,{children:"The pass chooses a mode from the annotation on the parameter."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["An unannotated parameter, or a ",e.jsx(n.code,{children:"float"})," parameter whose body uses no tensors, gets scalar mode. Scalar mode is symbolic forward mode. The pass builds an expression for the derivative with the sum, product, quotient, and chain rules, and the result has type ",e.jsx(n.code,{children:"float -> float"}),"."]}),`
`,e.jsxs(n.li,{children:["A parameter annotated ",e.jsx(n.code,{children:"tensor<float>[...]"})," gets reverse mode. The body must compute a scalar, e.g., a loss. The result is a function that returns the gradient, which is a tensor with the same shape as the parameter."]}),`
`,e.jsxs(n.li,{children:["A ",e.jsx(n.code,{children:"float"})," parameter whose body uses tensors gets pathwise mode. The pass applies the reverse mode rules to the scalar parameter, so it can differentiate a scalar through tensor code."]}),`
`]}),`
`,e.jsx(n.p,{children:"An unannotated parameter whose body uses tensors is a compile error, because the pass needs the annotation to choose a mode."}),`
`,e.jsx(n.h4,{id:"supported-expressions",children:"Supported expressions"}),`
`,e.jsxs(n.p,{children:["In scalar mode, the body can use literals, the parameter, and other variables, which count as constants. It can also use ",e.jsx(n.code,{children:"+"}),", ",e.jsx(n.code,{children:"-"}),", ",e.jsx(n.code,{children:"*"}),", ",e.jsx(n.code,{children:"/"}),", unary minus, ",e.jsx(n.code,{children:"if"}),", ",e.jsx(n.code,{children:"let"}),", and the math functions ",e.jsx(n.code,{children:"exp"}),", ",e.jsx(n.code,{children:"log"}),", ",e.jsx(n.code,{children:"sqrt"}),", ",e.jsx(n.code,{children:"relu"}),", and ",e.jsx(n.code,{children:"step"}),". The pass differentiates each branch of an ",e.jsx(n.code,{children:"if"}),", and it leaves the condition as it is."]}),`
`,e.jsxs(n.p,{children:["Reverse mode and pathwise mode support the same expressions. They also support ",e.jsx(n.code,{children:"dot"}),", ",e.jsx(n.code,{children:"transpose"}),", element-wise arithmetic, and arithmetic between a tensor and a scalar."]}),`
`,e.jsx(n.h4,{id:"unsupported-forms",children:"Unsupported forms"}),`
`,e.jsx(n.p,{children:"The pass reports a compile error for each form it can't differentiate correctly, so it doesn't produce a wrong derivative for those forms. The unsupported forms in every mode include the following:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"A call to another function inside the body"}),`
`,e.jsxs(n.li,{children:["A ",e.jsx(n.code,{children:"letrec"})," or a nested ",e.jsx(n.code,{children:"fn"})," inside the body"]}),`
`,e.jsx(n.li,{children:"A boolean or comparison expression where the pass expects a number"}),`
`]}),`
`,e.jsx(n.p,{children:"Scalar mode also rejects any tensor operation. Reverse mode and pathwise mode also reject the following forms:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"reshape"})}),`
`,e.jsx(n.li,{children:"A tensor literal whose elements mention the parameter"}),`
`,e.jsxs(n.li,{children:["An ",e.jsx(n.code,{children:"if"})," whose condition mentions the parameter"]}),`
`,e.jsxs(n.li,{children:["The matrix side of a matrix-vector or vector-matrix ",e.jsx(n.code,{children:"dot"}),", because its gradient needs an outer product"]}),`
`,e.jsx(n.li,{children:"A scalar built from the parameter and broadcast against a matrix"}),`
`,e.jsx(n.li,{children:"A body that doesn't compute a scalar"}),`
`]}),`
`,e.jsx(n.h4,{id:"examples-10",children:"Examples"}),`
`,e.jsxs(n.p,{children:["In scalar mode, the derivative of ",e.jsx(n.code,{children:"x * x * x"})," is ",e.jsx(n.code,{children:"3 * x * x"}),", which is ",e.jsx(n.code,{children:"12.0"})," at ",e.jsx(n.code,{children:"2.0"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let f = grad (fn x -> x * x * x) in
f 2.0  // Result: 12.0
`})}),`
`,e.jsxs(n.p,{children:["In reverse mode, the gradient of the squared dot product ",e.jsx(n.code,{children:"dot(w, x) * dot(w, x)"})," is ",e.jsx(n.code,{children:"2 * dot(w, x) * x"}),". At ",e.jsx(n.code,{children:"w0"}),", ",e.jsx(n.code,{children:"dot(w0, x)"})," is ",e.jsx(n.code,{children:"4.5"}),", so the gradient is ",e.jsx(n.code,{children:"9.0 * x"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x = [0.5, -1.0, 2.0] in
let w0 = [1.0, 2.0, 3.0] in
let g = grad (fn w: tensor<float>[3] -> dot(w, x) * dot(w, x)) in
g w0  // Result: [4.5, -9.0, 18.0]
`})}),`
`,e.jsxs(n.p,{children:["In pathwise mode, ",e.jsx(n.code,{children:"dot(x * s, x)"})," is ",e.jsx(n.code,{children:"s"})," times ",e.jsx(n.code,{children:"dot(x, x)"}),". Its derivative with respect to ",e.jsx(n.code,{children:"s"})," is therefore ",e.jsx(n.code,{children:"dot(x, x)"}),", which is ",e.jsx(n.code,{children:"14.0"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let x = [1.0, 2.0, 3.0] in
let g = grad (fn s: float -> dot(x * s, x)) in
g 2.0  // Result: 14.0
`})}),`
`,e.jsx(n.h2,{id:"6-type-inference",children:"6. Type inference"}),`
`,e.jsx(n.p,{children:"Bagl uses Hindley-Milner type inference, extended with dimension variables for tensor shapes. Chapter 6 describes the algorithm."}),`
`,e.jsx(n.h3,{id:"61-overview",children:"6.1 Overview"}),`
`,e.jsxs(n.p,{children:["Type inference works out the type of every expression, so most programs need no type annotations. Some programs still need one. For example, a function parameter that is used as a tensor gets a 2D tensor type unless an annotation says otherwise, so a parameter that should be a vector needs an annotation such as ",e.jsx(n.code,{children:"tensor<float>['n]"}),"."]}),`
`,e.jsx(n.p,{children:"The algorithm takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"It gives each unknown type a fresh type variable."}),`
`,e.jsx(n.li,{children:"It collects constraints from the structure of each expression. A constraint is a rule that two types must be equal."}),`
`,e.jsx(n.li,{children:"It solves the constraints with unification."}),`
`,e.jsx(n.li,{children:"It generalizes types at let bindings."}),`
`]}),`
`,e.jsx(n.h3,{id:"62-type-environments",children:"6.2 Type environments"}),`
`,e.jsx(n.p,{children:"A type environment maps each variable name in scope to a type scheme."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Γ = { x₁ : σ₁, x₂ : σ₂, ... }
`})}),`
`,e.jsxs(n.p,{children:["In the definition above, each ",e.jsx(n.code,{children:"σ"})," is a type scheme of the form ",e.jsx(n.code,{children:"∀ α₁...αₙ. τ"}),"."]}),`
`,e.jsx(n.h4,{id:"operations",children:"Operations"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Lookup, written ",e.jsx(n.code,{children:"Γ(x)"}),", returns the scheme bound to ",e.jsx(n.code,{children:"x"}),"."]}),`
`,e.jsxs(n.li,{children:["Extension, written ",e.jsx(n.code,{children:"Γ, x : σ"}),", adds a binding."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"FV(Γ)"})," returns all the free type variables in the environment. A free type variable is one that no ",e.jsx(n.code,{children:"∀"})," binds."]}),`
`]}),`
`,e.jsx(n.h3,{id:"63-inference-rules",children:"6.3 Inference rules"}),`
`,e.jsxs(n.p,{children:["Each rule below means that if the facts above the line hold, then the fact below the line holds. The notation ",e.jsx(n.code,{children:"Γ ⊢ e : τ"})," means that in the environment ",e.jsx(n.code,{children:"Γ"}),", the expression ",e.jsx(n.code,{children:"e"})," has type ",e.jsx(n.code,{children:"τ"}),"."]}),`
`,e.jsx(n.h4,{id:"literals",children:"Literals"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`─────────────────
Γ ⊢ n : int        (integer literal)

─────────────────
Γ ⊢ f : float      (float literal)

─────────────────
Γ ⊢ b : bool       (boolean literal)
`})}),`
`,e.jsx(n.h4,{id:"variables",children:"Variables"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`x : σ ∈ Γ    τ = instantiate(σ)
────────────────────────────────
        Γ ⊢ x : τ
`})}),`
`,e.jsx(n.h4,{id:"let-binding",children:"Let binding"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Γ ⊢ e₁ : τ₁    Γ, x : generalize(Γ, τ₁) ⊢ e₂ : τ₂
─────────────────────────────────────────────────────
            Γ ⊢ let x = e₁ in e₂ : τ₂
`})}),`
`,e.jsx(n.h4,{id:"recursive-let",children:"Recursive let"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Γ, x : τ ⊢ e₁ : τ₁    unify(τ, τ₁)    Γ, x : generalize(Γ, τ) ⊢ e₂ : τ₂
──────────────────────────────────────────────────────────────────────────
                  Γ ⊢ letrec x = e₁ in e₂ : τ₂
`})}),`
`,e.jsx(n.h4,{id:"function",children:"Function"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Γ, x : τ₁ ⊢ e : τ₂
─────────────────────────
Γ ⊢ fn x -> e : τ₁ -> τ₂
`})}),`
`,e.jsx(n.h4,{id:"application",children:"Application"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Γ ⊢ e₁ : τ₁    Γ ⊢ e₂ : τ₂    unify(τ₁, τ₂ -> α)
──────────────────────────────────────────────────
              Γ ⊢ e₁ e₂ : α
`})}),`
`,e.jsx(n.h4,{id:"conditional",children:"Conditional"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Γ ⊢ e₁ : τ₁    Γ ⊢ e₂ : τ₂    Γ ⊢ e₃ : τ₃
unify(τ₁, bool)    unify(τ₂, τ₃)
────────────────────────────────────────────
      Γ ⊢ if e₁ then e₂ else e₃ : τ₂
`})}),`
`,e.jsx(n.h3,{id:"64-unification",children:"6.4 Unification"}),`
`,e.jsx(n.p,{children:"Unification finds a substitution that makes two types equal. A substitution is a choice of a type for each type variable."}),`
`,e.jsx(n.h4,{id:"algorithm",children:"Algorithm"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`unify(τ₁, τ₂):
  τ₁' = find(τ₁)  // Follow links
  τ₂' = find(τ₂)  // Follow links

  match (τ₁', τ₂'):
    | (int, int) -> ok
    | (float, float) -> ok
    | (bool, bool) -> ok
    | (α, τ) or (τ, α) where α is unbound ->
        if occurs(α, τ) then error "recursive type"
        link(α, τ)
    | (τ₁ -> τ₂, τ₃ -> τ₄) ->
        unify(τ₁, τ₃)
        unify(τ₂, τ₄)
    | (tensor<e₁>[s₁], tensor<e₂>[s₂]) ->
        unify(e₁, e₂)
        unify_shape(s₁, s₂)
    | _ -> error "cannot unify"
`})}),`
`,e.jsx(n.h4,{id:"path-compression",children:"Path compression"}),`
`,e.jsx(n.p,{children:"The compiler stores type variables in a union-find structure, which tracks which variables have been made equal. It also uses path compression. When the compiler follows a chain of links to find what a variable stands for, it points the variable straight at the end of the chain, so the next lookup is faster."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`let rec find_ty = function
  | TVar ({ contents = Link t } as r) ->
      let t' = find_ty t in
      r := Link t';  (* Path compression *)
      t'
  | t -> t
`})}),`
`,e.jsx(n.h3,{id:"65-dimension-unification",children:"6.5 Dimension unification"}),`
`,e.jsx(n.p,{children:"The compiler unifies dimensions in the same way as types."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`unify_dim(d₁, d₂):
  d₁' = find_dim(d₁)
  d₂' = find_dim(d₂)

  match (d₁', d₂'):
    | (n, m) where n = m -> ok
    | (n, m) where n ≠ m -> error "dimension mismatch"
    | (α, d) or (d, α) where α is unbound ->
        link(α, d)
`})}),`
`,e.jsx(n.h4,{id:"shape-unification",children:"Shape unification"}),`
`,e.jsx(n.p,{children:"Two shapes unify when they have the same rank and each pair of dimensions unifies."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`unify_shape(s₁, s₂):
  if length(s₁) ≠ length(s₂) then
    error "shape rank mismatch"
  for each (d₁, d₂) in zip(s₁, s₂):
    unify_dim(d₁, d₂)
`})}),`
`,e.jsx(n.h3,{id:"66-generalization",children:"6.6 Generalization"}),`
`,e.jsxs(n.p,{children:["Generalization turns a type into a type scheme. It does so by adding a ",e.jsx(n.code,{children:"∀"})," for each type variable that is free in the type and not free in the environment."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`generalize(Γ, τ):
  free_vars = FV(τ) - FV(Γ)
  return ∀ free_vars. τ
`})}),`
`,e.jsxs(n.p,{children:["Bagl has no type classes, so it needs a rule for arithmetic on operands of unknown type. Before it generalizes a binding, the compiler gives the type ",e.jsx(n.code,{children:"int"})," to any such operand that is still unknown. For example, ",e.jsx(n.code,{children:"let f = fn x -> x + x in ..."})," gives ",e.jsx(n.code,{children:"f"})," the type ",e.jsx(n.code,{children:"int -> int"}),". A float constraint anywhere in the same binding takes priority, so ",e.jsx(n.code,{children:"let g = fn x -> (x + x) + 1.0 in ..."})," gives ",e.jsx(n.code,{children:"g"})," the type ",e.jsx(n.code,{children:"float -> float"}),"."]}),`
`,e.jsx(n.h4,{id:"level-based-generalization",children:"Level-based generalization"}),`
`,e.jsxs(n.p,{children:["Bagl uses levels to find the variables to generalize without scanning the whole environment. A level is a counter of how deeply the current ",e.jsx(n.code,{children:"let"})," binding is nested."]}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"Each type variable records the level at which it was created."}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"enter_level()"})," adds one to the current level before the compiler checks the value of a binding."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"leave_level()"})," subtracts one from the level after the compiler checks the value."]}),`
`,e.jsx(n.li,{children:"A variable whose level is greater than the current level can be generalized."}),`
`]}),`
`,e.jsx(n.h3,{id:"67-instantiation",children:"6.7 Instantiation"}),`
`,e.jsxs(n.p,{children:["Instantiation is the reverse of generalization. It replaces each variable bound by ",e.jsx(n.code,{children:"∀"})," with a fresh type variable."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`instantiate(∀ α₁...αₙ. τ):
  substitution = { αᵢ → fresh_var() for i in 1..n }
  return apply(substitution, τ)
`})}),`
`,e.jsx(n.h3,{id:"68-tensor-operation-types",children:"6.8 Tensor operation types"}),`
`,e.jsx(n.h4,{id:"dot-product-1",children:"Dot product"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`infer_dot(shape₁, shape₂):
  match (shape₁, shape₂):
    | ([m, k₁], [k₂, n]) ->
        unify_dim(k₁, k₂)
        return [m, n]
    | ([k₁], [k₂, n]) ->
        unify_dim(k₁, k₂)
        return [n]
    | ([m, k₁], [k₂]) ->
        unify_dim(k₁, k₂)
        return [m]
    | ([k₁], [k₂]) ->
        unify_dim(k₁, k₂)
        return []  // scalar
`})}),`
`,e.jsx(n.h4,{id:"transpose-1",children:"Transpose"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`infer_transpose(shape):
  match shape:
    | [m, n] -> [n, m]
    | _ -> error "transpose requires 2D tensor"
`})}),`
`,e.jsx(n.h3,{id:"69-example-inference",children:"6.9 Example inference"}),`
`,e.jsx(n.h4,{id:"example-1-identity-function",children:"Example 1: Identity function"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let id = fn x -> x in id 5
`})}),`
`,e.jsx(n.p,{children:"The compiler takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["For ",e.jsx(n.code,{children:"fn x -> x"}),", it assigns ",e.jsx(n.code,{children:"x : α"}),". The body also has type ",e.jsx(n.code,{children:"α"}),", so the function has type ",e.jsx(n.code,{children:"α -> α"}),"."]}),`
`,e.jsxs(n.li,{children:["It generalizes the type to ",e.jsx(n.code,{children:"∀α. α -> α"}),"."]}),`
`,e.jsxs(n.li,{children:["For ",e.jsx(n.code,{children:"id 5"}),", it instantiates the scheme to ",e.jsx(n.code,{children:"β -> β"})," and unifies that with ",e.jsx(n.code,{children:"int -> γ"}),"."]}),`
`,e.jsxs(n.li,{children:["Unification gives ",e.jsx(n.code,{children:"β = int"})," and ",e.jsx(n.code,{children:"γ = int"}),", so the final type is ",e.jsx(n.code,{children:"int"}),"."]}),`
`]}),`
`,e.jsx(n.h4,{id:"example-2-tensor-dot",children:"Example 2: Tensor dot"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[3,2] = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]] in
dot(a, b)
`})}),`
`,e.jsx(n.p,{children:"The compiler takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["It assigns ",e.jsx(n.code,{children:"a : tensor<float>[2,3]"}),"."]}),`
`,e.jsxs(n.li,{children:["It assigns ",e.jsx(n.code,{children:"b : tensor<float>[3,2]"}),"."]}),`
`,e.jsxs(n.li,{children:["For ",e.jsx(n.code,{children:"dot(a, b)"}),", it checks the shapes ",e.jsx(n.code,{children:"[2,3]"})," and ",e.jsx(n.code,{children:"[3,2]"}),"."]}),`
`,e.jsxs(n.li,{children:["It unifies the inner dimensions, and ",e.jsx(n.code,{children:"3 = 3"})," holds."]}),`
`,e.jsxs(n.li,{children:["The result shape is ",e.jsx(n.code,{children:"[2,2]"}),"."]}),`
`,e.jsxs(n.li,{children:["The final type is ",e.jsx(n.code,{children:"tensor<float>[2,2]"}),"."]}),`
`]}),`
`,e.jsx(n.h4,{id:"example-3-polymorphic-function",children:"Example 3: Polymorphic function"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let compose = fn f -> fn g -> fn x -> f (g x) in
compose (fn x -> x + 1) (fn x -> x * 2) 5
`})}),`
`,e.jsx(n.p,{children:"The compiler takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["For ",e.jsx(n.code,{children:"fn f -> fn g -> fn x -> f (g x)"}),", it finds the following types:",`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"f : α -> β"}),", ",e.jsx(n.code,{children:"g : γ -> α"}),", and ",e.jsx(n.code,{children:"x : γ"}),"."]}),`
`,e.jsxs(n.li,{children:["The whole function has type ",e.jsx(n.code,{children:"(α -> β) -> (γ -> α) -> γ -> β"}),"."]}),`
`]}),`
`]}),`
`,e.jsxs(n.li,{children:["It generalizes the type to ",e.jsx(n.code,{children:"∀αβγ. (α -> β) -> (γ -> α) -> γ -> β"}),"."]}),`
`,e.jsxs(n.li,{children:["At the application, it instantiates the scheme and unifies it with the arguments:",`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"f = fn x -> x + 1 : int -> int"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"g = fn x -> x * 2 : int -> int"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"x = 5 : int"})}),`
`]}),`
`]}),`
`,e.jsxs(n.li,{children:["The result type is ",e.jsx(n.code,{children:"int"}),"."]}),`
`]}),`
`,e.jsx(n.h3,{id:"610-error-messages",children:"6.10 Error messages"}),`
`,e.jsxs(n.p,{children:["Each type error includes the source location of the problem. For example, the compiler reports an error for the program below, saved as ",e.jsx(n.code,{children:"example.bagl"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let y = 1 in
let x: int = true in
x + y
`})}),`
`,e.jsxs(n.p,{children:["The first line of the report gives the message, and the second line gives the file, line, and column. The compiler then prints the line with the error between its neighbors, and it marks the part that caused the error with ",e.jsx(n.code,{children:"^"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`error: Cannot unify int with bool
  --> example.bagl:2:14
  |
1 | let y = 1 in
2 | let x: int = true in
  |              ^^^^
3 | x + y
  |
`})}),`
`,e.jsx(n.h2,{id:"7-tensor-semantics",children:"7. Tensor semantics"}),`
`,e.jsx(n.p,{children:"Chapter 7 defines what tensor types and tensor operations mean in Bagl."}),`
`,e.jsx(n.h3,{id:"71-tensor-representation",children:"7.1 Tensor representation"}),`
`,e.jsx(n.h4,{id:"logical-model",children:"Logical model"}),`
`,e.jsx(n.p,{children:"A tensor is an array of elements with one or more dimensions. Its type has the following form."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`tensor<E>[d₁, d₂, ..., dₙ]
`})}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The element type ",e.jsx(n.code,{children:"E"})," is the type of each element. It must be ",e.jsx(n.code,{children:"float"}),"."]}),`
`,e.jsxs(n.li,{children:["The shape ",e.jsx(n.code,{children:"[d₁, d₂, ..., dₙ]"})," lists the size of each dimension."]}),`
`,e.jsx(n.li,{children:"The rank is the number of dimensions, which is the length of the shape."}),`
`,e.jsx(n.li,{children:"The size is the total number of elements, which is the product of the dimensions."}),`
`]}),`
`,e.jsx(n.h4,{id:"physical-storage",children:"Physical storage"}),`
`,e.jsx(n.p,{children:"The VM stores each tensor as one flat array in row-major order, which is the order C uses. In row-major order, the elements of the first row come first, then the elements of the second row, and so on."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`[[a, b, c],     stored as    [a, b, c, d, e, f]
 [d, e, f]]                   indices: 0  1  2  3  4  5
`})}),`
`,e.jsx(n.h4,{id:"strides",children:"Strides"}),`
`,e.jsx(n.p,{children:"A stride is the number of positions in the flat array that you move when one index goes up by one. The strides turn an index with several parts into a position in the flat array."}),`
`,e.jsxs(n.p,{children:["For a shape ",e.jsx(n.code,{children:"[d₁, d₂, ..., dₙ]"}),", the strides are as follows."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`stride[i] = d[i+1] × d[i+2] × ... × d[n]
stride[n] = 1
`})}),`
`,e.jsxs(n.p,{children:["For example, the shape ",e.jsx(n.code,{children:"[2, 3]"})," has the following strides."]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"stride[0] = 3"}),", because each row holds 3 elements."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"stride[1] = 1"}),", because the elements of a row are next to each other."]}),`
`]}),`
`,e.jsxs(n.p,{children:["The index ",e.jsx(n.code,{children:"[i, j]"})," maps to the flat position ",e.jsx(n.code,{children:"i × 3 + j × 1"}),"."]}),`
`,e.jsx(n.h3,{id:"72-tensor-literals",children:"7.2 Tensor literals"}),`
`,e.jsx(n.p,{children:"Tensor elements must be floats. Section 7.6 shows what happens with int elements."}),`
`,e.jsx(n.h4,{id:"1d-tensors-vectors",children:"1D tensors (vectors)"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1.0, 2.0, 3.0]  // Type: tensor<float>[3]
`})}),`
`,e.jsx(n.h4,{id:"2d-tensors-matrices",children:"2D tensors (matrices)"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[[1.0, 2.0],  // Type: tensor<float>[2, 2]
 [3.0, 4.0]]
`})}),`
`,e.jsx(n.h4,{id:"type-inference-for-literals",children:"Type inference for literals"}),`
`,e.jsx(n.p,{children:"The compiler checks a tensor literal in the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["It infers the element type from the first element, and it requires that type to be ",e.jsx(n.code,{children:"float"}),"."]}),`
`,e.jsx(n.li,{children:"It checks that every element has the same type."}),`
`,e.jsx(n.li,{children:"It checks that every row has the same length."}),`
`,e.jsx(n.li,{children:"It infers the shape from the brackets. One level of brackets gives a vector, and two levels give a matrix, even when the matrix has only one row."}),`
`]}),`
`,e.jsx(n.h4,{id:"explicit-shape-annotation",children:"Explicit shape annotation"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] : [2, 3]
`})}),`
`,e.jsx(n.p,{children:"The annotation must match the shape that the compiler infers."}),`
`,e.jsx(n.h3,{id:"73-shape-checking",children:"7.3 Shape checking"}),`
`,e.jsx(n.h4,{id:"compile-time-verification",children:"Compile-time verification"}),`
`,e.jsx(n.p,{children:"Bagl checks tensor shapes at compile time. In the first example, the annotation matches the literal."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
a  // OK
`})}),`
`,e.jsx(n.p,{children:"In the second example, the annotation says the matrix has 2 columns, but the literal has 3."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let b: tensor<float>[2,2] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
b  // Error: Dimension mismatch: 2 vs 3
`})}),`
`,e.jsx(n.h4,{id:"dimension-variables",children:"Dimension variables"}),`
`,e.jsx(n.p,{children:"Dimension variables make shape polymorphism possible, which means one function can accept tensors of different sizes."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`// square works on a square matrix of any size
let square: tensor<float>['n, 'n] -> tensor<float>['n, 'n] = fn m -> dot(m, m) in
square [[1.0, 2.0], [3.0, 4.0]]  // Result: [[7.0, 10.0], [15.0, 22.0]]
`})}),`
`,e.jsxs(n.p,{children:["The same function rejects a matrix that isn't square, because ",e.jsx(n.code,{children:"'n"})," must stand for one size."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let square: tensor<float>['n, 'n] -> tensor<float>['n, 'n] = fn m -> dot(m, m) in
square [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]  // Error: Dimension mismatch: 2 vs 3
`})}),`
`,e.jsx(n.h4,{id:"shape-constraints",children:"Shape constraints"}),`
`,e.jsx(n.p,{children:"Each tensor operation adds a constraint on the shapes of its operands."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"dot(A, B)"})," requires the inner dimensions to match."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"transpose(A)"})," requires a 2D tensor."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"reshape(A, s)"})," requires the same total number of elements. The compiler checks the count only when every dimension is a known number, and the VM checks it again at run time."]}),`
`,e.jsx(n.li,{children:"Element-wise arithmetic on two tensors requires the two shapes to be equal."}),`
`]}),`
`,e.jsx(n.h3,{id:"74-tensor-operations",children:"7.4 Tensor operations"}),`
`,e.jsx(n.h4,{id:"741-dot-product",children:"7.4.1 Dot product"}),`
`,e.jsxs(n.p,{children:["The syntax is ",e.jsx(n.code,{children:"dot(a, b)"}),". The table gives the shape rules."]}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"A Shape"}),e.jsx(n.th,{children:"B Shape"}),e.jsx(n.th,{children:"Result Shape"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[m, k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k, n]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[m, n]"})}),e.jsx(n.td,{children:"Matrix times matrix"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k, n]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[n]"})}),e.jsx(n.td,{children:"Vector times matrix"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[m, k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[m]"})}),e.jsx(n.td,{children:"Matrix times vector"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[k]"})}),e.jsx(n.td,{children:"A float scalar"}),e.jsx(n.td,{children:"Dot product of two vectors"})]})]})]}),`
`,e.jsxs(n.p,{children:["Each element of the result is a sum of products. For a matrix times a matrix (",e.jsx(n.code,{children:"[m,k] × [k,n] → [m,n]"}),"), the formula is as follows."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`C[i,j] = Σ(k) A[i,k] × B[k,j]
`})}),`
`,e.jsxs(n.p,{children:["For two vectors (",e.jsx(n.code,{children:"[k] · [k] → scalar"}),"), the formula is as follows."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`result = Σ(i) A[i] × B[i]
`})}),`
`,e.jsx(n.p,{children:"Example:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [[1.0, 2.0], [3.0, 4.0]] in       // [2,2]
let b = [[5.0, 6.0], [7.0, 8.0]] in       // [2,2]
dot(a, b)  // Result: [[19.0, 22.0], [43.0, 50.0]]
// C[0,0] = 1×5 + 2×7 = 19
// C[0,1] = 1×6 + 2×8 = 22
// C[1,0] = 3×5 + 4×7 = 43
// C[1,1] = 3×6 + 4×8 = 50
`})}),`
`,e.jsx(n.h4,{id:"742-transpose",children:"7.4.2 Transpose"}),`
`,e.jsxs(n.p,{children:["The syntax is ",e.jsx(n.code,{children:"transpose(a)"}),", and the shape rule is ",e.jsx(n.code,{children:"[m, n] → [n, m]"}),". ",e.jsx(n.code,{children:"transpose"})," works only on 2D tensors. Element ",e.jsx(n.code,{children:"[i, j]"})," of the result is element ",e.jsx(n.code,{children:"[j, i]"})," of the input, as the formula shows."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`B[i,j] = A[j,i]
`})}),`
`,e.jsx(n.p,{children:"Example:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in  // [2,3]
transpose(a)  // Result: [[1.0, 4.0], [2.0, 5.0], [3.0, 6.0]], with shape [3,2]
`})}),`
`,e.jsx(n.h4,{id:"743-reshape",children:"7.4.3 Reshape"}),`
`,e.jsxs(n.p,{children:["The syntax is ",e.jsx(n.code,{children:"reshape(a, [d₁, d₂, ..., dₙ])"}),". The new shape must have the same total number of elements as the old one."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`d₁ × d₂ × ... × dₙ = original size
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"reshape"})," keeps the flat data as it is, and it reads that data with the new shape."]}),`
`,e.jsx(n.p,{children:"Example:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in  // [6]
reshape(a, [2, 3])  // Result: [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], with shape [2,3]
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0] in  // [6]
reshape(a, [3, 2])  // Result: [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]], with shape [3,2]
`})}),`
`,e.jsx(n.h3,{id:"75-shape-inference-examples",children:"7.5 Shape inference examples"}),`
`,e.jsx(n.h4,{id:"example-1-matrix-chain",children:"Example 1: Matrix chain"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[2, 3] = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]] in
let b: tensor<float>[3, 4] = [[1.0, 1.0, 1.0, 1.0], [2.0, 2.0, 2.0, 2.0], [3.0, 3.0, 3.0, 3.0]] in
let c: tensor<float>[4, 2] = [[1.0, 0.0], [0.0, 1.0], [1.0, 0.0], [0.0, 1.0]] in
let ab = dot(a, b) in    // [2,3] × [3,4] = [2,4]
dot(ab, c)               // [2,4] × [4,2] = [2,2]
`})}),`
`,e.jsx(n.h4,{id:"example-2-dimension-polymorphism",children:"Example 2: Dimension polymorphism"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`// Generic matrix multiply function
let mm = fn a -> fn b -> dot(a, b) in
let x: tensor<float>[2,3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let y: tensor<float>[3,5] = [[1.0, 0.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 0.0, 1.0], [0.0, 0.0, 1.0, 0.0, 1.0]] in
mm x y    // Type: tensor<float>[2,5]
`})}),`
`,e.jsx(n.h4,{id:"example-3-shape-error",children:"Example 3: Shape error"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[2, 3] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b: tensor<float>[4, 2] = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [7.0, 8.0]] in
dot(a, b)    // Error: Dimension mismatch: 3 vs 4
`})}),`
`,e.jsx(n.h3,{id:"76-element-type-handling",children:"7.6 Element type handling"}),`
`,e.jsx(n.h4,{id:"storage",children:"Storage"}),`
`,e.jsxs(n.p,{children:["The VM stores every tensor element as a float. The type checker requires float elements, so a program can't build an int tensor. If hand-written bytecode passes an int to ",e.jsx(n.code,{children:"TENSOR_CREATE"}),", the VM converts it to a float."]}),`
`,e.jsx(n.h4,{id:"type-inference",children:"Type inference"}),`
`,e.jsxs(n.p,{children:["The compiler infers the element type of a literal from the first element, and it requires that type to be ",e.jsx(n.code,{children:"float"}),". A literal of floats has a float element type."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1.0, 2.0, 3.0]  // Type: tensor<float>[3]
`})}),`
`,e.jsx(n.p,{children:"A literal of ints is a type error."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1, 2, 3]  // Error: Cannot unify int with float
`})}),`
`,e.jsx(n.p,{children:"A literal that mixes ints and floats also fails, because its first element is an int."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`[1, 2.0, 3]  // Error: Cannot unify int with float
`})}),`
`,e.jsx(n.h3,{id:"77-tensor-representation-internal",children:"7.7 Tensor representation (internal)"}),`
`,e.jsx(n.p,{children:"The VM stores a tensor with the following OCaml record."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`type tensor = {
  data: float array;    (* Flat storage *)
  shape: int list;      (* Dimensions *)
  strides: int list;    (* Access strides *)
}
`})}),`
`,e.jsx(n.h4,{id:"creating-tensors",children:"Creating tensors"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`let create_tensor shape init_val =
  let size = List.fold_left ( * ) 1 shape in
  {
    data = Array.make size init_val;
    shape;
    strides = compute_strides shape;
  }
`})}),`
`,e.jsx(n.h4,{id:"indexing",children:"Indexing"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`let flat_index indices strides =
  List.fold_left2 (fun acc i s -> acc + i * s) 0 indices strides

let tensor_get t indices =
  t.data.(flat_index indices t.strides)
`})}),`
`,e.jsx(n.h3,{id:"78-future-extensions",children:"7.8 Future extensions"}),`
`,e.jsx(n.p,{children:"The sections below list possible additions to tensor semantics. Two of them already exist in part, as each section says."}),`
`,e.jsx(n.h4,{id:"element-wise-operations",children:"Element-wise operations"}),`
`,e.jsxs(n.p,{children:["Element-wise arithmetic is already implemented. The operators ",e.jsx(n.code,{children:"+"}),", ",e.jsx(n.code,{children:"-"}),", ",e.jsx(n.code,{children:"*"}),", and ",e.jsx(n.code,{children:"/"})," work element by element on two tensors of the same shape."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [1.0, 2.0, 3.0] in
let b = [4.0, 5.0, 6.0] in
a * b  // Result: [4.0, 10.0, 18.0]
`})}),`
`,e.jsx(n.h4,{id:"reduction-operations",children:"Reduction operations"}),`
`,e.jsx(n.p,{children:"Bagl doesn't have reduction operations yet. The block below shows a possible syntax, and the compiler doesn't accept it."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`sum(a)     // Sum all elements
mean(a)    // Average of elements
max(a)     // Maximum element
`})}),`
`,e.jsx(n.h4,{id:"slicing",children:"Slicing"}),`
`,e.jsx(n.p,{children:"Bagl doesn't have slicing yet. The block below shows a possible syntax, and the compiler doesn't accept it."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`a[0:2, 1:3]    // Submatrix extraction
`})}),`
`,e.jsx(n.h4,{id:"broadcasting",children:"Broadcasting"}),`
`,e.jsxs(n.p,{children:["Bagl already broadcasts a float scalar against a tensor, so ",e.jsx(n.code,{children:"a * 2.0"})," multiplies each element of ",e.jsx(n.code,{children:"a"})," by ",e.jsx(n.code,{children:"2.0"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a = [1.0, 2.0, 3.0] in
a * 2.0  // Result: [2.0, 4.0, 6.0]
`})}),`
`,e.jsxs(n.p,{children:["Broadcasting between two tensors of different shapes isn't implemented. A broadcast of the ",e.jsx(n.code,{children:"[3, 1]"})," tensor and the ",e.jsx(n.code,{children:"[1, 4]"})," tensor below would give a ",e.jsx(n.code,{children:"[3, 4]"})," tensor. The compiler rejects the program instead, because the shapes differ."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let a: tensor<float>[3, 1] = [[1.0], [2.0], [3.0]] in
let b: tensor<float>[1, 4] = [[1.0, 2.0, 3.0, 4.0]] in
a + b  // Error: Dimension mismatch: 3 vs 1
`})}),`
`,e.jsx(n.h2,{id:"8-runtime-system",children:"8. Runtime system"}),`
`,e.jsx(n.p,{children:"Chapter 8 describes the Bagl virtual machine (VM) and how it runs a program."}),`
`,e.jsx(n.h3,{id:"81-virtual-machine-architecture",children:"8.1 Virtual machine architecture"}),`
`,e.jsx(n.p,{children:"Bagl runs programs on a stack-based virtual machine. A stack-based VM takes the operands of each instruction from the top of a stack, and it pushes the result back onto the stack."}),`
`,e.jsx(n.h4,{id:"components",children:"Components"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`┌─────────────────────────────────────────┐
│              VM State                    │
├─────────────────────────────────────────┤
│  Program    │ Bytecode chunks (one per  │
│             │ function)                  │
├─────────────┼───────────────────────────┤
│  Stack      │ Operand stack for         │
│             │ computation                │
├─────────────┼───────────────────────────┤
│  Locals     │ Local variable storage    │
│             │ for current frame          │
├─────────────┼───────────────────────────┤
│  Frames     │ Call stack for function   │
│             │ returns                    │
├─────────────┼───────────────────────────┤
│  PC         │ Program counter           │
├─────────────┼───────────────────────────┤
│  Chunk ID   │ Current function index    │
└─────────────┴───────────────────────────┘
`})}),`
`,e.jsx(n.h4,{id:"initial-state",children:"Initial state"}),`
`,e.jsx(n.p,{children:"The VM starts with the following state. The locals array has 256 slots, or more if the entry function needs more."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`{
  program;                    (* Loaded bytecode *)
  stack = Array.make 1024 VUnit;
  sp = 0;                     (* Stack pointer *)
  frames = [];                (* Call stack *)
  pc = 0;                     (* Program counter *)
  chunk_id = program.entry;   (* Start at entry point *)
  locals = Array.make 256 VUnit;
}
`})}),`
`,e.jsx(n.h3,{id:"82-runtime-values",children:"8.2 Runtime values"}),`
`,e.jsx(n.h4,{id:"value-types",children:"Value types"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`type value =
  | VInt of int           (* Integer *)
  | VFloat of float       (* Float *)
  | VBool of bool         (* Boolean *)
  | VString of string     (* String *)
  | VUnit                 (* Unit value *)
  | VTensor of tensor     (* Tensor *)
  | VClosure of closure   (* Function closure *)
`})}),`
`,e.jsx(n.h4,{id:"tensor-values",children:"Tensor values"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`type tensor = {
  data: float array;      (* Flat element storage *)
  shape: int list;        (* Dimension sizes *)
  strides: int list;      (* Access strides *)
}
`})}),`
`,e.jsx(n.h4,{id:"closure-values",children:"Closure values"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`type closure = {
  func_id: int;           (* Function chunk index *)
  captures: value array;  (* Captured variables *)
}
`})}),`
`,e.jsx(n.h3,{id:"83-stack-operations",children:"8.3 Stack operations"}),`
`,e.jsx(n.h4,{id:"push",children:"Push"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`push(value):
  stack[sp] = value
  sp = sp + 1
`})}),`
`,e.jsx(n.h4,{id:"pop",children:"Pop"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`pop():
  sp = sp - 1
  return stack[sp]
`})}),`
`,e.jsx(n.h4,{id:"stack-discipline",children:"Stack discipline"}),`
`,e.jsx(n.p,{children:"The stack holds the following kinds of values:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"The intermediate results of a computation"}),`
`,e.jsx(n.li,{children:"Function arguments"}),`
`,e.jsx(n.li,{children:"Temporary values"}),`
`]}),`
`,e.jsx(n.h3,{id:"84-call-frames",children:"8.4 Call frames"}),`
`,e.jsx(n.p,{children:"A call frame records what the VM needs in order to return from a function call."}),`
`,e.jsx(n.h4,{id:"frame-structure",children:"Frame structure"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`type frame = {
  return_addr: int;         (* Where to resume *)
  return_chunk: int;        (* Which function *)
  base_ptr: int;            (* Not currently used *)
  closure: closure option;  (* For captured vars *)
  saved_locals: value array; (* Caller's locals *)
}
`})}),`
`,e.jsx(n.h4,{id:"function-call",children:"Function call"}),`
`,e.jsx(n.p,{children:"A function call takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"The VM pops the closure from the stack."}),`
`,e.jsx(n.li,{children:"It pops the arguments from the stack."}),`
`,e.jsx(n.li,{children:"It saves the current state in a new frame."}),`
`,e.jsx(n.li,{children:"It pushes the frame onto the call stack."}),`
`,e.jsx(n.li,{children:"It switches to the chunk of the called function. A chunk is the bytecode of one function."}),`
`,e.jsx(n.li,{children:"It creates a new locals array and copies the arguments into it."}),`
`]}),`
`,e.jsx(n.h4,{id:"function-return",children:"Function return"}),`
`,e.jsx(n.p,{children:"A function return takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"The VM pops the return value from the stack."}),`
`,e.jsx(n.li,{children:"It pops the frame from the call stack."}),`
`,e.jsx(n.li,{children:"It restores the state of the caller."}),`
`,e.jsx(n.li,{children:"It pushes the return value onto the stack."}),`
`]}),`
`,e.jsx(n.h3,{id:"85-closures",children:"8.5 Closures"}),`
`,e.jsx(n.h4,{id:"closure-creation",children:"Closure creation"}),`
`,e.jsx(n.p,{children:"A closure is created in the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"The compiler finds the free variables of the function, which are the variables it uses from the enclosing scope."}),`
`,e.jsx(n.li,{children:"At run time, the VM copies the values of the free variables from the current environment."}),`
`,e.jsx(n.li,{children:"The VM creates a closure that holds the function ID and the copied values, which are called the captures."}),`
`]}),`
`,e.jsx(n.h4,{id:"closure-invocation",children:"Closure invocation"}),`
`,e.jsxs(n.p,{children:["When the VM calls a closure, it stores the closure in the new frame. The function body then reads its captures with the ",e.jsx(n.code,{children:"LOAD_CAPTURE"})," instruction."]}),`
`,e.jsx(n.h4,{id:"recursive-closures",children:"Recursive closures"}),`
`,e.jsx(n.p,{children:"A recursive closure needs to capture itself, so the VM builds it in the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"The bytecode stores the index of the capture that will hold the closure itself."}),`
`,e.jsx(n.li,{children:"The VM creates the closure with an empty slot at that index."}),`
`,e.jsx(n.li,{children:"The VM then puts the closure into its own empty slot."}),`
`]}),`
`,e.jsx(n.h3,{id:"86-execution-model",children:"8.6 Execution model"}),`
`,e.jsx(n.h4,{id:"fetch-execute-cycle",children:"Fetch-execute cycle"}),`
`,e.jsx(n.p,{children:"The VM runs a loop that fetches the next instruction and then executes it."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`while running:
  instr = chunk.code[pc]
  pc = pc + 1
  execute(instr)
`})}),`
`,e.jsx(n.h4,{id:"instruction-execution",children:"Instruction execution"}),`
`,e.jsx(n.p,{children:"Each instruction takes the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"It reads its operands from the stack or the locals."}),`
`,e.jsx(n.li,{children:"It does its computation."}),`
`,e.jsx(n.li,{children:"It pushes the result onto the stack."}),`
`,e.jsx(n.li,{children:"It tells the loop whether to continue."}),`
`]}),`
`,e.jsx(n.h4,{id:"termination",children:"Termination"}),`
`,e.jsx(n.p,{children:"Execution ends in any of the following cases:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The VM executes a ",e.jsx(n.code,{children:"HALT"})," instruction."]}),`
`,e.jsxs(n.li,{children:["The VM executes ",e.jsx(n.code,{children:"RETURN"})," when the call stack is empty."]}),`
`,e.jsx(n.li,{children:"A runtime error occurs."}),`
`]}),`
`,e.jsx(n.h3,{id:"87-memory-management",children:"8.7 Memory management"}),`
`,e.jsx(n.h4,{id:"stack-allocation",children:"Stack allocation"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"The stack has a fixed size of 1024 values."}),`
`,e.jsx(n.li,{children:"A stack overflow raises a runtime error."}),`
`]}),`
`,e.jsx(n.h4,{id:"local-variables",children:"Local variables"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Each frame gets its own locals array, with 256 slots or more if the function needs more."}),`
`,e.jsx(n.li,{children:"During a call, the frame keeps the locals of the caller, and the VM restores them on return."}),`
`]}),`
`,e.jsx(n.h4,{id:"garbage-collection",children:"Garbage collection"}),`
`,e.jsx(n.p,{children:"The VM has no garbage collector of its own. It is written in OCaml, and its values are ordinary OCaml values. The OCaml garbage collector frees a value once nothing refers to it."}),`
`,e.jsx(n.h3,{id:"88-tensor-operations-at-runtime",children:"8.8 Tensor operations at runtime"}),`
`,e.jsx(n.h4,{id:"tensor-creation",children:"Tensor creation"}),`
`,e.jsx(n.p,{children:"The VM creates a tensor in the following steps."}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"It pops the elements from the stack."}),`
`,e.jsx(n.li,{children:"It puts them in a flat array."}),`
`,e.jsx(n.li,{children:"It computes the strides."}),`
`,e.jsx(n.li,{children:"It pushes the tensor value onto the stack."}),`
`]}),`
`,e.jsx(n.h4,{id:"dot-product-2",children:"Dot product"}),`
`,e.jsx(n.p,{children:"The code below is a simplified form of the matrix case. The VM also handles a vector times a matrix, a matrix times a vector, and two vectors. For two vectors, it pushes the result as a float."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`let tensor_dot a b =
  match a.shape, b.shape with
  | [m; k1], [k2; n] when k1 = k2 ->
      let result = create_tensor [m; n] 0.0 in
      for i = 0 to m - 1 do
        for j = 0 to n - 1 do
          let sum = ref 0.0 in
          for k = 0 to k1 - 1 do
            sum := !sum +. a[i,k] *. b[k,j]
          done;
          result[i,j] <- !sum
        done
      done;
      result
`})}),`
`,e.jsx(n.h4,{id:"transpose-2",children:"Transpose"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`let tensor_transpose t =
  let [m; n] = t.shape in
  let result = create_tensor [n; m] 0.0 in
  for i = 0 to m - 1 do
    for j = 0 to n - 1 do
      result[j,i] <- t[i,j]
    done
  done;
  result
`})}),`
`,e.jsx(n.h3,{id:"89-error-handling",children:"8.9 Error handling"}),`
`,e.jsx(n.h4,{id:"runtime-errors",children:"Runtime errors"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ocaml",children:`exception Runtime_error of string
`})}),`
`,e.jsx(n.p,{children:"The runtime errors include the following:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Stack overflow or stack underflow"}),`
`,e.jsx(n.li,{children:"Division by zero"}),`
`,e.jsx(n.li,{children:"A value of the wrong type at run time"}),`
`,e.jsx(n.li,{children:"Tensor shapes that don't fit the operation"}),`
`,e.jsx(n.li,{children:"A program counter outside the code of the current function"}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"log"})," of a number that isn't positive, or ",e.jsx(n.code,{children:"sqrt"})," of a negative number"]}),`
`]}),`
`,e.jsx(n.h4,{id:"error-messages",children:"Error messages"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Runtime error: Stack overflow
Runtime error: Division by zero
Runtime error: Expected int, got bool
Runtime error: Invalid shapes for dot: 2x3 and 4x2
`})}),`
`,e.jsx(n.h3,{id:"810-debugging-support",children:"8.10 Debugging support"}),`
`,e.jsx(n.h4,{id:"instruction-tracing",children:"Instruction tracing"}),`
`,e.jsxs(n.p,{children:["The VM has no instruction tracer. The listing below is an example of what a trace would show for ",e.jsx(n.code,{children:"let x = 5 in x + 1"}),", with one line for each instruction the VM runs."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`0000: PUSH_INT 5
0001: STORE_LOCAL 0
0002: LOAD_LOCAL 0
0003: PUSH_INT 1
0004: IADD
0005: RETURN
`})}),`
`,e.jsx(n.h4,{id:"stack-inspection",children:"Stack inspection"}),`
`,e.jsx(n.p,{children:"The VM has no command that prints the stack or the locals. The listing below is an example of what such a printout would show."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`Stack: [VInt 5, VInt 1]
Locals: [VInt 5, VUnit, ...]
`})}),`
`,e.jsx(n.h4,{id:"bytecode-disassembly",children:"Bytecode disassembly"}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.code,{children:"--dump-bytecode"})," option prints the bytecode of each function in the following format. The listing below is simplified. The real listing for a program is often longer, because the compiler stores each intermediate result in a local."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`=== Function 0 (locals=2, params=0, captures=0) ===
   0: PUSH_INT 5
   1: STORE_LOCAL 0
   2: LOAD_LOCAL 0
   3: PUSH_INT 1
   4: IADD
   5: RETURN
`})}),`
`,e.jsx(n.h3,{id:"811-performance-characteristics",children:"8.11 Performance characteristics"}),`
`,e.jsx(n.h4,{id:"time-complexity",children:"Time complexity"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Operation"}),e.jsx(n.th,{children:"Complexity"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Stack push/pop"}),e.jsx(n.td,{children:"O(1)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Local access"}),e.jsx(n.td,{children:"O(1)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Closure capture"}),e.jsx(n.td,{children:"O(1)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Function call"}),e.jsx(n.td,{children:"O(captures)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Tensor dot"}),e.jsx(n.td,{children:"O(m×n×k)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Tensor transpose"}),e.jsx(n.td,{children:"O(m×n)"})]})]})]}),`
`,e.jsx(n.h4,{id:"space-complexity",children:"Space complexity"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Resource"}),e.jsx(n.th,{children:"Limit"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Stack"}),e.jsx(n.td,{children:"1024 values"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Locals"}),e.jsx(n.td,{children:"At least 256 per frame"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Call depth"}),e.jsx(n.td,{children:"Limited by memory"})]})]})]}),`
`,e.jsx(n.h2,{id:"9-bytecode-specification",children:"9. Bytecode specification"}),`
`,e.jsx(n.p,{children:"Chapter 9 describes the Bagl bytecode instruction set. Bytecode is the list of simple instructions that the compiler produces and the VM runs."}),`
`,e.jsxs(n.p,{children:["The chapter doesn't yet cover every opcode in ",e.jsx(n.code,{children:"src/bytecode.ml"}),". It leaves out the following opcodes:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The float comparisons ",e.jsx(n.code,{children:"FLT"}),", ",e.jsx(n.code,{children:"FGT"}),", ",e.jsx(n.code,{children:"FLE"}),", and ",e.jsx(n.code,{children:"FGE"})]}),`
`,e.jsxs(n.li,{children:["The element-wise tensor operations ",e.jsx(n.code,{children:"TADD"}),", ",e.jsx(n.code,{children:"TSUB"}),", ",e.jsx(n.code,{children:"TMUL"}),", and ",e.jsx(n.code,{children:"TDIV"})]}),`
`,e.jsxs(n.li,{children:["The math functions ",e.jsx(n.code,{children:"MEXP"}),", ",e.jsx(n.code,{children:"MLOG"}),", ",e.jsx(n.code,{children:"MSQRT"}),", ",e.jsx(n.code,{children:"MRELU"}),", and ",e.jsx(n.code,{children:"MSTEP"})]}),`
`]}),`
`,e.jsx(n.h3,{id:"91-bytecode-format",children:"9.1 Bytecode format"}),`
`,e.jsx(n.h4,{id:"program-structure-1",children:"Program structure"}),`
`,e.jsx(n.p,{children:"A program is a list of chunks, with one chunk for each function, and the index of the function that runs first."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Program = {
  chunks: Chunk[]    // One chunk per function
  entry: int         // Index of main function
}
`})}),`
`,e.jsx(n.h4,{id:"chunk-structure",children:"Chunk structure"}),`
`,e.jsx(n.p,{children:"A chunk holds the instructions of one function and three counts."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Chunk = {
  code: Opcode[]     // Instruction sequence
  num_locals: int    // Local variable count
  num_params: int    // Parameter count
  num_captures: int  // Captured variable count
}
`})}),`
`,e.jsx(n.h3,{id:"92-instruction-categories",children:"9.2 Instruction categories"}),`
`,e.jsx(n.h4,{id:"stack-operations",children:"Stack operations"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"PUSH_*"})," pushes a value onto the stack."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"POP"})," removes the top of the stack."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"DUP"})," duplicates the top of the stack."]}),`
`]}),`
`,e.jsx(n.h4,{id:"variable-access",children:"Variable access"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"LOAD_LOCAL"})," and ",e.jsx(n.code,{children:"STORE_LOCAL"})," read and write local variables."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"LOAD_GLOBAL"})," and ",e.jsx(n.code,{children:"STORE_GLOBAL"})," read and write global variables."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"LOAD_CAPTURE"})," reads a value that a closure captured."]}),`
`]}),`
`,e.jsx(n.h4,{id:"arithmetic",children:"Arithmetic"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The integer instructions are ",e.jsx(n.code,{children:"IADD"}),", ",e.jsx(n.code,{children:"ISUB"}),", ",e.jsx(n.code,{children:"IMUL"}),", ",e.jsx(n.code,{children:"IDIV"}),", and ",e.jsx(n.code,{children:"INEG"}),"."]}),`
`,e.jsxs(n.li,{children:["The float instructions are ",e.jsx(n.code,{children:"FADD"}),", ",e.jsx(n.code,{children:"FSUB"}),", ",e.jsx(n.code,{children:"FMUL"}),", ",e.jsx(n.code,{children:"FDIV"}),", and ",e.jsx(n.code,{children:"FNEG"}),"."]}),`
`]}),`
`,e.jsx(n.h4,{id:"comparison",children:"Comparison"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"IEQ"})," and ",e.jsx(n.code,{children:"INEQ"})," test equality."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"ILT"}),", ",e.jsx(n.code,{children:"IGT"}),", ",e.jsx(n.code,{children:"ILE"}),", and ",e.jsx(n.code,{children:"IGE"})," compare order."]}),`
`]}),`
`,e.jsx(n.h4,{id:"logical",children:"Logical"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The logical instructions are ",e.jsx(n.code,{children:"AND"}),", ",e.jsx(n.code,{children:"OR"}),", and ",e.jsx(n.code,{children:"NOT"}),"."]}),`
`]}),`
`,e.jsx(n.h4,{id:"control-flow",children:"Control flow"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"JUMP"})," and ",e.jsx(n.code,{children:"JUMP_IF_FALSE"})," move to another instruction."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"CALL"})," and ",e.jsx(n.code,{children:"RETURN"})," enter and leave a function."]}),`
`]}),`
`,e.jsx(n.h4,{id:"closures",children:"Closures"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"MAKE_CLOSURE"})," and ",e.jsx(n.code,{children:"MAKE_REC_CLOSURE"})," create closures."]}),`
`]}),`
`,e.jsx(n.h4,{id:"tensors",children:"Tensors"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The tensor instructions are ",e.jsx(n.code,{children:"TENSOR_CREATE"}),", ",e.jsx(n.code,{children:"TENSOR_DOT"}),", ",e.jsx(n.code,{children:"TENSOR_TRANSPOSE"}),", and ",e.jsx(n.code,{children:"TENSOR_RESHAPE"}),"."]}),`
`]}),`
`,e.jsx(n.h3,{id:"93-instruction-reference",children:"9.3 Instruction reference"}),`
`,e.jsx(n.p,{children:"Each entry shows the stack before and after the instruction, with the top of the stack on the right."}),`
`,e.jsx(n.h4,{id:"stack-operations-1",children:"Stack operations"}),`
`,e.jsx(n.h5,{id:"push_int-n",children:"PUSH_INT n"}),`
`,e.jsxs(n.p,{children:["Pushes the integer ",e.jsx(n.code,{children:"n"})," onto the stack."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., VInt(n)
`})}),`
`,e.jsx(n.h5,{id:"push_float-f",children:"PUSH_FLOAT f"}),`
`,e.jsxs(n.p,{children:["Pushes the float ",e.jsx(n.code,{children:"f"})," onto the stack."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., VFloat(f)
`})}),`
`,e.jsx(n.h5,{id:"push_bool-b",children:"PUSH_BOOL b"}),`
`,e.jsxs(n.p,{children:["Pushes the boolean ",e.jsx(n.code,{children:"b"})," onto the stack."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., VBool(b)
`})}),`
`,e.jsx(n.h5,{id:"push_string-s",children:"PUSH_STRING s"}),`
`,e.jsxs(n.p,{children:["Pushes the string ",e.jsx(n.code,{children:"s"})," onto the stack."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., VString(s)
`})}),`
`,e.jsx(n.h5,{id:"push_unit",children:"PUSH_UNIT"}),`
`,e.jsx(n.p,{children:"Pushes the unit value onto the stack."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., VUnit
`})}),`
`,e.jsx(n.h5,{id:"pop-1",children:"POP"}),`
`,e.jsx(n.p,{children:"Removes the top value from the stack."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., v → ...
`})}),`
`,e.jsx(n.h5,{id:"dup",children:"DUP"}),`
`,e.jsx(n.p,{children:"Duplicates the top value of the stack."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., v → ..., v, v
`})}),`
`,e.jsx(n.h4,{id:"local-variable-operations",children:"Local variable operations"}),`
`,e.jsx(n.h5,{id:"load_local-i",children:"LOAD_LOCAL i"}),`
`,e.jsxs(n.p,{children:["Pushes the local variable at index ",e.jsx(n.code,{children:"i"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., locals[i]
`})}),`
`,e.jsx(n.h5,{id:"store_local-i",children:"STORE_LOCAL i"}),`
`,e.jsxs(n.p,{children:["Pops a value and stores it in local ",e.jsx(n.code,{children:"i"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., v → ...
Effect: locals[i] = v
`})}),`
`,e.jsx(n.h4,{id:"global-variable-operations",children:"Global variable operations"}),`
`,e.jsx(n.h5,{id:"load_global-i",children:"LOAD_GLOBAL i"}),`
`,e.jsxs(n.p,{children:["Pushes the global variable at index ",e.jsx(n.code,{children:"i"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., globals[i]
`})}),`
`,e.jsxs(n.p,{children:["The VM doesn't implement ",e.jsx(n.code,{children:"LOAD_GLOBAL"})," yet, and it raises a runtime error when it runs one."]}),`
`,e.jsx(n.h5,{id:"store_global-i",children:"STORE_GLOBAL i"}),`
`,e.jsxs(n.p,{children:["Pops a value and stores it in global ",e.jsx(n.code,{children:"i"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., v → ...
Effect: globals[i] = v
`})}),`
`,e.jsxs(n.p,{children:["The VM doesn't implement ",e.jsx(n.code,{children:"STORE_GLOBAL"})," yet, and it raises a runtime error when it runs one."]}),`
`,e.jsx(n.h4,{id:"closure-operations",children:"Closure operations"}),`
`,e.jsx(n.h5,{id:"make_closure-func_id-num_captures",children:"MAKE_CLOSURE func_id num_captures"}),`
`,e.jsx(n.p,{children:"Creates a closure."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., capture₀, ..., captureₙ₋₁ → ..., VClosure
`})}),`
`,e.jsxs(n.p,{children:["The instruction pops ",e.jsx(n.code,{children:"num_captures"})," values, and it creates a closure that refers to function ",e.jsx(n.code,{children:"func_id"})," and holds the popped values."]}),`
`,e.jsx(n.h5,{id:"make_rec_closure-func_id-num_captures-self_idx",children:"MAKE_REC_CLOSURE func_id num_captures self_idx"}),`
`,e.jsx(n.p,{children:"Creates a recursive closure."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., capture₀, ..., captureₙ₋₁ → ..., VClosure
`})}),`
`,e.jsxs(n.p,{children:["The instruction works like ",e.jsx(n.code,{children:"MAKE_CLOSURE"}),", and it also puts the closure itself into capture slot ",e.jsx(n.code,{children:"self_idx"}),"."]}),`
`,e.jsx(n.h5,{id:"load_capture-i",children:"LOAD_CAPTURE i"}),`
`,e.jsxs(n.p,{children:["Pushes the captured value at index ",e.jsx(n.code,{children:"i"})," of the current closure."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ... → ..., current_closure.captures[i]
`})}),`
`,e.jsx(n.h4,{id:"integer-arithmetic",children:"Integer arithmetic"}),`
`,e.jsx(n.h5,{id:"iadd",children:"IADD"}),`
`,e.jsx(n.p,{children:"Adds two integers."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a + b)
Types: VInt, VInt → VInt
`})}),`
`,e.jsx(n.h5,{id:"isub",children:"ISUB"}),`
`,e.jsx(n.p,{children:"Subtracts two integers."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a - b)
Types: VInt, VInt → VInt
`})}),`
`,e.jsx(n.h5,{id:"imul",children:"IMUL"}),`
`,e.jsx(n.p,{children:"Multiplies two integers."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a * b)
Types: VInt, VInt → VInt
`})}),`
`,e.jsx(n.h5,{id:"idiv",children:"IDIV"}),`
`,e.jsx(n.p,{children:"Divides two integers."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a / b)
Types: VInt, VInt → VInt
Error: Division by zero if b = 0
`})}),`
`,e.jsx(n.h5,{id:"ineg",children:"INEG"}),`
`,e.jsx(n.p,{children:"Negates an integer."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a → ..., (-a)
Types: VInt → VInt
`})}),`
`,e.jsx(n.h4,{id:"float-arithmetic",children:"Float arithmetic"}),`
`,e.jsx(n.h5,{id:"fadd",children:"FADD"}),`
`,e.jsx(n.p,{children:"Adds two floats."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a +. b)
Types: VFloat, VFloat → VFloat
`})}),`
`,e.jsx(n.h5,{id:"fsub",children:"FSUB"}),`
`,e.jsx(n.p,{children:"Subtracts two floats."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a -. b)
Types: VFloat, VFloat → VFloat
`})}),`
`,e.jsx(n.h5,{id:"fmul",children:"FMUL"}),`
`,e.jsx(n.p,{children:"Multiplies two floats."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a *. b)
Types: VFloat, VFloat → VFloat
`})}),`
`,e.jsx(n.h5,{id:"fdiv",children:"FDIV"}),`
`,e.jsx(n.p,{children:"Divides two floats."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a /. b)
Types: VFloat, VFloat → VFloat
Error: Division by zero if b = 0.0
`})}),`
`,e.jsx(n.h5,{id:"fneg",children:"FNEG"}),`
`,e.jsx(n.p,{children:"Negates a float."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a → ..., (-.a)
Types: VFloat → VFloat
`})}),`
`,e.jsx(n.h4,{id:"comparison-operations",children:"Comparison operations"}),`
`,e.jsx(n.h5,{id:"ieq",children:"IEQ"}),`
`,e.jsx(n.p,{children:"Tests whether two values are equal."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a = b)
Types: 'a, 'a → VBool
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"IEQ"})," works on ints, floats, bools, strings, and the unit value. Two values of different kinds are never equal."]}),`
`,e.jsx(n.h5,{id:"ineq",children:"INEQ"}),`
`,e.jsx(n.p,{children:"Tests whether two values are not equal."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a ≠ b)
Types: 'a, 'a → VBool
`})}),`
`,e.jsx(n.h5,{id:"ilt",children:"ILT"}),`
`,e.jsxs(n.p,{children:["Tests whether ",e.jsx(n.code,{children:"a"})," is less than ",e.jsx(n.code,{children:"b"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a < b)
Types: VInt, VInt → VBool
`})}),`
`,e.jsx(n.h5,{id:"igt",children:"IGT"}),`
`,e.jsxs(n.p,{children:["Tests whether ",e.jsx(n.code,{children:"a"})," is greater than ",e.jsx(n.code,{children:"b"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a > b)
Types: VInt, VInt → VBool
`})}),`
`,e.jsx(n.h5,{id:"ile",children:"ILE"}),`
`,e.jsxs(n.p,{children:["Tests whether ",e.jsx(n.code,{children:"a"})," is less than or equal to ",e.jsx(n.code,{children:"b"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a ≤ b)
Types: VInt, VInt → VBool
`})}),`
`,e.jsx(n.h5,{id:"ige",children:"IGE"}),`
`,e.jsxs(n.p,{children:["Tests whether ",e.jsx(n.code,{children:"a"})," is greater than or equal to ",e.jsx(n.code,{children:"b"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a ≥ b)
Types: VInt, VInt → VBool
`})}),`
`,e.jsx(n.h4,{id:"logical-operations",children:"Logical operations"}),`
`,e.jsx(n.h5,{id:"and",children:"AND"}),`
`,e.jsx(n.p,{children:"Computes the logical and of two booleans."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a && b)
Types: VBool, VBool → VBool
`})}),`
`,e.jsx(n.h5,{id:"or",children:"OR"}),`
`,e.jsx(n.p,{children:"Computes the logical or of two booleans."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., (a || b)
Types: VBool, VBool → VBool
`})}),`
`,e.jsx(n.h5,{id:"not",children:"NOT"}),`
`,e.jsx(n.p,{children:"Computes the logical not of a boolean."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a → ..., (!a)
Types: VBool → VBool
`})}),`
`,e.jsx(n.h4,{id:"control-flow-1",children:"Control flow"}),`
`,e.jsx(n.h5,{id:"jump-addr",children:"JUMP addr"}),`
`,e.jsxs(n.p,{children:["Jumps to ",e.jsx(n.code,{children:"addr"})," every time."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Effect: pc = addr
`})}),`
`,e.jsx(n.h5,{id:"jump_if_false-addr",children:"JUMP_IF_FALSE addr"}),`
`,e.jsxs(n.p,{children:["Pops a boolean, and jumps to ",e.jsx(n.code,{children:"addr"})," if the boolean is false."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., cond → ...
Effect: if !cond then pc = addr
Types: VBool → (consumed)
`})}),`
`,e.jsx(n.h5,{id:"call-n_args",children:"CALL n_args"}),`
`,e.jsx(n.p,{children:"Calls a function."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., arg₀, ..., argₙ₋₁, closure → ...
Effect:
  1. Save current frame
  2. Switch to closure's function
  3. Copy args to new locals
`})}),`
`,e.jsx(n.h5,{id:"return",children:"RETURN"}),`
`,e.jsx(n.p,{children:"Returns from a function."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., result → ... (in caller), result
Effect:
  1. Pop frame
  2. Restore caller state
  3. Push result on caller's stack
`})}),`
`,e.jsx(n.h4,{id:"tensor-operations",children:"Tensor operations"}),`
`,e.jsx(n.h5,{id:"tensor_create-shape",children:"TENSOR_CREATE shape"}),`
`,e.jsx(n.p,{children:"Creates a tensor with the given shape."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., elem₀, ..., elemₙ₋₁ → ..., VTensor
`})}),`
`,e.jsx(n.p,{children:"The instruction pops as many elements as the shape holds, and it creates the tensor. The number of elements is the product of the dimensions."}),`
`,e.jsx(n.h5,{id:"tensor_dot",children:"TENSOR_DOT"}),`
`,e.jsx(n.p,{children:"Computes the dot product of two matrices or vectors."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., a, b → ..., result
Types: VTensor, VTensor → VTensor or VFloat
`})}),`
`,e.jsx(n.p,{children:"The result is a float when both inputs are vectors, and a tensor otherwise."}),`
`,e.jsx(n.h5,{id:"tensor_transpose",children:"TENSOR_TRANSPOSE"}),`
`,e.jsx(n.p,{children:"Transposes a 2D tensor."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., t → ..., transposed
Types: VTensor → VTensor
`})}),`
`,e.jsx(n.h5,{id:"tensor_reshape-shape",children:"TENSOR_RESHAPE shape"}),`
`,e.jsx(n.p,{children:"Reshapes a tensor."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., t → ..., reshaped
Types: VTensor → VTensor
Error: if sizes don't match
`})}),`
`,e.jsx(n.h4,{id:"debugging-and-control",children:"Debugging and control"}),`
`,e.jsx(n.h5,{id:"print",children:"PRINT"}),`
`,e.jsx(n.p,{children:"Prints the top of the stack, for debugging."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Stack: ..., v → ..., v
Effect: prints string_of_value(v)
`})}),`
`,e.jsx(n.h5,{id:"halt",children:"HALT"}),`
`,e.jsx(n.p,{children:"Stops execution."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Effect: terminates VM execution loop
`})}),`
`,e.jsx(n.h5,{id:"nop",children:"NOP"}),`
`,e.jsx(n.p,{children:"Does nothing."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Effect: none
`})}),`
`,e.jsx(n.h3,{id:"94-bytecode-examples",children:"9.4 Bytecode examples"}),`
`,e.jsxs(n.p,{children:["The listings in section 9.4 are simplified by hand to show how each construct works. The real compiler stores each intermediate result in a local, and its optimizer folds constant expressions such as ",e.jsx(n.code,{children:"1 + 2"})," into one value. The ",e.jsx(n.code,{children:"--dump-bytecode"})," option prints the real code, which is often longer or different."]}),`
`,e.jsx(n.h4,{id:"simple-expression",children:"Simple expression"}),`
`,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"1 + 2"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`PUSH_INT 1
PUSH_INT 2
IADD
RETURN
`})}),`
`,e.jsx(n.h4,{id:"let-binding-1",children:"Let binding"}),`
`,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"let x = 5 in x + 1"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`PUSH_INT 5
STORE_LOCAL 0
LOAD_LOCAL 0
PUSH_INT 1
IADD
RETURN
`})}),`
`,e.jsx(n.h4,{id:"function-definition-1",children:"Function definition"}),`
`,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"fn x -> x + 1"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`// Main function
MAKE_CLOSURE 1 0    // func_id=1, no captures
RETURN

// Function 1: x -> x + 1
LOAD_LOCAL 0        // x
PUSH_INT 1
IADD
RETURN
`})}),`
`,e.jsx(n.h4,{id:"function-call-1",children:"Function call"}),`
`,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"(fn x -> x + 1) 5"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`PUSH_INT 5          // Argument
MAKE_CLOSURE 1 0    // Create closure
CALL 1              // Call with 1 arg
RETURN
`})}),`
`,e.jsx(n.h4,{id:"conditional-1",children:"Conditional"}),`
`,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"if true then 1 else 2"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`PUSH_BOOL true
JUMP_IF_FALSE 4     // Jump to else
PUSH_INT 1
JUMP 5              // Skip else
PUSH_INT 2          // else branch
RETURN
`})}),`
`,e.jsx(n.h4,{id:"closure-with-capture",children:"Closure with capture"}),`
`,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"let y = 5 in fn x -> x + y"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`// Main
PUSH_INT 5
STORE_LOCAL 0       // y = 5
LOAD_LOCAL 0        // Push y for capture
MAKE_CLOSURE 1 1    // func_id=1, 1 capture
RETURN

// Function 1
LOAD_LOCAL 0        // x
LOAD_CAPTURE 0      // y
IADD
RETURN
`})}),`
`,e.jsx(n.h3,{id:"95-serialization-format",children:"9.5 Serialization format"}),`
`,e.jsxs(n.p,{children:["A compiled program is saved as a ",e.jsx(n.code,{children:".baglc"})," file with the layout below. Every integer in the file, including each ",e.jsx(n.code,{children:"uint32"})," in the layout, is written as 4 bytes in big-endian order, which puts the most significant byte first."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`Header:
  magic: "BAGL" (4 bytes)
  version: uint32
  entry: uint32
  num_chunks: uint32

For each chunk:
  num_locals: uint32
  num_params: uint32
  num_captures: uint32
  code_length: uint32
  code: opcode[] (variable)
`})}),`
`,e.jsx(n.p,{children:"Each opcode is written in two parts:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"One tag byte, which says which opcode it is."}),`
`,e.jsx(n.li,{children:"The operands, which depend on the opcode."}),`
`]})]})}function l(s={}){const{wrapper:n}=s.components||{};return n?e.jsx(n,{...s,children:e.jsx(i,{...s})}):i(s)}function j(){return e.jsx(t,{page:"spec",toc:r.spec,Content:l,collapse:!0})}export{j as default};
