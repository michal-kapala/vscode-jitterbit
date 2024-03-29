import { CodeAnalysis } from 'jitterbit-script';
import { DocumentHighlight, DocumentHighlightParams } from 'vscode-languageserver';
import { idInRange, makeRange } from '../utils/position';

export function documentHighlight(params: DocumentHighlightParams, analysis?: CodeAnalysis): DocumentHighlight[] | null {
	if(!analysis)
		return null;

	const highlights: DocumentHighlight[] = [];

	let symbol = "";
	let isVar = true;
	// variables
	for(const id of analysis.vars) {
		if(idInRange(params.position, makeRange(id.start, id.end))) {
			symbol = id.symbol;
			break;
		}
	}
	
	// functions
	if(symbol === "") {
		for(const id of analysis.callees) {
			if(idInRange(params.position, makeRange(id.start, id.end))) {
				symbol = id.symbol;
				isVar = false;
				break;
			}
		}
	}

	for(const id of isVar ? analysis.vars : analysis.callees) {
		if(id.symbol === symbol)
			highlights.push({range: makeRange(id.start, id.end)});
	}
	return highlights;
}
