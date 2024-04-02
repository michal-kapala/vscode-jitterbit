import { Api, CodeAnalysis, TypedGlobalIdentifier } from 'jitterbit-script';
import { Hover, HoverParams, MarkupContent, MarkupKind } from 'vscode-languageserver';
import { idInRange, makeRange } from '../utils/position';

/**
 * Returns hover information for identifiers.
 * @param params 
 * @param analysis 
 * @returns 
 */
export function getHover(params: HoverParams, analysis?: CodeAnalysis): Hover | null {
	if(!analysis)
		return null;

	// variables
	for(const id of analysis.vars) {
		// match position
		const range = makeRange(id.start, id.end);
		if(idInRange(params.position, range)) {
			let varType = "local";
			if(id.kind === "GlobalIdentifier")
				varType = (id as TypedGlobalIdentifier).globalKind;

			const signature = varType === "system"
				? `(${varType}, ${Api.getSysVar(id.symbol)?.type}) ${id.symbol}: ${id.type}`
				: `(${varType}) ${id.symbol}: ${id.type}`;

			let value = `\`\`\`jitterbit\n${signature}\n\`\`\`\n`;
			if(varType === "system") {
				const sysVar = Api.getSysVar(id.symbol);
				if(sysVar)
					value += sysVar.description;
			}
			const contents = {kind: MarkupKind.Markdown, value};
			return {contents, range: makeRange(id.start, id.end)};
		}
	}
	
	// functions
	const prefix = `\`\`\`jitterbit\n(function)`;
	for(const id of analysis.callees) {
		const range = makeRange(id.start, id.end);
		if(idInRange(params.position, range)) {
			const func = Api.getFunc(id.symbol);
			if(!func)
				continue;
			let value = "";
			for(let idx = 0; idx < func.signatures.length; idx++)
				value += `${prefix} ${func.toString(idx)}\n\`\`\`\n`;
			value += func.docs;
			const contents: MarkupContent = {kind: MarkupKind.Markdown, value};
			return {contents, range: makeRange(id.start, id.end)};
		}
	}
	// no hover for this item
	return null;
}
