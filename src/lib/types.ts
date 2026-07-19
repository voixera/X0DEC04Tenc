export interface EncryptionSettings {
  renameVariable: boolean;
  renameFunction: boolean;
  renameLocal: boolean;
  encryptString: boolean;
  encodeConstant: boolean;
  removeComments: boolean;
  compressOutput: boolean;
  protectGlobal: boolean;
  minify: boolean;
  randomIdentifierLength: number;
  outputFilename: string;
}

export const DEFAULT_SETTINGS: EncryptionSettings = {
  renameVariable: true,
  renameFunction: true,
  renameLocal: true,
  encryptString: true,
  encodeConstant: true,
  removeComments: true,
  compressOutput: false,
  protectGlobal: true,
  minify: false,
  randomIdentifierLength: 8,
  outputFilename: "",
};

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "validating" | "encrypting" | "done" | "error";
  progress: number;
  originalSize: number;
  encryptedSize: number;
  encryptionTime: number;
  encryptedContent: string | null;
  error: string | null;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  message: string;
  fileName?: string;
}

export interface HistoryItem {
  id: string;
  userId: string;
  fileName: string;
  originalSize: number;
  encryptedSize: number;
  encryptionTimeMs: number;
  success: boolean;
  errorMessage: string | null;
  settings: string;
  createdAt: string;
}

export interface StatsData {
  totalFiles: number;
  totalEncrypted: number;
  totalFailed: number;
  avgProcessTimeMs: number;
  successRate: number;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

export type PageId =
  | "dashboard"
  | "encrypt"
  | "history"
  | "settings"
  | "documentation"
  | "about";
