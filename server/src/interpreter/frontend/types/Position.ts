export default class Position {
  character: number;
  line: number;

  // VS Code's Position is zero-based
  // https://code.visualstudio.com/api/references/vscode-api#Position
  constructor(line = 0, character = 0) {
    this.line = line;
    this.character = character;
  }

  nextLine(): void {
    this.line++;
    this.character = 0;
  }

  advance(): void {
    this.character++;
  }
}
