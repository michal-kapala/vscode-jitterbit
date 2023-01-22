import {
	Diagnostic,
	DiagnosticSeverity,
	Position
} from 'vscode-languageserver';
import TokenPosition from './interpreter/frontend/types/Position';

/**
 * Creates a problem diagnostic entry for VS Code.
 * @param severity Value of `Diagnostic.severity`
 * @param message Value of `Diagnostic.message`
 * @param start Value of `Diagnostic.range.start`
 * @param end Value of `Diagnostic.range.end`
 * @returns `Diagnostic`
 */
export function makeDiagnostic(
	severity: DiagnosticSeverity, message: string, start: TokenPosition, end: TokenPosition
): Diagnostic {
	return {
		severity,
		message,
		range : {
			// lines and characters are zero-based for VS Code's Position
			start: { line: start.line, character: start.character } as Position,
			end: { line: end.line, character: end.character } as Position,
		},
		source: 'jitterbit'
	} as Diagnostic;
}
