"use client";

import { useEncryptStore, useNotificationStore } from "@/lib/store";
import { RotateCcw } from "@/components/icons";
import { cn, generateId } from "@/lib/utils";
import type { EncryptionSettings } from "@/lib/types";

const settingsMeta: {
  key: keyof EncryptionSettings;
  label: string;
  description: string;
  type: "toggle" | "number" | "text";
}[] = [
  {
    key: "renameVariable",
    label: "Rename Variables",
    description:
      "Replaces all variable names with random identifiers to make the source unreadable.",
    type: "toggle",
  },
  {
    key: "renameFunction",
    label: "Rename Functions",
    description:
      "Obfuscates function names with randomly generated identifiers.",
    type: "toggle",
  },
  {
    key: "renameLocal",
    label: "Rename Locals",
    description:
      "Transforms local variable names into random strings.",
    type: "toggle",
  },
  {
    key: "encryptString",
    label: "Encrypt Strings",
    description:
      "Encrypts all string literals using authenticated per-string protection.",
    type: "toggle",
  },
  {
    key: "encodeConstant",
    label: "Encode Constants",
    description:
      "Replaces numeric literals with computed expressions to prevent pattern matching.",
    type: "toggle",
  },
  {
    key: "removeComments",
    label: "Remove Comments",
    description:
      "Strips all single-line and multi-line comments from the source code.",
    type: "toggle",
  },
  {
    key: "compressOutput",
    label: "Compress Output",
    description:
      "Joins all lines into a single semicolon-separated line for maximum compactness.",
    type: "toggle",
  },
  {
    key: "protectGlobal",
    label: "Protect Globals",
    description:
      "Sandboxes the global environment using a protected metatable proxy.",
    type: "toggle",
  },
  {
    key: "minify",
    label: "Minify",
    description:
      "Removes unnecessary whitespace and empty lines before encryption.",
    type: "toggle",
  },
  {
    key: "randomIdentifierLength",
    label: "Random Identifier Length",
    description:
      "Controls the character length of generated random identifiers (4–32).",
    type: "number",
  },
  {
    key: "outputFilename",
    label: "Output Filename",
    description:
      "Custom filename for the encrypted output. Leave empty to use original name with _encrypted suffix.",
    type: "text",
  },
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useEncryptStore();
  const { addNotification } = useNotificationStore();

  const applyVerySafePreset = () => {
    updateSettings({
      renameVariable: true,
      renameFunction: true,
      renameLocal: true,
      encryptString: true,
      encodeConstant: true,
      removeComments: true,
      compressOutput: false,
      protectGlobal: false,
      minify: false,
    });
    addNotification({
      id: generateId(),
      type: "success",
      title: "Very Safe Mode",
      message: "Applied a conservative preset focused on runtime stability",
    });
  };

  const applyLuraphStylePreset = () => {
    updateSettings({
      renameVariable: true,
      renameFunction: true,
      renameLocal: true,
      encryptString: true,
      encodeConstant: true,
      removeComments: true,
      compressOutput: true,
      protectGlobal: true,
      minify: true,
      randomIdentifierLength: 16,
    });
    addNotification({
      id: generateId(),
      type: "success",
      title: "Luraph Style",
      message: "Applied a compact layered obfuscation preset",
    });
  };

  const handleReset = () => {
    resetSettings();
    addNotification({
      id: generateId(),
      type: "info",
      title: "Settings Reset",
      message: "All encryption settings restored to defaults",
    });
  };

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-[#e5e5e5]">
            Encryption Configuration
          </h2>
          <p className="text-[12px] text-[#525252] mt-0.5">
            Configure how your Lua files are processed and encrypted.
          </p>
        </div>
        <button
          onClick={applyVerySafePreset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5e5e5] text-[#090909] text-[11px] font-medium hover:bg-[#d4d4d4] transition-all duration-120"
        >
          Very Safe Mode
        </button>
        <button
          onClick={applyLuraphStylePreset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[var(--color-border)] text-[11px] text-[#a3a3a3] hover:text-[#e5e5e5] transition-all duration-120"
        >
          Luraph Style
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] border border-[var(--color-border)] text-[11px] text-[#525252] hover:text-[#a3a3a3] transition-all duration-120"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden divide-y divide-[var(--color-border)]">
        {settingsMeta.map((meta, idx) => (
          <div
            key={meta.key}
            className="flex items-start justify-between px-4 py-4 hover:bg-[#141414] transition-colors duration-120 animate-fade-in"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex-1 mr-4">
              <span className="text-[13px] text-[#e5e5e5] font-medium">
                {meta.label}
              </span>
              <p className="text-[11px] text-[#525252] mt-0.5 leading-relaxed">
                {meta.description}
              </p>
            </div>
            <div className="shrink-0 mt-0.5">
              {meta.type === "toggle" ? (
                <button
                  onClick={() =>
                    updateSettings({
                      [meta.key]: !settings[meta.key],
                    } as Partial<EncryptionSettings>)
                  }
                  className={cn(
                    "w-9 h-5 rounded-full relative transition-colors duration-180",
                    settings[meta.key] ? "bg-[#e5e5e5]" : "bg-[#2a2a2a]"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-[3px] w-[14px] h-[14px] rounded-full transition-all duration-180",
                      settings[meta.key]
                        ? "left-[20px] bg-[#090909]"
                        : "left-[3px] bg-[#525252]"
                    )}
                  />
                </button>
              ) : meta.type === "number" ? (
                <input
                  type="number"
                  min={4}
                  max={32}
                  value={settings[meta.key] as number}
                  onChange={(e) =>
                    updateSettings({
                      [meta.key]: Math.max(
                        4,
                        Math.min(32, parseInt(e.target.value) || 8)
                      ),
                    } as Partial<EncryptionSettings>)
                  }
                  className="w-20 bg-[#181818] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[12px] text-[#e5e5e5] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors duration-120 text-center"
                />
              ) : (
                <input
                  type="text"
                  value={settings[meta.key] as string}
                  placeholder="auto"
                  onChange={(e) =>
                    updateSettings({
                      [meta.key]: e.target.value,
                    } as Partial<EncryptionSettings>)
                  }
                  className="w-40 bg-[#181818] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[12px] text-[#e5e5e5] placeholder:text-[#2a2a2a] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors duration-120"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
