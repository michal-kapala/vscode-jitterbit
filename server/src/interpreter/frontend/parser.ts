/* eslint-disable no-case-declarations */
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { getSystemVar } from "../api/sysvars";
import {
  AssignmentExpr,
  BinaryExpr,
  BooleanLiteral,
  CallExpr,
  Expr,
  FloatLiteral,
  GlobalIdentifier,
  Identifier,
  IntegerLiteral,
  MemberExpr,
  ObjectLiteral,
  Program,
  Property,
  Stmt,
  StringLiteral,
  VarDeclaration,
} from "./ast";

import { tokenize } from "./lexer";
import Position from "./types/Position";
import { Token, TokenType } from "./types/Token";
import { makeDiagnostic } from '../../utils';

/**
 * Frontend for producing a valid AST from source code.
 */
export default class Parser {
  private tokens: Token[] = [];

  /*
   * Determines if the parsing is complete and the END OF FILE Is reached.
   */
  private not_eof(): boolean {
    return this.tokens[0].type != TokenType.EOF;
  }

  /**
   * Returns the currently available token.
   */
  private at() {
    return this.tokens[0] as Token;
  }

  /**
   * Returns the previous token and then advances the tokens array to the next value.
   */
  private consume() {
    const prev = this.tokens.shift() as Token;
    return prev;
  }

  /**
   *  Returns the previous token and then advances the tokens array to the next value.
   *  Also checks the type of expected token and throws if the values dnot match.
   */
  private expect(type: TokenType, err: any) {
    const prev = this.tokens.shift() as Token;
    if (!prev || prev.type != type) {
      console.error("Parser Error:\n", err, prev, " - Expecting: ", type);
      return {
        type: prev ? prev.type : TokenType.UnknownToken,
        value: prev ? prev.value : null
      } as Token;
    }

    return prev;
  }

  public produceAST(sourceCode: string, diagnostics: Diagnostic[]): Program {
    // global current tokenizer position, starts at 1,1
    const curPos = new Position();
    this.tokens = tokenize(sourceCode, curPos, diagnostics);

    // find the evaluation scope - <trans>...</trans>
    let openIdx: number | undefined;
    let closeIdx: number | undefined;
    let openingTag: Token | undefined;
    let closingTag: Token | undefined;
    this.tokens.forEach( (token, index) => {
      if(token.type === TokenType.OpenTransTag){
        openIdx = index;
        openingTag = token;
      }
      if(token.type === TokenType.CloseTransTag) {
        closeIdx = index;
        closingTag = token;
      }
    });

    const program: Program = {
      kind: "Program",
      body: [],
    };

    // validate the evaluation scope
    if(openIdx === undefined) {
      // Add warning:
      // 'No <trans> tag, script returns its content as string.'
      diagnostics.push(
        makeDiagnostic(
          DiagnosticSeverity.Warning,
          'No <trans> tag found, script returns its content as string.',
          new Position(),
          new Position()
        )
      );
      
      console.log('Warning: No <trans> tag, script returns its content as string.');
      
      // return the script source as a string

    } else if(closeIdx === undefined) {
      // Add JB error:
      // 'The expression <expr> is missing closing tag </trans>'
      diagnostics.push(
        makeDiagnostic(
          DiagnosticSeverity.Error,
          `The expression is missing </trans> closing tag:\n${sourceCode}\n`,
          new Position(),
          new Position()
        )
      );

      console.log("tokens:", JSON.stringify(this.tokens));
      console.log(`JB error: The expression is missing </trans> closing tag:\n${sourceCode}\n`);
    }
    else {
      if(openIdx !== 0 && openingTag) {
        // Add warning:
        // 'Script content before <trans> is not evaluated and may result in unexpected behaviour.'
        diagnostics.push(
          makeDiagnostic(
            DiagnosticSeverity.Warning,
            'Script content before <trans> is not evaluated and may result in unexpected behaviour.',
            new Position(),
            { line: openingTag.begin.line, character: openingTag.begin.character } as Position
          )
        );
        console.log("Warning: Script content before <trans> is not evaluated and may result in unexpected behaviour.");

        // Remove the front tail
        while(this.tokens[0].type !== TokenType.OpenTransTag) {
          this.tokens.shift();
        }
      }

      if(closeIdx != this.tokens.length - 1) {
        console.log('closeIdx:', closeIdx);
        console.log('this.tokens.length - 1:', this.tokens.length - 1);
        // Add warning:
        // 'Script content after </trans> is not evaluated and may result in unexpected behaviour.'
        // ignore the eof token
        // </trans> pos - curPos
        if(closingTag !== undefined) {
          diagnostics.push(
            makeDiagnostic(
              DiagnosticSeverity.Warning,
              'Script content after </trans> is not evaluated and may result in unexpected behaviour.',
              { line: closingTag.end.line, character: closingTag.end.character } as Position,
              curPos
            )
          );
          console.log("Warning: Script content after </trans> is not evaluated and may result in unexpected behaviour.");
        }

        // Remove the back tail
        let len = this.tokens.length - 1;
        while(this.tokens[len].type !== TokenType.CloseTransTag) {
          this.tokens.pop();
          len--;
        }
      }

      console.log("tokens before trans:", JSON.stringify(this.tokens));

      // Remove <trans> and </trans> then restore EOF into the evaluated token set
      this.tokens.shift();
      this.tokens.pop();
      this.tokens.push(new Token("EndOfFile", TokenType.EOF, curPos, curPos));

      console.log("tokens:", JSON.stringify(this.tokens));

      // Parse until end of file
      while (this.not_eof()) {
        program.body.push(this.parse_stmt());
      }
    }

    return program;
  }

  // Handle complex statement types
  private parse_stmt(): Stmt {
    // skip to parse_expr
    switch (this.at().type) {
      // to be removed
      case TokenType.Let:
      case TokenType.Const:
        return this.parse_var_declaration();
      default:
        return this.parse_expr();
    }
  }

  // LET IDENT;
  // ( LET | CONST ) IDENT = EXPR;
  parse_var_declaration(): Stmt {
    const isConstant = this.consume().type == TokenType.Const;
    const identifier = this.expect(
      TokenType.Identifier,
      "Expected identifier name following let | const keywords.",
    ).value;

    if (this.at().type == TokenType.Semicolon) {
      this.consume(); // expect semicolon
      if (isConstant) {
        throw "Must assign a value to constant expression. No value provided.";
      }

      return {
        kind: "VarDeclaration",
        identifier,
        constant: false,
      } as VarDeclaration;
    }

    this.expect(
      TokenType.Assignment,
      "Expected equals token following identifier in var declaration.",
    );

    const declaration = {
      kind: "VarDeclaration",
      value: this.parse_expr(),
      identifier,
      constant: isConstant,
    } as VarDeclaration;

    this.expect(
      TokenType.Semicolon,
      "Variable declaration statement must end with semicolon.",
    );

    return declaration;
  }

  // Handle expressions
  private parse_expr(): Expr {
    return this.parse_assignment_expr();
  }

  private parse_assignment_expr(): Expr {
    const left = this.parse_object_expr();

    if (this.at().type == TokenType.Assignment) {
      this.consume(); // advance past equals
      const value = this.parse_assignment_expr();
      return { value, assignee: left, kind: "AssignmentExpr" } as AssignmentExpr;
    }

    return left;
  }

  private parse_object_expr(): Expr {
    // { Prop[] }
    if (this.at().type !== TokenType.OpenBrace) {
      return this.parse_additive_expr();
    }

    this.consume(); // advance past open brace.
    const properties = new Array<Property>();

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const key =
        this.expect(TokenType.Identifier, "Object literal key expected").value;

      // Allows shorthand key: pair -> { key, }
      if (this.at().type == TokenType.Comma) {
        this.consume(); // advance past comma
        properties.push({ key, kind: "Property" } as Property);
        continue;
      } // Allows shorthand key: pair -> { key }
      else if (this.at().type == TokenType.CloseBrace) {
        properties.push({ key, kind: "Property" });
        continue;
      }

      // { key: val }
      this.expect(
        TokenType.Colon,
        "ParserError: Missing colon following identifier in ObjectExpr",
      );
      const value = this.parse_expr();

      properties.push({ kind: "Property", value, key });
      if (this.at().type != TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          "ParserError: Expected comma or closing bracket following property",
        );
      }
    }

    this.expect(TokenType.CloseBrace, "ParserError: Object literal missing closing brace.");
    return { kind: "ObjectLiteral", properties } as ObjectLiteral;
  }

  // Handle Addition & Subtraction Operations
  private parse_additive_expr(): Expr {
    let left = this.parse_multiplicitave_expr();

    while (this.at().value == "+" || this.at().value == "-") {
      const operator = this.consume().value;
      const right = this.parse_multiplicitave_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  // Handle Multiplication, Division & Modulo Operations
  private parse_multiplicitave_expr(): Expr {
    let left = this.parse_call_member_expr();

    // to be changed: modulo operator is unsupported
    while (
      this.at().value == "/" || this.at().value == "*" || this.at().value == "%"
    ) {
      const operator = this.consume().value;
      const right = this.parse_call_member_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  // foo.x()()
  private parse_call_member_expr(): Expr {
    const member = this.parse_member_expr();

    if (this.at().type == TokenType.OpenParen) {
      return this.parse_call_expr(member);
    }

    return member;
  }

  private parse_call_expr(caller: Expr): Expr {
    let call_expr: Expr = {
      kind: "CallExpr",
      caller,
      args: this.parse_args(),
    } as CallExpr;

    if (this.at().type == TokenType.OpenParen) {
      call_expr = this.parse_call_expr(call_expr);
    }

    return call_expr;
  }

  private parse_args(): Expr[] {
    this.expect(TokenType.OpenParen, "ParserError: Expected open parenthesis");
    const args = this.at().type == TokenType.CloseParen
      ? []
      : this.parse_arguments_list();

    this.expect(
      TokenType.CloseParen,
      "ParserError: Missing closing parenthesis inside arguments list",
    );
    return args;
  }

  private parse_arguments_list(): Expr[] {
    const args = [this.parse_assignment_expr()];

    while (this.at().type == TokenType.Comma && this.consume()) {
      args.push(this.parse_assignment_expr());
    }

    return args;
  }

  private parse_member_expr(): Expr {
    let object = this.parse_primary_expr();

    while (
      this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket
    ) {
      const operator = this.consume();
      let property: Expr;
      let computed: boolean;

      // non-computed values aka obj.expr
      if (operator.type == TokenType.Dot) {
        computed = false;
        // get identifier
        property = this.parse_primary_expr();
        if (property.kind != "Identifier") {
          throw `ParserError: Cannot use dot operator without right hand side being a identifier`;
        }
      } else { // this allows obj[computedValue]
        computed = true;
        property = this.parse_expr();
        this.expect(
          TokenType.CloseBracket,
          "ParserError: Missing closing bracket in computed value.",
        );
      }

      object = {
        kind: "MemberExpr",
        object,
        property,
        computed,
      } as MemberExpr;
    }

    return object;
  }

  // Orders Of Precedence
  // Assignment
  // Object
  // AdditiveExpr
  // MultiplicitaveExpr
  // Call
  // Member
  // PrimaryExpr

  // Parse Literal Values & Grouping Expressions
  private parse_primary_expr(): Expr {
    const tk = this.at().type;

    // Determine which token we are currently at and return literal value
    switch (tk) {
      // User-defined local variables
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: this.consume().value } as Identifier;

      case TokenType.GlobalIdentifier:
        // consume the token
        const globalVarToken = this.consume();
        // check if the name is '$'
        // then the var acts as an untracked global var i.e. it doesnt appear in the debugger
        if(globalVarToken.value === "$") {
          // Add a warning
          // member expressions on $ can lead to unexpected behavior, for instance:
          // $[2] = $;
          // lol = $[2];
          // results in a proxy error (502) and apache server exceptions from agents
          console.warn("ParserWarning: '$' should not be used as an identifier. It behaves like an untracked global variable and may cause unexpected behaviour including agent-level exceptions when used in complex expressions");
        }
        // check if system variable
        const sysVar = getSystemVar(globalVarToken.value);
        if(sysVar !== undefined) 
          return {
            kind: "GlobalIdentifier",
            symbol: globalVarToken.value,
            type: "system" 
          } as GlobalIdentifier;
        else {
          if(globalVarToken.value.substring(0, 11) === "$jitterbit.") {
            // Add a warning:
            // Global variable names should not begin with '$jitterbit.', it is a reserved namespace.
            console.warn("ParserWarning: Global variable names should not begin with '$jitterbit.', it is a reserved namespace.");
          }

          return {
            kind: "GlobalIdentifier",
            symbol: globalVarToken.value,
            type: "global"
          } as GlobalIdentifier;
        }

      // Constants and Numeric Constants
      case TokenType.Integer:
        return {
          kind: "NumericLiteral",
          value: parseInt(this.consume().value),
        } as IntegerLiteral;
      
      case TokenType.Float:
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.consume().value),
        } as FloatLiteral;

      case TokenType.True:
        this.consume();
        return {
          kind: "BooleanLiteral",
          value: true,
        } as BooleanLiteral;

      case TokenType.False:
        this.consume();
        return {
          kind: "BooleanLiteral",
          value: false,
        } as BooleanLiteral;

      // Grouping Expressions
      case TokenType.OpenParen: {
        this.consume(); // eat the opening paren
        const value = this.parse_expr();
        this.expect(
          TokenType.CloseParen,
          "ParserError: Unexpected token found inside parenthesised expression. Expected closing parenthesis.",
        ); // closing paren
        return value;
      }

      // '' string literal
      case TokenType.SingleQuoteString: {
        return { kind: "StringLiteral", value: this.consume().value } as StringLiteral;
      }

      // "" string literal
      case TokenType.DoubleQuoteString: {
        return { kind: "StringLiteral", value: this.consume().value } as StringLiteral;
      }

      // Unidentified Tokens and Invalid Code Reached
      default:
        console.error("ParserError: Unexpected token found during parsing!", this.at());
        // TODO: add an error/error detail for every other token type here
        // consume the token to prevent infinite loops
        this.consume();
        return { kind: "Program" };
    }
  }
}
