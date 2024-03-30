# VS Code Jitterbit extension

Full-fledged Visual Studio Code language extension for [Jitterbit scripts](https://success.jitterbit.com/design-studio/design-studio-reference/scripts/jitterbit-script-language/).
It includes:
- [language server](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [syntax highlighting](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide) (TextMate grammar)
- [language configuration](https://code.visualstudio.com/api/language-extensions/language-configuration-guide)
- [file icon](https://code.visualstudio.com/api/extension-capabilities/theming#file-icon-theme) and [color](https://code.visualstudio.com/api/extension-capabilities/theming#color-theme) theme inspired by Jitterbit Studio

## Language server features
### Diagnostics
Support for [`textDocument/publishDiagnostics`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_publishDiagnostics) notification. Errors and warnings are provided by the underlying package.

![diagnostics](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/698773ff-f65b-44e2-a6ac-e38889479cd1)

### File notifications
The extension keeps files in sync on editor-originating updates:
- create ([`workspace/didCreateFiles`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#workspace_didCreateFiles))
- delete ([`workspace/didDeleteFiles`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#workspace_didDeleteFiles))
- rename ([`workspace/didRenameFiles`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#workspace_didRenameFiles))

### Code completion
Support for [`textDocument/completion`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_completion) request. Jitterbit API definitions (system variables, functions and documentation) are provided by the underlying package.

![completion](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/84d1ba3e-4c5a-4550-bb5e-25691c82838f)

### Hover
Support for [`textDocument/hover`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_hover) request. Provides variable type information, function signatures and documentation for functions and system variables.

![hover](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/f6dc679a-9695-4bc2-b072-f9be299c34ae)

### Signature help
Support for [`textDocument/signatureHelp`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_signatureHelp) request. Supports polymorphic functions.

![signature](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/fd6f4592-0edd-4eb4-b949-7523f5dbde88)

### Symbol highlight
Support for [`textDocument/documentHighlight`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_documentHighlight) request.

![highlight](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/cb1c487e-bcf0-4e41-93db-b097acdba79f)

### References
Support for [`textDocument/references`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_references) request. Only variable and functions references are supported.

Note that the extension does not perform workspace indexing, thus it will only return the references in files that **have been opened** in the current editor session.

![references](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/ab2ba5d8-ce98-40ba-b112-678b448ce36c)

### Renaming

Support for [`textDocument/rename`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_rename) request. Only variable renaming is supported.

Global/system variable renaming do not require `$` in the input. The initial input completion or dotted names will use the segment including the current cursor position.

Similarly to [references](#references), only the occurences in files that **have been opened** in the current editor session will be updated.

![rename](https://github.com/michal-kapala/vscode-jitterbit/assets/48450427/29e6d9f0-db63-415c-b6b6-7c5e5856974e)

## Disclaimers

The language server was built using Microsoft's [lsp-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample) template.

It employs [jitterbit-script](https://github.com/michal-kapala/jitterbit-script) package for script parsing and static analysis.

This extension is a community effort and as such is not affiliated with, endorsed, supported or maintained by [@jitterbit](https://github.com/jitterbit).

The Jitterbit logo is a trademark of [Jitterbit, Inc.](https://www.jitterbit.com/)