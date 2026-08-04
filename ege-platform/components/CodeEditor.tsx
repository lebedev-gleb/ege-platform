"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const KEYWORDS = [
  "for", "while", "if", "elif", "else", "def", "return", "break",
  "continue", "in", "and", "or", "not", "import", "from", "True",
  "False", "None",
];
const FUNCTIONS = [
  "print", "input", "int", "float", "str", "len", "range", "sum",
  "min", "max", "abs", "sorted", "list", "map", "enumerate",
];
const ALL = Array.from(new Set([...KEYWORDS, ...FUNCTIONS])).sort();

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const TOKEN_REGEX =
  /(#.*$)|("[^"]*"|'[^']*')|\b(\d+)\b|\b(for|while|if|elif|else|def|return|break|continue|in|and|or|not|import|from|True|False|None)\b|\b(print|input|int|float|str|len|range|sum|min|max|abs|sorted|list|map|enumerate)\b/gm;

function highlight(code: string) {
  return escapeHtml(code).replace(
    TOKEN_REGEX,
    (m, comment, str, num, kw, fn) => {
      if (comment) return `<span class="text-emerald-600">${m}</span>`;
      if (str) return `<span class="text-amber-600">${m}</span>`;
      if (num) return `<span class="text-violet-600">${m}</span>`;
      if (kw) return `<span class="font-medium text-accent">${m}</span>`;
      if (fn) return `<span class="text-sky-600">${m}</span>`;
      return m;
    }
  );
}

function getCurrentWord(text: string, caret: number) {
  const before = text.slice(0, caret);
  const match = before.match(/[A-Za-z_]+$/);
  return match ? match[0] : "";
}

// Геометрия редактора (совпадает с классами ниже)
const LINE_H = 20; // leading-[20px]
const PAD = 12; // p-3
const GUTTER = 40; // w-10

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  starterCode?: string;
};

export default function CodeEditor({
  value,
  onChange,
  disabled,
  starterCode,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const [caret, setCaret] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [active, setActive] = useState(0);
  const [hidePopup, setHidePopup] = useState(false);
  const [charWidth, setCharWidth] = useState(7.8);
  const [copied, setCopied] = useState(false);

  // Измеряем ширину моноширинного символа (для позиции подсказок)
  useEffect(() => {
    if (measureRef.current) {
      setCharWidth(measureRef.current.getBoundingClientRect().width / 10);
    }
  }, []);

  const lines = value.split("\n");
  const word = getCurrentWord(value, caret);
  const suggestions =
    !disabled && !hidePopup && word.length >= 1
      ? ALL.filter((w) => w.startsWith(word) && w !== word).slice(0, 6)
      : [];

  // Держим активный индекс в границах текущего списка (без эффекта).
  // Если он вышел за пределы — считаем активным первый пункт.
  const activeIndex = active < suggestions.length ? active : 0;

  // Позиция курсора (строка/столбец) → координаты подсказки
  const before = value.slice(0, caret);
  const rowsArr = before.split("\n");
  const row = rowsArr.length - 1;
  const col = rowsArr[rowsArr.length - 1].length;
  const popupTop = PAD + (row + 1) * LINE_H - scrollTop + 2;
  const popupLeft = GUTTER + PAD + col * charWidth;

  function syncScroll() {
    const ta = textareaRef.current;
    if (!ta) return;
    setScrollTop(ta.scrollTop);
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }

  function syncCaret() {
    const ta = textareaRef.current;
    if (ta) setCaret(ta.selectionStart);
  }

  function accept(w: string) {
    const start = caret - word.length;
    const isFn = FUNCTIONS.includes(w);
    const insert = isFn ? `${w}()` : w;
    const next = value.slice(0, start) + insert + value.slice(caret);
    onChange(next);
    const newCaret = start + w.length + (isFn ? 1 : 0);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = newCaret;
      setCaret(newCaret);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        accept(suggestions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setHidePopup(true);
        return;
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const en = ta.selectionEnd;
      onChange(value.slice(0, s) + "    " + value.slice(en));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 4;
        setCaret(s + 4);
      });
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Код скопирован");
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#f6f8fa]">
      {/* Шапка */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted">python</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyCode}
            title="Скопировать"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
          {starterCode !== undefined && !disabled && (
            <button
              type="button"
              onClick={() => onChange(starterCode)}
              title="Вернуть заготовку"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-foreground"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Тело */}
      <div className="relative flex h-52">
        <div
          ref={gutterRef}
          className="w-10 shrink-0 select-none overflow-hidden border-r border-border py-3 text-right font-mono text-[13px] leading-[20px] text-muted/60"
        >
          {lines.map((_, i) => (
            <div key={i} className="pr-2">
              {i + 1}
            </div>
          ))}
          <div className="h-40" />
        </div>

        <div className="relative flex-1">
          <div
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <pre
              className="min-h-full whitespace-pre p-3 font-mono text-[13px] leading-[20px] text-[#24292f]"
              dangerouslySetInnerHTML={{ __html: highlight(value) + "\n" }}
            />
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            wrap="off"
            spellCheck={false}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              setCaret(e.target.selectionStart);
              setHidePopup(false);
            }}
            onKeyDown={onKeyDown}
            onKeyUp={syncCaret}
            onClick={syncCaret}
            onSelect={syncCaret}
            onScroll={syncScroll}
            className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent p-3 font-mono text-[13px] leading-[20px] text-transparent caret-[#24292f] outline-none disabled:opacity-70"
          />

          {/* Подсказки как у Яндекса */}
          {suggestions.length > 0 && (
            <div
              className="absolute z-20 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
              style={{ top: popupTop, left: popupLeft }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    accept(s);
                  }}
                  className={`flex w-full items-center gap-2 px-2.5 py-1 text-left font-mono text-[13px] ${
                    i === activeIndex
                      ? "bg-accent text-white"
                      : "text-foreground hover:bg-surface"
                  }`}
                >
                  <span
                    className={`rounded px-1 text-[10px] ${
                      i === activeIndex ? "bg-white/20" : "bg-border text-muted"
                    }`}
                  >
                    abc
                  </span>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Невидимый измеритель ширины символа */}
          <span
            ref={measureRef}
            className="invisible absolute left-0 top-0 font-mono text-[13px]"
          >
            MMMMMMMMMM
          </span>
        </div>
      </div>
    </div>
  );
}