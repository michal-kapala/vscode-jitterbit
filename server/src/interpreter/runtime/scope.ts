import { systemVars } from "../api/sysvars";
import { GlobalIdentifier } from "../frontend/ast";
import { MK_BOOL, MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "./values";

export function createGlobalScope() {
  const scope = new Scope();
  return scope;
}

export default class Scope {
  private parent?: Scope;
  private variables: Map<string, RuntimeVal>;
  private constants: Set<string>;

  constructor(parentScope?: Scope) {
    const global = parentScope ? false : true;
    this.parent = parentScope;
    this.variables = new Map();
    this.constants = new Set();
    if(global) {
      // Initialize static system variables
      systemVars.static.forEach((value) => {
        // parse default value
        if(value.default !== undefined) {
          let def = {} as RuntimeVal;
          switch(value.dataType) {
            case "Boolean":
              def = MK_BOOL(value.default === "true" ? true : false);
              break;
            case "Integer":
              def = MK_NUMBER(parseInt(value.default));
              break;
            case "String":
              def = MK_STRING(value.default);
              break;
            // TODO: Array
            default:
              // This can happen only if you modify system vars types
              console.error(`ScopeError: Unsupported system variable type for ${value.name}:`, value.dataType);
              def = MK_NULL();
              break;
          }
          this.variables.set(value.name, def);
        }
        // initialize with null value
        else
          this.variables.set(value.name, MK_NULL());
      });
    }
  }

  public declareVar(
    varname: string,
    value: RuntimeVal,
    constant: boolean,
  ): RuntimeVal {
    if (this.variables.has(varname)) {
      throw `Cannot declare variable ${varname} as it already is defined.`;
    }

    this.variables.set(varname, value);
    if (constant) {
      this.constants.add(varname);
    }
    return value;
  }

  public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
    const scope = this.resolve(varname);

    // Cannot assign to constant
    if (scope.constants.has(varname)) {
      throw `Cannot reassign to variable ${varname} as it was declared constant.`;
    }

    scope.variables.set(varname, value);
    return value;
  }

  public lookupVar(varname: string): RuntimeVal {
    const scope = this.resolve(varname);
    return scope.variables.get(varname) as RuntimeVal;
  }

  public resolve(varname: string): Scope {
    if (this.variables.has(varname)) {
      return this;
    }

    // global scope reached
    if (this.parent === undefined) {
      // proper scope for global/system variables
      if(varname[0] === "$")
        return this;
      else
        // Add JB error
        // Local variable <varname> hasn't been initialized
        throw `Local variable '${varname}' hasn't been initialized`;
    }

    return this.parent.resolve(varname);
  }

  /**
   * Returns the global scope.
   * @returns Top-level `Scope` of a program.
   */
  public getGlobal(): Scope {
    if(this.parent === undefined)
      return this;
    return this.parent.getGlobal();
  }

  /**
   * Null-initializes a global or extendable system variable.
   * 
   * Static system variables are initalized before interpretation.
   * @param global A global/system variable AST node
   */
  public initGlobalVar(global: GlobalIdentifier): void {
    if(this.parent === undefined) {
      const value = this.lookupVar(global.symbol);
      if(value === undefined)
        this.variables.set(global.symbol, MK_NULL());
    }
    else
      // This is a development-only warning, users cant cause it
      console.warn("ScopeWarning: Attempt to null-initialize a global variable from a child scope.");
  }
}
