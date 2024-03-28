import { Api, CodeAnalysis, TypedGlobalIdentifier } from 'jitterbit-script';
import { Hover, HoverParams, MarkedString } from 'vscode-languageserver';
import { idInRange, makeRange } from './utils/position';

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

			const contents: MarkedString[] = [
				{
					language: "jitterbit",
					value: signature
				}
			];
			
			if(varType === "system") {
				const sysVar = Api.getSysVar(id.symbol);
				if(sysVar) {
					contents.push(sysVar.description);
				}
			}
			return {contents, range: makeRange(id.start, id.end)};
		}
	}
	
	// functions
	for(const id of analysis.callees) {
		const range = makeRange(id.start, id.end);
		if(idInRange(params.position, range)) {
			const func = Api.getFunc(id.symbol);
			if(!func)
				continue;
			const contents: MarkedString[] = [
				{
					language: "jitterbit",
					value: `(function) ${func}`
				},
				func.docs
			];
			return {contents, range: makeRange(id.start, id.end)};
		}
	}
	// no hover for this item
	return null;
}
