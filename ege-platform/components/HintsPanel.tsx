"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { fetchHints } from "@/lib/api";

export default function HintsPanel({ taskId }: { taskId: string }) {
  const [hints, setHints] = useState<{ order: number; body: string }[]>([]);
  // Множество открытых подсказок (по номеру order)
  const [open, setOpen] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetchHints(taskId).then((data) => {
      if (!cancelled) setHints(data);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (hints.length === 0) return null;

  function toggle(order: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lightbulb size={15} className="text-amber-500" />
        Подсказки
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {hints.map((hint) => {
          const isOpen = open.has(hint.order);
          return (
            <div key={hint.order}>
              <button
                onClick={() => toggle(hint.order)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  isOpen
                    ? "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                    : "border-border bg-surface text-muted hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Lightbulb size={14} />
                  Подсказка {hint.order}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="mt-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-relaxed">
                  {hint.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}