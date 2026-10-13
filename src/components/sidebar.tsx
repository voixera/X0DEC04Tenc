"use client";

/**
 * LabRail — the workspace navigation.
 *
 * Replaces the previous glass sidebar with a narrower, numbered laboratory rail:
 * a vertical index of sections labelled like instrument channels, with the
 * Choco OBF mark as a fixed anchor. All navigation behaviour is unchanged.
 */

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
  UserRound,
} from "@/components/icons";
import type { PageId } from "@/lib/types";

const navGroups: {
  label: string;
  items: { id: PageId; label: string; icon: typeof LayoutDashboard; index: string }[];
}[] = [
  {
    label: "Lab",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard, index: "01" },
      { id: "encrypt", label: "Obfuscate", icon: Shield, index: "02" },
      { id: "history", label: "Runs", icon: History, index: "03" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "account", label: "Profile", icon: UserRound, index: "04" },
      { id: "settings", label: "Settings", icon: Settings, index: "05" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "documentation", label: "Docs", icon: BookOpen, index: "06" },
      { id: "about", label: "About", icon: Info, index: "07" },
    ],
  },
];

export default function LabRail() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } =
    useAppStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className="rail fixed left-0 top-0 z-50 flex h-full w-[236px] flex-col border-r border-[var(--color-border)] transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] -translate-x-full lg:translate-x-0"
        data-open={sidebarOpen}
        aria-label="Workspace navigation"
      >
        {/* Brand lockup */}
        <div className="flex h-[74px] items-center gap-3 border-b border-[var(--color-border)] px-5">
          <div className="brand-mark brand-mark--logo grid h-10 w-10 place-items-center rounded-[10px]" />
          <div className="flex min-w-0 flex-col leading-none">
            <span className="choco-wordmark font-display text-[17px]">Choco OBF</span>
            <span className="type-label mt-1.5">
              COCOA LAB
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

        {/* Indexed nav */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="type-label px-2.5 pb-2.5">{group.label}</p>
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
                      className="rail-item w-full text-left"
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="index-num w-5 shrink-0">{item.index}</span>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status footer */}
        <div className="border-t border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="type-label">ENGINE ONLINE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
