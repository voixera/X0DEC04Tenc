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
      "Navigate to the Encrypt page from the sidebar. You will see a large drop zone in the center of the page.",
      "Drag and drop your .lua files directly onto the drop zone. Alternatively, click the \"Files\" button to open a file picker, or click \"Folder\" to select an entire directory.",
      "Only files with the .lua extension are accepted. Each file must be under 10MB in size. Empty files are automatically rejected.",
      "You can add up to 500+ files in a single batch. Files are queued and processed sequentially to maintain system stability.",
      "After files are added, they appear in the queue list below the drop zone with their names and sizes. You can remove individual files before starting encryption.",
    ],
  },
  {
    id: "encrypt",
    title: "Encrypting Files",
    content: [
      "Before starting encryption, configure your settings in the panel on the right side. Each setting controls a specific aspect of the encryption process.",
      "Click the \"Encrypt\" button in the queue header to begin processing. Files are encrypted one by one in the order they were added.",
      "The Live Log at the bottom of the page shows real-time progress for each file: validation, scanning, encrypting, optimizing, and completion.",
      "Each file goes through five stages: validation (checking format and size), analysis (parsing the Lua source), encryption (applying all selected transformations), optimization (finalizing the output), and completion.",
      "If a file fails during encryption, it will be marked with an error indicator and the error message will appear in the log. Other files in the queue continue processing normally.",
    ],
  },
  {
    id: "download",
    title: "Downloading Results",
    content: [
      "After encryption completes, each file shows an output card with four metrics: original size, encrypted size, size change, and processing time.",
      "Click the \"Download\" button on any output card to save the encrypted file. The filename will have \"_encrypted\" appended before the extension.",
      "Use the \"Copy\" button to copy the encrypted output directly to your clipboard for quick pasting.",
      "Click \"Preview\" to open a modal showing the full encrypted output. This is useful for quick inspection without downloading.",
      "If you encrypted multiple files, use the \"All\" button in the queue header to download every completed file at once.",
    ],
  },
  {
    id: "settings",
    title: "Encryption Settings",
    content: [
      "Rename Variables / Functions / Locals: Replaces identifiers with random strings. This is the primary obfuscation method. Lua keywords and built-in functions are preserved automatically.",
      "Encrypt Strings: Each string literal is encrypted using AES-128-GCM with a unique key per string. A lightweight decryption runtime is injected into the output.",
      "Encode Constants: Numeric literals are replaced with equivalent expressions (e.g., 42 becomes (87-45)) to prevent simple pattern matching.",
      "Remove Comments: Strips all single-line (--) and multi-line (--[[ ]]) comments. This reduces file size and removes developer notes from the output.",
      "Compress Output: Joins all lines into a single semicolon-separated line. Produces the most compact output but reduces readability for debugging.",
      "Protect Globals: Wraps the code in a sandboxed environment using setmetatable. Prevents unintended global variable leaks.",
      "Minify: Removes unnecessary whitespace and empty lines before applying other transformations.",
      "Layered Encryption: Encodes the entire output in Base64 and wraps it in a loader function. Adds an extra layer of protection at the cost of slightly larger output.",
      "Random Identifier Length: Controls how long generated identifiers are (4–32 characters). Longer identifiers are harder to guess but increase file size.",
    ],
  },
  {
    id: "security",
    title: "Security Tips",
    content: [
      "Always enable Rename Variables, Rename Functions, and Encrypt Strings together for maximum protection. These three settings form the core obfuscation layer.",
      "Enable Layered Encryption for distribution builds. The additional Base64 encoding prevents casual inspection of the encrypted code structure.",
      "Use Protect Globals to prevent your code from accidentally modifying the global environment. This is especially important for scripts running in shared environments.",
      "Increase the Random Identifier Length to 16 or higher for production deployments. Shorter identifiers are easier to brute-force map back to original names.",
      "Never rely on obfuscation alone for security. X0DEC04T Encrypt makes reverse engineering significantly harder, but no obfuscation is theoretically unbreakable.",
      "Keep your original source files in a secure location. The encryption process is one-way — there is no built-in decryption tool.",
      "All file processing happens server-side. Your files are not stored permanently — they are processed in memory and the encrypted output is returned immediately.",
    ],
  },
];

const faqItems: { q: string; a: string }[] = [
  {
    q: "What file formats are supported?",
    a: "X0DEC04T Encrypt exclusively supports .lua files. Other scripting languages are not currently supported. Ensure your files have the correct .lua extension before uploading.",
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
    q: "Can the encryption be reversed?",
    a: "The encryption process is designed to be one-way. While the code remains functionally equivalent, recovering the original source from the encrypted output requires significant effort.",
  },
  {
    q: "Why does my encrypted file become larger?",
    a: "Some settings, particularly Encrypt Strings and Layered Encryption, add decryption runtime code and encoded data that increase the overall file size. This is expected behavior and represents the security overhead.",
  },
  {
    q: "What Lua version is supported?",
    a: "The encryption engine supports Lua 5.1 through 5.4 syntax, as well as LuaJIT extensions. Standard Lua constructs are handled correctly.",
  },
  {
    q: "Do encrypted files run slower?",
    a: "There is minimal runtime overhead. String decryption adds a small initial cost when strings are first accessed, but this is typically negligible for most applications.",
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
          Complete guide for using X0DEC04T Encrypt effectively.
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
