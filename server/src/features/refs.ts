import { CodeAnalysis } from 'jitterbit-script';
import { Location, ReferenceParams } from 'vscode-languageserver';
import { idInRange, makeRange } from '../utils/position';
import { FileMap } from '../utils/workspace';

/**
 * Returns references for all **opened** files.
 * @param params 
 * @param files 
 * @param analysis 
 * @returns 
 */
export function getRefs(params: ReferenceParams, files: FileMap, analysis?: CodeAnalysis): Location[] | null {
	const refs: Location[] = [];
	if(!analysis)
		return null;

	let symbol = "";
	let isVar = true;
	let isLocal = false;
	// variables
	for(const id of analysis.vars) {
		if(idInRange(params.position, makeRange(id.start, id.end))) {
			symbol = id.symbol;
			if(id.kind === "Identifier")
				isLocal = true;
			break;
		}
	}

	if(symbol === "") {
		// functions
		for(const id of analysis.callees) {
			if(idInRange(params.position, makeRange(id.start, id.end))) {
				symbol = id.symbol;
				isVar = false;
				break;
			}
		}	
	}
	
	// no reference tracking for this item
	if(symbol === "")
		return null;

	// current file refs for local variables
	if(isLocal) {
		for(const id of analysis.vars) {
			if(id.symbol === symbol)
				refs.push({uri: params.textDocument.uri, range: makeRange(id.start, id.end)});
		}
		return refs;
	}

	// scan workspace
	for(const file of files) {
		const analysis = file[1];
		for(const id of isVar ? analysis.vars : analysis.callees) {
			if(id.symbol === symbol)
				refs.push({uri: file[0], range: makeRange(id.start, id.end)});
		}
	}
	return refs;
}
