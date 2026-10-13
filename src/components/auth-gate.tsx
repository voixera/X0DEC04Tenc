"use client";

/**
 * AuthGate — the Choco OBF entry experience.
 *
 * Unauthenticated visitors see a cinematic, asymmetrical hero (editorial copy +
 * WebGL chocolate centerpiece) with the real login/signup form embedded as part
 * of the composition. Authenticated visitors see the application.
 *
 * All authentication logic is unchanged from the original implementation; only
 * the presentation has been redesigned.
 */

import { useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "@/components/icons";
import HeroCopy from "@/components/hero/hero-copy";
import ChocolateVisual from "@/components/hero/chocolate-visual";
import LandingSections from "@/components/hero/landing-sections";

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
        className="auth-input pr-12"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="password-toggle absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function LoginPanel({ onScrollToApp }: { onScrollToApp: () => void }) {
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
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="premium-login relative w-full max-w-md rounded-[var(--radius-xl)] p-7 sm:p-8"
      aria-label="Sign in to Choco OBF"
    >
      <div className="mb-7 flex items-center gap-3">
        <div className="brand-mark grid h-11 w-11 place-items-center rounded-xl font-mono text-sm text-[#c98a54]">
          Ch
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand)]">
            Choco OBF
          </p>
          <p className="text-xs text-[var(--color-muted)]">Luau build access</p>
        </div>
      </div>

      <h2 className="display-xl text-[1.7rem] text-[var(--color-text)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Sign in to keep your obfuscation history and totals scoped to your account.
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
            className="discord-action mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-base)] border border-[rgba(88,101,242,.45)] bg-[rgba(88,101,242,.12)] px-4 py-3 text-sm text-[#c7ceff] transition-colors hover:bg-[rgba(88,101,242,.22)]"
          >
            <span className="discord-mark block h-4 w-4 rounded bg-[url('/discord.svg')] bg-center bg-no-repeat" />
            Connect with Discord
          </a>
          <div className="auth-divider my-4 flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            or continue with email
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "signup" && (
          <input name="name" required placeholder="Full name" className="auth-input" />
        )}
        {mode !== "verify" && (
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="auth-input"
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
            className="auth-input text-center font-mono tracking-[0.4em]"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="primary-action w-full px-4 py-3 text-sm disabled:opacity-60"
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
        <button type="button" onClick={onScrollToApp} className="hover:text-[var(--color-text)]">
          Learn more ↓
        </button>
      </div>
    </motion.section>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<unknown | undefined>(undefined);
  const heroRef = useRef<HTMLElement>(null);
  const appSection = useRef<HTMLDivElement>(null);
  const docsSection = useRef<HTMLDivElement>(null);

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
      <div className="premium-shell grid min-h-screen place-items-center text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-caramel-bright)]" />
          Opening Choco OBF…
        </div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div className="premium-shell min-h-screen">
      {/* ---------- HERO ---------- */}
      <section
        ref={heroRef}
        className="cocoa-grain relative overflow-hidden px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14"
      >
        <div className="mx-auto grid max-w-[1360px] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6">
          <HeroCopy
            onExplore={() => scrollTo(appSection)}
            onDocs={() => scrollTo(docsSection)}
            githubHref={GITHUB_HREF}
          />
          <div className="relative order-first lg:order-last">
            {/* WebGL centerpiece with graceful fallback */}
            <ChocolateVisual className="relative mx-auto aspect-square w-full max-w-[520px]" />
            {/* Floating code fragments for depth */}
            <div className="pointer-events-none absolute -left-2 top-6 hidden lg:block">
              <div className="code-surface animate-slide-in-up px-3 py-2 text-[11px] leading-relaxed shadow-2xl">
                <span className="code-token-keyword">local </span>
                <span className="code-token-ident">source</span>
                <span className="code-token-plain"> = </span>
                <span className="code-token-fn">read</span>
                <span className="code-token-plain">()</span>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-1 bottom-10 hidden lg:block">
              <div className="code-surface animate-slide-in-up px-3 py-2 text-[11px] leading-relaxed shadow-2xl [animation-delay:120ms]">
                <span className="code-token-keyword">return </span>
                <span className="code-token-string">&quot;complex&quot;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- LOGIN ---------- */}
      <section
        ref={appSection}
        className="relative px-5 pb-20 sm:px-8 lg:px-12"
        aria-label="Get started"
      >
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto grid max-w-[1360px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div className="max-w-xl pt-2">
              <p className="eyebrow">Get started</p>
              <h2 className="display-xl mt-3 text-[color:var(--color-text)]">
                Open the workspace.
              </h2>
              <p className="lede mt-4">
                Sign in to obfuscate Luau, review every transformation in a live
                log, and keep a scoped history of your builds. Your source is
                processed in memory and never persisted.
              </p>
            </div>
            <LoginPanel onScrollToApp={() => scrollTo(docsSection)} />
          </div>
        </div>
      </section>

      {/* ---------- FEATURES / DOCS / FOOTER ---------- */}
      <LandingSections ref={docsSection} githubHref={GITHUB_HREF} />
    </div>
  );
}
