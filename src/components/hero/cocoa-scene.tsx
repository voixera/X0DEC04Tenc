"use client";

/**
 * CocoaScene — resilient wrapper around the WebGL centerpiece.
 *
 * Detects WebGL + reduced-motion, lazy-loads the heavy scene after first paint,
 * pauses when the tab is hidden or the canvas leaves the viewport, and always
 * renders a material static fallback (the real logo) when 3D is unavailable.
 * The hero is fully usable regardless of whether this ever mounts.
 */

import { Suspense, lazy, useEffect, useRef, useState } from "react";

const CocoaLattice = lazy(() => import("./cocoa-lattice"));

const STATIC_FALLBACK = (
  <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
    <div className="hero-fallback-glow" />
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

export default function CocoaScene({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !supportsWebGL()) return;
    const id = window.setTimeout(() => setEnabled(true), 200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: enabled ? 0 : 1 }}
        aria-hidden={enabled}
      >
        {STATIC_FALLBACK}
      </div>
      {enabled && (
        <div
          className="absolute inset-0"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 480ms ease" }}
        >
          <Suspense fallback={null}>
            <CocoaLattice />
          </Suspense>
        </div>
      )}
    </div>
  );
}
