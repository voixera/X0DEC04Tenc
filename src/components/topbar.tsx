"use client";

import { useAppStore, useEncryptStore } from "@/lib/store";
import { Menu, Loader2 } from "@/components/icons";
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

  return (
    <header className="h-14 bg-[#0d0d0d]/80 backdrop-blur-sm border-b border-[var(--color-border)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120 p-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[14px] font-semibold text-[#e5e5e5] tracking-tight">
          {pageLabels[currentPage] || "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-[12px] text-[#a3a3a3]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing</span>
          </div>
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
