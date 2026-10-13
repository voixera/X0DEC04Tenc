"use client";

import { useState } from "react";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  content: string[];
}

const sections: Section[] = [
  {
    id: "upload",
    title: "Uploading Files",
    content: [
      "Navigate to the Obfuscate page from the sidebar. You will see a large drop zone in the center of the page.",
      "Drag and drop your .lua or .luau files directly onto the drop zone. Alternatively, click the \"Files\" button to open a file picker, or click \"Folder\" to select an entire directory.",
      "Only files with the .lua or .luau extension are accepted. Each file must be under 10MB in size. Empty files are automatically rejected.",
      "You can add up to 500+ files in a single batch. Files are queued and processed sequentially to maintain system stability.",
      "After files are added, they appear in the queue list below the drop zone with their names and sizes. You can remove individual files before starting obfuscation.",
    ],
  },
  {
    id: "encrypt",
    title: "Obfuscating Files",
    content: [
      "Before starting, configure your settings in the panel on the right side. Each setting controls a specific transformation.",
      "Click the \"Obfuscate\" button in the queue header to begin processing. Files are processed one by one in the order they were added.",
      "The Live Log at the bottom of the page shows real-time progress for each file: validation, scanning, obfuscating, optimizing, and completion.",
      "If a file fails, it is marked with an error indicator and a clear diagnostic appears in the log. The original source is never replaced by partial output.",
    ],
  },
  {
    id: "download",
    title: "Downloading Results",
    content: [
      "After processing completes, each file shows an output card with four metrics: original size, protected size, size change, and processing time.",
      "Click the \"Download\" button on any output card to save the protected file. The filename will have \"_protected\" appended before the extension.",
      "Use the \"Copy\" button to copy the protected output directly to your clipboard for quick pasting.",
      "Click \"Preview\" to open a modal showing the full protected output. This is useful for quick inspection without downloading.",
      "If you processed multiple files, use the \"All\" button in the queue header to download every completed file at once.",
    ],
  },
  {
    id: "settings",
    title: "Obfuscation Settings",
    content: [
      "Rename Variables / Functions / Locals: Replaces identifiers with random strings. This is the primary obfuscation method. Renaming is scope-aware: Lua keywords, Roblox globals (game, workspace, Instance, Enum, ...) and standard-library names are preserved automatically.",
      "Encrypt Strings: Each non-empty string literal is replaced with an equivalent expression that reconstructs the original bytes at runtime using only string.char/string.byte/table.concat. This is reversible obfuscation, not encryption — it hides the text from casual reading.",
      "Encode Constants: Numeric integer literals are replaced with equivalent expressions (e.g., 42 becomes (87-45)) to prevent simple pattern matching.",
      "Remove Comments: Strips single-line (--) and long (--[[ ]]) comments. This reduces file size and removes developer notes from the output.",
      "Compress Output: Removes insignificant whitespace to produce a more compact single-block output. It never merges the branding header into the code body.",
      "Protect Globals: NOT SUPPORTED. The previous metatable sandbox produced invalid or broken Lua and has been disabled; enabling this toggle is a no-op.",
      "Minify: Removes unnecessary whitespace and empty lines before applying other transformations.",
      "Random Identifier Length: Controls how long generated identifiers are (4–32 characters). Longer identifiers are harder to guess but increase file size.",
    ],
  },
  {
    id: "security",
    title: "Security Tips",
    content: [
      "Always enable Rename Variables, Rename Functions, and Encrypt Strings together for best results. These three settings form the core obfuscation layer.",
      "Use Protect Globals only for documentation purposes — it is not supported and does nothing.",
      "Increase the Random Identifier Length to 16 or higher for production deployments. Shorter identifiers are easier to brute-force map back to original names.",
      "Never rely on obfuscation alone for security. Choco OBF makes reverse engineering harder, but no obfuscation is unbreakable, and none of these techniques are encryption.",
      "Keep your original source files in a secure location. Obfuscation is lossy to read but the behaviour is preserved — there is no built-in de-obfuscation tool.",
      "All file processing happens server-side. Your files are not stored permanently — they are processed in memory and the obfuscated output is returned immediately.",
    ],
  },
];

const faqItems: { q: string; a: string }[] = [
  {
    q: "What file formats are supported?",
    a: "Choco OBF supports .lua and .luau files. Ensure your files have the correct extension before uploading.",
  },
  {
    q: "Is there a file size limit?",
    a: "Yes, each individual file must be under 10MB. This limit ensures stable processing and prevents memory issues. If you have larger files, consider splitting them into modules.",
  },
  {
    q: "Can I encrypt multiple files at once?",
    a: "Yes. The batch system supports 500+ files in a single session. Files are queued and processed sequentially. You can monitor progress for each file in the queue and Live Log.",
  },
  {
    q: "Are my files stored on the server?",
    a: "File contents are processed in memory and never written to disk. Only metadata (filename, size, processing time) is stored in the history database for your reference.",
  },
  {
    q: "Can the obfuscation be reversed?",
    a: "Obfuscation is designed to make the source hard to read, not to encrypt it. The original names and structure are lost, but the runtime behaviour is preserved. There is no built-in de-obfuscation tool, though a determined reader can still reverse-engineer the output.",
  },
  {
    q: "Why does my protected file become larger?",
    a: "String encoding and identifier renaming add runtime code and generated data that increase the overall file size. This is expected and represents the obfuscation overhead.",
  },
  {
    q: "What Lua dialect is supported?",
    a: "Choco OBF targets Roblox Luau. It handles the Luau common subset, including long strings, numeric escapes and standard constructs. Luau-only syntax is preserved but must be validated in Roblox Studio.",
  },
  {
    q: "Do protected files run slower?",
    a: "There is minimal runtime overhead. Inline string decoding adds a small one-time cost when a string is first evaluated, but this is typically negligible for most applications.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#141414] transition-colors duration-120"
      >
        <span className="text-[13px] text-[#a3a3a3] font-medium pr-4">{q}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-[#3a3a3a] shrink-0 transition-transform duration-180",
            open ? "rotate-180" : ""
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 animate-fade-in">
          <p className="text-[12px] text-[#525252] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-[14px] font-semibold text-[#e5e5e5]">Documentation</h2>
        <p className="text-[12px] text-[#525252] mt-0.5">
          Complete guide for using Choco OBF effectively.
        </p>
      </div>

      {sections.map((section, sIdx) => (
        <div
          key={section.id}
          className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden animate-fade-in"
          style={{ animationDelay: `${sIdx * 60}ms` }}
        >
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-[13px] font-medium text-[#e5e5e5]">
              {section.title}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {section.content.map((paragraph, pIdx) => (
              <p
                key={pIdx}
                className="text-[12px] text-[#737373] leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-[#111111] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-[13px] font-medium text-[#e5e5e5]">
            Frequently Asked Questions
          </span>
        </div>
        {faqItems.map((item, idx) => (
          <FAQItem key={idx} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  );
}
