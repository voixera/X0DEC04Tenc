"use client";

/**
 * LabTopbar — the workspace top strip.
 *
 * A ruled editorial header instead of the previous glass bar: a mono channel
 * label, the page title in display type, and instrument-style controls on the
 * right (processing state, theme, account, version). All behaviour is unchanged.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore, useEncryptStore } from "@/lib/store";
import { LogOut, Menu, Loader2, Moon, Sun, Sparkles } from "@/components/icons";

const pageLabels: Record<string, { title: string; channel: string }> = {
  dashboard: { title: "Overview", channel: "CH-01" },
  encrypt: { title: "Obfuscate", channel: "CH-02" },
  history: { title: "Runs", channel: "CH-03" },
  settings: { title: "Settings", channel: "CH-05" },
  account: { title: "Profile", channel: "CH-04" },
  documentation: { title: "Documentation", channel: "CH-06" },
  about: { title: "About", channel: "CH-07" },
};

type Theme = "cocoa" | "milk" | "praline";

const themeMeta: Record<Theme, { label: string; Icon: typeof Moon; next: Theme }> = {
  cocoa: { label: "Cocoa", Icon: Moon, next: "milk" },
  milk: { label: "Milk", Icon: Sun, next: "praline" },
  praline: { label: "Praline", Icon: Sparkles, next: "cocoa" },
};

export default function LabTopbar() {
  const { currentPage, toggleSidebar } = useAppStore();
  const isProcessing = useEncryptStore((s) => s.isProcessing);
  const [theme, setTheme] = useState<Theme>("cocoa");
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("x0d-theme");
    const id = window.setTimeout(() => {
      if (saved === "milk" || saved === "praline") setTheme(saved);
    }, 0);
    let active = true;
    fetch("/api/auth/discord/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user);
      })
      .catch(() => {});
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, []);

  const changeTheme = (value: Theme) => {
    setTheme(value);
    localStorage.setItem("x0d-theme", value);
  };

  const meta = themeMeta[theme];
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    location.reload();
  };

  const page = pageLabels[currentPage] ?? pageLabels.dashboard;

  return (
    <header className="topbar-glass sticky top-0 z-30 flex h-[74px] items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 backdrop-blur-xl lg:px-7">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Open navigation"
          className="p-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="index-num">{page.channel}</span>
          <span className="h-3 w-px bg-[var(--color-border-strong)]" />
        </div>
        <div className="min-w-0">
          <p className="type-label">Choco OBF / Workspace</p>
          <h1 className="truncate font-display text-[19px] leading-tight text-[var(--color-text)]">
            {page.title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-dim)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="type-label hidden sm:inline">PROCESSING</span>
          </div>
        )}

        <button
          aria-label={`Switch theme from ${meta.label}`}
          title={`Theme · ${meta.label}`}
          onClick={() => changeTheme(meta.next)}
          className="theme-switch"
        >
          <meta.Icon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{meta.label}</span>
          <span className="theme-switch__dot" />
        </button>

        {user && (
          <button
            onClick={logout}
            title="Sign out"
            className="secondary-action hidden items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:flex"
          >
            <span className="max-w-24 truncate">{user.username}</span>
            <LogOut className="h-3 w-3" />
          </button>
        )}

        <div className="hidden items-center gap-2 sm:flex">
          <span className="font-mono text-[11px] text-[var(--color-muted)]">v2.0.0</span>
          <motion.span
            className={`h-1.5 w-1.5 rounded-full ${
              isProcessing ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"
            }`}
            animate={isProcessing ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
            transition={isProcessing ? { duration: 1.1, repeat: Infinity } : undefined}
          />
        </div>
      </div>
    </header>
  );
}
