/**
 * Choco OBF — structural validator.
 *
 * Two responsibilities:
 *   1. Validate the *input* source before transformation so unsupported or
 *      malformed scripts fail fast with a clear message instead of producing
 *      corrupt output.
 *   2. Validate the *generated* output as a final safety gate, so the engine
 *      never reports success for output that does not lex or has obviously
 *      unbalanced block structure.
 *
 * This is a structural check, not a full Luau parser. It catches the class of
 * failures that matter here: unterminated constructs and unbalanced blocks.
 */

import { ObfuscationError, type ObfuscationPhase } from "./errors";
import { tokenize, type Token } from "./tokenizer";

const OPEN_KEYWORDS = new Set(["function", "if", "do", "repeat"]);
const CLOSE_KEYWORDS = new Set(["end", "until"]);

/**
 * Verify block-structure balance using the token stream. This is deliberately
 * conservative: it tracks `function/if/do/repeat` openings against `end/until`
 * closings. `for` and `while` open an implicit `do` which is counted when the
 * `do` keyword appears.
 */
function checkBlockBalance(tokens: Token[], phase: ObfuscationPhase): void {
  const stack: { keyword: string; line: number; column: number }[] = [];

  for (const tok of tokens) {
    if (tok.type !== "keyword") continue;
    if (OPEN_KEYWORDS.has(tok.value)) {
      stack.push({ keyword: tok.value, line: tok.line, column: tok.column });
    } else if (tok.value === "end") {
      if (stack.length === 0) {
        throw new ObfuscationError(
          phase,
          "Unexpected 'end' with no matching block opener",
          { line: tok.line, column: tok.column }
        );
      }
      // `until` closes `repeat`, `end` closes everything else.
      while (stack.length && stack[stack.length - 1].keyword === "repeat") {
        stack.pop();
      }
      if (stack.length === 0) {
        throw new ObfuscationError(
          phase,
          "Unexpected 'end' with no matching block opener",
          { line: tok.line, column: tok.column }
        );
      }
      stack.pop();
    } else if (tok.value === "until") {
      const top = stack[stack.length - 1];
      if (!top || top.keyword !== "repeat") {
        throw new ObfuscationError(
          phase,
          "Unexpected 'until' with no matching 'repeat'",
          { line: tok.line, column: tok.column }
        );
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    throw new ObfuscationError(
      phase,
      `Unclosed '${unclosed.keyword}' block`,
      { line: unclosed.line, column: unclosed.column }
    );
  }
}

/**
 * Balance check for (), [], {} — long strings are already consumed as single
 * string tokens by the lexer, so their brackets never reach here.
 */
function checkBracketBalance(tokens: Token[], phase: ObfuscationPhase): void {
  const stack: { ch: string; line: number; column: number }[] = [];
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  for (const tok of tokens) {
    if (tok.type !== "punctuation" && tok.type !== "operator") continue;
    if (tok.value === "(" || tok.value === "[" || tok.value === "{") {
      stack.push({ ch: tok.value, line: tok.line, column: tok.column });
    } else if (tok.value === ")" || tok.value === "]" || tok.value === "}") {
      const top = stack[stack.length - 1];
      if (!top || top.ch !== pairs[tok.value]) {
        throw new ObfuscationError(
          phase,
          `Unmatched '${tok.value}'`,
          { line: tok.line, column: tok.column }
        );
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const open = stack[stack.length - 1];
    throw new ObfuscationError(
      phase,
      `Unclosed '${open.ch}'`,
      { line: open.line, column: open.column }
    );
  }
}

/** Validate input source. Throws `ObfuscationError` when malformed. */
export function validateInput(source: string): Token[] {
  if (source.trim().length === 0) {
    throw new ObfuscationError("validate-input", "Input source is empty");
  }
  const tokens = tokenize(source);
  checkBracketBalance(tokens, "validate-input");
  checkBlockBalance(tokens, "validate-input");
  return tokens;
}

/**
 * Validate generated output as a final gate. Returns the token stream on
 * success and throws `ObfuscationError` (phase `validate-output`) otherwise.
 */
export function validateOutput(output: string): Token[] {
  let tokens: Token[];
  try {
    tokens = tokenize(output);
  } catch (err) {
    if (err instanceof ObfuscationError) {
      throw new ObfuscationError(
        "validate-output",
        `Generated output is not valid Luau: ${err.message}`,
        err.line !== undefined ? { line: err.line, column: err.column ?? 1 } : undefined
      );
    }
    throw err;
  }
  checkBracketBalance(tokens, "validate-output");
  checkBlockBalance(tokens, "validate-output");
  return tokens;
}
