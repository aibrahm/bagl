const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");

let client;

function activate(_context) {
  const command = vscode.workspace
    .getConfiguration("baglLsp")
    .get("path", "bagl-lsp");

  const serverOptions = {
    command,
    args: [],
    options: {},
  };

  const clientOptions = {
    documentSelector: [{ scheme: "file", language: "bagl" }],
  };

  client = new LanguageClient(
    "bagl",
    "Bagl Language Server",
    serverOptions,
    clientOptions
  );
  client.start();
}

function deactivate() {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

module.exports = { activate, deactivate };
