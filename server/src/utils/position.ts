import { Position as JbPosition } from 'jitterbit-script';
import { Position, Range } from 'vscode-languageserver';

/**
 * Translates JB parser positions to VSCode ones (0-based).
 * @param start 
 * @param end 
 * @returns 
 */
export function makeRange(start: JbPosition, end: JbPosition): Range {
	return {
		start: {
			line: start.line - 1,
			character: start.character - 1
		},
		end: {
			line: end.line - 1,
			character: end.character
		}
	};
}

/**
 * Checks if identifier position is inside of the range (inclusive).
 * @param pos The identifier's VSCode position
 * @param range VSCode range
 */
export function idInRange(pos: Position, range: Range): boolean {
	// an identifier must contain itself in a single line
	if(range.start.line === range.end.line && range.start.line <= pos.line && pos.line <= range.end.line)
		return range.start.character <= pos.character && pos.character <= range.end.character;
	return false;
}
