import {
  AssignmentExpr,
  BinaryExpr,
  Identifier,
  ObjectLiteral,
} from "../../frontend/ast";
import Scope from "../scope";
import { evaluate } from "../interpreter";
import { MK_NULL, NullVal, NumberVal, ObjectVal, RuntimeVal, StringVal } from "../values";

/**
 * Evaluates binary expressions on numeric literals.
 * @param lhs Left-hand side numeric literal.
 * @param rhs Right-hand side numeric literal.
 * @param operator Binary operator.
 * @returns 
 */
function eval_numeric_binary_expr(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string,
): NumberVal {
  let result: number;
  if (operator == "+") {
    result = lhs.value + rhs.value;
  } else if (operator == "-") {
    result = lhs.value - rhs.value;
  } else if (operator == "*") {
    result = lhs.value * rhs.value;
  } else if (operator == "/") {
    // TODO: Division by zero checks
    result = lhs.value / rhs.value;
  } else {
    result = lhs.value % rhs.value;
  }

  return { value: result, type: "number" };
}

/**
 * Evaluates binary expressions on string literals.
 * @param lhs Left-hand side string literal.
 * @param rhs Right-hand side string literal.
 * @param operator Binary operator.
 */
function eval_string_binary_expr(
  lhs: StringVal,
  rhs: StringVal,
  operator: string,
): StringVal | NullVal {
  let result: string;
  // string concatenation
  if (operator == "+") {
    result = lhs.value + rhs.value;
    return { type: "string", value: result } as StringVal;
  } else {
    // Add JB error:
    // Illegal operation, <operation name, ex. SUBTRACT> with incompatible data types: string <operator> string
    console.error(`Illegal operation, ${operator} with incompatible data types: string ${operator} string`);
    // Illegal operation returns null
    return MK_NULL();
  }

}

/**
 * Evaulates expressions following the binary operation type.
 */
export function eval_binary_expr(
  binop: BinaryExpr,
  scope: Scope,
): RuntimeVal {
  const lhs = evaluate(binop.left, scope);
  const rhs = evaluate(binop.right, scope);

  // Only currently support numeric operations
  if (lhs.type == "number" && rhs.type == "number") {
    return eval_numeric_binary_expr(
      lhs as NumberVal,
      rhs as NumberVal,
      binop.operator,
    );
  }

  // string concatenation
  if (lhs.type == "string" && rhs.type == "string") {
    return eval_string_binary_expr(
      lhs as StringVal,
      rhs as StringVal,
      binop.operator,
    );
  }

  // Add JB error:
  // Illegal operation, <operation name, ex. SUBTRACT> with incompatible data types: <lhs.type> <operator> <rhs.type>
  console.error(`Illegal operation, ${binop.operator} with incompatible data types: ${lhs.type} ${binop.operator} ${rhs.type}`);
  // One or both are NULL
  return MK_NULL();
}

export function eval_identifier(
  ident: Identifier,
  scope: Scope,
): RuntimeVal {
  const val = scope.lookupVar(ident.symbol);
  return val;
}

export function eval_assignment(
  node: AssignmentExpr,
  scope: Scope,
): RuntimeVal {
  if (node.assignee.kind !== "Identifier" && node.assignee.kind !== "GlobalIdentifier") {
    throw `Invalid LHS inside assignment expr ${JSON.stringify(node.assignee)}`;
  }

  const varname = (node.assignee as Identifier).symbol;
  return scope.assignVar(varname, evaluate(node.value, scope));
}

export function eval_object_expr(
  obj: ObjectLiteral,
  scope: Scope,
): RuntimeVal {
  const object = { type: "object", properties: new Map() } as ObjectVal;
  for (const { key, value } of obj.properties) {
    const runtimeVal = (value == undefined)
      ? scope.lookupVar(key)
      : evaluate(value, scope);

    object.properties.set(key, runtimeVal);
  }

  return object;
}
