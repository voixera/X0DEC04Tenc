"use client";

/**
 * A tiny, dependency-free tokeniser-highlighter for Lua/Luau snippets.
 *
 * This is presentation-only: it colours already-generated code for the
 * comparison UI. It never parses semantics and never mutates the source it is
 * given — it only wraps spans for display. If anything unexpected appears it
 * degrades to plain text.
 */

import { Fragment, type ReactNode } from "react";

type Kind = "keyword" | "string" | "number" | "comment" | "fn" | "ident" | "plain";

const KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then",
  "true", "until", "while", "continue", "export", "type",
]);

const CLASS: Record<Kind, string> = {
  keyword: "text-[#c98a54]",
  string: "text-[#9fb27a]",
  number: "text-[#c9a06b]",
  comment: "text-[#6b5747] italic",
  fn: "text-[#d6ab84]",
  ident: "text-[#e6d8c6]",
  plain: "text-[#b9a494]",
};

interface Node {
  kind: Kind;
  text: string;
}

/** Tokenise a small snippet into display spans. Best-effort, never throws. */
function scan(source: string): Node[] {
  const out: Node[] = [];
  let i = 0;
  const n = source.length;

  const push = (kind: Kind, text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ kind, text });
  };

  while (i < n) {
    const c = source[i];

    // Line comment
    if (c === "-" && source[i + 1] === "-") {
      let j = i + 2;
      if (source[j] === "[") {
        // long comment --[[ ]]
        const m = /^\[(=*)\[/.exec(source.slice(i + 2));
        if (m) {
          const close = "]" + m[1] + "]";
          const end = source.indexOf(close, i + 2 + m[0].length);
          const stop = end === -1 ? n : end + close.length;
          push("comment", source.slice(i, stop));
          i = stop;
          continue;
        }
      }
      let nl = source.indexOf("\n", i);
      if (nl === -1) nl = n;
      push("comment", source.slice(i, nl));
      i = nl;
      continue;
    }

    // Strings
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (source[j] === "\\") { j += 2; continue; }
        if (source[j] === c) { j++; break; }
        if (source[j] === "\n") break;
        j++;
      }
      push("string", source.slice(i, j));
      i = j;
      continue;
    }
    if (c === "[") {
      const m = /^\[(=*)\[/.exec(source.slice(i));
      if (m) {
        const close = "]" + m[1] + "]";
        const end = source.indexOf(close, i + m[0].length);
        const stop = end === -1 ? n : end + close.length;
        push("string", source.slice(i, stop));
        i = stop;
        continue;
      }
    }

    // Numbers
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(source[i + 1] || ""))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxX._eE+\-]/.test(source[j])) {
        // stop a trailing +/- not part of exponent
        if ((source[j] === "+" || source[j] === "-") && !/[eE]/.test(source[j - 1] || "")) break;
        j++;
      }
      push("number", source.slice(i, j));
      i = j;
      continue;
    }

    // Identifiers / keywords
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(source[j])) j++;
      const word = source.slice(i, j);
      if (KEYWORDS.has(word)) push("keyword", word);
      else if (source[j] === "(") push("fn", word);
      else push("ident", word);
      i = j;
      continue;
    }

    // Whitespace + punctuation
    push("plain", c);
    i++;
  }

  return out;
}

export function CodeSnippet({
  code,
  className,
}: {
  code: string;
  className?: string;
}): ReactNode {
  const nodes = scan(code);
  return (
    <pre className={className}>
      {nodes.map((node, idx) => (
        <Fragment key={idx}>
          <span className={CLASS[node.kind]}>{node.text}</span>
        </Fragment>
      ))}
    </pre>
  );
}
