import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { Diagnostic as JbDiagnostic } from 'jitterbit-script';

/**
 * Transforms typechecker diagnostics into VSCode ones.
 * @param diags 
 * @returns
 */
export function makeDiagnostics(diags: JbDiagnostic[]): Diagnostic[] {
	const result: Diagnostic[] = [];
	for(const diag of diags) {
		result.push(
			{
				severity: diag.error ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
				range: {
					// VSC positions are zero-based
					start: {
						line: diag.start.line - 1,
						character: diag.start.character - 1
					},
					end: {
						line: diag.end.line - 1,
						character: diag.end.character
					},
				},
				message: diag.msg,
				source: 'jitterbit'
			} as Diagnostic
		);
	}
	return result;
}