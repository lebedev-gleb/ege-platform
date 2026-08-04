"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// ---------- Подсветка Python ----------
function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const TOKEN_REGEX =
  /(#.*$)|("[^"]*"|'[^']*')|\b(\d+)\b|\b(for|while|if|elif|else|def|return|break|continue|in|and|or|not|import|from|True|False|None|print|input|int|float|str|len|range|sum|min|max|abs|sorted|list)\b/gm;

function highlight(code: string) {
  return escapeHtml(code).replace(
    TOKEN_REGEX,
    (match, comment, str, num, word) => {
      if (comment)
        return `<span class="text-emerald-600">${match}</span>`;
      if (str) return `<span class="text-amber-600">${match}</span>`;
      if (num) return `<span class="text-violet-600">${match}</span>`;
      if (word) {
        const funcs = [
          "print", "input", "int", "float", "str", "len",
          "range", "sum", "min", "max", "abs", "sorted", "list",
        ];
        if (funcs.includes(match))
          return `<span class="text-sky-600">${match}</span>`;
        return `<span class="font-medium text-accent">${match}</span>`;
      }
      return match;
    }
  );
}

// ---------- Блок кода с копированием ----------
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#f6f8fa]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted">python</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <pre
        className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-[#24292f]"
        dangerouslySetInnerHTML={{ __html: highlight(code) }}
      />
    </div>
  );
}

// ---------- Рендер решения: текст + блоки кода ```...``` ----------
export default function SolutionContent({ text }: { text: string }) {
  const parts = text.split("```");

  return (
    <div className="flex flex-col gap-3">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // Блок кода. Убираем первую строку, если это название языка.
          const lines = part.replace(/^\n/, "").split("\n");
          const code = lines[0].trim().match(/^[a-z]+$/)
            ? lines.slice(1).join("\n")
            : part.replace(/^\n/, "");
          return <CodeBlock key={index} code={code.replace(/\n$/, "")} />;
        }
        const trimmed = part.trim();
        if (trimmed === "") return null;
        return (
          <p
            key={index}
            className="whitespace-pre-wrap text-sm leading-relaxed"
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}