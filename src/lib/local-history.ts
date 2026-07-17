import type { HistoryItem, StatsData } from "./types";
import { generateId } from "./utils";
import { getClientUserId, normalizeUserId } from "./user";

const LOCAL_HISTORY_PREFIX = "x0dec04t_history:";
const MAX_LOCAL_HISTORY_ITEMS = 500;

type HistoryInput = Omit<HistoryItem, "id" | "userId" | "createdAt"> & {
  id?: string;
  userId?: string;
  createdAt?: string;
};

interface QueryOptions {
  userId?: string;
  search?: string;
  filter?: "all" | "success" | "failed";
  page?: number;
  limit?: number;
}

function getStorageKey(userId = getClientUserId()) {
  return `${LOCAL_HISTORY_PREFIX}${normalizeUserId(userId)}`;
}

function canUseStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function sortByNewest(items: HistoryItem[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function loadLocalHistory(userId = getClientUserId()): HistoryItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is HistoryItem => {
      return (
        item &&
        typeof item.id === "string" &&
        typeof item.fileName === "string" &&
        typeof item.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function saveLocalHistory(items: HistoryItem[], userId = getClientUserId()) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const trimmed = sortByNewest(items).slice(0, MAX_LOCAL_HISTORY_ITEMS);
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(trimmed));
  } catch {
    // Storage can be blocked or full; remote history is still the source of truth.
  }
}

export function addLocalHistory(input: HistoryInput): HistoryItem {
  const userId = normalizeUserId(input.userId ?? getClientUserId());
  const item: HistoryItem = {
    ...input,
    id: input.id ?? generateId(),
    userId,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  const existing = loadLocalHistory(userId).filter((entry) => entry.id !== item.id);
  saveLocalHistory([item, ...existing], userId);
  return item;
}

export function deleteLocalHistory(id: string, userId = getClientUserId()) {
  const existing = loadLocalHistory(userId);
  const next = existing.filter((item) => item.id !== id);

  if (next.length === existing.length) {
    return false;
  }

  saveLocalHistory(next, userId);
  return true;
}

export function queryLocalHistory({
  userId = getClientUserId(),
  search = "",
  filter = "all",
  page = 1,
  limit = 20,
}: QueryOptions = {}) {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = sortByNewest(loadLocalHistory(userId)).filter((item) => {
    const matchesSearch = normalizedSearch
      ? item.fileName.toLowerCase().includes(normalizedSearch)
      : true;
    const matchesFilter =
      filter === "success" ? item.success : filter === "failed" ? !item.success : true;

    return matchesSearch && matchesFilter;
  });

  const start = (Math.max(1, page) - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    hasMore: filtered.length > start + limit,
    total: filtered.length,
  };
}

export function getLocalStats(userId = getClientUserId()): StatsData {
  const items = loadLocalHistory(userId);
  const totalFiles = items.length;
  const totalEncrypted = items.filter((item) => item.success).length;
  const totalFailed = totalFiles - totalEncrypted;
  const avgProcessTimeMs =
    totalFiles > 0
      ? items.reduce((sum, item) => sum + item.encryptionTimeMs, 0) / totalFiles
      : 0;

  return {
    totalFiles,
    totalEncrypted,
    totalFailed,
    avgProcessTimeMs,
    successRate: totalFiles > 0 ? Math.round((totalEncrypted / totalFiles) * 1000) / 10 : 100,
  };
}

export function mergeHistoryItems(...groups: HistoryItem[][]): HistoryItem[] {
  const byId = new Map<string, HistoryItem>();

  for (const group of groups) {
    for (const item of group) {
      byId.set(item.id, item);
    }
  }

  return sortByNewest(Array.from(byId.values()));
}

export function addStats(a: StatsData, b: StatsData): StatsData {
  const totalFiles = a.totalFiles + b.totalFiles;
  const totalEncrypted = a.totalEncrypted + b.totalEncrypted;
  const totalFailed = a.totalFailed + b.totalFailed;
  const avgProcessTimeMs =
    totalFiles > 0
      ? (a.avgProcessTimeMs * a.totalFiles + b.avgProcessTimeMs * b.totalFiles) / totalFiles
      : 0;

  return {
    totalFiles,
    totalEncrypted,
    totalFailed,
    avgProcessTimeMs,
    successRate: totalFiles > 0 ? Math.round((totalEncrypted / totalFiles) * 1000) / 10 : 100,
  };
}
