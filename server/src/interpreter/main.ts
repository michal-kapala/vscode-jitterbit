import Parser from "./frontend/parser";
import { createGlobalScope } from "./runtime/scope";
import { evaluate } from "./runtime/interpreter";
import { Diagnostic } from 'vscode-languageserver/node';

export function interpret(sourceCode: string): Diagnostic[] {
  // eslint-disable-next-line prefer-const
  let diagnostics: Diagnostic[] = [];
  const parser = new Parser();
  const globalScope = createGlobalScope();
  const program = parser.produceAST(sourceCode, diagnostics);
  const result = evaluate(program, globalScope);
  console.log("\nScript result:\n", result);
  return diagnostics;
}
