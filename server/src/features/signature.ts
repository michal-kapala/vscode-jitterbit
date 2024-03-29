import { Api, CodeAnalysis, Func } from 'jitterbit-script';
import { MarkupKind, Position, SignatureHelp, SignatureHelpParams } from 'vscode-languageserver';
import { idInRange, makeRange } from '../utils/position';
import { makeSignatures } from '../utils/function';

/**
 * Returns signature help info.
 * @param params 
 * @param analysis 
 * @returns 
 */
export function signatureHelp(params: SignatureHelpParams, analysis?: CodeAnalysis): SignatureHelp | null {
	if(!analysis)
		return null;

	const help: SignatureHelp = {
		signatures: [],
		activeSignature: null,
		activeParameter: null
	};

	// the submitted position is the one after the '(' trigger character was pressed
	if(!params.context?.isRetrigger) {
		const pos: Position = {line: params.position.line, character: params.position.character - 1};

		// find function
		let func: Func | undefined = undefined;
		for(const id of analysis.callees) {
			if(idInRange(pos, makeRange(id.start, id.end))) {
				func = Api.getFunc(id.symbol);
				break;
			}
		}

		if(!func)
			return null;

		help.signatures = makeSignatures(func);
		help.activeSignature = help.signatures.length > 0 ? 0 : null;
		if(help.activeSignature && help.signatures[help.activeSignature].activeParameter)
			help.activeParameter = 0;
		return help;
	}
	else {
		// retriggered
		const activeHelp = params.context.activeSignatureHelp;
		
		// always provided, type safety-only check
		if(!activeHelp)
			return null;

		if(params.context.triggerCharacter === ")")
			return null;

		// get function
		const funcName = extractFuncName(activeHelp.signatures[activeHelp.activeSignature ?? 0].label);
		if(!funcName)
			return null;
		const func = Api.getFunc(funcName);
		if(!func)
			return null;

		// this implementation doesn't respect comma deletions/backtracking
		if(activeHelp.activeSignature !== null) {
			for(const s of activeHelp.signatures) {
				s.documentation = {
					kind: MarkupKind.Markdown,
					value: func.docs
				};
			}
			const sig = activeHelp.signatures[activeHelp.activeSignature];
			if(params.context.triggerCharacter === ",") {
				const paramsLen = func.signatures[activeHelp.activeSignature].params.length;
				const lastRequired = func.signatures[activeHelp.activeSignature].params[paramsLen - 1].required;
				if(sig && activeHelp.activeParameter !== null && (lastRequired || activeHelp.activeParameter < paramsLen - 1)) {
					sig.activeParameter = activeHelp.activeParameter + 1;
					activeHelp.activeParameter = sig.activeParameter as number;
				}
			}
		}
		return activeHelp;
	}
}

/**
 * Returns the function name from its signature.
 * @param signature 
 */
function extractFuncName(signature: string) {
	const pattern = /^([a-zA-Z]+[a-zA-Z0-9_])(?=\()\(/g;
	const matches = signature.match(pattern);
	if(!matches)
		return null;
	// remove '('
	return matches[0].substring(0, matches[0].length - 1);
}
