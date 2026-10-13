/**
 * Lua execution helper for Choco OBF tests.
 *
 * Uses wasmoon (Lua 5.4 compiled to WASM) to actually execute Lua source. This
 * is NOT Luau — Luau-only syntax (`+=`, `continue`, `::` type annotations,
 * `if/then/else` expressions) is out of scope for automated runs and must be
 * verified manually in Roblox Studio. The scripts used in tests are restricted
 * to the Lua 5.4 / Luau common subset.
 */

import { LuaFactory, type LuaEngine } from "wasmoon";

let factory: LuaFactory | null = null;

function getFactory(): LuaFactory {
  if (!factory) factory = new LuaFactory();
  return factory;
}

export interface RunResult {
  ok: boolean;
  /** Captured lines printed by the script. */
  output: string[];
  /** Error message when `ok` is false. */
  error?: string;
}

/**
 * Execute a Lua script, capturing `print` output. Each call gets a fresh state
 * so scripts cannot leak globals into one another.
 */
export async function runLua(source: string): Promise<RunResult> {
  const engine: LuaEngine = await getFactory().createEngine();
  const output: string[] = [];
  try {
    engine.global.set("print", (...args: unknown[]) => {
      output.push(args.map((a) => formatValue(a)).join("\t"));
    });
    await engine.doString(source);
    return { ok: true, output };
  } catch (err) {
    return {
      ok: false,
      output,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    engine.global.close();
  }
}

function formatValue(v: unknown): string {
  if (v === null) return "nil";
  if (typeof v === "number") {
    // Match Lua's default number formatting reasonably.
    if (Number.isInteger(v)) return String(v);
    return String(v);
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
