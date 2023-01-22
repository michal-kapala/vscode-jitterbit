import { Program, VarDeclaration } from "../../frontend/ast";
import Scope from "../scope";
import { evaluate } from "../interpreter";
import { MK_NULL, RuntimeVal } from "../values";

export function eval_program(program: Program, env: Scope): RuntimeVal {
  let lastEvaluated: RuntimeVal = MK_NULL();
  try {
    for (const statement of program.body) {
      lastEvaluated = evaluate(statement, env);
    }
  }
  catch(e) {
    // this should be added as an error
    console.error("\nInterpreterError: Could not evaluate the program.\nLast evaluated statement: ", lastEvaluated);
    console.error("InterpreterError:", e);
  }
  
  return lastEvaluated;
}

export function eval_var_declaration(
  declaration: VarDeclaration,
  env: Scope,
): RuntimeVal {
  const value = declaration.value
    ? evaluate(declaration.value, env)
    : MK_NULL();

  return env.declareVar(declaration.identifier, value, declaration.constant);
}
