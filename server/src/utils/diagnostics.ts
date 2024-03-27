import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { Diagnostic as JbDiagnostic } from 'jitterbit-script';
import { makeRange } from './position';

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
				range: makeRange(diag.start, diag.end),
				message: diag.msg,
				source: 'jitterbit'
			} as Diagnostic
		);
	}
	return result;
}