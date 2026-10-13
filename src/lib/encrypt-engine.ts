/**
 * Choco OBF — obfuscation engine.
 *
 * Pipeline (each stage separated so failures are attributable):
 *   1. Input validation        -> validateInput (lex + structure)
 *   2. Comment removal         -> removeComments
 *   3. Scope-aware renaming    -> renameIdentifiers
 *   4. String encoding         -> encodeStrings
 *   5. Constant encoding       -> encodeConstants
 *   6. Emit                    -> emitOutput
 *   7. Output validation       -> validateOutput (final safety gate)
 *
 * On any failure the caller receives `ok: false`, diagnostics, and the
 * ORIGINAL source unchanged — never partial or corrupt output.
 */

import type { EncryptionSettings } from "./types";
import { ObfuscationError } from "./obf/errors";
import { validateInput, validateOutput } from "./obf/validator";
import {
  encodeConstants,
  encodeStrings,
  minify,
  removeComments,
  renameIdentifiers,
  stripWhitespace,
  type PassContext,
} from "./obf/passes";
import { emitOutput } from "./obf/emit";
import { LUAU_KEYWORDS, PROTECTED_GLOBALS } from "./obf/tokenizer";

export interface ObfuscationDiagnostic {
  phase: string;
  message: string;
  line?: number;
  column?: number;
}

export interface ObfuscationResult {
  ok: boolean;
  /** Protected output when `ok` is true; otherwise the ORIGINAL source. */
  output: string;
  diagnostics: ObfuscationDiagnostic[];
  originalSize: number;
  outputSize: number;
}

/* ------------------------------------------------------------------------- *
 * Deterministic RNG (mulberry32) so identical inputs + settings are stable.
 * ------------------------------------------------------------------------- */

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromInput(code: string, settings: EncryptionSettings): number {
  let h = 2166136261;
  const s = code + JSON.stringify(settings);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Run the obfuscation pipeline.
 *
 * @param code      Original Luau source.
 * @param settings  User-selected transformations.
 * @param options   `validateOutput` (default true) toggles the final safety gate.
 */
export function obfuscateLuaCode(
  code: string,
  settings: EncryptionSettings,
  options: { validateOutput?: boolean } = {}
): ObfuscationResult {
  const validate = options.validateOutput ?? true;
  const originalSize = Buffer.byteLength(code, "utf8");
  const fail = (err: unknown, phaseFallback: string): ObfuscationResult => {
    const diag: ObfuscationDiagnostic =
      err instanceof ObfuscationError
        ? {
            phase: err.phase,
            message: err.message,
            line: err.line,
            column: err.column,
          }
        : {
            phase: phaseFallback,
            message: err instanceof Error ? err.message : "Unknown error",
          };
    return {
      ok: false,
      output: code, // never return partial/corrupt output
      diagnostics: [diag],
      originalSize,
      outputSize: originalSize,
    };
  };

  const ctx: PassContext = {
    rng: makeRng(seedFromInput(code, settings)),
    idLength: Math.max(4, Math.min(32, settings.randomIdentifierLength || 8)),
    reserved: new Set<string>([...LUAU_KEYWORDS, ...PROTECTED_GLOBALS]),
  };

  let tokens;
  try {
    tokens = validateInput(code);
  } catch (err) {
    return fail(err, "validate-input");
  }

  try {
    // Normalise: drop insignificant whitespace so every pass sees adjacent
    // meaningful tokens. The emitter reconstructs spacing deterministically.
    tokens = stripWhitespace(tokens);

    if (settings.removeComments) {
      tokens = removeComments(tokens);
    }

    if (settings.renameVariable || settings.renameFunction || settings.renameLocal) {
      tokens = renameIdentifiers(tokens, settings, ctx);
    }

    if (settings.encryptString) {
      tokens = encodeStrings(tokens);
    }

    if (settings.encodeConstant) {
      tokens = encodeConstants(tokens, ctx);
    }

    if (settings.minify) {
      tokens = minify(tokens);
    }

    const output = emitOutput(tokens, {
      branded: true,
      compress: settings.compressOutput,
    });

    if (validate) {
      try {
        validateOutput(output);
      } catch (err) {
        return fail(err, "validate-output");
      }
    }

    return {
      ok: true,
      output,
      diagnostics: [],
      originalSize,
      outputSize: Buffer.byteLength(output, "utf8"),
    };
  } catch (err) {
    return fail(err, "internal");
  }
}
