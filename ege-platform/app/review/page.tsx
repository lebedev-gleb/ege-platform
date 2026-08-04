"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  LogIn,
  PartyPopper,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DifficultyBadge from "@/components/DifficultyBadge";
import { fetchProgress, reviewAnswerApi } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useNow } from "@/hooks/useNow";
import { useAuth } from "@/hooks/useAuth";
import { startYandexLogin } from "@/lib/auth";
import type { ReviewResult } from "@/types";

export default function ReviewPage() {
  const { isSignedIn } = useAuth();
  const tasks = useTasksStore((state) => state.tasks);
  const mistakes = useAppStore((state) => state.mistakes);
  const setProgress = useAppStore((state) => state.setProgress);
  const hydrated = useHydrated();
  const nowTs = useNow();

  const [queue, setQueue] = useState<string[] | null>(null);
  const [stage, setStage] = useState<"answering" | "feedback">("answering");
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<ReviewResult | null>(null);

  const deck = Object.values(mistakes).filter((item) => {
    const task = tasks.find((t) => t.id === item.taskId);
    return task !== undefined && task.kind !== "code";
  });
  const dueList =
    nowTs === 0
      ? []
      : deck
          .filter((item) => item.dueAt <= nowTs)
          .sort((a, b) => a.dueAt - b.dueAt);
  const upcoming = deck
    .filter((item) => item.dueAt > nowTs)
    .sort((a, b) => a.dueAt - b.dueAt)[0];

  const currentTaskId = queue && queue.length > 0 ? queue[0] : null;
  const currentTask = currentTaskId
    ? tasks.find((t) => t.id === currentTaskId)
    : undefined;
  const sessionFinished = queue !== null && queue.length === 0;

  function startSession() {
    setQueue(dueList.map((item) => item.taskId));
    setStage("answering");
    setValue("");
    setFeedback(null);
  }

  // Перезабрать прогресс с сервера — вызываем после КАЖДОГО ответа,
  // чтобы состояние колоды всегда совпадало с сервером (даже если выйти).
  async function refreshProgress() {
    try {
      const progress = await fetchProgress();
      setProgress(progress.taskResults, progress.mistakes);
    } catch {
      // не критично: обновится при следующей загрузке
    }
  }

  async function handleCheck() {
    if (!currentTask || checking || value.trim() === "") return;
    setChecking(true);
    try {
      const result = await reviewAnswerApi(currentTask.id, value);
      setFeedback(result);
      setStage("feedback");
      // Сразу синхронизируемся с сервером: due_at и интервал уже обновлены там
      await refreshProgress();
    } catch {
      toast.error("Не удалось отправить ответ", {
        description: "Проверьте, запущен ли бэкенд (go run .)",
      });
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    if (!queue || !currentTaskId || !feedback) return;
    const rest = queue.slice(1);
    // Ошибся — карточка вернётся в конец сегодняшней очереди
    setQueue(feedback.correct ? rest : [...rest, currentTaskId]);
    setStage("answering");
    setValue("");
    setFeedback(null);
  }

  return (
    <div className="py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/my-courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} /> Мои курсы
        </Link>
        <div className="mt-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Работа над ошибками
          </h1>
          <p className="mt-2 text-muted">
            Верный ответ увеличивает интервал повторения, ошибка возвращает
            задание в начало.
          </p>
        </div>

        {!isSignedIn ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border p-14 text-center">
            <p className="font-medium">Войдите, чтобы повторять ошибки</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Колода повторений привязана к вашему аккаунту.
            </p>
            <button
              onClick={startYandexLogin}
              className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              <LogIn size={15} /> Войти
            </button>
          </div>
        ) : (
          hydrated &&
          nowTs !== 0 && (
            <div className="mt-8">
              {queue === null ? (
                dueList.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border p-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Brain size={22} />
                    </div>
                    <p className="mt-5 text-lg font-medium">
                      На сегодня повторений нет
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                      {deck.length === 0
                        ? "В колоде пусто: вы пока не ошибались. Решайте задачи — если что, они появятся здесь."
                        : upcoming
                          ? `Следующее повторение: ${new Date(upcoming.dueAt).toLocaleDateString("ru-RU")}.`
                          : "Возвращайтесь позже."}
                    </p>
                    <Link
                      href="/catalog"
                      className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
                    >
                      Решать задачи
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-border bg-surface p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Brain size={22} />
                    </div>
                    <p className="mt-5 text-3xl font-semibold tracking-tight">
                      {dueList.length}
                    </p>
                    <p className="mt-1 text-muted">
                      заданий готово к повторению
                    </p>
                    <button
                      onClick={startSession}
                      className="mx-auto mt-6 flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      Начать повторение
                    </button>
                  </div>
                )
              ) : sessionFinished ? (
                <div className="rounded-3xl border border-green-500/40 bg-green-500/5 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-white">
                    <PartyPopper size={22} />
                  </div>
                  <p className="mt-5 text-lg font-medium">
                    Все повторения на сегодня выполнены!
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                    Задания вернутся, когда придёт время следующего интервала.
                  </p>
                  <Link
                    href="/my-courses"
                    className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
                  >
                    К моим курсам
                  </Link>
                </div>
              ) : currentTask ? (
                <div>
                  <p className="text-center text-sm text-muted">
                    Осталось в очереди: {queue.length}
                  </p>
                  <div className="mt-3 rounded-3xl border border-border bg-surface p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        Задание {currentTask.egeNumber}
                      </span>
                      <DifficultyBadge difficulty={currentTask.difficulty} />
                      <span className="text-xs text-muted">
                        #{currentTask.id}
                      </span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap leading-relaxed">
                      {currentTask.statement}
                    </p>

                    <input
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        if (stage === "answering") handleCheck();
                        else handleNext();
                      }}
                      disabled={stage === "feedback" || checking}
                      placeholder="Ответ"
                      className={`mt-5 h-11 w-full rounded-full border bg-background px-5 text-sm outline-none transition-colors placeholder:text-muted ${
                        stage === "feedback" && feedback
                          ? feedback.correct
                            ? "border-green-500"
                            : "border-red-500"
                          : "border-border focus:border-accent"
                      }`}
                    />

                    {stage === "feedback" && feedback && (
                      <div
                        className={`mt-4 rounded-2xl border p-4 text-sm ${
                          feedback.correct
                            ? "border-green-500/40 bg-green-500/5"
                            : "border-red-500/40 bg-red-500/5"
                        }`}
                      >
                        <p
                          className={`flex items-center gap-2 font-medium ${
                            feedback.correct
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500"
                          }`}
                        >
                          {feedback.correct ? (
                            <Check size={15} />
                          ) : (
                            <X size={15} />
                          )}
                          {feedback.correct ? "Верно!" : "Неверно"}
                        </p>
                        {!feedback.correct && (
                          <p className="mt-1 text-muted">
                            Правильный ответ: {feedback.correctAnswer}. Задание
                            вернётся в конце сегодняшней очереди.
                          </p>
                        )}
                        {feedback.correct && (
                          <p className="mt-1 text-muted">
                            {feedback.learned
                              ? "Лестница пройдена — задание выучено и покидает колоду 🎉"
                              : `Следующее повторение через ${feedback.nextDays} дн.`}
                          </p>
                        )}
                      </div>
                    )}

                    {stage === "answering" ? (
                      <button
                        onClick={handleCheck}
                        disabled={value.trim() === "" || checking}
                        className="mt-5 flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                      >
                        {checking ? "Проверяем…" : "Проверить"}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      >
                        Далее <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  );
}