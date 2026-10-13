"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Clock,
  ChevronRight,
  AlertCircle,
  ArrowRight,
} from "@/components/icons";
import { formatMs, formatDate } from "@/lib/utils";
import { getClientUserId } from "@/lib/user";
import {
  addStats,
  getLocalStats,
  mergeHistoryItems,
  queryLocalHistory,
} from "@/lib/local-history";
import type { StatsData, HistoryItem } from "@/lib/types";
import { useAppStore } from "@/lib/store";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 px-1">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 font-display text-[1.9rem] leading-none text-[color:var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="min-w-0 flex-1 px-1">
      <div className="skeleton h-3 w-16" />
      <div className="skeleton mt-3 h-7 w-20" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getClientUserId();
      const userParam = `userId=${encodeURIComponent(userId)}`;
      const localStats = getLocalStats(userId);
      const localRecent = queryLocalHistory({ userId, limit: 5 }).items;
      const [statsRes, historyRes] = await Promise.all([
        fetch(`/api/stats?${userParam}`),
        fetch(`/api/history?limit=5&${userParam}`),
      ]);
      if (!statsRes.ok || !historyRes.ok) throw new Error("Failed to load data");
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      setStats(addStats(statsData, localStats));
      setHistory(mergeHistoryItems(historyData.items || [], localRecent).slice(0, 5));
    } catch (e) {
      const userId = getClientUserId();
      const localRecent = queryLocalHistory({ userId, limit: 5 }).items;
      if (localRecent.length > 0) {
        setStats(getLocalStats(userId));
        setHistory(localRecent);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 animate-fade-in">
        <AlertCircle className="h-8 w-8 text-[var(--color-muted)]" />
        <p className="text-[13px] text-[var(--color-muted)]">{error}</p>
        <button
          onClick={fetchData}
          className="text-[12px] text-[var(--color-accent-dim)] underline underline-offset-2 transition-colors hover:text-[var(--color-text)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* ---- Editorial hero band ---- */}
      <section className="cocoa-grain relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Obfuscation workspace</p>
            <h2 className="display-xl mt-4 text-[color:var(--color-text)]">
              Build protected scripts, audit every run.
            </h2>
            <p className="lede mt-4 max-w-lg">
              Queue Luau source, apply your preset, and review per-account
              history — all from one console. Output is validated before it is
              ever reported as done.
            </p>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 1, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={() => setCurrentPage("encrypt")}
              className="primary-action mt-7 inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              Open obfuscation queue
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Editorial pipeline note (factual steps of the real engine) */}
          <div className="code-surface hidden px-5 py-4 text-[11px] leading-relaxed lg:block">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span>pipeline</span>
              <span className="text-[var(--color-brand)]">ready</span>
            </div>
            <div className="space-y-2">
              <p><span className="code-token-number">01</span> <span className="code-token-plain">tokenize source</span></p>
              <p><span className="code-token-number">02</span> <span className="code-token-plain">scope-aware rename</span></p>
              <p><span className="code-token-number">03</span> <span className="code-token-plain">encode strings</span></p>
              <p><span className="code-token-number">04</span> <span className="code-token-plain">validate output</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Inline stat strip (not a card grid) ---- */}
      <section className="panel flex flex-wrap items-stretch gap-y-6 divide-y divide-[var(--color-border)] px-6 py-6 sm:flex-nowrap sm:divide-y-0 sm:divide-x">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : stats ? (
          <>
            <Stat label="Total files" value={stats.totalFiles.toLocaleString()} />
            <Stat label="Obfuscated" value={stats.totalEncrypted.toLocaleString()} />
            <Stat label="Failed" value={stats.totalFailed.toLocaleString()} />
            <Stat label="Success rate" value={`${stats.successRate}%`} />
            <Stat label="Avg time" value={formatMs(stats.avgProcessTimeMs)} />
          </>
        ) : null}
      </section>

      {/* ---- Recent activity ---- */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h3 className="font-display text-lg text-[color:var(--color-text)]">
            Recent activity
          </h3>
          <button
            onClick={() => setCurrentPage("history")}
            className="flex items-center gap-1 text-[11px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-4 w-4 rounded" />
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-4 w-16" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <FileText className="h-6 w-6 text-[var(--color-muted)]" />
            <p className="text-[12px] text-[var(--color-muted)]">
              No obfuscation activity yet
            </p>
            <button
              onClick={() => setCurrentPage("encrypt")}
              className="mt-1 text-[12px] text-[var(--color-accent-dim)] underline underline-offset-2 transition-colors hover:text-[var(--color-text)]"
            >
              Obfuscate your first file
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="grid animate-fade-in grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand)_6%,transparent)] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.success
                      ? "bg-[var(--color-success)]"
                      : "bg-[var(--color-error)]"
                  }`}
                />
                <span className="flex-1 truncate font-mono text-[12px] text-[var(--color-accent-dim)]">
                  {item.fileName}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[var(--color-muted)]">
                  {formatMs(item.encryptionTimeMs)}
                </span>
                <span className="hidden shrink-0 text-[11px] text-[var(--color-muted)] sm:block">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Quick actions ---- */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Obfuscate files", icon: Shield, page: "encrypt" as const },
          { label: "View history", icon: Clock, page: "history" as const },
          { label: "Read documentation", icon: FileText, page: "documentation" as const },
        ].map((a) => (
          <button
            key={a.page}
            onClick={() => setCurrentPage(a.page)}
            className="secondary-action motion-press flex items-center justify-between gap-2 px-4 py-3.5 text-[12px]"
          >
            <span className="flex items-center gap-2.5">
              <a.icon className="h-4 w-4" />
              {a.label}
            </span>
            <ArrowRight className="h-3.5 w-3.5 opacity-50" />
          </button>
        ))}
      </section>
    </div>
  );
}
