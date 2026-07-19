"use client";

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
} from "@/components/icons";
import { cn } from "@/lib/utils";
import type { PageId } from "@/lib/types";

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "encrypt", label: "Encrypt", icon: Shield },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "documentation", label: "Documentation", icon: BookOpen },
  { id: "about", label: "About", icon: Info },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } =
    useAppStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[220px] sidebar-glass border-r border-[var(--color-border)] z-50 flex flex-col transition-transform duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[var(--color-border)] shrink-0">
          <div className="w-7 h-7 rounded-lg brand-mark flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-[var(--color-text)] tracking-tight leading-tight">
              X0DEC04T
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-medium uppercase tracking-wider leading-tight">
              Encrypt
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-120 w-full text-left",
                  active
                    ? "nav-active text-[var(--color-text)] border border-[var(--color-border)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-[var(--color-muted)]">System online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
