"use client";

/**
 * LandingSections — public feature / workflow / footer content for the
 * unauthenticated landing experience.
 *
 * Content is factual and limited to features the engine actually implements.
 * A GSAP ScrollTrigger drives the transformation-workflow sequence; everything
 * degrades to static, readable content when motion is reduced or JS is delayed.
 */

import { forwardRef, useEffect, useRef } from "react";
import {
  Scan,
  Layers,
  Wand2,
  FileCode2,
  ShieldCheck,
  ArrowRight,
  GitBranch,
} from "@/components/icons";

const FEATURES = [
  {
    icon: Scan,
    title: "Scope-aware renaming",
    body: "Locals, parameters and local functions are renamed using a real scope stack. Roblox globals, standard-library names, table keys and field/method names are preserved.",
  },
  {
    icon: Layers,
    title: "Reversible string encoding",
    body: "String literals become equivalent expressions reconstructed at runtime with only string.char, string.byte and table.concat — no loadstring, io or os.",
  },
  {
    icon: Wand2,
    title: "Constant encoding",
    body: "Plain integer literals are rewritten as arithmetic expressions to defeat simple pattern matching, without changing numeric type or precision.",
  },
  {
    icon: ShieldCheck,
    title: "Output validation",
    body: "Generated output is re-lexed and structure-checked before success is reported. If validation fails, the original source is returned unchanged.",
  },
];

const WORKFLOW = [
  { step: "01", label: "Tokenise", detail: "A Luau-aware lexer separates strings, long strings, comments, numbers and operators." },
  { step: "02", label: "Transform", detail: "Comment removal, scope-aware renaming, string encoding and constant encoding run as token-level passes." },
  { step: "03", label: "Emit", detail: "A deterministic emitter rebuilds the source, keeping the branding header out of the code body." },
  { step: "04", label: "Validate", detail: "The output is re-lexed and balance-checked. On failure the original source is returned untouched." },
];

function WorkflowTimeline() {
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
          gsap.from("[data-workflow='node']", {
            y: 26,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: "top 78%", once: true },
          });
          gsap.from("[data-workflow='line']", {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.9,
            ease: "power2.inOut",
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: "top 78%", once: true },
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
    <div ref={root} className="mt-14 grid gap-6 md:grid-cols-4">
      {WORKFLOW.map((w, i) => (
        <div key={w.step} data-workflow="node" className="relative">
          {i < WORKFLOW.length - 1 && (
            <span
              data-workflow="line"
              className="absolute left-[calc(100%-0.5rem)] top-3 hidden h-px w-[calc(100%-1.5rem)] bg-[var(--color-border-strong)] md:block"
            />
          )}
          <p className="font-mono text-xs text-[var(--color-brand)]">{w.step}</p>
          <h4 className="mt-2 font-display text-xl text-[color:var(--color-text)]">
            {w.label}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {w.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

const LandingSections = forwardRef<HTMLDivElement, { githubHref: string }>(
  function LandingSections({ githubHref }, ref) {
    return (
      <>
        {/* ---------- FEATURES ---------- */}
        <section ref={ref} className="border-t border-[var(--color-border)] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1360px]">
            <div className="max-w-2xl">
              <p className="eyebrow">What it does</p>
              <h2 className="display-xl mt-3 text-[color:var(--color-text)]">
                Built to make Luau harder to read — never wrong to run.
              </h2>
              <p className="lede mt-4">
                Obfuscation, not encryption. Choco OBF reshapes source while
                preserving observable behaviour, and refuses to report success
                when it cannot produce valid Luau.
              </p>
            </div>

            {/* Alternating editorial feature rows rather than a uniform card grid */}
            <div className="mt-14 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {FEATURES.map((f, i) => {
                const flip = i % 2 === 1;
                return (
                  <div
                    key={f.title}
                    className="grid items-center gap-6 py-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
                  >
                    {/* Head: icon + title */}
                    <div
                      className={`flex items-center gap-4 ${
                        flip ? "md:order-2 md:justify-end md:text-right" : ""
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] ${
                          flip ? "md:order-2" : ""
                        }`}
                      >
                        <f.icon className="h-5 w-5 text-[var(--color-brand)]" />
                      </div>
                      <h3 className="font-display text-2xl text-[color:var(--color-text)]">
                        {f.title}
                      </h3>
                    </div>

                    {/* Body */}
                    <p
                      className={`text-sm leading-relaxed text-[var(--color-accent-dim)] ${
                        flip ? "md:order-1 md:text-right" : ""
                      }`}
                    >
                      {f.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- WORKFLOW ---------- */}
        <section className="border-t border-[var(--color-border)] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1360px]">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="display-xl mt-3 text-[color:var(--color-text)]">
                Four passes between your source and the output.
              </h2>
            </div>
            <WorkflowTimeline />
          </div>
        </section>

        {/* ---------- COMPATIBILITY ---------- */}
        <section className="border-t border-[var(--color-border)] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1360px] gap-8 md:grid-cols-3">
            {[
              { label: "Target language", value: "Roblox Luau" },
              { label: "Input formats", value: ".lua · .luau" },
              { label: "String protection", value: "Reversible encoding" },
            ].map((row) => (
              <div key={row.label} className="border-l border-[var(--color-border-strong)] pl-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {row.label}
                </p>
                <p className="mt-2 font-display text-2xl text-[color:var(--color-text)]">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-[1360px] text-xs leading-relaxed text-[var(--color-muted)]">
            Luau-only syntax (compound assignment, continue, type annotations) is
            preserved and lexically validated. Roblox-API behaviour should be
            confirmed in Roblox Studio.
          </p>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer className="border-t border-[var(--color-border)] px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1360px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="brand-mark grid h-9 w-9 place-items-center rounded-lg" />
              <div>
                <p className="choco-wordmark font-display text-lg leading-none">Choco OBF</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  Luau source obfuscator
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--color-accent-dim)]">
              <a
                href={githubHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-[var(--color-text)]"
              >
                <GitBranch className="h-4 w-4" /> Repository
              </a>
              <a href="#top" className="inline-flex items-center gap-2 hover:text-[var(--color-text)]">
                Back to top
                <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
              </a>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-[1360px] text-xs text-[var(--color-muted)]">
            Obfuscation is not encryption. Choco OBF makes source harder to read;
            it does not guarantee that output is impossible to reverse engineer.
          </p>
        </footer>
      </>
    );
  }
);

export default LandingSections;
