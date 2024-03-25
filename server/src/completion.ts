import { Api } from 'jitterbit-script';
import { CompletionItem, CompletionItemKind, MarkupKind } from 'vscode-languageserver/node';

/**
 * Initialized Jitterbit API completion list with functions and system variables.
 * @returns 
 */
export function initCompletionList(): CompletionItem[] {
	const list: CompletionItem[] = [];
	let index = 0;
	// true/false
	list.push({
		label: "true",
		kind: CompletionItemKind.Keyword,
		data: index++,
		detail: `(const) bool`,
	});
	list.push({
		label: "false",
		kind: CompletionItemKind.Keyword,
		data: index++,
		detail: `(const) bool`,
	});

	// functions
	for(const func of Api.functions) {
		list.push({
			label: func.name,
			kind: CompletionItemKind.Function,
			data: index++,
			insertText: func.name,
			detail: `(function) ${func}`,
		});
	}

	// static system variables
	for(const sysVar of Api.sysVars.static) {
		list.push({
			label: sysVar.name,
			kind: CompletionItemKind.Variable,
			data: index++,
			insertText: sysVar.name.substring(1),
			detail: `(system, ${getSysVarType(sysVar.dataType)}, ${sysVar.type}) ${sysVar.name}`,
			documentation: {
				kind: MarkupKind.Markdown,
				value: sysVar.description
			}
		});
	}

	// extendable system variables
	for(const sysVar of Api.sysVars.extendable) {
		list.push({
			label: `${sysVar.name}.*`,
			kind: CompletionItemKind.Property,
			data: index++,
			insertText: `${sysVar.name.substring(1)}.`,
			detail: `(system, ${getSysVarType(sysVar.dataType)}, ${sysVar.type}) ${sysVar.name}.*`,
			documentation: {
				kind: MarkupKind.Markdown,
				value: sysVar.description
			}
		});
	}
	return list;
}

/**
 * Returns proper type names, to be removed in future.
 * @param type 
 * @returns
 */
function getSysVarType(type: string) {
	switch(type) {
		case "String":
			return "string";
		case "Integer":
			return "number";
		case "Boolean":
			return "bool";
		case "Array":
			return "array";
		default:
			return "type";
	}
}
