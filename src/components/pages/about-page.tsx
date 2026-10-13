"use client";

import { Shield, Zap, Lock } from "@/components/icons";

export default function AboutPage() {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-[10px] bg-[#111111] border border-[var(--color-border)] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#e5e5e5]" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-[#e5e5e5] tracking-tight">
              Choco OBF
            </h2>
            <span className="text-[11px] text-[#525252] font-mono">v2.0.0</span>
          </div>
        </div>
        <p className="text-[13px] text-[#737373] leading-relaxed mt-4">
          Choco OBF is a Luau source code obfuscation platform for Roblox
          developers. It transforms readable scripts into harder-to-read
          equivalents while preserving the original runtime behaviour.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4 animate-fade-in" style={{ animationDelay: "60ms" }}>
          <Shield className="w-5 h-5 text-[#525252] mb-3" />
          <h3 className="text-[13px] font-medium text-[#e5e5e5] mb-1">
            Multi-Layer Obfuscation
          </h3>
          <p className="text-[11px] text-[#525252] leading-relaxed">
            Scope-aware identifier renaming, reversible string encoding,
            constant encoding, and comment stripping are combined for defense
            in depth. This is obfuscation, not encryption.
          </p>
        </div>

        <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4 animate-fade-in" style={{ animationDelay: "120ms" }}>
          <Zap className="w-5 h-5 text-[#525252] mb-3" />
          <h3 className="text-[13px] font-medium text-[#e5e5e5] mb-1">
            High Performance
          </h3>
          <p className="text-[11px] text-[#525252] leading-relaxed">
            Processes hundreds of files with minimal latency. Queue-based batch
            processing ensures stable operation under heavy workloads.
          </p>
        </div>

        <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4 animate-fade-in" style={{ animationDelay: "180ms" }}>
          <Lock className="w-5 h-5 text-[#525252] mb-3" />
          <h3 className="text-[13px] font-medium text-[#e5e5e5] mb-1">
            Privacy First
          </h3>
          <p className="text-[11px] text-[#525252] leading-relaxed">
            Files are processed in memory and never persisted to disk. Only metadata
            is stored for history tracking. Your source code stays private.
          </p>
        </div>
      </div>

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-[13px] font-medium text-[#e5e5e5]">
            Technical Specifications
          </span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {[
            { label: "Target Language", value: "Roblox Luau" },
            { label: "String Protection", value: "Reversible per-string byte encoding" },
            { label: "Identifier Obfuscation", value: "Scope-aware, configurable length" },
            { label: "Constant Encoding", value: "Arithmetic expression substitution" },
            { label: "Comment Removal", value: "Single-line and long comments" },
            { label: "Global Protection", value: "Not supported (documented)" },
            { label: "Output Validation", value: "Re-lexed before success is reported" },
            { label: "Supported Syntax", value: "Luau common subset" },
            { label: "Max File Size", value: "10 MB per file" },
            { label: "Batch Processing", value: "500+ files per session" },
          ].map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[#141414] transition-colors duration-120"
            >
              <span className="text-[12px] text-[#737373]">{row.label}</span>
              <span className="text-[12px] text-[#a3a3a3] font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4">
        <h3 className="text-[13px] font-medium text-[#e5e5e5] mb-2">
          Architecture
        </h3>
        <p className="text-[12px] text-[#525252] leading-relaxed">
          Choco OBF is built on Next.js with server-side transformation. The
          frontend uses React with Zustand for state management. The
          obfuscation engine tokenises Luau source and runs a series of
          token-level passes (comment removal, scope-aware renaming, string
          encoding, constant encoding, emission), then re-validates the output
          before reporting success. PostgreSQL stores processing history and
          statistics via Drizzle ORM.
        </p>
      </div>

      <div className="text-center py-4">
        <p className="text-[11px] text-[#2a2a2a]">
          Choco OBF · Built for Roblox Luau developers
        </p>
      </div>
    </div>
  );
}
