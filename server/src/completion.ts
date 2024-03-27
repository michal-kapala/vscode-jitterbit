import { Api, CodeAnalysis } from 'jitterbit-script';
import { CompletionItem, CompletionItemKind, MarkupKind, Position } from 'vscode-languageserver/node';

const jbApiCompletionItems = initCompletionList();

/**
 * Initialized Jitterbit API completion list with functions and system variables.
 * @returns 
 */
function initCompletionList(): CompletionItem[] {
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
			documentation: {
				kind: MarkupKind.Markdown,
				value: func.docs
			}
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
 * Returns a completion item list using out-of-the-box VSCode search algorithm.
 * @param analysis 
 * @param curPos
 */
export function getCompletion(analysis: CodeAnalysis, curPos: Position): CompletionItem[] {
	console.log('getCompletion() called');
	const result = [...jbApiCompletionItems];
	const scriptVars: CompletionItem[] = [];
	let index = result.length;
	// add deduped local/global variables
	for(const id of analysis.vars) {
		if(scriptVars.find((ci) => ci.label === id.symbol))
			continue;
		const varType = id.kind === "GlobalIdentifier" ? 'global' : 'local';
		scriptVars.push({
			label: id.symbol,
			kind: CompletionItemKind.Variable,
			data: index++,
			detail: `(${varType}) ${id.symbol}`,
			insertText: varType === "global" ? id.symbol.substring(1) : id.symbol
		});
	}
	// join arrays
	for(const id of scriptVars)
		result.push(id);

	return result;
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
