/**
 * Choco OBF — output emitter.
 *
 * Turns a token stream back into Luau source. The key correctness fix here is
 * that the branding header is always written as its own line and is never
 * merged into the code body: the previous engine joined *all* lines with `;`
 * when "Compress Output" was enabled, which turned the leading `--` comment
 * into a comment over the entire program (a guaranteed syntax error).
 */

import type { Token } from "./tokenizer";

/**
 * Decide whether a space is required between two adjacent token values so they
 * do not merge into a different token when concatenated.
 */
function needsSpaceBetween(a: string, b: string): boolean {
  if (a === "" || b === "") return false;
  const isWordChar = (c: string) => /[A-Za-z0-9_]/.test(c);
  const lastA = a[a.length - 1];
  const firstB = b[0];
  if (isWordChar(lastA) && isWordChar(firstB)) return true;
  if (lastA === "-" && firstB === "-") return true; // avoid forming a comment
  if (lastA === "[" && firstB === "[") return true;
  if (lastA === "." && firstB === ".") return true;
  if (/[0-9]/.test(lastA) && firstB === ".") return true;
  return false;
}

/**
 * Emit tokens with minimal whitespace. Newlines are preserved as statement
 * separators; spaces are inserted only where two tokens would otherwise merge.
 *
 * Because whitespace tokens are stripped before emission, this is also the
 * default (readable) emitter: it reconstructs spacing deterministically.
 */
export function emitPreserving(tokens: Token[]): string {
  return emitMinified(tokens);
}

/**
 * Emit tokens with minimal whitespace. Newlines are preserved as statement
 * separators; spaces are inserted only where two tokens would otherwise merge.
 */
export function emitMinified(tokens: Token[]): string {
  let out = "";
  let prevMeaningful: Token | null = null;
  let pendingNewline = false;

  for (const tok of tokens) {
    if (tok.type === "eof") break;
    if (tok.type === "whitespace") continue;

    if (tok.type === "newline") {
      pendingNewline = true;
      continue;
    }

    if (prevMeaningful) {
      if (needsSpaceBetween(prevMeaningful.value, tok.value)) {
        out += " ";
      } else if (pendingNewline) {
        out += "\n";
      }
    }
    out += tok.value;
    prevMeaningful = tok;
    pendingNewline = false;
  }

  return out;
}

export interface EmitOptions {
  /** Whether to prefix the protected-output branding header. */
  branded: boolean;
  /** Whether to emit single-line/compact form. */
  compress: boolean;
}

/**
 * Produce the final protected output.
 *
 * The header is emitted on its own line, terminated by a real newline, and is
 * never part of any `;`-join. This is intentional and load-bearing.
 */
export function emitOutput(tokens: Token[], opts: EmitOptions): string {
  const body = opts.compress ? emitMinified(tokens) : emitPreserving(tokens);
  const header = opts.branded ? "-- Choco OBF protected\n" : "";

  if (!opts.compress) {
    return header + body;
  }

  // Compact form: header line stays a standalone comment; the code body is
  // collapsed onto as few lines as possible but NOT semicolon-joined, because
  // semicolon joining across `end`/`until`/`return` is unsafe. `emitMinified`
  // already removes redundant whitespace; we just ensure a clean newline
  // between the header and the body.
  return header + body.trimStart();
}
