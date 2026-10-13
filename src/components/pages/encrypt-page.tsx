"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useEncryptStore, useNotificationStore } from "@/lib/store";
import {
  Upload,
  Download,
  Trash2,
  File,
  FolderOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  Eye,
  RotateCcw,
  Copy,
  ChevronDown,
} from "@/components/icons";
import {
  formatBytes,
  formatMs,
  calcReduction,
  cn,
  generateId,
  isLuaFile,
  validateFileSize,
} from "@/lib/utils";
import { getClientUserId } from "@/lib/user";
import { addLocalHistory } from "@/lib/local-history";
import { CodeSnippet } from "@/components/hero/code-snippet";
import type { FileItem, LogEntry } from "@/lib/types";

function SettingsPanel() {
  const { settings, updateSettings } = useEncryptStore();

  const toggles: { key: keyof typeof settings; label: string; description: string }[] = [
    { key: "renameVariable", label: "Rename Variables", description: "Obfuscate variable names" },
    { key: "renameFunction", label: "Rename Functions", description: "Obfuscate function names" },
    { key: "renameLocal", label: "Rename Locals", description: "Obfuscate local identifiers" },
    { key: "encryptString", label: "Encode Strings", description: "Reversible per-string byte encoding" },
    { key: "encodeConstant", label: "Encode Constants", description: "Obfuscate numeric constants" },
    { key: "removeComments", label: "Remove Comments", description: "Strip all comments" },
    { key: "compressOutput", label: "Compress Output", description: "Compact single-block output" },
    { key: "protectGlobal", label: "Protect Globals (unsupported)", description: "No-op; kept for compatibility" },
    { key: "minify", label: "Minify", description: "Remove whitespace" },
  ];

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3.5">
        <span className="font-display text-[17px] text-[color:var(--color-text)]">
          Obfuscation settings
        </span>
      </div>
      <div className="max-h-[420px] space-y-1 overflow-y-auto p-3">
        {toggles.map((t) => (
          <label
            key={t.key}
            className="group flex cursor-pointer items-start justify-between gap-3 rounded-[var(--radius-base)] px-2.5 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand)_7%,transparent)]"
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-[12px] text-[var(--color-accent-dim)] transition-colors group-hover:text-[var(--color-text)]">
                {t.label}
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">{t.description}</span>
            </div>
            <div
              role="switch"
              aria-checked={!!settings[t.key]}
              aria-label={t.label}
              className={cn(
                "relative ml-3 h-[18px] w-8 shrink-0 rounded-full transition-colors duration-180",
                settings[t.key]
                  ? "bg-[linear-gradient(180deg,#c98a54,#a56c43)]"
                  : "bg-[var(--color-cocoa-600)]"
              )}
              onClick={(e) => {
                e.preventDefault();
                updateSettings({ [t.key]: !settings[t.key] } as Record<string, boolean>);
              }}
            >
              <div
                className={cn(
                  "absolute top-[2px] h-[14px] w-[14px] rounded-full transition-all duration-180",
                  settings[t.key]
                    ? "left-[18px] bg-[#1c0f0b]"
                    : "left-[2px] bg-[var(--color-muted)]"
                )}
              />
            </div>
          </label>
        ))}

        <div className="px-2.5 py-2">
          <label className="mb-1.5 block text-[12px] text-[var(--color-muted)]">
            Random identifier length
          </label>
          <input
            type="number"
            min={4}
            max={32}
            value={settings.randomIdentifierLength}
            onChange={(e) =>
              updateSettings({
                randomIdentifierLength: Math.max(
                  4,
                  Math.min(32, parseInt(e.target.value) || 8)
                ),
              })
            }
            className="auth-input px-3 py-2 text-[12px]"
          />
        </div>

        <div className="px-2.5 py-2">
          <label className="mb-1.5 block text-[12px] text-[var(--color-muted)]">
            Output filename (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. protected_output.lua"
            value={settings.outputFilename}
            onChange={(e) => updateSettings({ outputFilename: e.target.value })}
            className="auth-input px-3 py-2 text-[12px]"
          />
        </div>
      </div>
    </div>
  );
}

function LiveLog() {
  const logs = useEncryptStore((s) => s.logs);
  const clearLogs = useEncryptStore((s) => s.clearLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColors = {
    info: "text-[var(--color-muted)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    error: "text-[var(--color-error)]",
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[var(--color-muted)]" />
          <span className="font-display text-[15px] text-[color:var(--color-text)]">Live log</span>
          {logs.length > 0 && (
            <span className="font-mono text-[10px] text-[var(--color-muted)]">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="text-[11px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Clear
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="h-[200px] space-y-0.5 overflow-y-auto p-3 font-mono text-[11px]"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-[11px] text-[var(--color-muted)]">
              Waiting for obfuscation process…
            </span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex animate-fade-in gap-2">
              <span className="shrink-0 text-[var(--color-cocoa-400)]">
                {new Date(log.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className={levelColors[log.level]}>
                {log.fileName ? `[${log.fileName}] ` : ""}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OutputPanel({
  file,
  onPreview,
}: {
  file: FileItem;
  onPreview: (f: FileItem) => void;
}) {
  const [copied, setCopied] = useState(false);
  const downloadFile = useCallback(() => {
    if (!file.encryptedContent) return;
    const blob = new Blob([file.encryptedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.(lua|luau)$/, "_protected.$1");
    a.click();
    URL.revokeObjectURL(url);
  }, [file]);

  const copyToClipboard = useCallback(async () => {
    if (!file.encryptedContent) return;
    try {
      await navigator.clipboard.writeText(file.encryptedContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: do nothing
    }
  }, [file]);

  if (file.status !== "done") return null;

  return (
    <div className="panel animate-fade-in overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
        <span className="flex-1 truncate font-mono text-[12px] text-[color:var(--color-text)]">
          {file.name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-4">
        {[
          { label: "Original", value: formatBytes(file.originalSize) },
          { label: "Protected", value: formatBytes(file.encryptedSize) },
          { label: "Reduction", value: calcReduction(file.originalSize, file.encryptedSize) },
          { label: "Time", value: formatMs(file.encryptionTime) },
        ].map((m) => (
          <div key={m.label} className="bg-[var(--color-bg-secondary)] px-3 py-2.5">
            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {m.label}
            </span>
            <span className="mt-1 block font-mono text-[12px] text-[var(--color-accent-dim)]">
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Generated output · preview
          </span>
          {copied && (
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-success)]">
              copied
            </span>
          )}
        </div>
        <div className="code-surface scanline max-h-[168px] overflow-hidden px-3 py-2.5 text-[10.5px] leading-relaxed">
          <CodeSnippet
            code={(file.encryptedContent || "").slice(0, 520)}
            className="whitespace-pre-wrap break-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] px-3 py-3">
        <button
          onClick={downloadFile}
          className="primary-action motion-press flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px]"
        >
          <Download className="h-3 w-3" />
          Download
        </button>
        <button
          onClick={() => onPreview(file)}
          className="secondary-action motion-press flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px]"
        >
          <Eye className="h-3 w-3" />
          Preview
        </button>
        <button
          onClick={copyToClipboard}
          className={cn(
            "secondary-action motion-press flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px]",
            copied && "action-success"
          )}
        >
          {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function PreviewModal({
  file,
  onClose,
}: {
  file: FileItem | null;
  onClose: () => void;
}) {
  if (!file || !file.encryptedContent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel flex max-h-[85vh] w-full max-w-5xl flex-col animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-caramel-bright)]" />
            <span className="truncate font-mono text-[13px] text-[color:var(--color-text)]">
              {file.name}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="text-lg text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            ×
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-[var(--color-border)] md:border-b-0 md:border-r">
            <div className="border-b border-[var(--color-border)] px-4 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Source
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-bg)] p-4">
              <p className="font-mono text-[11px] leading-relaxed text-[var(--color-muted)]">
                {file.name} · {formatBytes(file.originalSize)}
                <br />
                The original source is processed in memory and is not retained
                for preview. Only the generated output is shown here.
              </p>
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="border-b border-[var(--color-border)] px-4 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-brand)]">
                Generated output
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-bg)] p-4">
              <CodeSnippet
                code={file.encryptedContent}
                className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EncryptPage() {
  const {
    files,
    addFiles,
    updateFile,
    removeFile,
    clearFiles,
    settings,
    addLog,
    isProcessing,
    setProcessing,
    processedCount,
    setProcessedCount,
  } = useEncryptStore();
  const { addNotification } = useNotificationStore();
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const log = useCallback(
    (level: LogEntry["level"], message: string, fileName?: string) => {
      addLog({
        id: generateId(),
        timestamp: Date.now(),
        level,
        message,
        fileName,
      });
    },
    [addLog]
  );

  const handleFiles = useCallback(
    (fileList: globalThis.File[]) => {
      const validFiles: FileItem[] = [];
      const errors: string[] = [];

      for (const f of fileList) {
        if (!isLuaFile(f.name)) {
          errors.push(`${f.name}: Not a .lua or .luau file`);
          continue;
        }
        if (!validateFileSize(f.size)) {
          errors.push(`${f.name}: Exceeds 10MB limit`);
          continue;
        }
        if (f.size === 0) {
          errors.push(`${f.name}: File is empty`);
          continue;
        }
        validFiles.push({
          id: generateId(),
          file: f,
          name: f.name,
          size: f.size,
          status: "pending",
          progress: 0,
          originalSize: f.size,
          encryptedSize: 0,
          encryptionTime: 0,
          encryptedContent: null,
          error: null,
        });
      }

      if (errors.length > 0) {
        errors.forEach((e) => log("error", e));
        addNotification({
          id: generateId(),
          type: "warning",
          title: "Some files skipped",
          message: `${errors.length} file(s) could not be added`,
        });
      }

      if (validFiles.length > 0) {
        addFiles(validFiles);
        log("info", `Added ${validFiles.length} file(s) to queue`);
      }
    },
    [addFiles, log, addNotification]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const items = Array.from(e.dataTransfer.files);
      handleFiles(items);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const processQueue = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    setProcessing(true);
    log("info", `Starting obfuscation of ${pending.length} file(s)`);
    let completed = 0;

    for (const fileItem of pending) {
      let localHistoryRecorded = false;

      try {
        updateFile(fileItem.id, { status: "validating", progress: 10 });
        log("info", "Validating file…", fileItem.name);

        await new Promise((r) => setTimeout(r, 100));
        updateFile(fileItem.id, { status: "encrypting", progress: 30 });
        log("info", "Scanning source…", fileItem.name);

        await new Promise((r) => setTimeout(r, 80));
        log("info", "Obfuscating…", fileItem.name);
        updateFile(fileItem.id, { progress: 50 });

        const formData = new FormData();
        formData.append("file", fileItem.file);
        formData.append("settings", JSON.stringify(settings));
        formData.append("userId", getClientUserId());

        const res = await fetch("/api/encrypt", {
          method: "POST",
          body: formData,
        });

        updateFile(fileItem.id, { progress: 80 });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const message = errData.error || "Obfuscation failed";

          if (errData.historySaved === false) {
            addLocalHistory({
              fileName: fileItem.name,
              originalSize: fileItem.size,
              encryptedSize: 0,
              encryptionTimeMs: 0,
              success: false,
              errorMessage: message,
              settings: JSON.stringify(settings),
            });
          }

          localHistoryRecorded = true;
          throw new Error(message);
        }

        const data = await res.json();
        if (data.historySaved === false) {
          addLocalHistory({
            fileName: data.fileName || fileItem.name,
            originalSize: data.originalSize || fileItem.size,
            encryptedSize: data.encryptedSize || 0,
            encryptionTimeMs: data.encryptionTimeMs || 0,
            success: true,
            errorMessage: null,
            settings: JSON.stringify(settings),
          });
          localHistoryRecorded = true;
          log("warning", "Obfuscated, but history was not saved", fileItem.name);
        }
        log("info", "Optimizing output…", fileItem.name);
        updateFile(fileItem.id, { progress: 95 });

        await new Promise((r) => setTimeout(r, 60));

        updateFile(fileItem.id, {
          status: "done",
          progress: 100,
          encryptedContent: data.encrypted,
          encryptedSize: data.encryptedSize,
          originalSize: data.originalSize,
          encryptionTime: data.encryptionTimeMs,
        });
        log("success", `Finished in ${formatMs(data.encryptionTimeMs)}`, fileItem.name);
        completed++;
        setProcessedCount(completed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (!localHistoryRecorded) {
          addLocalHistory({
            fileName: fileItem.name,
            originalSize: fileItem.size,
            encryptedSize: 0,
            encryptionTimeMs: 0,
            success: false,
            errorMessage: msg,
            settings: JSON.stringify(settings),
          });
        }
        updateFile(fileItem.id, {
          status: "error",
          progress: 0,
          error: msg,
        });
        log("error", msg, fileItem.name);
      }
    }

    setProcessing(false);
    addNotification({
      id: generateId(),
      type: completed === pending.length ? "success" : "warning",
      title: "Obfuscation Complete",
      message: `${completed}/${pending.length} files obfuscated successfully`,
    });
    log(
      "info",
      `Batch complete: ${completed}/${pending.length} succeeded`
    );
  }, [files, settings, updateFile, setProcessing, log, addNotification, setProcessedCount]);

  const downloadAll = useCallback(() => {
    const done = files.filter((f) => f.status === "done" && f.encryptedContent);
    done.forEach((f) => {
      const blob = new Blob([f.encryptedContent!], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name.replace(/\.(lua|luau)$/, "_protected.$1");
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [files]);

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const totalProgress =
    files.length > 0
      ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
      : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Build pipeline</p>
          <h2 className="display-xl mt-2 text-[color:var(--color-text)]">Obfuscate source</h2>
          <p className="mt-2 text-xs text-[var(--color-muted)]">Upload Lua or Luau, apply the active preset, and download the protected output.</p>
        </div>
        <span className="hidden rounded-full border border-[var(--color-border-strong)] bg-[var(--color-brand)]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-brand)] sm:block">Engine online</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="space-y-4 min-w-0">
          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "cocoa-grain relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed p-4 text-center transition-all duration-200",
              dragOver
                ? "border-[var(--color-border-hover)] bg-[var(--color-brand)]/8"
                : "border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]"
            )}
            onClick={() => inputRef.current?.click()}
          >
            <Upload
              className={cn(
                "mb-3 h-8 w-8 transition-colors duration-200",
                dragOver ? "text-[var(--color-caramel-bright)]" : "text-[var(--color-muted)]"
              )}
            />
            <p className="mb-1 text-[13px] text-[var(--color-accent-dim)]">
              Drop .lua or .luau files here or{" "}
              <span className="text-[color:var(--color-text)] underline underline-offset-2">browse</span>
            </p>
            <p className="text-[11px] text-[var(--color-muted)]">
              Batch upload · max 10MB per file
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="secondary-action motion-press flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
              >
                <File className="h-3 w-3" />
                Files
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  folderRef.current?.click();
                }}
                className="secondary-action motion-press flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
              >
                <FolderOpen className="h-3 w-3" />
                Folder
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".lua,.luau"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
          <input
            ref={folderRef}
            type="file"
            accept=".lua,.luau"
            multiple
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const luaFiles = Array.from(e.target.files).filter((f) =>
                  isLuaFile(f.name)
                );
                handleFiles(luaFiles);
              }
              e.target.value = "";
            }}
          />

          {/* File List */}
          {files.length > 0 && (
            <div className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-display text-[15px] text-[color:var(--color-text)]">
                    Queue
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-muted)]">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                  {isProcessing && (
                    <span className="font-mono text-[11px] text-[var(--color-brand)]">
                      {totalProgress}%
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {doneCount > 0 && (
                    <button
                      onClick={downloadAll}
                      className="primary-action motion-press flex items-center gap-1.5 px-2.5 py-1 text-[11px]"
                    >
                      <Download className="h-3 w-3" />
                      All
                    </button>
                  )}
                  {!isProcessing && pendingCount > 0 && (
                    <button
                      onClick={processQueue}
                      className="primary-action motion-press flex items-center gap-1.5 px-2.5 py-1 text-[11px]"
                    >
                      Obfuscate {pendingCount}
                    </button>
                  )}
                  {!isProcessing && (
                    <button
                      onClick={clearFiles}
                      aria-label="Clear queue"
                      className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isProcessing && (
                <div className="h-[2px] bg-[var(--color-bg)]">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#a56c43,#c98a54)] transition-all duration-240"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              )}

              <div className="max-h-[300px] divide-y divide-[var(--color-border)] overflow-y-auto">
                {files.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex min-w-0 animate-fade-in flex-wrap items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand)_6%,transparent)] sm:flex-nowrap"
                    style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}
                  >
                    <div className="shrink-0">
                      {f.status === "done" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
                      ) : f.status === "error" ? (
                        <XCircle className="h-3.5 w-3.5 text-[var(--color-error)]" />
                      ) : f.status === "encrypting" || f.status === "validating" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-accent-dim)]" />
                      ) : (
                        <File className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                      )}
                    </div>
                    <span className="min-w-[140px] flex-1 truncate font-mono text-[12px] text-[var(--color-accent-dim)]">
                      {f.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[var(--color-muted)]">
                      {formatBytes(f.size)}
                    </span>
                    {f.status === "encrypting" || f.status === "validating" ? (
                      <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--color-bg)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-caramel-bright)] transition-all duration-200"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    ) : null}
                    {f.error && (
                      <span className="max-w-[100px] shrink-0 truncate text-[10px] text-[var(--color-error)]">
                        {f.error}
                      </span>
                    )}
                    {!isProcessing && (
                      <button
                        onClick={() => removeFile(f.id)}
                        aria-label={`Remove ${f.name}`}
                        className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Results */}
          {files.filter((f) => f.status === "done").length > 0 && (
            <div className="space-y-3">
              <span className="font-display text-[17px] text-[color:var(--color-text)]">Output</span>
              {files
                .filter((f) => f.status === "done")
                .map((f) => (
                  <OutputPanel
                    key={f.id}
                    file={f}
                    onPreview={setPreviewFile}
                  />
                ))}
            </div>
          )}

          {/* Live Log */}
          <LiveLog />
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-4">
          <SettingsPanel />
        </div>
      </div>

      <PreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
