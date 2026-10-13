"use client";

/**
 * HeroCopy — the editorial headline block for the Choco OBF landing hero.
 *
 * GSAP drives a single coordinated entrance timeline (headline lines, lede,
 * CTAs). It is reduced-motion aware and cleans up on unmount, and the content
 * is always present in the DOM so it is usable even if the animation never
 * runs.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, GitBranch } from "@/components/icons";

const HEADLINE_LINES = [
  "Sweet on the surface.",
  "Complex underneath.",
];

export default function HeroCopy({
  onExplore,
  onDocs,
  githubHref,
}: {
  onExplore: () => void;
  onDocs: () => void;
  githubHref?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    // Lazy-load GSAP so it is not in the critical path.
    import("gsap").then(({ gsap }) => {
      if (cancelled || !root.current) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(el);
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(q("[data-hero='eyebrow']"), { y: 14, opacity: 0, duration: 0.6 })
          .from(
            q("[data-hero='line']"),
            { yPercent: 118, opacity: 0, duration: 0.9, stagger: 0.1 },
            "-=0.35"
          )
          .from(q("[data-hero='lede']"), { y: 18, opacity: 0, duration: 0.7 }, "-=0.5")
          .from(
            q("[data-hero='cta'] > *"),
            { y: 14, opacity: 0, duration: 0.55, stagger: 0.08 },
            "-=0.4"
          )
          .from(q("[data-hero='meta']"), { opacity: 0, duration: 0.6 }, "-=0.3");
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={root} className="relative z-10 max-w-2xl">
      <p data-hero="eyebrow" className="eyebrow hero-reveal">
        Choco OBF · Luau Obfuscator
      </p>

      <h1 className="display-hero mt-5 text-[color:var(--color-text)]">
        {HEADLINE_LINES.map((line) => (
          <span key={line} className="block overflow-hidden pb-[0.06em]">
            <span data-hero="line" className="hero-reveal block">
              {line}
            </span>
          </span>
        ))}
      </h1>

      <p data-hero="lede" className="lede hero-reveal mt-6 max-w-xl">
        An advanced Luau obfuscation toolkit that transforms readable source into
        a more complex representation, preserving intended behaviour — and
        validates the result before it ever leaves your machine.
      </p>

      <div data-hero="cta" className="mt-9 flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          onClick={onExplore}
          whileHover={{ y: -2 }}
          whileTap={{ y: 1, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="primary-action inline-flex items-center gap-2 px-5 py-3 text-sm"
        >
          Explore Choco OBF
          <ArrowRight className="h-4 w-4" />
        </motion.button>

        <motion.button
          type="button"
          onClick={onDocs}
          whileHover={{ y: -2 }}
          whileTap={{ y: 1, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="secondary-action group inline-flex items-center gap-2 px-5 py-3 text-sm"
        >
          <BookOpen className="h-4 w-4" />
          View Documentation
          <span className="ml-1 h-px w-0 bg-[var(--color-caramel-bright)] transition-all duration-300 group-hover:w-4" />
        </motion.button>

        {githubHref && (
          <a
            href={githubHref}
            target="_blank"
            rel="noreferrer"
            className="secondary-action inline-flex items-center gap-2 px-4 py-3 text-sm"
          >
            <GitBranch className="h-4 w-4" />
            Source
          </a>
        )}
      </div>

      <div
        data-hero="meta"
        className="hero-reveal mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]"
      >
        <span>Scope-aware renaming</span>
        <span className="hidden h-1 w-1 rounded-full bg-[var(--color-border-strong)] sm:block" />
        <span>Reversible string encoding</span>
        <span className="hidden h-1 w-1 rounded-full bg-[var(--color-border-strong)] sm:block" />
        <span>Output validation</span>
      </div>
    </div>
  );
}
