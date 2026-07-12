"use client";

import { create } from "zustand";
import type {
  EncryptionSettings,
  FileItem,
  LogEntry,
  Notification,
  PageId,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

interface AppStore {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

interface EncryptStore {
  settings: EncryptionSettings;
  updateSettings: (partial: Partial<EncryptionSettings>) => void;
  resetSettings: () => void;
  files: FileItem[];
  addFiles: (files: FileItem[]) => void;
  updateFile: (id: string, partial: Partial<FileItem>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
  isProcessing: boolean;
  setProcessing: (v: boolean) => void;
  processedCount: number;
  setProcessedCount: (n: number) => void;
}

export const useEncryptStore = create<EncryptStore>((set) => ({
  settings: { ...DEFAULT_SETTINGS },
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
  files: [],
  addFiles: (files) => set((s) => ({ files: [...s.files, ...files] })),
  updateFile: (id, partial) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, ...partial } : f)),
    })),
  removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  clearFiles: () => set({ files: [], processedCount: 0 }),
  logs: [],
  addLog: (entry) => set((s) => ({ logs: [...s.logs, entry] })),
  clearLogs: () => set({ logs: [] }),
  isProcessing: false,
  setProcessing: (v) => set({ isProcessing: v }),
  processedCount: 0,
  setProcessedCount: (n) => set({ processedCount: n }),
}));

interface NotificationStore {
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (n) =>
    set((s) => ({ notifications: [...s.notifications, n] })),
  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
}));
