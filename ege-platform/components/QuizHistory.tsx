"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ListChecks, X } from "lucide-react";
import { fetchQuizResults } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { QuizResult } from "@/types";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuizHistory() {
  const { isSignedIn } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetchQuizResults()
      .then((data) => {
        if (!cancelled) setQuizzes(data);
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
        <ListChecks size={20} className="text-accent" /> Квизы
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-muted">Загружаем…</p>
      ) : quizzes.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Вы ещё не проходили квизы. Пройдите квиз — он появится здесь с
          разбором.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {quizzes.map((quiz) => {
            const isOpen = openId === quiz.id;
            const percent =
              quiz.total === 0
                ? 0
                : Math.round((quiz.correct / quiz.total) * 100);
            return (
              <div
                key={quiz.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : quiz.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-background/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{quiz.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(quiz.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-sm">
                    <span className="font-semibold tabular-nums">
                      {quiz.correct}/{quiz.total}
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
                    <ChevronDown
                      size={18}
                      className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-3 border-t border-border p-5">
                    {quiz.rows.map((row, index) => {
                      const pickedText =
                        row.picked.length > 0
                          ? row.picked.map((i) => row.options[i]).join(", ")
                          : row.expired
                            ? "Не успел ответить"
                            : "Без ответа";
                      const correctText = row.correct
                        .map((i) => row.options[i])
                        .join(", ");
                      return (
                        <div
                          key={index}
                          className={`rounded-2xl border p-4 ${
                            row.isCorrect
                              ? "border-green-500/40 bg-green-500/5"
                              : "border-red-500/40 bg-red-500/5"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                                row.isCorrect ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {row.isCorrect ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                            </span>
                            <p className="text-sm font-medium">
                              {index + 1}. {row.question}
                            </p>
                          </div>
                          <div className="mt-2 pl-7 text-sm">
                            <p
                              className={
                                row.isCorrect ? "text-muted" : "text-red-500"
                              }
                            >
                              Ваш ответ: {pickedText}
                            </p>
                            {!row.isCorrect && (
                              <p className="mt-1 text-green-600 dark:text-green-400">
                                Верный: {correctText}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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