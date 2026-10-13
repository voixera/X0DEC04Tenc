/**
 * Choco OBF — transformation passes.
 *
 * All passes operate over the token stream produced by `tokenize`, never over
 * raw text. This is what makes the output correct: a string can never be
 * mistaken for an identifier, a comment can never be split mid-token, and
 * renaming is scope-aware.
 */

import type { EncryptionSettings } from "../types";
import { PROTECTED_GLOBALS, LUAU_KEYWORDS, type Token } from "./tokenizer";

/* ------------------------------------------------------------------------- *
 * Identifier generation
 * ------------------------------------------------------------------------- */

const ID_ALPHABET_START = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
const ID_ALPHABET_REST = ID_ALPHABET_START + "0123456789";

function randomIdentifier(length: number, rng: () => number): string {
  const len = Math.max(1, length);
  let out = ID_ALPHABET_START[Math.floor(rng() * ID_ALPHABET_START.length)];
  for (let i = 1; i < len; i++) {
    out += ID_ALPHABET_REST[Math.floor(rng() * ID_ALPHABET_REST.length)];
  }
  return out;
}

export interface PassContext {
  /** Deterministic RNG so tests are reproducible. */
  rng: () => number;
  idLength: number;
  /** Names that must never be produced by the generator (keywords/globals). */
  reserved: Set<string>;
}

/* ------------------------------------------------------------------------- *
 * Normalisation
 * ------------------------------------------------------------------------- */

/**
 * Remove `whitespace` tokens from the stream so every pass can treat adjacent
 * meaningful tokens as adjacent. Newlines are retained as statement
 * separators; the emitter is responsible for inserting any spacing that
 * becomes necessary. This keeps the passes simple and free of "skip the
 * whitespace token" bugs.
 */
export function stripWhitespace(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.type !== "whitespace");
}

/* ------------------------------------------------------------------------- *
 * Comment removal
 * ------------------------------------------------------------------------- */

/** Drop comment tokens. Newlines are preserved so statements stay separated. */
export function removeComments(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.type !== "comment");
}

/* ------------------------------------------------------------------------- *
 * Scope-aware identifier renaming
 * ------------------------------------------------------------------------- */

interface Scope {
  /** original name -> obfuscated name declared in this scope. */
  names: Map<string, string>;
  parent: Scope | null;
}

function lookup(scope: Scope | null, name: string): string | undefined {
  let s = scope;
  while (s) {
    const found = s.names.get(name);
    if (found !== undefined) return found;
    s = s.parent;
  }
  return undefined;
}

/**
 * Find every token index that *declares* a name (local variable, local
 * function, function parameter, or for-loop variable) and classify it.
 */
type DeclKind = "local" | "localFunction" | "param" | "forVar";

function collectDeclarations(tokens: Token[]): Map<number, DeclKind> {
  const decls = new Map<number, DeclKind>();

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type !== "keyword") continue;

    if (tok.value === "local") {
      // `local function name(params)`
      if (tokens[i + 1]?.type === "keyword" && tokens[i + 1]?.value === "function") {
        if (tokens[i + 2]?.type === "identifier") {
          decls.set(i + 2, "localFunction");
        }
        // Mark the parameter list of this local function.
        let j = i + 2;
        if (tokens[j]?.type === "identifier") j++;
        while (j < tokens.length && tokens[j].value !== "(" && tokens[j].value !== "end") j++;
        if (tokens[j]?.value === "(") {
          let depth = 0;
          j++;
          while (j < tokens.length) {
            const t = tokens[j];
            if (t.value === "(") depth++;
            else if (t.value === ")") {
              if (depth === 0) break;
              depth--;
            } else if (t.type === "identifier" && depth === 0) {
              decls.set(j, "param");
            }
            j++;
          }
        }
        continue;
      }
      // `local a, b = ...` — stop at the first non-identifier (`,`, `=`, `<`).
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === "identifier") {
        decls.set(j, "local");
        j++;
        if (tokens[j]?.value === ",") {
          j++;
          continue;
        }
        break;
      }
      continue;
    }

    if (tok.value === "for") {
      // `for i = 1, n do` or `for k, v in pairs(t) do`
      let j = i + 1;
      while (j < tokens.length) {
        const t = tokens[j];
        if (t.type === "identifier") {
          decls.set(j, "forVar");
          j++;
          if (tokens[j]?.value === ",") {
            j++;
            continue;
          }
          continue;
        }
        if (t.value === "=" || (t.type === "keyword" && (t.value === "in" || t.value === "do"))) {
          break;
        }
        j++;
      }
      continue;
    }

    if (tok.value === "function") {
      // `function name(a, b)` or `function(a, b)` — mark params inside the
      // first balanced parenthesised list that follows.
      let j = i + 1;
      if (tokens[j]?.type === "identifier") j++; // function name
      while (j < tokens.length && tokens[j].value !== "(" && tokens[j].value !== "end") j++;
      if (tokens[j]?.value !== "(") continue;
      let depth = 0;
      j++;
      while (j < tokens.length) {
        const t = tokens[j];
        if (t.value === "(") depth++;
        else if (t.value === ")") {
          if (depth === 0) break;
          depth--;
        } else if (t.type === "identifier" && depth === 0) {
          decls.set(j, "param");
        }
        j++;
      }
      continue;
    }
  }

  return decls;
}

/**
 * Rename locals, parameters and local functions using a scope stack. Global
 * references, protected Roblox/standard-library names, keywords, and content
 * inside strings/comments are never touched.
 *
 * Settings gate categories:
 *   - renameLocal    -> local variable declarations
 *   - renameFunction -> local function declarations
 *   - renameVariable -> function parameters and for-loop variables
 *
 * The traversal is a single pass that maintains an explicit scope stack. A
 * function's own scope opens at its parameter list and closes at its matching
 * `end`, so parameters are visible in the body but not outside. Declaration
 * ownership is decided by declaration *kind* rather than generic block depth,
 * which keeps shadowing and upvalue resolution correct.
 */
export function renameIdentifiers(
  tokens: Token[],
  settings: EncryptionSettings,
  ctx: PassContext
): Token[] {
  const decls = collectDeclarations(tokens);
  if (decls.size === 0) return tokens;

  const renameLocals = settings.renameLocal;
  const renameFunctions = settings.renameFunction;
  const renameVars = settings.renameVariable;

  const gen = (): string => {
    for (let attempt = 0; attempt < 64; attempt++) {
      const candidate = randomIdentifier(ctx.idLength, ctx.rng);
      const collides =
        ctx.reserved.has(candidate) ||
        LUAU_KEYWORDS.has(candidate) ||
        candidate.startsWith("_x") ||
        candidate.startsWith("_s") ||
        candidate.startsWith("_k");
      if (!collides) return candidate;
    }
    return randomIdentifier(ctx.idLength + 4, ctx.rng);
  };

  const shouldRename = (kind: DeclKind): boolean => {
    switch (kind) {
      case "local": return renameLocals;
      case "localFunction": return renameFunctions;
      case "param": return renameVars;
      case "forVar": return renameVars;
    }
  };

  const work = tokens.map((t) => ({ ...t }));
  const root: Scope = { names: new Map(), parent: null };

  // A single traversal builds the scope tree, records the owning scope of each
  // declaration, and records the active scope at every token. Both declaration
  // assignment and reference resolution then use the SAME scope tree.
  const scopeAt: Scope[] = new Array(work.length);
  {
    let scope: Scope = root;
    const stack: Scope[] = [root];

    const openScope = () => {
      const child: Scope = { names: new Map(), parent: scope };
      stack.push(child);
      scope = child;
    };
    const closeScope = () => {
      if (stack.length > 1) {
        stack.pop();
        scope = stack[stack.length - 1];
      }
    };

    for (let i = 0; i < work.length; i++) {
      const tok = work[i];

      // Record the scope active for this token BEFORE any block it opens.
      scopeAt[i] = scope;

      // Function names declared via `local function name` belong to the
      // enclosing scope even though `function` opens a new one.
      const kind = decls.get(i);
      if (kind === "localFunction" && work[i - 1]?.value === "function") {
        scopeAt[i] = scope.parent ?? scope;
      }

      if (tok.type === "keyword") {
        if (tok.value === "function") openScope();
        else if (tok.value === "do" || tok.value === "then" || tok.value === "repeat") openScope();
        else if (tok.value === "end" || tok.value === "until") closeScope();
      }
    }
  }

  // Assign obfuscated names to declarations in their owning scopes.
  for (let i = 0; i < work.length; i++) {
    const kind = decls.get(i);
    if (!kind) continue;
    const tok = work[i];
    if (tok.type !== "identifier") continue;
    if (PROTECTED_GLOBALS.has(tok.value)) continue;
    if (!shouldRename(kind)) continue;
    const owner = scopeAt[i] ?? root;
    const obf = gen();
    owner.names.set(tok.value, obf);
    (tok as Token & { __obf?: string }).__obf = obf;
  }

  // Identify identifiers used as FIELD, METHOD or TABLE-KEY names. These are
  // not variable references and must never be renamed:
  //   foo.bar   -> bar (field)
  //   foo:bar() -> bar (method)
  //   { key = v } -> key (table constructor key, at brace depth > 0)
  const nonVarIndexes = new Set<number>();
  let braceDepth = 0;
  for (let i = 0; i < work.length; i++) {
    const tok = work[i];
    if (tok.value === "{") {
      braceDepth++;
      continue;
    }
    if (tok.value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (tok.type !== "identifier") continue;
    const prev = work[i - 1];
    if (prev && (prev.value === "." || prev.value === ":")) {
      nonVarIndexes.add(i);
      continue;
    }
    // Table-constructor key: `key = ...` where we are inside a `{ }` and the
    // preceding meaningful token is `{` or `,`.
    if (braceDepth > 0 && prev && (prev.value === "{" || prev.value === ",")) {
      const next = work[i + 1];
      if (next && next.value === "=") {
        nonVarIndexes.add(i);
      }
    }
  }

  // Rewrite declarations and references using the recorded scope per token.
  for (let i = 0; i < work.length; i++) {
    const tok = work[i];
    if (tok.type !== "identifier") continue;
    if (PROTECTED_GLOBALS.has(tok.value)) continue;
    if (nonVarIndexes.has(i)) continue;
    const own = (tok as Token & { __obf?: string }).__obf;
    if (own) {
      tok.value = own;
    } else {
      const mapped = lookup(scopeAt[i] ?? root, tok.value);
      if (mapped !== undefined) tok.value = mapped;
    }
  }

  return work;
}

/* ------------------------------------------------------------------------- *
 * String encoding — CORRECT, invertible, Luau-only
 * ------------------------------------------------------------------------- */

/**
 * Encode a byte string as an invertible Luau expression using only
 * Roblox-available built-ins (`string.char`) and no `loadstring`/`io`/`os`.
 *
 * `strValue` is a Lua byte string represented as a JS string where each
 * `charCodeAt` is one byte (0–255) — this is how the lexer decodes `\ddd`
 * escapes. Converting back to bytes therefore uses latin1, NOT utf8 (using
 * utf8 would double-encode bytes >= 128, e.g. `\195\169`).
 *
 * Scheme: XOR every byte with a single-byte key derived deterministically from
 * the payload, then emit them as a `string.char(...)`-style literal wrapped in
 * an inline decoder. XOR is its own inverse, so the original bytes are
 * recovered exactly. The previous implementation used AES-GCM ciphertext and
 * tried to recover it with subtraction — impossible, producing garbage.
 */
function xorKeyFor(bytes: number[]): number {
  let acc = 0x5a;
  for (const b of bytes) acc = (acc ^ b) & 0xff;
  return (acc % 255) + 1; // 1..255
}

function bytesFromLuaString(strValue: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < strValue.length; i++) {
    bytes.push(strValue.charCodeAt(i) & 0xff);
  }
  return bytes;
}

/** Emit the XORed bytes plus a self-contained inline decoder expression. */
function encodeStringToken(strValue: string): string {
  const bytes = bytesFromLuaString(strValue);
  if (bytes.length === 0) return '""';
  const key = xorKeyFor(bytes);
  const encoded = bytes.map((b) => b ^ key);

  // Build the raw Lua string literal holding the XORed bytes.
  let literal = '"';
  for (const b of encoded) {
    if (b === 0x5c) literal += "\\\\";
    else if (b === 0x22) literal += '\\"';
    else if (b >= 0x20 && b < 0x7f) literal += String.fromCharCode(b);
    else literal += "\\" + b; // decimal escape, always unambiguous
  }
  literal += '"';

  // Inline decoder as an expression (function call), so it is usable anywhere
  // a string literal was. Uses only string.char/string.byte/table.concat.
  return (
    `(function() local _k=${key} local _s=${literal} local _r={} ` +
    `for _i=1,#_s do _r[_i]=string.char(string.byte(_s,_i)~ _k) end ` +
    `return table.concat(_r) end)()`
  );
}

/** Replace every non-empty string literal token with an encoded expression. */
export function encodeStrings(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (const tok of tokens) {
    if (tok.type === "string" && (tok.stringValue ?? "").length > 0) {
      const expr = encodeStringToken(tok.stringValue ?? "");
      out.push({
        type: "punctuation",
        value: expr,
        start: tok.start,
        end: tok.end,
        line: tok.line,
        column: tok.column,
      });
      continue;
    }
    out.push(tok);
  }
  return out;
}

/* ------------------------------------------------------------------------- *
 * Constant encoding
 * ------------------------------------------------------------------------- */

/**
 * Rewrite standalone integer literals as an equivalent arithmetic expression.
 * Only plain non-negative decimal integers in a safe range are touched;
 * hex/float/exponent forms are left untouched to avoid changing type or
 * precision.
 */
export function encodeConstants(tokens: Token[], ctx: PassContext): Token[] {
  return tokens.map((tok) => {
    if (tok.type !== "number") return tok;
    if (!/^\d+$/.test(tok.value)) return tok;
    const n = parseInt(tok.value, 10);
    if (!Number.isFinite(n) || n > 1_000_000) return tok;
    const offset = Math.floor(ctx.rng() * 90) + 10;
    return { ...tok, value: `(${n + offset}-${offset})` };
  });
}

/* ------------------------------------------------------------------------- *
 * Minify
 * ------------------------------------------------------------------------- */

/** Collapse insignificant whitespace while keeping statement newlines. */
export function minify(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (const tok of tokens) {
    if (tok.type === "whitespace") continue; // emitter inserts needed spaces
    out.push(tok);
  }
  return out;
}
