"use client";

/**
 * ChocolateVisual — resilient wrapper around the WebGL centerpiece.
 *
 * Responsibilities:
 *  - Detect WebGL support and `prefers-reduced-motion`.
 *  - Lazy-load the heavy R3F scene only when appropriate.
 *  - Pause rendering when the document is hidden or the element is off-screen.
 *  - Always render a graceful static fallback (the logo) when WebGL is
 *    unavailable, reduced motion is requested, or the scene is loading.
 *
 * The hero remains fully usable regardless of whether this ever mounts.
 */

import { Suspense, lazy, useEffect, useRef, useState } from "react";

const ChocolateCenterpiece = lazy(() => import("./chocolate-centerpiece"));

const STATIC_FALLBACK = (
  <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
    <div className="hero-fallback-glow" />
    {/* The real brand asset stands in for the 3D form. */}
    <div className="hero-fallback-mark" role="img" aria-label="Choco OBF logo" />
  </div>
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function ChocolateVisual({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  // Decide whether to run WebGL at all (once, client-side).
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !supportsWebGL()) return;
    // Defer the heavy import until after first paint so the hero is instant.
    const id = window.setTimeout(() => setEnabled(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  // Pause when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Pause when scrolled out of view.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && !document.hidden),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {/* Static fallback fades out once the WebGL scene is live. */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: enabled ? 0 : 1 }}
        aria-hidden={enabled}
      >
        {STATIC_FALLBACK}
      </div>
      {enabled && (
        <div className="absolute inset-0" style={{ opacity: visible ? 1 : 0, transition: "opacity 480ms ease" }}>
          <Suspense fallback={null}>
            <ChocolateCenterpiece />
          </Suspense>
        </div>
      )}
    </div>
  );
}
