export type ValueType = "null" | "number" | "bool" | "object" | "string" | "call";

export interface RuntimeVal {
  type: ValueType;
}

/**
 * Defines a value of undefined meaning.
 */
export interface NullVal extends RuntimeVal {
  type: "null";
  value: null;
}

export function MK_NULL() {
  return { type: "null", value: null } as NullVal;
}

/**
 * Runtime value that has access to native javascript boolean.
 */
export interface BooleanVal extends RuntimeVal {
  type: "bool";
  value: boolean;
}

export function MK_BOOL(b = true) {
  return { type: "bool", value: b } as BooleanVal;
}

/**
 * Runtime value that has access to native javascript number.
 */
export interface NumberVal extends RuntimeVal {
  type: "number";
  value: number;
}

export function MK_NUMBER(n = 0) {
  return { type: "number", value: n } as NumberVal;
}

/**
 * Runtime value that has access to native javascript string.
 */
export interface StringVal extends RuntimeVal {
  type: "string";
  value: string;
}

export function MK_STRING(s = "") {
  return { type: "string", value: s } as StringVal;
}

/**
 * Runtime value that has access to the raw native javascript object property map.
 */
export interface ObjectVal extends RuntimeVal {
  type: "object";
  properties: Map<string, RuntimeVal>;
}

/**
 * Runtime value of a function call, which can result in different runtime values.
 */
export interface CallVal extends RuntimeVal {
  type: "call";
  // calls dont return other calls (only simple type or object type literals)
  // 'ObjectVal' to be changed to array type
  result: NullVal | BooleanVal | NumberVal | ObjectVal | StringVal;
}
