# Choco OBF

Choco OBF is a Roblox **Luau** source-code obfuscator. It transforms readable
Luau into a harder-to-read but behaviour-preserving equivalent, and it validates
its own output before reporting success.

> **Obfuscation is not encryption.** Choco OBF makes source harder to read; it
> does not and cannot guarantee that output is impossible to reverse engineer.
> Do not rely on it as a security boundary.

## What it does

The engine tokenises Luau source and runs a pipeline of token-level passes:

1. **Input validation** — lexes the source and checks block/bracket balance.
   Malformed input fails fast with a located diagnostic.
2. **Comment removal** — strips single-line and long comments.
3. **Scope-aware renaming** — renames locals, parameters and local functions
   using a proper scope stack. Roblox globals (`game`, `workspace`, `Instance`,
   `Enum`, …), standard-library names, keywords, table keys and field/method
   names are never touched.
4. **String encoding** — replaces non-empty string literals with an equivalent
   expression that reconstructs the original bytes at runtime using only
   `string.char` / `string.byte` / `table.concat` (no `loadstring`, `io` or `os`).
5. **Constant encoding** — rewrites plain integer literals as arithmetic
   expressions.
6. **Minify / compress** — removes insignificant whitespace.
7. **Output validation** — the generated output is re-lexed and balance-checked
   before the operation is reported as successful. On any failure the **original
   source is returned unchanged** — never partial or corrupt output.

## Supported syntax

Choco OBF targets the **Luau common subset**: variables, functions, closures,
conditionals, loops, tables (including nested), string escapes and long strings,
multiple returns, varargs, method/colon syntax, and Roblox API references.

Luau-only syntax (compound assignment `+=`, `continue`, type annotations `::`,
`if/then/else` expressions) is preserved and lexically validated but is **not**
executed by the automated test runtime (see Testing). Verify such scripts in
Roblox Studio.

### Known limitations

- **Protect Globals** is not supported. The previous metatable sandbox produced
  invalid Lua and has been disabled; toggling it is a no-op. The setting key is
  retained only for backward compatibility.
- String encoding is **reversible obfuscation**, not encryption.
- No control-flow flattening or virtualisation is implemented.

## Architecture

```
src/lib/encrypt-engine.ts     Pipeline orchestration + result/diagnostics
src/lib/obf/tokenizer.ts      Luau-aware lexer (strings, long strings, comments, numbers)
src/lib/obf/validator.ts      Input & output structural validation
src/lib/obf/passes.ts         Transformation passes (rename, strings, constants, minify)
src/lib/obf/emit.ts           Deterministic output emission
src/lib/obf/errors.ts         Typed ObfuscationError + phases
src/app/api/encrypt/route.ts  HTTP endpoint; gates success on validation
```

## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # engine regression suite
```

### Testing

The regression suite (`tests/engine.test.ts`) executes each original script and
its obfuscated output through **wasmoon (Lua 5.4 in WebAssembly)** and asserts
identical observable behaviour, plus assertions for malformed-input handling and
bug regressions.

**Important:** the test runtime is **Lua 5.4, not Luau**. Cases are restricted to
the shared subset. Luau-only syntax is covered by a lexical-validity test only.
**Nothing in this repository has been verified inside Roblox Studio** — scripts
that use Roblox APIs or Luau-only syntax must be confirmed there manually.

## Configuration

Environment variables are documented in `.env.example`.
