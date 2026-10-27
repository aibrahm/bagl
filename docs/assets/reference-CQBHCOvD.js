import{j as e}from"./preload-helper-CkyS6jwL.js";import{t}from"./_virtual_toc-Dm_Ky1bC.js";import{D as a}from"./doc-page-CxP1cBkI.js";import"./shell-Cdyk8OT_.js";import"./examples-CwxgrFpf.js";import"./compiler-Dl0UKjtR.js";function r(i){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...i.components},{Example:s}=n;return s||d("Example"),e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"language-reference",children:"Language reference"}),`
`,e.jsxs(n.p,{children:["The reference describes each part of Bagl, from literals and functions to tensors and ",e.jsx(n.code,{children:"grad"}),". You can edit the examples and run them. ",e.jsx(n.a,{href:"/bagl/spec/",children:"The specification"})," gives the complete rules."]}),`
`,e.jsx(n.h2,{id:"overview",children:"Overview"}),`
`,e.jsxs(n.p,{children:["Bagl is a small functional language with static types. A tensor's shape is part of its type, so a mismatch in matrix dimensions is a compile error, and ",e.jsx(n.code,{children:"grad"})," turns a function into its derivative before type inference runs."]}),`
`,e.jsx(n.p,{children:"The compiler runs these stages in order."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`source → lexer → parser → grad expansion → Hindley-Milner inference (with shapes)
       → control flow graph IR → optimizer → stack bytecode → VM
`})}),`
`,e.jsx(n.p,{children:"The compiler prefers an error to a wrong answer. If it can't handle a program correctly, it reports an error instead of guessing."}),`
`,e.jsx(n.h2,{id:"basics",children:"Basics"}),`
`,e.jsx(n.h3,{id:"literals-and-comments",children:"Literals and comments"}),`
`,e.jsxs(n.p,{children:["There are four scalar types, ",e.jsx(n.code,{children:"int"}),", ",e.jsx(n.code,{children:"float"}),", ",e.jsx(n.code,{children:"bool"})," and ",e.jsx(n.code,{children:"string"}),". Integers and floats are separate types, and Bagl never converts one into the other on its own. Line comments start with ",e.jsx(n.code,{children:"//"}),", and block comments look like ",e.jsx(n.code,{children:"/* ... */"}),"."]}),`
`,e.jsx(s,{id:"literals"}),`
`,e.jsx(n.h3,{id:"bindings",children:"Bindings"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"let name = value in body"})," binds a name inside the body. Bindings can nest, and an inner binding hides an outer one with the same name. A program evaluates to the value of its last expression."]}),`
`,e.jsx(s,{id:"bindings"}),`
`,e.jsx(n.h3,{id:"functions",children:"Functions"}),`
`,e.jsxs(n.p,{children:["A function takes exactly one parameter, so a function of several arguments is written as nested ",e.jsx(n.code,{children:"fn"}),", which is called currying. You call a function by writing the argument after it, and calls group to the left. Functions are values, and they keep the variables around them, which makes them closures."]}),`
`,e.jsx(s,{id:"functions"}),`
`,e.jsx(n.h3,{id:"recursion",children:"Recursion"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"letrec"})," makes a name visible inside its own definition. At run time, the virtual machine (VM) creates a closure that refers to itself, and it fills in that reference right after it allocates the closure."]}),`
`,e.jsx(s,{id:"recursion"}),`
`,e.jsx(n.h3,{id:"conditionals",children:"Conditionals"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"if"})," is an expression. Both branches must have the same type, and the condition must be a ",e.jsx(n.code,{children:"bool"}),". The comparison operators are ",e.jsx(n.code,{children:"== != < > <= >="}),", and the logical operators are ",e.jsx(n.code,{children:"&& || !"}),". Equality works on scalars only, as ",e.jsx(n.a,{href:"#limits",children:"the limits"})," explain."]}),`
`,e.jsx(s,{id:"conditionals"}),`
`,e.jsx(n.h2,{id:"the-type-system",children:"The type system"}),`
`,e.jsx(n.h3,{id:"inference",children:"Inference"}),`
`,e.jsxs(n.p,{children:["Bagl uses Hindley-Milner type inference, so you rarely write a type, and the checker finds the most general one. A value bound with ",e.jsx(n.code,{children:"let"})," is generalized, so one definition can be used at several types. The checker uses union-find unification and level-based generalization, which is the technique that OCaml's own checker uses."]}),`
`,e.jsx(s,{id:"inference"}),`
`,e.jsxs(n.p,{children:["The occurs check rejects infinite types, so ",e.jsx(n.code,{children:"fn x -> x x"})," is a compile error instead of a hang."]}),`
`,e.jsx(s,{id:"occurs-check"}),`
`,e.jsx(n.h3,{id:"numeric-operators",children:"Numeric operators"}),`
`,e.jsxs(n.p,{children:["Bagl has no type classes, so ",e.jsx(n.code,{children:"+ - * /"})," and the comparisons choose between int and float by looking at their operands. If either side is a ",e.jsx(n.code,{children:"float"}),", the operation works on floats. When neither side is known yet, the checker waits, and it only defaults to ",e.jsx(n.code,{children:"int"})," when the enclosing binding is generalized. Because of the wait, the order of the operands never matters."]}),`
`,e.jsx(s,{id:"numerics"}),`
`,e.jsxs(n.p,{children:["With no constraint at all, a numeric parameter defaults to ",e.jsx(n.code,{children:"int"}),", so ",e.jsx(n.code,{children:"fn x -> x + x"})," has the type ",e.jsx(n.code,{children:"int -> int"}),". The design gives up principal types to keep a checker that runs in one pass, and you can annotate the parameter to get the float version. Division by zero is a runtime error for integers and floats alike, and it never produces ",e.jsx(n.code,{children:"inf"}),"."]}),`
`,e.jsx(n.h3,{id:"annotations",children:"Annotations"}),`
`,e.jsxs(n.p,{children:["You can add a type after a binding name or a parameter. A parameter annotation can't be a function type unless you wrap it in parentheses. Named type variables, like ",e.jsx(n.code,{children:"'a"}),", and dimension variables, like ",e.jsx(n.code,{children:"'n"}),", are shared within one annotation, so ",e.jsx(n.code,{children:"tensor<float>['n,'n]"})," means a square matrix."]}),`
`,e.jsx(s,{id:"annotations"}),`
`,e.jsx(n.h2,{id:"tensors",children:"Tensors"}),`
`,e.jsx(n.h3,{id:"literals-and-rank",children:"Literals and rank"}),`
`,e.jsxs(n.p,{children:["Tensors hold floats, and they have rank 1 (vectors) or rank 2 (matrices). The brackets decide the rank, and a matrix with one row is different from a vector. For example, ",e.jsx(n.code,{children:"[1.0, 2.0]"})," is a vector with shape ",e.jsx(n.code,{children:"[2]"}),", and ",e.jsx(n.code,{children:"[[1.0, 2.0]]"})," is a 1x2 matrix. The compiler rejects integer tensors instead of converting them."]}),`
`,e.jsx(s,{id:"tensor-literals"}),`
`,e.jsx(n.h3,{id:"dot-transpose-and-reshape",children:"dot, transpose and reshape"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"dot"})," works on four combinations of ranks, and it unifies the shared dimension in each one."]}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Operand shapes"}),e.jsx(n.th,{children:"Result"}),e.jsx(n.th,{children:"Meaning"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsxs(n.td,{children:[e.jsx(n.code,{children:"[m,k]"})," and ",e.jsx(n.code,{children:"[k,n]"})]}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[m,n]"})}),e.jsx(n.td,{children:"matrix product"})]}),e.jsxs(n.tr,{children:[e.jsxs(n.td,{children:[e.jsx(n.code,{children:"[m,k]"})," and ",e.jsx(n.code,{children:"[k]"})]}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[m]"})}),e.jsx(n.td,{children:"matrix times vector"})]}),e.jsxs(n.tr,{children:[e.jsxs(n.td,{children:[e.jsx(n.code,{children:"[k]"})," and ",e.jsx(n.code,{children:"[k,n]"})]}),e.jsx(n.td,{children:e.jsx(n.code,{children:"[n]"})}),e.jsx(n.td,{children:"vector times matrix"})]}),e.jsxs(n.tr,{children:[e.jsxs(n.td,{children:[e.jsx(n.code,{children:"[k]"})," and ",e.jsx(n.code,{children:"[k]"})]}),e.jsx(n.td,{children:e.jsx(n.code,{children:"float"})}),e.jsx(n.td,{children:"inner product"})]})]})]}),`
`,e.jsx(s,{id:"dot"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"transpose"})," works on matrices. ",e.jsx(n.code,{children:"reshape"})," takes a literal shape, and it checks the number of elements when both sizes are known."]}),`
`,e.jsx(n.h3,{id:"element-wise-arithmetic",children:"Element-wise arithmetic"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"+ - * /"})," on two tensors of the same shape work element by element. Here ",e.jsx(n.code,{children:"*"})," is the element-wise product, and matrix multiplication is ",e.jsx(n.code,{children:"dot"}),". A float on either side is applied to every element. The compiler checks the shapes, and the VM checks them again at run time."]}),`
`,e.jsx(s,{id:"elementwise"}),`
`,e.jsx(n.h3,{id:"shape-checking",children:"Shape checking"}),`
`,e.jsx(n.p,{children:"Shapes live in the type system as a second set of unification variables. Each dimension is a union-find variable with its own occurs check, and the checker unifies dimensions alongside ordinary types. A mismatch is a compile error that points at the expression at fault. The check also works across function calls, so a bad shape passed through a function still reports the mismatch."}),`
`,e.jsx(s,{id:"shapes"}),`
`,e.jsx(n.h2,{id:"math-builtins",children:"Math builtins"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"exp"}),", ",e.jsx(n.code,{children:"log"}),", ",e.jsx(n.code,{children:"sqrt"}),", ",e.jsx(n.code,{children:"relu"})," and ",e.jsx(n.code,{children:"step"})," work on a float, or element by element on a tensor. ",e.jsx(n.code,{children:"step"})," is the Heaviside function, which is 1.0 for x > 0 and 0.0 otherwise, and it is exactly the derivative of ",e.jsx(n.code,{children:"relu"}),"."]}),`
`,e.jsx(s,{id:"math"}),`
`,e.jsxs(n.p,{children:["Domain errors stop the program at run time instead of producing ",e.jsx(n.code,{children:"nan"}),", so ",e.jsx(n.code,{children:"log"})," of a number that isn't positive and ",e.jsx(n.code,{children:"sqrt"})," of a negative number are errors."]}),`
`,e.jsx(s,{id:"math-domain"}),`
`,e.jsx(n.h2,{id:"differentiation",children:"Differentiation"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"grad"})," is a source to source transform that runs before type inference. The compiler rewrites ",e.jsx(n.code,{children:"grad (fn x -> body)"})," into an ordinary Bagl function that computes the derivative, and that function goes through inference, the optimizer and the VM like any other code. The derivative is therefore checked for types and shapes too. The parameter annotation selects the mode."]}),`
`,e.jsx(n.h3,{id:"scalar-mode",children:"Scalar mode"}),`
`,e.jsxs(n.p,{children:["For a parameter with no annotation or a ",e.jsx(n.code,{children:"float"})," annotation, over scalar code, ",e.jsx(n.code,{children:"grad"})," applies the sum, product, quotient and chain rules symbolically. For an ",e.jsx(n.code,{children:"if"}),", it differentiates each branch and keeps the condition as it is. It passes through ",e.jsx(n.code,{children:"let"}),", and each builtin has its usual derivative rule."]}),`
`,e.jsx(s,{id:"grad-scalar"}),`
`,e.jsx(n.p,{children:"Derivatives are ordinary functions, so you can combine them with anything else. The example below is Newton's method, where the compiler supplies the derivative of f."}),`
`,e.jsx(s,{id:"newton"}),`
`,e.jsx(n.h3,{id:"tensor-mode",children:"Tensor mode"}),`
`,e.jsxs(n.p,{children:["With a tensor parameter annotation, ",e.jsx(n.code,{children:"grad"})," uses reverse mode differentiation, and it returns the gradient of a scalar loss in the shape of the parameter. The rules cover ",e.jsx(n.code,{children:"dot"})," in all four rank cases, ",e.jsx(n.code,{children:"transpose"}),", element-wise arithmetic, the math builtins, scalar broadcast and ",e.jsx(n.code,{children:"let"}),". The annotation is required, because the transform runs before inference and the rules for ",e.jsx(n.code,{children:"dot"})," depend on the ranks of its operands."]}),`
`,e.jsx(s,{id:"grad-tensor"}),`
`,e.jsxs(n.p,{children:["Tensor mode is enough to train a model in the language. The example below trains XOR on mapped features by gradient descent, and it converges to the exact solution ",e.jsx(n.code,{children:"[1, 1, -2]"}),"."]}),`
`,e.jsx(s,{id:"train-xor"}),`
`,e.jsx(n.h3,{id:"pathwise-derivatives",children:"Pathwise derivatives"}),`
`,e.jsxs(n.p,{children:["You can also differentiate a parameter annotated as ",e.jsx(n.code,{children:"float"})," through tensor code, and the compiler expresses the sums this needs as dot products. Computational finance calls the technique the pathwise derivative estimator. It computes how sensitive a Monte Carlo average is by differentiating through the simulation itself."]}),`
`,e.jsx(s,{id:"pathwise"}),`
`,e.jsxs(n.p,{children:["The answer, 0.65, is exactly the estimator E[g × 1",e.jsx("sub",{children:"ITM"}),"], because the two paths that end in the money contribute (1.2 + 1.4) / 4."]}),`
`,e.jsx(n.h3,{id:"what-is-rejected",children:"What is rejected"}),`
`,e.jsx(n.p,{children:"Every gradient that Bagl returns is exact for the program you wrote. If Bagl can't differentiate something correctly, it reports a compile error, and it rejects these cases."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"A function call in the body, because the transform works on the syntax and can't see inside a call yet."}),`
`,e.jsxs(n.li,{children:["A tensor parameter without an annotation, because the rules for ",e.jsx(n.code,{children:"dot"})," need the ranks of the operands, and the transform runs before inference."]}),`
`,e.jsxs(n.li,{children:["The matrix side of a matrix times vector ",e.jsx(n.code,{children:"dot"}),", which needs an outer product, and a scalar broadcast against a matrix, which needs a sum over the matrix. Bagl has neither operation."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"letrec"}),", nested ",e.jsx(n.code,{children:"fn"}),", tensor literals that mention the parameter, and, in tensor mode, conditions on the parameter."]}),`
`]}),`
`,e.jsx(s,{id:"grad-rejected"}),`
`,e.jsx(n.h2,{id:"runtime-and-tooling",children:"Runtime and tooling"}),`
`,e.jsxs(n.p,{children:["Bagl compiles to a compact stack bytecode, and a VM with frames of varying size runs it. You can save a program as a ",e.jsx(n.code,{children:".baglc"})," file with ",e.jsx(n.code,{children:"baglc -c file.bagl"}),", and it reloads byte for byte, negative numbers included. The optimizer runs on an intermediate representation (IR) made of basic blocks, and within each block it runs constant folding, dead code elimination, copy propagation and common subexpression elimination. ",e.jsx(n.code,{children:"-O0"})," turns the optimizer off, and ",e.jsx(n.a,{href:"/bagl/start/#command-line-options",children:"the command line options"})," show each stage."]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The REPL starts when you run ",e.jsx(n.code,{children:"baglc"})," with no file. Bindings stay across lines, and ",e.jsx(n.code,{children:"letrec"}),", closures and ",e.jsx(n.code,{children:"grad"})," all work. ",e.jsx(n.code,{children:":type e"})," shows the inferred type of an expression."]}),`
`,e.jsxs(n.li,{children:["For editors, ",e.jsx(n.code,{children:"bagl-lsp"})," speaks the Language Server Protocol, and it shows the compiler's errors as you type. A VS Code extension is in ",e.jsx(n.code,{children:"editors/"}),", and ",e.jsx(n.a,{href:"/bagl/start/#set-up-your-editor",children:"the getting started page"})," shows the Neovim setup."]}),`
`,e.jsxs(n.li,{children:["In the browser, js_of_ocaml builds the compiler into about 160 KB of JavaScript (50 KB compressed). The same bundle runs this page and ",e.jsx(n.a,{href:"/bagl/playground/",children:"the playground"}),"."]}),`
`]}),`
`,e.jsx(n.h2,{id:"limits",children:"Limits"}),`
`,e.jsx(n.p,{children:"Bagl has these limits."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"There's no I/O, and there are no lists, tuples, records or string operations. Strings support literals and equality only, and a program is one expression."}),`
`,e.jsx(n.li,{children:"Tensors are rank 1 or 2, and they hold floats only. There's no indexing or slicing, so you extract a component with a dot product against a basis vector. Broadcasting works only with scalars, and there's no outer product."}),`
`,e.jsxs(n.li,{children:["Numeric operators default operands with no constraint to ",e.jsx(n.code,{children:"int"})," when a binding is generalized, so ",e.jsx(n.code,{children:"fn x -> x + x"})," is ",e.jsx(n.code,{children:"int -> int"})," unless you annotate it. Type classes would fix the problem, and Bagl gives them up to keep a checker that runs in one pass."]}),`
`,e.jsx(n.li,{children:"Equality on tensors or functions is a compile error, and Bagl doesn't compare them structurally."}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"grad"})," has the limits in ",e.jsx(n.a,{href:"#what-is-rejected",children:"the section above"}),", and each of them is a compile error, never a wrong number."]}),`
`,e.jsxs(n.li,{children:["In one corner of inference, a tensor argument without an annotation defaults to rank 2, so annotate a vector parameter as ",e.jsx(n.code,{children:"tensor<float>['n]"}),"."]}),`
`]}),`
`,e.jsx(n.h2,{id:"grammar",children:"Grammar"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`program     ::= expr
expr        ::= "let" NAME [":" type] "=" expr "in" expr
              | "letrec" NAME [":" type] "=" expr "in" expr
              | "fn" NAME [":" simple-type] "->" expr
              | "if" expr "then" expr "else" expr
              | binop-expr
binop-expr  ::= unary { binop unary }       // precedence: || < && < ==,!= < <,>,<=,>= < +,- < *,/
unary       ::= ["-" | "!"] postfix
postfix     ::= primary { primary }         // application, left-associative
primary     ::= INT | FLOAT | STRING | "true" | "false" | NAME
              | "(" expr ")" | tensor
              | "dot" "(" expr "," expr ")" | "transpose" "(" expr ")"
              | "reshape" "(" expr "," shape ")"
              | ("exp" | "log" | "sqrt" | "relu" | "step") "(" expr ")"
              | "grad" ...                   // ordinary application, special-cased on fn literals
tensor      ::= "[" expr {"," expr} "]"      // vector
              | "[" row {"," row} "]"        // matrix, even with one row
type        ::= simple-type ["->" type]
simple-type ::= "int" | "float" | "bool" | "string" | "'" NAME
              | "tensor" "<" type ">" shape | "(" type ")"
shape       ::= "[" dim {"," dim} "]"        // dim ::= INT | "'" NAME
`})})]})}function o(i={}){const{wrapper:n}=i.components||{};return n?e.jsx(n,{...i,children:e.jsx(r,{...i})}):r(i)}function d(i,n){throw new Error("Expected component `"+i+"` to be defined: you likely forgot to import, pass, or provide it.")}function j(){return e.jsx(a,{page:"reference",toc:t.reference,Content:o})}export{j as default};
