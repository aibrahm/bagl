# Bagl for VS Code

The extension adds language support for `.bagl` files, with syntax highlighting, live diagnostics and hover types. Diagnostics are red underlines that show the compiler's own error messages. The diagnostics and hover types come from the `bagl-lsp` server in the Bagl repository, and the syntax highlighting comes from the extension's grammar.

## What hover shows

The server splits each top-level `let ... in` chain into separate bindings. It then shows the inferred type of the binding under the cursor, e.g., `double : int -> int`. When you hover over the final body expression of a program, the server shows its type as `_ : <type>`. Hover over a nested expression shows the type of the top-level binding that contains it. The split stops at a `letrec`, so hover anywhere from a `letrec` to the end of the chain shows the type of the whole remaining expression, as `_ : <type>`. Hover for smaller expressions is not implemented.

## Building and installing

1. Build and install the server so that `bagl-lsp` is on your PATH:

   ```sh
   dune build
   dune install
   ```

   Or set the `baglLsp.path` setting to `_build/default/lsp/lsp_main.exe`.

2. Package and install the extension. You need `npm` and `vsce` for the following steps:

   ```sh
   cd editors/vscode
   npm install
   npx vsce package
   code --install-extension bagl-language-0.1.0.vsix
   ```

3. Open any `.bagl` file. Diagnostics update as you type, and hovering over a top-level binding shows its inferred type.

## Settings

| Setting        | Default    | Meaning                              |
| -------------- | ---------- | ------------------------------------ |
| `baglLsp.path` | `bagl-lsp` | Path to the language server binary. |

## Neovim

Neovim needs no plugin. Add the following to your `init.lua`:

```lua
vim.filetype.add({ extension = { bagl = "bagl" } })
vim.api.nvim_create_autocmd("FileType", {
  pattern = "bagl",
  callback = function()
    vim.lsp.start({ name = "bagl-lsp", cmd = { "bagl-lsp" } })
  end,
})
```
