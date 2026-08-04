"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock3, FileText, X } from "lucide-react";
import { fetchVariants } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { VariantAttempt } from "@/types";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VariantHistory() {
  const { isSignedIn } = useAuth();
  const [variants, setVariants] = useState<VariantAttempt[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetchVariants()
      .then((data) => {
        if (!cancelled) setVariants(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  if (!isSignedIn) return null;

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <FileText size={20} className="text-accent" /> Варианты
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-muted">Загружаем…</p>
      ) : variants.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Вы ещё не проходили варианты. Соберите вариант в каталоге и завершите
          его — он появится здесь.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {variants.map((variant) => {
            const isOpen = openId === variant.id;
            const percent =
              variant.total === 0
                ? 0
                : Math.round((variant.correct / variant.total) * 100);
            return (
              <div
                key={variant.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : variant.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-background/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{variant.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(variant.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-sm">
                    <span className="font-semibold tabular-nums">
                      {variant.correct}/{variant.total}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        percent >= 70
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : percent >= 40
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {percent}%
                    </span>
                    <span className="hidden items-center gap-1 text-muted sm:flex">
                      <Clock3 size={13} /> {formatTime(variant.seconds)}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="overflow-x-auto border-t border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                          <th className="px-5 py-3 font-medium">№</th>
                          <th className="px-5 py-3 font-medium">Задание</th>
                          <th className="px-5 py-3 font-medium">Ваш ответ</th>
                          <th className="px-5 py-3 font-medium">Верный</th>
                          <th className="px-5 py-3 text-center font-medium">
                            Итог
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {variant.rows.map((row, index) => (
                          <tr key={row.taskId}>
                            <td className="px-5 py-3 tabular-nums">
                              {index + 1}
                            </td>
                            <td className="px-5 py-3 text-muted">
                              ЕГЭ №{row.egeNumber} · #{row.taskId}
                            </td>
                            <td
                              className={`px-5 py-3 font-medium ${
                                row.draft === ""
                                  ? "text-muted"
                                  : row.correct
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-500"
                              }`}
                            >
                              {row.draft === "" ? "—" : row.draft}
                            </td>
                            <td className="px-5 py-3">
                              {row.correctAnswer ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${
                                  row.correct ? "bg-green-500" : "bg-red-500"
                                }`}
                              >
                                {row.correct ? (
                                  <Check size={13} />
                                ) : (
                                  <X size={13} />
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}