"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type User = { id: string; username: string; avatar: string | null };

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => { fetch("/api/auth/discord/me").then((r) => r.json()).then((data) => setUser(data.user)).catch(() => setUser(null)); }, []);
  if (user === undefined) return <div className="min-h-screen grid place-items-center text-sm text-[var(--color-muted)]">Loading secure workspace…</div>;
  if (!user) return <main className="min-h-screen grid place-items-center p-6"><section className="premium-login w-full max-w-md rounded-2xl p-8 text-center"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 font-mono text-xl text-emerald-400">X0</div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">X0DEC04T / SECURE ACCESS</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Your secure workspace</h1><p className="mt-3 text-sm text-[var(--color-muted)]">Sign in with Discord to encrypt, manage, and keep your workspace private.</p><a href="/api/auth/discord" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[.99]"><span className="font-mono text-sm">→</span> Continue with Discord</a><p className="mt-4 font-mono text-[10px] text-[var(--color-muted)]">OAuth2 · encrypted session · 7 day access</p></section></main>;
  return <>{children}</>;
}
