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
import type { FileItem, LogEntry } from "@/lib/types";

function SettingsPanel() {
  const { settings, updateSettings } = useEncryptStore();

  const toggles: { key: keyof typeof settings; label: string; description: string }[] = [
    { key: "renameVariable", label: "Rename Variables", description: "Obfuscate variable names" },
    { key: "renameFunction", label: "Rename Functions", description: "Obfuscate function names" },
    { key: "renameLocal", label: "Rename Locals", description: "Obfuscate local identifiers" },
    { key: "encryptString", label: "Encrypt Strings", description: "AES encrypt string literals" },
    { key: "encodeConstant", label: "Encode Constants", description: "Obfuscate numeric constants" },
    { key: "removeComments", label: "Remove Comments", description: "Strip all comments" },
    { key: "compressOutput", label: "Compress Output", description: "Single-line output" },
    { key: "protectGlobal", label: "Protect Globals", description: "Sandbox global environment" },
    { key: "minify", label: "Minify", description: "Remove whitespace" },
    { key: "layeredEncryption", label: "Layered Encryption", description: "Base64 + loader wrap" },
  ];

  return (
    <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-[13px] font-medium text-[#e5e5e5]">
          Encryption Settings
        </span>
      </div>
      <div className="p-3 space-y-1 max-h-[420px] overflow-y-auto">
        {toggles.map((t) => (
          <label
            key={t.key}
            className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#181818] transition-colors duration-120 cursor-pointer group"
          >
            <div className="flex flex-col">
              <span className="text-[12px] text-[#a3a3a3] group-hover:text-[#e5e5e5] transition-colors duration-120">
                {t.label}
              </span>
              <span className="text-[10px] text-[#3a3a3a]">{t.description}</span>
            </div>
            <div
              className={cn(
                "w-8 h-[18px] rounded-full relative transition-colors duration-180 shrink-0 ml-3",
                settings[t.key] ? "bg-[#e5e5e5]" : "bg-[#2a2a2a]"
              )}
              onClick={(e) => {
                e.preventDefault();
                updateSettings({ [t.key]: !settings[t.key] } as Record<string, boolean>);
              }}
            >
              <div
                className={cn(
                  "absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-180",
                  settings[t.key]
                    ? "left-[18px] bg-[#090909]"
                    : "left-[2px] bg-[#525252]"
                )}
              />
            </div>
          </label>
        ))}

        <div className="px-2 py-2">
          <label className="text-[12px] text-[#525252] block mb-1.5">
            Random Identifier Length
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
            className="w-full bg-[#181818] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[12px] text-[#e5e5e5] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors duration-120"
          />
        </div>

        <div className="px-2 py-2">
          <label className="text-[12px] text-[#525252] block mb-1.5">
            Output Filename (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. encrypted_output.lua"
            value={settings.outputFilename}
            onChange={(e) => updateSettings({ outputFilename: e.target.value })}
            className="w-full bg-[#181818] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[12px] text-[#e5e5e5] placeholder:text-[#2a2a2a] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors duration-120"
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
    info: "text-[#525252]",
    success: "text-green-400",
    warning: "text-amber-400",
    error: "text-red-400",
  };

  return (
    <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#525252]" />
          <span className="text-[13px] font-medium text-[#e5e5e5]">Live Log</span>
          {logs.length > 0 && (
            <span className="text-[10px] text-[#3a3a3a] font-mono">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="text-[11px] text-[#3a3a3a] hover:text-[#737373] transition-colors duration-120"
          >
            Clear
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="h-[200px] overflow-y-auto p-3 font-mono text-[11px] space-y-0.5"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px] text-[#2a2a2a]">
              Waiting for encryption process…
            </span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 animate-fade-in">
              <span className="text-[#2a2a2a] shrink-0">
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
  const downloadFile = useCallback(() => {
    if (!file.encryptedContent) return;
    const blob = new Blob([file.encryptedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(".lua", "_encrypted.lua");
    a.click();
    URL.revokeObjectURL(url);
  }, [file]);

  const copyToClipboard = useCallback(async () => {
    if (!file.encryptedContent) return;
    try {
      await navigator.clipboard.writeText(file.encryptedContent);
    } catch {
      // Fallback: do nothing
    }
  }, [file]);

  if (file.status !== "done") return null;

  return (
    <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] p-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        <span className="text-[12px] text-[#e5e5e5] font-mono truncate flex-1">
          {file.name}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-[#181818] rounded-lg p-2">
          <span className="text-[10px] text-[#3a3a3a] block">Original</span>
          <span className="text-[12px] text-[#a3a3a3] font-mono">
            {formatBytes(file.originalSize)}
          </span>
        </div>
        <div className="bg-[#181818] rounded-lg p-2">
          <span className="text-[10px] text-[#3a3a3a] block">Encrypted</span>
          <span className="text-[12px] text-[#a3a3a3] font-mono">
            {formatBytes(file.encryptedSize)}
          </span>
        </div>
        <div className="bg-[#181818] rounded-lg p-2">
          <span className="text-[10px] text-[#3a3a3a] block">Reduction</span>
          <span className="text-[12px] text-[#a3a3a3] font-mono">
            {calcReduction(file.originalSize, file.encryptedSize)}
          </span>
        </div>
        <div className="bg-[#181818] rounded-lg p-2">
          <span className="text-[10px] text-[#3a3a3a] block">Time</span>
          <span className="text-[12px] text-[#a3a3a3] font-mono">
            {formatMs(file.encryptionTime)}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={downloadFile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5e5e5] text-[#090909] text-[11px] font-medium hover:bg-[#d4d4d4] transition-colors duration-120"
        >
          <Download className="w-3 h-3" />
          Download
        </button>
        <button
          onClick={() => onPreview(file)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[var(--color-border)] text-[11px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[var(--color-border)] text-[11px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
        >
          <Copy className="w-3 h-3" />
          Copy
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
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-[13px] font-medium text-[#e5e5e5] truncate">
            {file.name}
          </span>
          <button
            onClick={onClose}
            className="text-[#525252] hover:text-[#e5e5e5] transition-colors duration-120 text-lg"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-[11px] font-mono text-[#a3a3a3] whitespace-pre-wrap break-all leading-relaxed">
            {file.encryptedContent}
          </pre>
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
          errors.push(`${f.name}: Not a .lua file`);
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
    log("info", `Starting encryption of ${pending.length} file(s)`);
    let completed = 0;

    for (const fileItem of pending) {
      try {
        updateFile(fileItem.id, { status: "validating", progress: 10 });
        log("info", "Validating file…", fileItem.name);

        await new Promise((r) => setTimeout(r, 100));
        updateFile(fileItem.id, { status: "encrypting", progress: 30 });
        log("info", "Scanning source…", fileItem.name);

        await new Promise((r) => setTimeout(r, 80));
        log("info", "Encrypting…", fileItem.name);
        updateFile(fileItem.id, { progress: 50 });

        const formData = new FormData();
        formData.append("file", fileItem.file);
        formData.append("settings", JSON.stringify(settings));

        const res = await fetch("/api/encrypt", {
          method: "POST",
          body: formData,
        });

        updateFile(fileItem.id, { progress: 80 });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Encryption failed");
        }

        const data = await res.json();
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
      title: "Encryption Complete",
      message: `${completed}/${pending.length} files encrypted successfully`,
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
      a.download = f.name.replace(".lua", "_encrypted.lua");
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
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "border-2 border-dashed rounded-[10px] transition-all duration-180 flex flex-col items-center justify-center min-h-[180px] cursor-pointer",
              dragOver
                ? "border-[#e5e5e5]/30 bg-[#e5e5e5]/[0.02]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[#111111]"
            )}
            onClick={() => inputRef.current?.click()}
          >
            <Upload
              className={cn(
                "w-8 h-8 mb-3 transition-colors duration-180",
                dragOver ? "text-[#e5e5e5]" : "text-[#2a2a2a]"
              )}
            />
            <p className="text-[13px] text-[#737373] mb-1">
              Drop .lua files here or{" "}
              <span className="text-[#a3a3a3] underline underline-offset-2">browse</span>
            </p>
            <p className="text-[11px] text-[#3a3a3a]">
              Supports batch upload up to 500+ files · Max 10MB per file
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[var(--color-border)] text-[11px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
              >
                <File className="w-3 h-3" />
                Files
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  folderRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[var(--color-border)] text-[11px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
              >
                <FolderOpen className="w-3 h-3" />
                Folder
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".lua"
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
            accept=".lua"
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
            <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-[#e5e5e5]">
                    Queue
                  </span>
                  <span className="text-[11px] text-[#3a3a3a] font-mono">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                  {isProcessing && (
                    <span className="text-[11px] text-[#525252]">
                      {totalProgress}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {doneCount > 0 && (
                    <button
                      onClick={downloadAll}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e5e5e5] text-[#090909] text-[11px] font-medium hover:bg-[#d4d4d4] transition-colors duration-120"
                    >
                      <Download className="w-3 h-3" />
                      All
                    </button>
                  )}
                  {!isProcessing && pendingCount > 0 && (
                    <button
                      onClick={processQueue}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e5e5e5] text-[#090909] text-[11px] font-medium hover:bg-[#d4d4d4] transition-colors duration-120"
                    >
                      Encrypt {pendingCount}
                    </button>
                  )}
                  {!isProcessing && (
                    <button
                      onClick={clearFiles}
                      className="text-[#3a3a3a] hover:text-[#737373] transition-colors duration-120"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isProcessing && (
                <div className="h-[2px] bg-[#181818]">
                  <div
                    className="h-full bg-[#e5e5e5] transition-all duration-240"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto divide-y divide-[var(--color-border)]">
                {files.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#141414] transition-colors duration-120 animate-fade-in"
                    style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}
                  >
                    <div className="shrink-0">
                      {f.status === "done" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : f.status === "error" ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      ) : f.status === "encrypting" || f.status === "validating" ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#a3a3a3] animate-spin" />
                      ) : (
                        <File className="w-3.5 h-3.5 text-[#3a3a3a]" />
                      )}
                    </div>
                    <span className="text-[12px] text-[#a3a3a3] font-mono truncate flex-1">
                      {f.name}
                    </span>
                    <span className="text-[11px] text-[#3a3a3a] shrink-0">
                      {formatBytes(f.size)}
                    </span>
                    {f.status === "encrypting" || f.status === "validating" ? (
                      <div className="w-16 h-1 bg-[#181818] rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#a3a3a3] transition-all duration-180 rounded-full"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    ) : null}
                    {f.error && (
                      <span className="text-[10px] text-red-400 shrink-0 max-w-[100px] truncate">
                        {f.error}
                      </span>
                    )}
                    {!isProcessing && (
                      <button
                        onClick={() => removeFile(f.id)}
                        className="text-[#2a2a2a] hover:text-[#737373] transition-colors duration-120 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
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
              <span className="text-[13px] font-medium text-[#e5e5e5]">Output</span>
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
