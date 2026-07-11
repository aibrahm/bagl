# Bagl for VS Code

Language support for `.bagl` files: syntax highlighting, live diagnostics
(red squiggles with the compiler's real error messages) and hover types,
powered by the `bagl-lsp` server in this repository.

## What hover shows

The server splits each top-level `let ... in` chain into its individual
bindings and reports the inferred type of the binding under the cursor,
for example `double : int -> int`. Hovering the final body expression of a
program shows its type as `_ : <type>`. Hover inside `letrec` bindings and
nested inner expressions falls back to the type of the enclosing top-level
declaration; finer-grained expression hover is not implemented.

## Building and installing

1. Build and install the server so `bagl-lsp` is on your PATH:

   ```sh
   dune build
   dune install
   ```

   Alternatively point the `baglLsp.path` setting at
   `_build/default/lsp/lsp_main.exe`.

2. Package and install the extension (requires `npm` and `vsce`):

   ```sh
   cd editors/vscode
   npm install
   npx vsce package
   code --install-extension bagl-language-0.1.0.vsix
   ```

3. Open any `.bagl` file. Diagnostics update as you type; hover a
   top-level binding to see its inferred type.

## Settings

| Setting        | Default    | Meaning                              |
| -------------- | ---------- | ------------------------------------ |
| `baglLsp.path` | `bagl-lsp` | Path to the language server binary. |

## Neovim

No plugin needed; put this in your `init.lua`:

```lua
vim.filetype.add({ extension = { bagl = "bagl" } })
vim.api.nvim_create_autocmd("FileType", {
  pattern = "bagl",
  callback = function()
    vim.lsp.start({ name = "bagl-lsp", cmd = { "bagl-lsp" } })
  end,
})
```
