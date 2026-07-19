"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type User = { id: string; username: string; avatar: string | null };

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => { fetch("/api/auth/discord/me").then((r) => r.json()).then((data) => setUser(data.user)).catch(() => setUser(null)); }, []);
  if (user === undefined) return <div className="min-h-screen grid place-items-center text-sm text-[var(--color-muted)]">Loading secure workspace…</div>;
  if (!user) return <main className="min-h-screen grid place-items-center p-6"><section className="premium-login w-full max-w-md rounded-3xl p-8 text-center"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-violet-500 text-2xl">✦</div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">X0DEC04T Pro</p><h1 className="mt-3 text-3xl font-bold">Your secure workspace</h1><p className="mt-3 text-sm text-[var(--color-muted)]">Sign in with Discord to encrypt, manage, and keep your workspace private.</p><a href="/api/auth/discord" className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4752c4]"><span className="text-lg">◉</span> Continue with Discord</a><p className="mt-4 text-xs text-[var(--color-muted)]">Discord OAuth must be configured by the administrator.</p></section></main>;
  return <>{children}</>;
}
