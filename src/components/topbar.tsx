"use client";

import { useEffect, useState } from "react";
import { useAppStore, useEncryptStore } from "@/lib/store";
import { LogOut, Menu, Loader2, Moon, Sun, Sparkles } from "@/components/icons";
import { cn } from "@/lib/utils";

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  encrypt: "Encrypt",
  history: "History",
  settings: "Settings",
  documentation: "Documentation",
  about: "About",
};

export default function Topbar() {
  const { currentPage, toggleSidebar } = useAppStore();
  const isProcessing = useEncryptStore((s) => s.isProcessing);
  const [theme, setTheme] = useState(() => typeof window === "undefined" ? "midnight" : localStorage.getItem("x0d-theme") || "midnight");
  const [user, setUser] = useState<{ username: string } | null>(null);
  useEffect(() => { document.body.dataset.theme = theme; fetch("/api/auth/discord/me").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {}); }, [theme]);
  const changeTheme = (value: string) => { setTheme(value); localStorage.setItem("x0d-theme", value); document.body.dataset.theme = value; };
  const themeMeta = theme === "pearl" ? { label: "Pearl", Icon: Sun, next: "aurora" } : theme === "aurora" ? { label: "Aurora", Icon: Sparkles, next: "midnight" } : { label: "Midnight", Icon: Moon, next: "pearl" };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); };

  return (
    <header className="h-14 topbar-glass backdrop-blur-xl border-b border-[var(--color-border)] flex items-center justify-between gap-3 px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120 p-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[14px] font-semibold text-[#e5e5e5] tracking-tight truncate">
          {pageLabels[currentPage] || "Dashboard"}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-[12px] text-[#a3a3a3]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Processing</span>
          </div>
        )}
        <button aria-label={`Switch theme from ${themeMeta.label}`} title={`Switch theme · ${themeMeta.label}`} onClick={() => changeTheme(themeMeta.next)} className="theme-switch"><themeMeta.Icon className="h-3.5 w-3.5" /><span className="hidden md:inline">{themeMeta.label}</span><span className="theme-switch__dot" /></button>
        {user && (
          <button
            onClick={logout}
            title="Sign out"
            className="secondary-action hidden items-center gap-1.5 px-2 py-1 text-[11px] sm:flex"
          >
            <span className="max-w-24 truncate">{user.username}</span>
            <LogOut className="h-3 w-3" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#525252] font-mono">v1.0.0</span>
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isProcessing ? "bg-amber-400 animate-pulse" : "bg-green-500"
            )}
          />
        </div>
      </div>
    </header>
  );
}
