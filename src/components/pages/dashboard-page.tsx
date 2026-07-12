"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Shield,
  Clock,
  Zap,
  AlertCircle,
  ChevronRight,
} from "@/components/icons";
import { formatMs, formatDate, cn } from "@/lib/utils";
import type { StatsData, HistoryItem } from "@/lib/types";
import { useAppStore } from "@/lib/store";

function StatCard({
  label,
  value,
  icon: Icon,
  index,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
  index: number;
}) {
  return (
    <div
      className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#525252] font-medium uppercase tracking-wider">
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg bg-[#181818] border border-[var(--color-border)] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#737373]" />
        </div>
      </div>
      <span className="text-[22px] font-semibold text-[#e5e5e5] tracking-tight">
        {value}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton w-16 h-3" />
        <div className="skeleton w-7 h-7 rounded-lg" />
      </div>
      <div className="skeleton w-20 h-6 mt-1" />
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
      const [statsRes, historyRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/history?limit=5"),
      ]);
      if (!statsRes.ok || !historyRes.ok) throw new Error("Failed to load data");
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      setStats(statsData);
      setHistory(historyData.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 animate-fade-in">
        <AlertCircle className="w-8 h-8 text-[#525252]" />
        <p className="text-[13px] text-[#525252]">{error}</p>
        <button
          onClick={fetchData}
          className="text-[12px] text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120 underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : stats ? (
          <>
            <StatCard
              label="Total Files"
              value={stats.totalFiles.toLocaleString()}
              icon={FileText}
              index={0}
            />
            <StatCard
              label="Encrypted"
              value={stats.totalEncrypted.toLocaleString()}
              icon={Shield}
              index={1}
            />
            <StatCard
              label="Avg Time"
              value={formatMs(stats.avgProcessTimeMs)}
              icon={Clock}
              index={2}
            />
            <StatCard
              label="Success Rate"
              value={`${stats.successRate}%`}
              icon={Zap}
              index={3}
            />
          </>
        ) : null}
      </div>

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-[13px] font-medium text-[#e5e5e5]">
            Recent Activity
          </span>
          <button
            onClick={() => setCurrentPage("history")}
            className="text-[11px] text-[#525252] hover:text-[#a3a3a3] flex items-center gap-1 transition-colors duration-120"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-4 h-4 rounded" />
                <div className="skeleton flex-1 h-4" />
                <div className="skeleton w-16 h-4" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FileText className="w-6 h-6 text-[#2a2a2a]" />
            <p className="text-[12px] text-[#525252]">No encryption activity yet</p>
            <button
              onClick={() => setCurrentPage("encrypt")}
              className="text-[12px] text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120 mt-1 underline underline-offset-2"
            >
              Encrypt your first file
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors duration-120 animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    item.success ? "bg-green-500" : "bg-red-500"
                  )}
                />
                <span className="text-[12px] text-[#a3a3a3] flex-1 truncate font-mono">
                  {item.fileName}
                </span>
                <span className="text-[11px] text-[#525252] shrink-0">
                  {formatMs(item.encryptionTimeMs)}
                </span>
                <span className="text-[11px] text-[#3a3a3a] shrink-0 hidden sm:block">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-4">
        <h3 className="text-[13px] font-medium text-[#e5e5e5] mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setCurrentPage("encrypt")}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#181818] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[12px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
          >
            <Shield className="w-3.5 h-3.5" />
            Encrypt Files
          </button>
          <button
            onClick={() => setCurrentPage("history")}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#181818] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[12px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
          >
            <Clock className="w-3.5 h-3.5" />
            View History
          </button>
          <button
            onClick={() => setCurrentPage("documentation")}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#181818] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[12px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
          >
            <FileText className="w-3.5 h-3.5" />
            Read Docs
          </button>
        </div>
      </div>
    </div>
  );
}
