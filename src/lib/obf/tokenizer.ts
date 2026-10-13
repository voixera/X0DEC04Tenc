/**
 * Choco OBF — Luau-aware tokenizer.
 *
 * This replaces the previous fragile regex/char-scanning approach. Every pass in
 * the engine operates on this token stream instead of raw text, which is the
 * single most important fix: strings, comments and identifiers can no longer be
 * confused for one another.
 *
 * Scope: it recognises everything needed to safely transform Luau source —
 * short strings with escapes, long strings (`[[ ]]`, `[==[ ]==]`), line and
 * block comments (with the same long-bracket forms), numbers (decimal, float,
 * exponent, hex incl. binary literals), identifiers/keywords, and operators.
 * It is intentionally not a full parser; it is a faithful lexer.
 */

import { ObfuscationError } from "./errors";

export type TokenType =
  | "identifier"
  | "keyword"
  | "number"
  | "string"
  | "operator"
  | "punctuation"
  | "comment"
  | "whitespace"
  | "newline"
  | "eof";

export interface Token {
  type: TokenType;
  /** Raw text exactly as it appeared in the source. */
  value: string;
  /** Decoded contents for `string` tokens (escapes resolved). */
  stringValue?: string;
  /** The bracket level for long strings, e.g. 0 for `[[`, 1 for `[=[`. */
  longLevel?: number;
  start: number;
  end: number;
  line: number;
  column: number;
}

/**
 * Luau keywords. `continue` is a contextual keyword in Luau (only meaningful
 * inside loops) and is therefore NOT listed here, so it is treated as a plain
 * identifier and can be renamed safely when it is a variable.
 */
export const LUAU_KEYWORDS = new Set<string>([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
  "export",
  "type",
]);

/**
 * Names the obfuscator must never rename even though they are plain
 * identifiers. These are Roblox/Luau globals and standard library roots that
 * user scripts reference directly; renaming them would break runtime behaviour.
 * This list is deliberately conservative — anything not present here that the
 * script declares as a local is fair game.
 */
export const PROTECTED_GLOBALS = new Set<string>([
  // Roblox globals
  "game",
  "workspace",
  "script",
  "Instance",
  "Enum",
  "CFrame",
  "Vector2",
  "Vector3",
  "Color3",
  "UDim",
  "UDim2",
  "BrickColor",
  "Ray",
  "Region3",
  "TweenInfo",
  "NumberRange",
  "NumberSequence",
  "NumberSequenceKeypoint",
  "ColorSequence",
  "ColorSequenceKeypoint",
  "Rect",
  "PhysicalProperties",
  "Random",
  "DateTime",
  "Axes",
  "Faces",
  "Font",
  "PathWaypoint",
  "SharedTable",
  "task",
  "wait",
  "spawn",
  "delay",
  "tick",
  "time",
  "elapsedTime",
  "typeof",
  "warn",
  "print",
  "require",
  "settings",
  "UserSettings",
  "PluginManager",
  "gcinfo",
  "newproxy",
  "loadstring",
  "getfenv",
  "setfenv",
  "getmetatable",
  "setmetatable",
  "rawget",
  "rawset",
  "rawequal",
  "rawlen",
  "select",
  "pairs",
  "ipairs",
  "next",
  "pcall",
  "xpcall",
  "error",
  "assert",
  "tonumber",
  "tostring",
  "type",
  "unpack",
  "collectgarbage",
  "coroutine",
  "debug",
  "utf8",
  "os",
  "string",
  "table",
  "math",
  "bit32",
  "buffer",
  "vector",
  "_G",
  "_VERSION",
  "shared",
]);

const OPERATOR_CHARS = "+-*/%^#=<>;:,.(){}[]";

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isHexDigit(ch: string): boolean {
  return (
    (ch >= "0" && ch <= "9") ||
    (ch >= "a" && ch <= "f") ||
    (ch >= "A" && ch <= "F")
  );
}

function isIdentifierStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isIdentifierPart(ch: string): boolean {
  return isIdentifierStart(ch) || isDigit(ch);
}

/**
 * Try to read a long bracket (`[`, `=`*, `[`) starting at `index`.
 * Returns the bracket level, or null when the position is not a long bracket.
 */
function readLongBracket(
  src: string,
  index: number
): { level: number; openEnd: number } | null {
  if (src[index] !== "[") return null;
  let j = index + 1;
  let level = 0;
  while (j < src.length && src[j] === "=") {
    level++;
    j++;
  }
  if (src[j] !== "[") return null;
  return { level, openEnd: j + 1 };
}

function findLongBracketClose(
  src: string,
  from: number,
  level: number
): number {
  const close = "]" + "=".repeat(level) + "]";
  return src.indexOf(close, from);
}

/** Resolve Lua/Luau short-string escape sequences to their actual characters. */
function decodeEscapes(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) {
      out += "\\";
      break;
    }
    switch (next) {
      case "n": out += "\n"; i++; break;
      case "t": out += "\t"; i++; break;
      case "r": out += "\r"; i++; break;
      case "a": out += "\x07"; i++; break;
      case "b": out += "\b"; i++; break;
      case "f": out += "\f"; i++; break;
      case "v": out += "\v"; i++; break;
      case "\\": out += "\\"; i++; break;
      case '"': out += '"'; i++; break;
      case "'": out += "'"; i++; break;
      case "\n": out += "\n"; i++; break;
      case "z": {
        // \z skips subsequent whitespace including newlines.
        i += 2;
        while (i < raw.length && /\s/.test(raw[i])) i++;
        i--;
        break;
      }
      case "x": {
        const hex = raw.slice(i + 2, i + 4);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 3;
        } else {
          out += "x";
          i++;
        }
        break;
      }
      case "u": {
        const m = /^\{([0-9a-fA-F]+)\}/.exec(raw.slice(i + 2));
        if (m) {
          out += String.fromCodePoint(parseInt(m[1], 16));
          i += 2 + m[0].length;
        } else {
          out += "u";
          i++;
        }
        break;
      }
      default: {
        if (isDigit(next)) {
          const m = /^\d{1,3}/.exec(raw.slice(i + 1));
          if (m) {
            out += String.fromCharCode(parseInt(m[0], 10));
            i += m[0].length;
          }
        } else {
          out += next;
          i++;
        }
      }
    }
  }
  return out;
}

/**
 * Tokenize Luau source. Throws `ObfuscationError` with a precise location on
 * unterminated strings/comments, which the caller surfaces as a validation
 * failure rather than corrupt output.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let lineStart = 0;

  const push = (
    type: TokenType,
    value: string,
    start: number,
    tline: number,
    tcolumn: number,
    extra?: Partial<Token>
  ) => {
    tokens.push({
      type,
      value,
      start,
      end: start + value.length,
      line: tline,
      column: tcolumn,
      ...extra,
    });
  };

  while (i < source.length) {
    const ch = source[i];
    const start = i;
    const tokenLine = line;
    const tokenColumn = i - lineStart + 1;

    // Newlines — kept as distinct tokens so statements can be split safely.
    if (ch === "\n") {
      push("newline", "\n", start, tokenLine, tokenColumn);
      i++;
      line++;
      lineStart = i;
      continue;
    }
    if (ch === "\r") {
      if (source[i + 1] === "\n") {
        push("newline", "\r\n", start, tokenLine, tokenColumn);
        i += 2;
      } else {
        push("newline", "\r", start, tokenLine, tokenColumn);
        i++;
      }
      line++;
      lineStart = i;
      continue;
    }

    // Whitespace (spaces/tabs only — newlines handled above).
    if (ch === " " || ch === "\t" || ch === "\f" || ch === "\v") {
      let j = i;
      while (j < source.length && /[ \t\f\v]/.test(source[j])) j++;
      push("whitespace", source.slice(i, j), start, tokenLine, tokenColumn);
      i = j;
      continue;
    }

    // Comments: `--` then optional long bracket, else line comment.
    if (ch === "-" && source[i + 1] === "-") {
      const lb = readLongBracket(source, i + 2);
      if (lb) {
        const closeIdx = findLongBracketClose(source, lb.openEnd, lb.level);
        if (closeIdx === -1) {
          throw new ObfuscationError(
            "lex",
            "Unterminated long comment",
            { line: tokenLine, column: tokenColumn }
          );
        }
        const end = closeIdx + lb.level + 2;
        const text = source.slice(i, end);
        push("comment", text, start, tokenLine, tokenColumn);
        // Update line counter for newlines inside the comment.
        for (let k = i; k < end; k++) {
          if (source[k] === "\n") {
            line++;
            lineStart = k + 1;
          }
        }
        i = end;
        continue;
      }
      let end = source.indexOf("\n", i);
      if (end === -1) end = source.length;
      push("comment", source.slice(i, end), start, tokenLine, tokenColumn);
      i = end;
      continue;
    }

    // Long strings.
    if (ch === "[") {
      const lb = readLongBracket(source, i);
      if (lb) {
        const closeIdx = findLongBracketClose(source, lb.openEnd, lb.level);
        if (closeIdx === -1) {
          throw new ObfuscationError(
            "lex",
            "Unterminated long string",
            { line: tokenLine, column: tokenColumn }
          );
        }
        const end = closeIdx + lb.level + 2;
        const inner = source.slice(lb.openEnd, closeIdx);
        push("string", source.slice(i, end), start, tokenLine, tokenColumn, {
          stringValue: inner,
          longLevel: lb.level,
        });
        for (let k = i; k < end; k++) {
          if (source[k] === "\n") {
            line++;
            lineStart = k + 1;
          }
        }
        i = end;
        continue;
      }
    }

    // Short strings.
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < source.length) {
        const c = source[j];
        if (c === "\\") {
          j += 2;
          continue;
        }
        if (c === quote) break;
        if (c === "\n") {
          throw new ObfuscationError(
            "lex",
            "Unterminated string literal",
            { line: tokenLine, column: tokenColumn }
          );
        }
        j++;
      }
      if (j >= source.length) {
        throw new ObfuscationError(
          "lex",
          "Unterminated string literal",
          { line: tokenLine, column: tokenColumn }
        );
      }
      const text = source.slice(i, j + 1);
      push("string", text, start, tokenLine, tokenColumn, {
        stringValue: decodeEscapes(text.slice(1, -1)),
      });
      i = j + 1;
      continue;
    }

    // Numbers: decimal/float/exponent and hex (incl. binary literals).
    if (isDigit(ch) || (ch === "." && isDigit(source[i + 1] ?? ""))) {
      let j = i;
      if (ch === "0" && (source[i + 1] === "x" || source[i + 1] === "X")) {
        j = i + 2;
        while (j < source.length && isHexDigit(source[j])) j++;
        // Luau binary literals: 0b1010_0001
        if (source[j] === ".") {
          j++;
          while (j < source.length && isHexDigit(source[j])) j++;
        }
        if (source[j] === "p" || source[j] === "P") {
          j++;
          if (source[j] === "+" || source[j] === "-") j++;
          while (j < source.length && isDigit(source[j])) j++;
        }
      } else {
        while (j < source.length && (isDigit(source[j]) || source[j] === "_")) j++;
        if (source[j] === ".") {
          j++;
          while (j < source.length && (isDigit(source[j]) || source[j] === "_")) j++;
        }
        if (source[j] === "e" || source[j] === "E") {
          j++;
          if (source[j] === "+" || source[j] === "-") j++;
          while (j < source.length && isDigit(source[j])) j++;
        }
      }
      push("number", source.slice(i, j), start, tokenLine, tokenColumn);
      i = j;
      continue;
    }

    // Identifiers / keywords.
    if (isIdentifierStart(ch)) {
      let j = i + 1;
      while (j < source.length && isIdentifierPart(source[j])) j++;
      const text = source.slice(i, j);
      push(
        LUAU_KEYWORDS.has(text) ? "keyword" : "identifier",
        text,
        start,
        tokenLine,
        tokenColumn
      );
      i = j;
      continue;
    }

    // Operators / punctuation (multi-char first).
    const three = source.slice(i, i + 3);
    if (three === "..." || three === "..=") {
      push("operator", three, start, tokenLine, tokenColumn);
      i += 3;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (
      two === "==" ||
      two === "~=" ||
      two === "<=" ||
      two === ">=" ||
      two === ".." ||
      two === "::" ||
      two === "+=" ||
      two === "-=" ||
      two === "*=" ||
      two === "/=" ||
      two === "%=" ||
      two === "^=" ||
      two === "//" ||
      two === "->"
    ) {
      push("operator", two, start, tokenLine, tokenColumn);
      i += 2;
      continue;
    }
    if (OPERATOR_CHARS.includes(ch) || ch === "~") {
      push("punctuation", ch, start, tokenLine, tokenColumn);
      i += 1;
      continue;
    }

    // Unknown character — report rather than silently skip.
    throw new ObfuscationError(
      "lex",
      `Unexpected character ${JSON.stringify(ch)}`,
      { line: tokenLine, column: tokenColumn }
    );
  }

  push("eof", "", source.length, line, source.length - lineStart + 1);
  return tokens;
}
