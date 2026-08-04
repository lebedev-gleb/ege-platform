"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { fetchAuthorProgress, fetchAuthorQuizzes } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AuthorQuiz } from "@/types";

export default function AuthorQuizzesCarousel({
  onStart,
}: {
  onStart: (quizId: string, title: string) => void;
}) {
  const { isSignedIn } = useAuth();
  const [quizzes, setQuizzes] = useState<AuthorQuiz[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAuthorQuizzes().then((data) => {
      if (!cancelled) setQuizzes(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetchAuthorProgress()
      .then((data) => {
        if (!cancelled) setProgress(data.quizzes ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  function scroll(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function handleClick(quiz: AuthorQuiz) {
    const already = quiz.id in progress;
    if (already) {
      const ok = window.confirm(
        `Вы уже проходили этот квиз (${progress[quiz.id]}%). Пройти заново? Прежний результат сохранится в статистике.`
      );
      if (!ok) return;
    }
    onStart(quiz.id, quiz.title);
  }

  if (quizzes.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Авторские квизы</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Вперёд"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {quizzes.map((quiz) => {
          const solved = quiz.id in progress;
          const percent = progress[quiz.id] ?? 0;
          return (
            <button
              key={quiz.id}
              onClick={() => handleClick(quiz)}
              className="relative flex w-64 shrink-0 snap-start flex-col rounded-3xl border border-border bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-accent"
            >
              {solved && (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                  <Check size={14} />
                </span>
              )}
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <ListChecks size={20} />
              </span>
              <p className="mt-4 font-semibold tracking-tight">{quiz.title}</p>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">
                {quiz.description}
              </p>
              <p className="mt-3 text-xs text-muted">
                {quiz.questionIds.length} вопросов
              </p>

              {solved && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                    Решено на {percent}%
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}