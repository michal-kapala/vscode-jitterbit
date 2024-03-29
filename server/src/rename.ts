import { RenameParams, WorkspaceEdit } from 'vscode-languageserver';
import { FileMap } from './utils/workspace';
import { CodeAnalysis } from 'jitterbit-script';
import { idInRange, makeRange } from './utils/position';

/**
 * Renames a variable's refs in all **opened** files.
 * 
 * The actual renaming is handled by the editor, which triggers `onDidChangeContent` update and syncs the analysis.
 * @param params 
 * @param files 
 * @param analysis 
 * @returns 
 */
export function rename(params: RenameParams, files: FileMap, analysis?: CodeAnalysis): WorkspaceEdit | null {
	if(!analysis)
		return null;

	let symbol = "";
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
	
	// no reference tracking for this item
	if(symbol === "")
		return null;

	const edit: WorkspaceEdit = {changes: {}};

	// local variables - edit refs in the current file
	if(isLocal && edit.changes) {
		edit.changes[params.textDocument.uri] = [];
		for(const id of analysis.vars) {
			if(id.symbol === symbol) {
				edit.changes[params.textDocument.uri].push({
					range: makeRange(id.start, id.end),
					newText: params.newName
				});
			}
		}
		return edit;
	}

	// global/system variables - edit refs in all tracked (opened) files
	if(edit.changes) {
		for(const file of files) {
			edit.changes[file[0]] = [];
			for(const global of file[1].vars) {
				if(global.symbol === symbol) {
					edit.changes[file[0]].push({
						range: makeRange(global.start, global.end),
						newText: `$${params.newName}`
					});
				}
			}
		}
		return edit;
	}

	// item irrenamable
	return null;
}
