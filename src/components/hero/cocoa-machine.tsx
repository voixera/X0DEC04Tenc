"use client";

/**
 * CocoaMachine — the Cocoa Lab opening installation.
 *
 * COMPOSITION (deliberately NOT a centered hero)
 * - A full-viewport stage with a measured "lab grid" substrate.
 * - Editorial type laid asymmetrically: the statement splits across the canvas,
 *   with "CODE," high-left and "REFINED." low-right, so the eye travels.
 * - The WebGL fracture sits off-centre, threaded *between* the type layers.
 * - Technical annotations are pinned to real grid coordinates (not a container).
 * - A left-edge vertical axis label runs the height of the stage.
 *
 * MOTION
 * - GSAP choreographs a single staged entrance: grid draws in, type lines rise
 *   from clipped masks, annotations fade to place, the installation scales up.
 * - Reduced-motion renders the resolved state immediately.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import CocoaScene from "@/components/hero/cocoa-scene";
import { ArrowDown, Shield, GitBranch } from "@/components/icons";

export default function CocoaMachine({
  onEnter,
  onEngine,
  githubHref,
}: {
  onEnter: () => void;
  onEngine: () => void;
  githubHref: string;
}) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    import("gsap").then(({ gsap }) => {
      if (cancelled || !root.current) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(el);
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(q("[data-grid]"), { opacity: 0, duration: 1.1 }, 0)
          .from(
            q("[data-stage-line]"),
            { scaleX: 0, transformOrigin: "left center", duration: 1.0, stagger: 0.08 },
            0.15
          )
          .from(
            q("[data-type-mask] > span"),
            { yPercent: 112, duration: 1.05, stagger: 0.14 },
            0.3
          )
          .from(q("[data-axis]"), { opacity: 0, duration: 0.8 }, 0.7)
          .from(q("[data-annot]"), { opacity: 0, y: 12, duration: 0.7, stagger: 0.07 }, 0.9)
          .from(
            q("[data-install]"),
            { opacity: 0, scale: 0.82, duration: 1.2, ease: "power2.out" },
            0.35
          )
          .from(q("[data-cta] > *"), { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 }, 1.1)
          .from(q("[data-lede]"), { opacity: 0, y: 14, duration: 0.7 }, 1.0);
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      id="top"
      className="cocoa-ground grain relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label="Choco OBF — Luau obfuscation laboratory"
    >
      {/* Lab grid substrate */}
      <div data-grid className="lab-grid" aria-hidden="true" />

      {/* Left-edge vertical axis label */}
      <div
        data-axis
        className="pointer-events-none absolute left-2 top-1/2 hidden -translate-y-1/2 xl:block"
        aria-hidden="true"
      >
        <span
          className="type-label block"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          CHOCO&nbsp;LAB — SYSTEM&nbsp;01 — LUAU&nbsp;TRANSFORMATION
        </span>
      </div>

      {/* ---------------- Editorial type layer ---------------- */}
      {/* CODE, — upper, far left, bleeds toward the edge */}
      <h1 className="relative z-20 mt-[13vh] px-5 sm:px-8 lg:px-14">
        <span className="sr-only">Code, refined. A darker layer of Luau.</span>
        <span
          aria-hidden="true"
          className="type-machine block text-[var(--color-text)]"
        >
          <span className="overflow-hidden inline-block align-top">
            <span data-type-mask className="hero-reveal inline-block">
              <span className="block">CODE,</span>
            </span>
          </span>
        </span>
      </h1>

      {/* Central installation — off-centre, right-biased, overlapping the type */}
      <div
        data-install
        className="pointer-events-none absolute right-[-6%] top-[8%] z-10 h-[74%] w-[86%] sm:right-[-2%] sm:w-[70%] lg:right-[3%] lg:top-[6%] lg:h-[82%] lg:w-[54%]"
      >
        <CocoaScene className="relative h-full w-full" />
      </div>

      {/* Annotation cluster pinned across the stage */}
      <div className="pointer-events-none absolute inset-0 z-30 hidden lg:block" aria-hidden="true">
        <span data-annot className="type-label absolute left-14 top-[24%]">
          [ 01 ]&nbsp; SOURCE → OUTPUT
        </span>
        <span data-annot className="type-label type-label--hot absolute left-14 top-[28%]">
          ENGINE STATUS — OPERATIONAL
        </span>
        <span data-annot className="type-label absolute right-14 top-[14%] text-right">
          ROBLOX LUAU
        </span>
        <span data-annot className="type-label absolute right-14 top-[18%] text-right">
          REVERSIBLE STRING ENCODING
        </span>
      </div>

      {/* REFINED. — lower right, oversized, riding under the installation */}
      <div className="relative z-20 mt-auto px-5 pb-[8vh] sm:px-8 lg:px-14">
        <span aria-hidden="true" className="type-machine block text-right text-[var(--color-text)]">
          <span className="overflow-hidden inline-block align-top">
            <span data-type-mask className="hero-reveal inline-block">
              <span className="block">REFINED.</span>
            </span>
          </span>
        </span>

        {/* Lede + actions, arranged as a lab readout, not a centered stack */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <p data-lede className="type-lede hero-reveal max-w-md">
            A darker layer of Luau. An experimental obfuscation laboratory that
            reshapes readable source into a more complex equivalent — then
            re-lexes and validates the output before reporting success.
          </p>

          <div data-cta className="flex flex-wrap items-start gap-3 lg:justify-end">
            <motion.button
              type="button"
              onClick={onEnter}
              whileHover={{ y: -2 }}
              whileTap={{ y: 1, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="btn btn--solid"
            >
              <Shield className="h-4 w-4" />
              Enter the laboratory
            </motion.button>
            <motion.a
              href={githubHref}
              target="_blank"
              rel="noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ y: 1, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="btn btn--ghost"
            >
              <GitBranch className="h-4 w-4" />
              Repository
            </motion.a>
            <button type="button" onClick={onEngine} className="btn btn--quiet">
              <ArrowDown className="h-4 w-4" />
              How it works
            </button>
          </div>
        </div>
      </div>

      {/* Bottom rule + scroll cue */}
      <div className="relative z-20 flex items-center gap-4 px-5 pb-6 sm:px-8 lg:px-14">
        <span data-stage-line className="rule-hot block h-px flex-1" />
        <span className="type-label whitespace-nowrap">SCROLL · COMPOSITION 01</span>
      </div>
    </section>
  );
}
