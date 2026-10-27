import{j as e}from"./preload-helper-CkyS6jwL.js";import{t as r}from"./_virtual_toc-Dm_Ky1bC.js";import{D as d}from"./doc-page-CxP1cBkI.js";import"./shell-Cdyk8OT_.js";import"./examples-CwxgrFpf.js";import"./compiler-Dl0UKjtR.js";function s(l){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...l.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"get-started",children:"Get started"}),`
`,e.jsxs(n.p,{children:["Bagl builds from source. The build gives you ",e.jsx(n.code,{children:"baglc"}),", the compiler and REPL, and ",e.jsx(n.code,{children:"bagl-lsp"}),", the language server for code editors. To try the language without installing it, use ",e.jsx(n.a,{href:"/bagl/playground/",children:"the playground"}),"."]}),`
`,e.jsx(n.h2,{id:"installation",children:"Installation"}),`
`,e.jsxs(n.p,{children:["You need OCaml 5.2 and dune, the OCaml build tool. OCaml 4.14 and newer also work. ",e.jsx(n.a,{href:"https://ocaml.org/install",children:"The OCaml install guide"})," covers opam, the OCaml package manager, which installs both."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-sh",children:`git clone https://github.com/aibrahm/bagl.git
cd bagl
dune build
dune test
dune install
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"dune install"})," puts ",e.jsx(n.code,{children:"baglc"})," and ",e.jsx(n.code,{children:"bagl-lsp"})," on your PATH. Without it, write ",e.jsx(n.code,{children:"dune exec baglc --"})," in place of ",e.jsx(n.code,{children:"baglc"}),"."]}),`
`,e.jsx(n.h2,{id:"hello-world",children:"Hello, world"}),`
`,e.jsxs(n.p,{children:["A Bagl program is one expression. Save the program below as ",e.jsx(n.code,{children:"hello.bagl"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bagl",children:`let greeting = "Hello, world" in
greeting
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"baglc"})," compiles the file, runs it and prints the value. The REPL below also prints the type."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`$ baglc hello.bagl
"Hello, world"
`})}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.code,{children:"examples"})," folder in the repository has nine programs. ",e.jsx(n.code,{children:"examples/train_xor.bagl"})," trains a small model by gradient descent."]}),`
`,e.jsx(n.h2,{id:"the-repl",children:"The REPL"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"baglc"})," with no file starts a REPL, an interactive prompt. Bindings made with ",e.jsx(n.code,{children:"let"})," and ",e.jsx(n.code,{children:"letrec"})," stay for the lines that follow."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`$ baglc
> let square = fn x -> x * x
square = <closure@1> : int -> int
> square 5
= 25 : int
> let df = grad (fn x -> x * x * x)
df = <closure@2> : float -> float
> df 2.0
= 12. : float
> :type fn x -> x
: 'a -> 'a
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:":type"})," followed by an expression prints its type without running it, and ",e.jsx(n.code,{children:":quit"})," leaves the REPL."]}),`
`,e.jsx(n.h2,{id:"compiling-to-bytecode",children:"Compiling to bytecode"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"-c"})," saves a program as bytecode for the Bagl virtual machine, and ",e.jsx(n.code,{children:"baglc"})," runs a ",e.jsx(n.code,{children:".baglc"})," file without compiling it again."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-sh",children:`baglc -c program.bagl -o program.baglc
baglc program.baglc
`})}),`
`,e.jsx(n.h2,{id:"command-line-options",children:"Command line options"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Option"}),e.jsx(n.th,{children:"Effect"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-c"})}),e.jsxs(n.td,{children:["Compile to a ",e.jsx(n.code,{children:".baglc"})," file instead of running."]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-o path"})}),e.jsxs(n.td,{children:["The output file for ",e.jsx(n.code,{children:"-c"}),"."]})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-r"})}),e.jsx(n.td,{children:"Compile and run. This is the default."})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"-O0"})}),e.jsx(n.td,{children:"Turn off the optimizer."})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"--dump-ast"})}),e.jsx(n.td,{children:"Print the syntax tree."})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"--dump-types"})}),e.jsx(n.td,{children:"Print the syntax tree with inferred types."})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"--dump-ir"})}),e.jsx(n.td,{children:"Print the intermediate representation."})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.code,{children:"--dump-bytecode"})}),e.jsx(n.td,{children:"Print the bytecode."})]})]})]}),`
`,e.jsx(n.h2,{id:"editor-support",children:"Editor support"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"bagl-lsp"})," is a Language Server Protocol server. It reports compiler errors as you type and shows the type of a top-level binding on hover."]}),`
`,e.jsx(n.h3,{id:"vs-code",children:"VS Code"}),`
`,e.jsxs(n.p,{children:["The extension is in ",e.jsx(n.code,{children:"editors/vscode"}),". It adds syntax colors and starts ",e.jsx(n.code,{children:"bagl-lsp"})," for ",e.jsx(n.code,{children:".bagl"})," files."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-sh",children:`cd editors/vscode
npm install
npx vsce package
code --install-extension bagl-language-0.1.0.vsix
`})}),`
`,e.jsx(n.h3,{id:"neovim",children:"Neovim"}),`
`,e.jsxs(n.p,{children:["Neovim needs no plugin. Add these lines to ",e.jsx(n.code,{children:"init.lua"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-lua",children:`vim.filetype.add({ extension = { bagl = "bagl" } })
vim.api.nvim_create_autocmd("FileType", {
  pattern = "bagl",
  callback = function()
    vim.lsp.start({ name = "bagl-lsp", cmd = { "bagl-lsp" } })
  end,
})
`})}),`
`,e.jsx(n.h2,{id:"next-steps",children:"Next steps"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.a,{href:"/bagl/reference/",children:"The language reference"})," covers each part of the language with examples. ",e.jsx(n.a,{href:"/bagl/spec/",children:"The specification"})," gives the full rules, and ",e.jsx(n.a,{href:"/bagl/internals/",children:"the internals page"})," explains how the compiler works."]})]})}function i(l={}){const{wrapper:n}=l.components||{};return n?e.jsx(n,{...l,children:e.jsx(s,{...l})}):s(l)}function p(){return e.jsx(d,{page:"start",toc:r.start,Content:i})}export{p as default};
