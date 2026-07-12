"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Trash2,
  Download,
  AlertCircle,
  FileText,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "@/components/icons";
import { formatBytes, formatMs, formatDate, cn, generateId } from "@/lib/utils";
import { useNotificationStore } from "@/lib/store";
import type { HistoryItem } from "@/lib/types";

type FilterType = "all" | "success" | "failed";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const { addNotification } = useNotificationStore();

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        search,
        filter,
        page: page.toString(),
        limit: "20",
      });
      const res = await fetch(`/api/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => {
    const timer = setTimeout(fetchHistory, 300);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Delete failed");
        setItems((prev) => prev.filter((i) => i.id !== id));
        addNotification({
          id: generateId(),
          type: "success",
          title: "Deleted",
          message: "History entry removed",
        });
      } catch {
        addNotification({
          id: generateId(),
          type: "error",
          title: "Error",
          message: "Failed to delete entry",
        });
      }
    },
    [addNotification]
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 animate-fade-in">
        <AlertCircle className="w-8 h-8 text-[#525252]" />
        <p className="text-[13px] text-[#525252]">{error}</p>
        <button
          onClick={fetchHistory}
          className="text-[12px] text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120 underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3a3a3a]" />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#111111] border border-[var(--color-border)] rounded-[10px] pl-9 pr-3 py-2 text-[12px] text-[#e5e5e5] placeholder:text-[#2a2a2a] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors duration-120"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as FilterType);
              setPage(1);
            }}
            className="appearance-none bg-[#111111] border border-[var(--color-border)] rounded-[10px] px-3 py-2 pr-8 text-[12px] text-[#a3a3a3] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors duration-120 cursor-pointer"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#3a3a3a] pointer-events-none" />
        </div>
      </div>

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-4 h-4 rounded" />
                <div className="skeleton flex-1 h-4" />
                <div className="skeleton w-12 h-4" />
                <div className="skeleton w-12 h-4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileText className="w-8 h-8 text-[#1a1a1a]" />
            <p className="text-[13px] text-[#3a3a3a]">
              {search ? "No matching entries" : "No encryption history"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[12px] text-[#525252] hover:text-[#a3a3a3] transition-colors duration-120 underline underline-offset-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_80px_60px] gap-3 px-4 py-2 border-b border-[var(--color-border)] text-[10px] text-[#3a3a3a] uppercase tracking-wider font-medium">
              <span>File</span>
              <span>Original</span>
              <span>Encrypted</span>
              <span>Time</span>
              <span>Date</span>
              <span></span>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_80px_60px] gap-1 sm:gap-3 px-4 py-3 hover:bg-[#141414] transition-colors duration-120 animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.success ? (
                      <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    )}
                    <span className="text-[12px] text-[#a3a3a3] font-mono truncate">
                      {item.fileName}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#525252] font-mono">
                    {formatBytes(item.originalSize)}
                  </span>
                  <span className="text-[11px] text-[#525252] font-mono">
                    {formatBytes(item.encryptedSize)}
                  </span>
                  <span className="text-[11px] text-[#525252] font-mono">
                    {formatMs(item.encryptionTimeMs)}
                  </span>
                  <span className="text-[11px] text-[#3a3a3a] hidden sm:block">
                    {formatDate(item.createdAt)}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-[#2a2a2a] hover:text-red-400 transition-colors duration-120 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {items.length >= 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[var(--color-border)] text-[11px] text-[#525252] hover:text-[#a3a3a3] disabled:opacity-30 transition-all duration-120"
          >
            Previous
          </button>
          <span className="text-[11px] text-[#3a3a3a] font-mono">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[var(--color-border)] text-[11px] text-[#525252] hover:text-[#a3a3a3] transition-all duration-120"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
