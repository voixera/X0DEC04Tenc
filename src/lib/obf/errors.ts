/**
 * Choco OBF — structured error and diagnostic types.
 *
 * The engine never throws raw strings that reach the UI. Every failure is
 * surfaced as an `ObfuscationError` carrying the phase in which it occurred and,
 * where known, the source position. The API route serialises these into a
 * stable JSON shape so the client can render actionable diagnostics.
 */

export type ObfuscationPhase =
  | "input"
  | "lex"
  | "validate-input"
  | "rename"
  | "strings"
  | "constants"
  | "emit"
  | "validate-output"
  | "internal";

export interface DiagnosticLocation {
  line: number;
  column: number;
}

export class ObfuscationError extends Error {
  readonly phase: ObfuscationPhase;
  readonly line?: number;
  readonly column?: number;

  constructor(
    phase: ObfuscationPhase,
    message: string,
    location?: DiagnosticLocation
  ) {
    super(message);
    this.name = "ObfuscationError";
    this.phase = phase;
    this.line = location?.line;
    this.column = location?.column;
  }

  /** Human readable, single-line description used in UI logs. */
  toDisplay(): string {
    const where =
      this.line !== undefined
        ? ` (line ${this.line}${this.column !== undefined ? `, column ${this.column}` : ""})`
        : "";
    return `${this.message}${where}`;
  }
}
