"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard,
  Shield,
  History,
  Settings,
  BookOpen,
  Info,
  X,
  Lock,
  UserRound,
} from "@/components/icons";
import type { PageId } from "@/lib/types";

const navGroups: {
  label: string;
  items: { id: PageId; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "encrypt", label: "Obfuscate", icon: Shield },
      { id: "history", label: "History", icon: History },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "account", label: "Profile", icon: UserRound },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "documentation", label: "Documentation", icon: BookOpen },
      { id: "about", label: "About", icon: Info },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } =
    useAppStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className="sidebar-glass fixed left-0 top-0 z-50 flex h-full w-[232px] flex-col border-r border-[var(--color-border)] transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] -translate-x-full lg:translate-x-0"
        data-open={sidebarOpen}
      >
        <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-5">
          <div className="brand-mark grid h-9 w-9 place-items-center rounded-[10px]">
            <Lock className="h-4 w-4 text-[#c98a54]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="choco-wordmark font-display text-[17px]">Choco OBF</span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Luau obfuscator
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="ml-auto text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        setSidebarOpen(false);
                      }}
                      data-active={active}
                      className="nav-item w-full text-left"
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] px-4 py-4">
          <div className="flex items-center gap-2">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[11px] text-[var(--color-muted)]">Engine online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
