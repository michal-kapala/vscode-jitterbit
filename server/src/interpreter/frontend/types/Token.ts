import Position from "./Position";

// Represents tokens that our language understands in parsing.
export enum TokenType {
  // Script scope tag
  OpenTransTag,
  CloseTransTag,
  // Literal Types
  Integer,
  Float,
  Identifier,
  GlobalIdentifier,
  SingleQuoteString,
  DoubleQuoteString,
  // Keywords
  Let,
  Const,
  True,
  False,
  // Grouping * Operators
  BinaryOperator,
  Assignment,
  Comma,
  Dot,
  Colon,
  Semicolon,
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, //]
  EOF, // Signified the end of file
  UnknownToken // Token parsing error
}

/**
 * Represents a single token from the source-code.
 */
export class Token {
  /**
   * Contains the raw value as seen inside the source code.
   */
  value: string;
  /**
   * Type of the tagged structure.
   */
  type: TokenType;
  /**
   * The position of token's first character.
   */ 
  begin: Position;
  /**
   * The position of token's last character.
   */
  end: Position;

  constructor(value: string, type: TokenType, begin: Position, end: Position) {
    this.value = value;
    this.type = type;
    this.begin = begin;
    this.end = end;
  }
}
