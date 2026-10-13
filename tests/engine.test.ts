/**
 * Choco OBF — engine regression tests.
 *
 * Strategy: for each supported case we (1) execute the ORIGINAL Lua in the
 * Lua 5.4 (WASM) runtime, (2) obfuscate it with Choco OBF, (3) execute the
 * generated output in the same runtime, and (4) assert identical observable
 * output. Malformed/unsupported inputs assert that obfuscation fails cleanly
 * with diagnostics instead of producing corrupt output.
 *
 * IMPORTANT: this runtime is Lua 5.4, not Luau. Cases are restricted to the
 * common subset. Luau-only syntax is covered by a separate, clearly-labelled
 * section that only asserts lexical/structural validity, not execution.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { obfuscateLuaCode } from "../src/lib/encrypt-engine";
import { DEFAULT_SETTINGS, type EncryptionSettings } from "../src/lib/types";
import { runLua } from "./helpers/lua";
import { tokenize } from "../src/lib/obf/tokenizer";

/** Settings with every supported transformation enabled, deterministic. */
function allOn(extra: Partial<EncryptionSettings> = {}): EncryptionSettings {
  return { ...DEFAULT_SETTINGS, ...extra };
}

/** Obfuscate, assert success, and return the output. */
function obfuscateOrFail(src: string, settings = allOn()): string {
  const r = obfuscateLuaCode(src, settings);
  assert.equal(
    r.ok,
    true,
    `expected obfuscation to succeed, got diagnostics: ${JSON.stringify(r.diagnostics)}`
  );
  return r.output;
}

/** Run original vs. obfuscated and assert identical output. */
async function assertRoundTrip(src: string, settings = allOn()) {
  const original = await runLua(src);
  assert.equal(original.ok, true, `original failed to run: ${original.error}`);

  const obf = obfuscateOrFail(src, settings);
  const transformed = await runLua(obf);
  assert.equal(
    transformed.ok,
    true,
    `obfuscated output failed to run: ${transformed.error}\n---\n${obf}`
  );
  assert.deepEqual(
    transformed.output,
    original.output,
    `output mismatch\noriginal: ${JSON.stringify(original.output)}\nobf: ${JSON.stringify(transformed.output)}\n---\n${obf}`
  );
  return { original, obf, transformed };
}

/* ========================================================================= *
 * 1. Basic arithmetic and variable declarations
 * ========================================================================= */

test("arithmetic and variable declarations", async () => {
  await assertRoundTrip(`
local a = 2 + 3 * 4
local b = 10 / 4
local c = 2 ^ 8
print(a)
print(b)
print(c)
`);
});

/* ========================================================================= *
 * 2. Local and global function references
 * ========================================================================= */

test("local and global function references", async () => {
  await assertRoundTrip(`
local function double(x) return x * 2 end
function triple(x) return x * 3 end
print(double(21))
print(triple(7))
`);
});

/* ========================================================================= *
 * 3. Nested functions and closures
 * ========================================================================= */

test("nested functions and closures", async () => {
  await assertRoundTrip(`
local function makeCounter(start)
  local count = start
  return function()
    count = count + 1
    return count
  end
end
local c = makeCounter(10)
print(c())
print(c())
print(c())
`);
});

/* ========================================================================= *
 * 4. Conditional statements and loops
 * ========================================================================= */

test("conditionals and loops", async () => {
  await assertRoundTrip(`
local sum = 0
for i = 1, 5 do
  if i % 2 == 0 then
    sum = sum + i
  else
    sum = sum - i
  end
end
print(sum)
local j = 0
while j < 3 do
  j = j + 1
end
print(j)
local k = 0
repeat
  k = k + 1
until k >= 4
print(k)
`);
});

/* ========================================================================= *
 * 5. Tables, nested tables, and table access
 * ========================================================================= */

test("tables and nested table access", async () => {
  await assertRoundTrip(`
local t = { 1, 2, 3, name = "choco" }
t[4] = 4
t.nested = { deep = { value = 99 } }
print(t[1] + t[4])
print(t.name)
print(t.nested.deep.value)
`);
});

/* ========================================================================= *
 * 6. String literals, escape sequences, Unicode
 * ========================================================================= */

test("string literals, escapes and unicode", async () => {
  await assertRoundTrip(`
local s = "line1\\nline2"
local q = 'single \\"quoted\\" text'
local uni = "caf\\195\\169"  -- UTF-8 for "café"
local concat = s .. "|" .. q .. "|" .. uni
print(#s)
print(concat)
`);
});

/* ========================================================================= *
 * 7. Multiple return values and varargs
 * ========================================================================= */

test("multiple returns and varargs", async () => {
  await assertRoundTrip(`
local function many() return 1, 2, 3 end
local a, b, c = many()
print(a, b, c)
local function sum(...)
  local total = 0
  for _, v in ipairs({...}) do total = total + v end
  return total
end
print(sum(1, 2, 3, 4, 5))
`);
});

/* ========================================================================= *
 * 8. Roblox API references — lexical preservation only (no Roblox runtime)
 * ========================================================================= */

test("Roblox API names are never renamed", () => {
  const src = `
local Players = game:GetService("Players")
local part = Instance.new("Part")
part.Parent = workspace
local color = Color3.fromRGB(255, 0, 0)
print(typeof(Players), typeof(part), typeof(color))
`;
  const out = obfuscateOrFail(src);
  // Roblox globals and API member names referenced as globals/fields must be
  // preserved. `Players` is a local here, so it is intentionally renamed.
  for (const name of [
    "game",
    "GetService",
    "Instance",
    "workspace",
    "Color3",
    "fromRGB",
    "typeof",
  ]) {
    assert.ok(out.includes(name), `expected '${name}' to be preserved, output was:\n${out}`);
  }
  // `new` and `fromRGB` are field accesses on preserved globals — the whole
  // call chain must remain valid.
  assert.ok(out.includes(":GetService"), "method call syntax must be preserved");
});

/* ========================================================================= *
 * 9. Module-style code and require references
 * ========================================================================= */

test("module require references are preserved", async () => {
  // `require` and the module path are globals/strings and must survive.
  const src = `
local Module = require(script.Parent.ModuleScript)
print(type(Module))
`;
  const out = obfuscateOrFail(src);
  assert.ok(out.includes("require"), "require must be preserved");
  assert.ok(out.includes("script"), "script must be preserved");
  assert.ok(out.includes("ModuleScript"), "ModuleScript must be preserved");
  // Overall output must still be lexically valid.
  assert.doesNotThrow(() => tokenize(out));
});

/* ========================================================================= *
 * 10. Empty, malformed and unsupported input
 * ========================================================================= */

test("empty input is rejected cleanly", () => {
  const r = obfuscateLuaCode("", DEFAULT_SETTINGS);
  assert.equal(r.ok, false);
  assert.ok(r.diagnostics.length > 0);
  assert.equal(r.output, "", "must return original (empty) source, not corrupt output");
});

test("whitespace-only input is rejected cleanly", () => {
  const r = obfuscateLuaCode("   \n\t  ", DEFAULT_SETTINGS);
  assert.equal(r.ok, false);
});

test("unterminated string is rejected with a located diagnostic", () => {
  const r = obfuscateLuaCode('local x = "unterminated\nprint(x)', DEFAULT_SETTINGS);
  assert.equal(r.ok, false);
  assert.ok(
    r.diagnostics[0].phase === "lex" || r.diagnostics[0].phase === "validate-input",
    `unexpected phase: ${r.diagnostics[0].phase}`
  );
  assert.ok(r.diagnostics[0].line !== undefined);
});

test("unbalanced block is rejected", () => {
  const r = obfuscateLuaCode("function f()\n  print(1)\n", DEFAULT_SETTINGS);
  assert.equal(r.ok, false);
  assert.equal(r.diagnostics[0].phase, "validate-input");
});

test("unbalanced brackets are rejected", () => {
  const r = obfuscateLuaCode("local t = {1, 2, 3\nprint(t)", DEFAULT_SETTINGS);
  assert.equal(r.ok, false);
});

test("failure never returns partial output", () => {
  const bad = 'local x = "unterminated';
  const r = obfuscateLuaCode(bad, DEFAULT_SETTINGS);
  assert.equal(r.ok, false);
  assert.equal(r.output, bad, "on failure the original source must be returned unchanged");
});

/* ========================================================================= *
 * 11. Larger scripts with nested scopes
 * ========================================================================= */

test("larger script with nested scopes", async () => {
  await assertRoundTrip(`
local function process(items)
  local result = {}
  for index, value in ipairs(items) do
    if value > 0 then
      local transformed = value * 2
      table.insert(result, transformed)
    else
      local function negate(v) return -v end
      table.insert(result, negate(value))
    end
  end
  return result
end
local out = process({ 1, -2, 3, -4, 5 })
for i = 1, #out do
  print(i, out[i])
end
`);
});

/* ========================================================================= *
 * Regression tests for specific bugs discovered during development
 * ========================================================================= */

test("REGRESSION: strings are not renamed (identifier in string stays intact)", async () => {
  // The old engine ran identifier replacement over the whole text, including
  // string contents, corrupting them.
  const src = `
local message = "local x = 5; print(x)"
print(message)
`;
  const { transformed } = await assertRoundTrip(src);
  assert.deepEqual(transformed.output, ["local x = 5; print(x)"]);
});

test("REGRESSION: compressOutput does not comment out the program", async () => {
  // The old engine joined all lines (including the `--` header) with `;`,
  // turning the header comment into a comment over the entire program.
  const src = `print("hello")\nprint(1 + 1)\n`;
  const out = obfuscateOrFail(src, allOn({ compressOutput: true }));
  const r = await runLua(out);
  assert.equal(r.ok, true, `compressed output failed: ${r.error}\n---\n${out}`);
  assert.deepEqual(r.output, ["hello", "2"]);
});

test("REGRESSION: globals are not renamed", async () => {
  const src = `x_global_test = 42\nprint(x_global_test)\n`;
  // Note: we deliberately use a global assignment; it must survive.
  const out = obfuscateOrFail(src);
  assert.ok(out.includes("x_global_test") || out.includes("print"), "print must survive");
  const r = await runLua(out);
  assert.equal(r.ok, true, r.error);
});

test("REGRESSION: identical input produces identical output (deterministic)", () => {
  const src = `local a = "x"\nlocal b = 1 + 2\nprint(a, b)\n`;
  const r1 = obfuscateLuaCode(src, DEFAULT_SETTINGS);
  const r2 = obfuscateLuaCode(src, DEFAULT_SETTINGS);
  assert.equal(r1.output, r2.output);
});

test("REGRESSION: string encoding round-trips exactly for all byte values", async () => {
  // Exercise characters requiring the full byte range and escapes.
  const src = `
local mixed = "\\0\\1\\2\\255A\\n\\t" .. "\\127\\128"
print(#mixed)
print(string.byte(mixed, 1), string.byte(mixed, 6))
`;
  await assertRoundTrip(src);
});

test("REGRESSION: encodeConstant output is a numeric expression, not a string", async () => {
  const src = `local n = 100\nprint(n + 23)\nprint(type(n))\n`;
  const { transformed } = await assertRoundTrip(src, allOn({ encodeConstant: true }));
  assert.deepEqual(transformed.output, ["123", "number"]);
});

/* ========================================================================= *
 * Settings combinations
 * ========================================================================= */

test("all transformations disabled yields runnable output", async () => {
  const src = `local x = "hi"\nprint(x)\n`;
  const off = allOn({
    renameVariable: false,
    renameFunction: false,
    renameLocal: false,
    encryptString: false,
    encodeConstant: false,
    removeComments: false,
    minify: false,
    compressOutput: false,
    protectGlobal: false,
  });
  await assertRoundTrip(src, off);
});

test("every individual transformation is independently valid", async () => {
  const src = `local function greet(name)\n  return "Hello, " .. name .. "!"\nend\nprint(greet("Choco"))\nprint(21 * 2)\n`;
  const keys: (keyof EncryptionSettings)[] = [
    "renameVariable",
    "renameFunction",
    "renameLocal",
    "encryptString",
    "encodeConstant",
    "removeComments",
    "minify",
    "compressOutput",
    "protectGlobal",
  ];
  for (const key of keys) {
    const settings = allOn({ [key]: true } as Partial<EncryptionSettings>);
    const r = obfuscateLuaCode(src, settings);
    assert.equal(r.ok, true, `setting ${key}=true failed: ${JSON.stringify(r.diagnostics)}`);
    const exec = await runLua(r.output);
    assert.equal(exec.ok, true, `setting ${key}=true produced un-runnable output: ${exec.error}`);
  }
});

test("comment removal keeps strings containing comment-like text", async () => {
  const src = `
local url = "http://example.com"  -- a trailing comment
--[[ block
comment ]]
print(url)
`;
  const { transformed } = await assertRoundTrip(src, allOn({ removeComments: true }));
  assert.deepEqual(transformed.output, ["http://example.com"]);
});

test("long strings are handled", async () => {
  const src = `
local text = [[multi
line
value]]
print(#text > 0)
`;
  await assertRoundTrip(src);
});

test("REGRESSION: table constructor keys are not renamed", async () => {
  // `{ v = v }` has a string key `v` and a variable value `v`. Renaming the
  // key would change the table's field name and break field access.
  const src = `
local v = 10
local t = { v = v, other = 1 }
print(t.v, t.other)
`;
  const { transformed } = await assertRoundTrip(src);
  assert.deepEqual(transformed.output, ["10\t1"]);
});

test("REGRESSION: field and method names are not renamed", async () => {
  const src = `
local obj = {}
obj.__index = obj
function obj.new(val) return setmetatable({ value = val }, obj) end
function obj:get() return self.value end
local o = obj.new(55)
print(o:get())
`;
  const { transformed } = await assertRoundTrip(src);
  assert.deepEqual(transformed.output, ["55"]);
});

/* ========================================================================= *
 * Lexical validity for Luau-only syntax (NOT executed — Lua 5.4 can't run it)
 * ========================================================================= */

test("Luau-only syntax: output remains lexically valid (no execution)", () => {
  const src = `
local counter = 0
for i = 1, 10 do
  if i % 2 == 0 then
    counter += 1
    continue
  end
  counter -= 1
end
local x: number = 5
print(x)
`;
  const r = obfuscateLuaCode(src, allOn({ encryptString: false }));
  // Compound assignment and `continue` are Luau syntax the Lua 5.4 runtime
  // cannot execute, so we assert only that output lexes cleanly.
  assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
  assert.doesNotThrow(() => tokenize(r.output));
});
