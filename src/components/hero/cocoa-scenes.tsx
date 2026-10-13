"use client";

/**
 * CocoaScenes — the public narrative beneath the Cocoa Machine hero.
 *
 * Each scene has a *distinct* composition; there is no repeatable card grid:
 *
 * Scene 02 — TRANSFORMATION: a continuous source→output canvas with an animated
 *   sweep, real Lua on the left and the engine's real output shape on the right.
 * Scene 03 — THE ENGINE: a branching syntax stem that splits into the four real
 *   passes, drawn as an annotated diagram rather than feature cards.
 * Scene 04 — COMPATIBILITY: a technical specification table, editorial, ruled.
 * Scene 05 — DOCUMENTATION: a two-column index / detail pair.
 * Scene 06 — CLOSING SIGNATURE: a full-bleed editorial sign-off.
 *
 * All content is factual to the engine (scope-aware renaming, reversible string
 * encoding, constant encoding, output validation). No fabricated metrics.
 */

import { forwardRef, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 * Scene 02 — The transformation
 * ------------------------------------------------------------------ */

const SOURCE_LINES: [string, string][] = [
  ["keyword", "local "],
  ["plain", "function "],
  ["ident", "greet"],
  ["plain", "(name)\n    "],
  ["keyword", "return "],
  ["string", '"Hello, "'],
  ["plain", " .. name .. "],
  ["string", '"!"'],
  ["plain", "\n"],
  ["keyword", "end"],
];

const OUTPUT_LINES: [string, string][] = [
  ["comment", "-- Protected with Choco OBF"],
  ["plain", "\n"],
  ["keyword", "local "],
  ["encrypted", "v1 = function(v2)\n    "],
  ["keyword", "return "],
  ["encrypted", "string.char(72,101,108,...)"],
  ["plain", " .. v2 .. "],
  ["encrypted", "string.char(33)"],
  ["plain", "\n"],
  ["keyword", "end"],
];

function CodeColumn({
  label,
  meta,
  lines,
  tone,
}: {
  label: string;
  meta: string;
  lines: [string, string][];
  tone: "source" | "output";
}) {
  return (
    <div className="corner-ticks">
      <div className="mb-3 flex items-center justify-between">
        <span className="type-label type-label--hot">{label}</span>
        <span className="type-label">{meta}</span>
      </div>
      <div className={`code-surface p-4 ${tone === "output" ? "scanline" : ""}`}>
        {lines.map(([cls, text], i) => (
          <span key={i} className="code-line">
            <span className="code-gutter">{String(i + 1).padStart(2, "0")}</span>
            <span className={`tok-${cls}`}>{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TransformationScene() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.from("[data-sweep]", {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.1,
            ease: "power2.inOut",
            scrollTrigger: { trigger: el, start: "top 72%", once: true },
          });
          gsap.from("[data-col]", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 74%", once: true },
          });
        }, el);
      }
    );
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      id="transformation"
      className="cocoa-ground relative overflow-hidden px-5 py-24 sm:px-8 lg:px-14"
    >
      <div className="lab-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="max-w-2xl">
          <span className="type-label type-label--hot">Scene 02 — Transformation</span>
          <h2 className="type-section mt-4 text-[var(--color-text)]">
            The source goes in readable.
          </h2>
        </div>

        <div className="mt-6 flex items-center gap-4" aria-hidden="true">
          <span data-sweep className="rule-hot block h-px flex-1" />
          <span className="type-label whitespace-nowrap">A · INPUT</span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div data-col>
            <CodeColumn
              label="SOURCE · LUAU"
              meta=".luau · human-readable"
              lines={SOURCE_LINES}
              tone="source"
            />
          </div>
          <div data-col>
            <CodeColumn
              label="OUTPUT · OBFUSCATED"
              meta="equivalent · validated"
              lines={OUTPUT_LINES}
              tone="output"
            />
          </div>
        </div>

        <p className="type-body mt-10 max-w-2xl border-l border-[var(--color-border-strong)] pl-5">
          Scope-aware renaming renames locals, parameters and local functions
          only; Roblox globals, standard-library names and table keys are
          preserved. String literals become equivalent expressions rebuilt with
          <span className="font-mono text-[var(--color-accent-bright)]"> string.char</span>,
          <span className="font-mono text-[var(--color-accent-bright)]"> string.byte</span> and
          <span className="font-mono text-[var(--color-accent-bright)]"> table.concat</span> —
          never <span className="font-mono">loadstring</span>.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Scene 03 — The engine (branching diagram)
 * ------------------------------------------------------------------ */

const PASSES = [
  { id: "00", name: "Tokenise", detail: "Luau-aware lexer separates strings, long strings, comments, numbers and operators." },
  { id: "01", name: "Transform", detail: "Comment removal, scope-aware renaming, string encoding and constant encoding run as token passes." },
  { id: "02", name: "Emit", detail: "A deterministic emitter rebuilds source, keeping the branding header out of the code body." },
  { id: "03", name: "Validate", detail: "Output is re-lexed and balance-checked. On failure the original source is returned untouched." },
];

function EngineScene() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.from("[data-branch]", {
            scaleY: 0,
            transformOrigin: "top center",
            duration: 0.7,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 72%", once: true },
          });
          gsap.from("[data-pass]", {
            x: -24,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 74%", once: true },
          });
        }, el);
      }
    );
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      id="engine"
      className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-bg-deep)] px-5 py-24 sm:px-8 lg:px-14"
    >
      <div className="lab-grid lab-grid--dense" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1200px]">
        <span className="type-label type-label--hot">Scene 03 — The engine</span>
        <h2 className="type-section mt-4 max-w-3xl text-[var(--color-text)]">
          One stem. Four passes.
        </h2>

        {/* A single vertical stem that branches into each pass. */}
        <div className="relative mt-14">
          <span
            data-branch
            className="absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-px bg-[linear-gradient(180deg,var(--color-accent-bright),var(--color-border))] md:block"
            aria-hidden="true"
          />
          <ol className="flex flex-col gap-0">
            {PASSES.map((p) => (
              <li
                key={p.id}
                data-pass
                className="grid gap-4 border-b border-[var(--color-border)] py-7 md:grid-cols-[auto_minmax(0,220px)_minmax(0,1fr)] md:items-baseline md:gap-8 md:pl-10"
              >
                <span className="index-num">{p.id}</span>
                <h3 className="type-title text-[var(--color-text)]">{p.name}</h3>
                <p className="type-body max-w-xl">{p.detail}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {["Obfuscation, not encryption", "Original returned on failure", "Deterministic output"].map(
            (tag) => (
              <span key={tag} className="type-label flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[var(--color-accent-bright)]" />
                {tag}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Scene 04 — Compatibility specification
 * ------------------------------------------------------------------ */

const SPECS = [
  { k: "Target language", v: "Roblox Luau" },
  { k: "Input formats", v: ".lua · .luau" },
  { k: "Renaming", v: "Scope-aware (locals only)" },
  { k: "String protection", v: "Reversible encoding" },
  { k: "Constant encoding", v: "Integer literal rewriting" },
  { k: "Output gate", v: "Re-lex + structural check" },
];

function SpecScene() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <span className="type-label type-label--hot">Scene 04 — Specification</span>
            <h2 className="type-section mt-4 text-[var(--color-text)]">
              What it targets.
            </h2>
            <p className="type-body mt-6 max-w-md">
              Luau-only syntax — compound assignment, <span className="font-mono">continue</span>,
              type annotations — is preserved and lexically validated. Roblox-API
              behaviour should be confirmed in Roblox Studio.
            </p>
          </div>

          <dl className="border-t border-[var(--color-border)]">
            {SPECS.map((s) => (
              <div
                key={s.k}
                className="flex items-baseline justify-between gap-6 border-b border-[var(--color-border)] py-4"
              >
                <dt className="type-label">{s.k}</dt>
                <dd className="font-mono text-sm text-[var(--color-text)]">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Scene 06 — Closing signature
 * ------------------------------------------------------------------ */

function SignatureScene({ githubHref }: { githubHref: string }) {
  return (
    <footer className="cocoa-ground grain relative overflow-hidden px-5 pb-12 pt-24 sm:px-8 lg:px-14">
      <div className="lab-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1200px]">
        <span className="type-label type-label--hot">Scene 06 — Signature</span>

        <p className="type-machine mt-6 text-[var(--color-text)]" style={{ fontSize: "clamp(2.4rem,11vw,9rem)" }}>
          Choco&nbsp;OBF
        </p>

        <div className="mt-12 grid gap-8 border-t border-[var(--color-border)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="type-label">Laboratory</p>
            <p className="type-body mt-2">
              Luau source obfuscation with output validation. Built on a
              Luau-aware token pipeline.
            </p>
          </div>
          <div>
            <p className="type-label">Repository</p>
            <a
              href={githubHref}
              target="_blank"
              rel="noreferrer"
              className="type-body mt-2 inline-block text-[var(--color-accent-bright)] hover:underline"
            >
              voixera / X0DEC04Tenc ↗
            </a>
          </div>
          <div>
            <p className="type-label">Honesty</p>
            <p className="type-body mt-2">
              Obfuscation is not encryption. Output is harder to read, not
              impossible to reverse.
            </p>
          </div>
          <div>
            <p className="type-label">Navigate</p>
            <a href="#top" className="type-body mt-2 inline-block hover:text-[var(--color-text)]">
              Back to top ↑
            </a>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <span className="rule-x block h-px flex-1" />
          <span className="type-label whitespace-nowrap">
            © Choco OBF — COCOA LAB
          </span>
        </div>
      </div>
    </footer>
  );
}

const CocoaScenes = forwardRef<HTMLDivElement, { githubHref: string }>(
  function CocoaScenes({ githubHref }, ref) {
    return (
      <>
        <TransformationScene />
        <div ref={ref}>
          <EngineScene />
        </div>
        <SpecScene />
        <SignatureScene githubHref={githubHref} />
      </>
    );
  }
);

export default CocoaScenes;
