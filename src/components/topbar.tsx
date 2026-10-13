"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore, useEncryptStore } from "@/lib/store";
import { LogOut, Menu, Loader2, Moon, Sun, Sparkles } from "@/components/icons";

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  encrypt: "Obfuscate",
  history: "History",
  settings: "Settings",
  account: "Profile",
  documentation: "Documentation",
  about: "About",
};

type Theme = "cocoa" | "milk" | "praline";

const themeMeta: Record<Theme, { label: string; Icon: typeof Moon; next: Theme }> = {
  cocoa: { label: "Cocoa", Icon: Moon, next: "milk" },
  milk: { label: "Milk", Icon: Sun, next: "praline" },
  praline: { label: "Praline", Icon: Sparkles, next: "cocoa" },
};

export default function Topbar() {
  const { currentPage, toggleSidebar } = useAppStore();
  const isProcessing = useEncryptStore((s) => s.isProcessing);
  const [theme, setTheme] = useState<Theme>("cocoa");
  const [user, setUser] = useState<{ username: string } | null>(null);

  // Sync theme to the DOM (external system) and load the session user.
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  // Adopt the stored theme after mount (avoids SSR hydration mismatch).
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

  return (
    <header className="topbar-glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 backdrop-blur-xl lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Open navigation"
          className="p-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Choco OBF
          </p>
          <h1 className="truncate font-display text-[17px] leading-tight text-[color:var(--color-text)]">
            {pageLabels[currentPage] || "Dashboard"}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-accent-dim)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Processing</span>
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

        <div className="flex items-center gap-2">
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
