"use client";

/**
 * AuthGate — the Choco OBF entry experience.
 *
 * COMPOSITION (rebuilt from the ground up)
 * - Unauthenticated visitors land on the Cocoa Machine hero (full-viewport,
 *   asymmetric editorial installation + WebGL fracture).
 * - Lab access (the real auth form) is presented as "Scene 05 — Access", a
 *   split editorial panel, not a centered card under the hero.
 * - Existing authentication logic is unchanged; only the presentation changed.
 */

import { useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "@/components/icons";
import CocoaMachine from "@/components/hero/cocoa-machine";
import CocoaScenes from "@/components/hero/cocoa-scenes";

type Mode = "login" | "signup" | "forgot" | "verify" | "reset";

const GITHUB_HREF = "https://github.com/voixera/X0DEC04Tenc";

function PasswordField() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        name="password"
        type={visible ? "text" : "password"}
        required
        placeholder="Password"
        className="field pr-12"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="password-toggle absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function AccessPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const action = mode === "forgot" ? "send-reset" : mode;
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, email: data.email || email, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Request failed");
        return;
      }
      setEmail(String(data.email || email));
      setMessage(result.message || "Done");
      if (result.next) setMode(result.next);
      if (mode === "login") location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "signup"
      ? "Create workspace"
      : mode === "forgot"
        ? "Reset password"
        : mode === "verify"
          ? "Verify email"
          : mode === "reset"
            ? "New password"
            : "Sign in";

  return (
    <motion.div
      initial={{ opacity: 1, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="surface surface--flat corner-ticks p-6 sm:p-8"
      aria-label="Sign in to Choco OBF"
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="type-label type-label--hot">Access terminal</span>
        <span className="type-label">{mode.toUpperCase()}</span>
      </div>

      <h3 className="type-title text-[var(--color-text)]">{title}</h3>
      <p className="type-body mt-2">
        Sign in to keep obfuscation history and totals scoped to your account.
        Source is processed in memory and never persisted.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-error)]/12 p-3 text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg bg-[var(--color-success)]/12 p-3 text-xs text-[var(--color-success)]">
          {message}
        </p>
      )}

      {mode === "login" && (
        <>
          <a
            href="/api/auth/discord"
            className="discord-action mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-sm"
          >
            <span className="discord-mark block h-4 w-4 rounded bg-[url('/discord.svg')] bg-center bg-no-repeat" />
            Connect with Discord
          </a>
          <div className="auth-divider my-4 flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.14em]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            or continue with email
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "signup" && (
          <input name="name" required placeholder="Full name" className="field" />
        )}
        {mode !== "verify" && (
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
          />
        )}
        {(mode === "login" || mode === "signup" || mode === "reset") && <PasswordField />}
        {(mode === "verify" || mode === "reset") && (
          <input
            name="code"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="6-digit code"
            className="field text-center font-mono tracking-[0.4em]"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn--solid w-full disabled:opacity-60"
        >
          {loading
            ? "Working…"
            : mode === "forgot"
              ? "Send reset code"
              : mode === "verify"
                ? "Verify email"
                : mode === "reset"
                  ? "Reset password"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
        {mode === "login" ? (
          <>
            <button type="button" onClick={() => setMode("signup")} className="hover:text-[var(--color-text)]">
              Create an account
            </button>
            <button type="button" onClick={() => setMode("forgot")} className="hover:text-[var(--color-text)]">
              Forgot password?
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setMode("login")} className="hover:text-[var(--color-text)]">
            Back to sign in
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AccessScene() {
  return (
    <section
      id="access"
      className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-bg-deep)] px-5 py-24 sm:px-8 lg:px-14"
    >
      <div className="lab-grid" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
        <div>
          <span className="type-label type-label--hot">Scene 05 — Access</span>
          <h2 className="type-section mt-4 text-[var(--color-text)]">
            Open the workspace.
          </h2>
          <p className="type-lede mt-6 max-w-lg">
            The laboratory is private. Sign in to obfuscate Luau, review every
            transformation in a live log, and keep a scoped build history.
          </p>

          <div className="mt-10 grid max-w-lg gap-5 border-t border-[var(--color-border)] pt-8 sm:grid-cols-2">
            {[
              ["In-memory processing", "Source never leaves the request."],
              ["Scoped history", "Totals and logs tied to your account."],
              ["Validated output", "Original returned if validation fails."],
              ["Discord or email", "Two sign-in paths, one workspace."],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="type-label">{t}</p>
                <p className="type-body mt-1.5">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:pt-2">
          <AccessPanel />
        </div>
      </div>
    </section>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<unknown | undefined>(undefined);
  const engineSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetch("/api/auth/email/me"), fetch("/api/auth/discord/me")])
      .then(async ([emailResponse, discordResponse]) => {
        const [emailData, discordData] = await Promise.all([
          emailResponse.json(),
          discordResponse.json(),
        ]);
        setUser(emailData.user || discordData.user);
      })
      .catch(() => setUser(null));
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (user === undefined) {
    return (
      <div className="cocoa-ground grid min-h-[100svh] place-items-center">
        <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-bright)]" />
          <span className="type-label">Opening laboratory…</span>
        </div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <main className="min-h-[100svh] bg-[var(--color-bg)]">
      <CocoaMachine
        onEnter={() => scrollTo(engineSection)}
        onEngine={() => scrollTo(engineSection)}
        githubHref={GITHUB_HREF}
      />
      <CocoaScenes ref={engineSection} githubHref={GITHUB_HREF} />
      <AccessScene />
    </main>
  );
}
