/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	HoverParams,
	Hover,
	ReferenceParams,
	Location,
	RenameFilesParams,
	DeleteFilesParams,
	CreateFilesParams,
	RenameParams,
	WorkspaceEdit,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
	Diagnostic as JbDiagnostic,
	Parser,
	Typechecker,
	CodeAnalysis
} from 'jitterbit-script';
import { getCompletion } from './completion';
import { makeDiagnostics } from './utils/diagnostics';
import { getHover } from './hover';
import { getRefs } from './refs';
import { initFileMap } from './utils/workspace';
import { rename } from './rename';

// workspace global items
const files = initFileMap();

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true
			},
			hoverProvider: true,
			referencesProvider: true,
			renameProvider: true
		},
	};
	if (hasWorkspaceFolderCapability) {
		const filters = [{scheme: 'file', pattern: {glob: '**/*.jb'}}];
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			},
			fileOperations: {
				didCreate: {filters},
				didDelete: {filters},
				didRename: {filters}
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.jitterbitLanguageServer || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'jitterbit'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

connection.workspace.onDidRenameFiles((params: RenameFilesParams) => {
	for(const file of params.files) {
		const analysis = files.get(file.oldUri) ?? {ast: [], diagnostics: [], vars: [], callees: []};
		files.set(file.newUri, analysis);
		files.delete(file.oldUri);
		connection.sendDiagnostics({diagnostics: [], uri: file.oldUri});
	}
});

connection.workspace.onDidCreateFiles((params: CreateFilesParams) => {
	for(const file of params.files)
		files.set(file.uri, {ast: [], diagnostics: [], vars: [], callees: []});
});

connection.workspace.onDidDeleteFiles((params: DeleteFilesParams) => {
	for(const file of params.files) {
		files.delete(file.uri);
		connection.sendDiagnostics({diagnostics: [], uri: file.uri});
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	// TODO: Incremental updates because the editor slows down noticeably
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);
	const script = textDocument.getText();
	const parser = new Parser();
	const jbDiags: JbDiagnostic[] = [];

	let diagnostics: Diagnostic[] = [];
	let analysis: CodeAnalysis = {
		ast: [],
		diagnostics: [],
		vars: [],
		callees: []
	};
	try {
		const ast = parser.parse(script, jbDiags);
		analysis = Typechecker.analyze(ast, jbDiags);
		diagnostics = makeDiagnostics(analysis.diagnostics);
	} catch(e) {
		// jitterbit-script error - should be reported as an issue
		console.error(e);
	}
	// update files
	files.set(textDocument.uri, analysis);
	
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(params: TextDocumentPositionParams): CompletionItem[] => {
		const latestAnalysis = files.get(params.textDocument.uri);
		return getCompletion(latestAnalysis);
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return item;
	}
);

// This handles the docs on hover event.
connection.onHover(
	(params: HoverParams): Hover | null => {
		const latestAnalysis = files.get(params.textDocument.uri);
		return getHover(params, latestAnalysis);
	}
);

// This handles 'Find All References' action event.
connection.onReferences(
	(params: ReferenceParams): Location[] | null => {
		const analysis = files.get(params.textDocument.uri);
		return getRefs(params, files, analysis);
	}
);

// This handles 'Rename Symbol' action event.
connection.onRenameRequest(
	(params: RenameParams): WorkspaceEdit | null => {
		const analysis = files.get(params.textDocument.uri);
		return rename(params, files, analysis);
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
