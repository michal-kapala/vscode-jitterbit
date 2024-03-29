import { Func, Signature } from 'jitterbit-script';
import { MarkupKind, ParameterInformation, SignatureInformation } from 'vscode-languageserver';

/**
 * Returns signature info of a function.
 * @param func 
 * @returns 
 */
export function makeSignatures(func: Func): SignatureInformation[] {
	const sigs: SignatureInformation[] = [];
	for(const sig of func.signatures)
			sigs.push(makeSignature(sig, sig.toString(func.name), func.docs));
	return sigs;
}

/**
 * Converts a Jitterbit signature into signature info.
 * @param sig 
 * @param label 
 * @param docs 
 * @returns 
 */
function makeSignature(sig: Signature, label: string, docs: string): SignatureInformation {
	const parameters: ParameterInformation[] = [];
	for(const param of sig.params)
		parameters.push({label: param.name});
	return {
		label,
		parameters,
		documentation: {
			kind: MarkupKind.Markdown,
			value: docs
		}
	};
}
