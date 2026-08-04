"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  LogIn,
  Printer,
  RotateCcw,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import DifficultyBadge from "@/components/DifficultyBadge";
import { useTasksStore } from "@/store/useTasksStore";
import {
  fetchProgress,
  saveVariantApi,
  submitAnswerApi,
} from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useNow } from "@/hooks/useNow";
import { useAuth } from "@/hooks/useAuth";
import { startYandexLogin } from "@/lib/auth";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

type Phase = "running" | "result";

type ResultRow = {
  taskId: string;
  egeNumber: number;
  draft: string;
  correct: boolean;
  correctAnswer: string | null;
};

export default function VariantPage() {
  const { isSignedIn } = useAuth();
  const tasks = useTasksStore((state) => state.tasks);
  const variantTaskIds = useAppStore((state) => state.variantTaskIds);
  const variantTitle = useAppStore((state) => state.variantTitle);
  const variantSourceId = useAppStore((state) => state.variantSourceId);
  const setProgress = useAppStore((state) => state.setProgress);
  const hydrated = useHydrated();
  const nowTs = useNow();

  const [phase, setPhase] = useState<Phase>("running");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState(0);
  const [finishedSeconds, setFinishedSeconds] = useState(0);
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);
  const [finishing, setFinishing] = useState(false);

  const variantTasks = variantTaskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task) => task !== undefined);

  const currentTask =
    variantTasks.find((t) => t.id === currentTaskId) ?? variantTasks[0];
  const currentIndex = currentTask
    ? variantTasks.findIndex((t) => t.id === currentTask.id)
    : 0;

  // Старт отсчёта при первом «живом» тике часов (0:00 без рассинхрона)
  if (
    startedAt === 0 &&
    nowTs !== 0 &&
    variantTasks.length > 0 &&
    phase === "running"
  ) {
    setStartedAt(nowTs);
  }

  const elapsedSeconds =
    startedAt === 0 ? 0 : Math.max(0, Math.floor((nowTs - startedAt) / 1000));
  const answeredCount = variantTasks.filter(
    (task) => (drafts[task.id] ?? "").trim() !== ""
  ).length;

  const correctCount = resultRows.filter((row) => row.correct).length;
  const percent =
    resultRows.length === 0
      ? 0
      : Math.round((correctCount / resultRows.length) * 100);

  function goToTask(offset: number) {
    if (variantTasks.length === 0) return;
    const nextIndex =
      (currentIndex + offset + variantTasks.length) % variantTasks.length;
    setCurrentTaskId(variantTasks[nextIndex].id);
  }

  async function finishVariant() {
    if (
      answeredCount < variantTasks.length &&
      !window.confirm(
        `Отвечено ${answeredCount} из ${variantTasks.length}. Завершить вариант?`
      )
    ) {
      return;
    }
    setFinishing(true);
    const seconds = elapsedSeconds;
    try {
      const rows: ResultRow[] = [];
      for (const task of variantTasks) {
        const draft = (drafts[task.id] ?? "").trim();
        if (draft === "") {
          rows.push({
            taskId: task.id,
            egeNumber: task.egeNumber,
            draft: "",
            correct: false,
            correctAnswer: null,
          });
          continue;
        }
        const result = await submitAnswerApi(task.id, draft);
        rows.push({
          taskId: task.id,
          egeNumber: task.egeNumber,
          draft,
          correct: result.correct,
          correctAnswer: result.correctAnswer,
        });
      }
      setResultRows(rows);
      setFinishedSeconds(seconds);

      const progress = await fetchProgress();
      setProgress(progress.taskResults, progress.mistakes);

      // Сохраняем вариант в историю (для «Статистики»)
      try {
        await saveVariantApi({
          title: variantTitle || "Вариант",
          seconds,
          sourceId: variantSourceId,
          rows,
        });
      } catch {
        // не критично для показа результата
      }

      setPhase("result");
    } catch {
      toast.error("Не удалось проверить вариант", {
        description: "Проверьте, запущен ли бэкенд (go run .)",
      });
    } finally {
      setFinishing(false);
    }
  }

  function restart() {
    setDrafts({});
    setResultRows([]);
    setCurrentTaskId(variantTasks[0]?.id ?? null);
    setStartedAt(nowTs);
    setPhase("running");
  }

  function printVariant() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Браузер заблокировал окно печати", {
        description: "Разрешите всплывающие окна для этого сайта",
      });
      return;
    }
    const tasksHtml = variantTasks
      .map(
        (task, index) => `
      <div class="task">
        <p class="task-header">Задание ${index + 1} · ЕГЭ №${task.egeNumber} · #${task.id}</p>
        <p class="statement">${escapeHtml(task.statement)}</p>
        <p class="answer-line">Ответ: ____________________________</p>
      </div>`
      )
      .join("");
    printWindow.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(variantTitle || "Тренировочный вариант")}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 720px; margin: 40px auto; color: #111; padding: 0 16px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 28px; }
  .task { margin-bottom: 24px; page-break-inside: avoid; }
  .task-header { font-weight: bold; font-size: 13px; color: #444; margin: 0 0 6px; }
  .statement { font-size: 15px; line-height: 1.55; margin: 0; white-space: pre-wrap; }
  .answer-line { margin: 12px 0 0; font-size: 14px; }
</style>
</head>
<body>
<h1>${escapeHtml(variantTitle || "Тренировочный вариант")}</h1>
<p class="meta">Заданий: ${variantTasks.length} · ЕГЭ.Информатика · ${new Date().toLocaleDateString("ru-RU")}</p>
${tasksHtml}
</body>
</html>`);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="py-10">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> Каталог задач
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {variantTitle || "Вариант"}
      </h1>
      <p className="mt-2 text-muted">
        Экзаменационный режим: отвечайте в любом порядке, проверка — по кнопке
        «Завершить». Черновики ответов живут до перезагрузки страницы.
      </p>

      {hydrated &&
        (variantTasks.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Zap size={22} />
            </div>
            <p className="mt-5 text-lg font-medium">Вариант ещё не собран</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Откройте каталог: соберите случайный вариант в конструкторе или
              выберите авторский.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : phase === "running" && currentTask ? (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium tabular-nums">
                  <Clock3 size={14} /> {formatTime(elapsedSeconds)}
                </span>
                <span className="text-sm text-muted">
                  Отвечено: {answeredCount} из {variantTasks.length}
                </span>
              </div>
              <button
                onClick={printVariant}
                className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                <Printer size={14} /> Версия для печати
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {variantTasks.map((task, index) => {
                const isCurrent = task.id === currentTask.id;
                const hasAnswer = (drafts[task.id] ?? "").trim() !== "";
                return (
                  <button
                    key={task.id}
                    onClick={() => setCurrentTaskId(task.id)}
                    aria-label={`Задание ${index + 1}`}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-medium transition-all ${
                      isCurrent
                        ? "bg-accent text-white shadow-md shadow-accent/30"
                        : hasAnswer
                          ? "bg-accent/10 text-accent hover:bg-accent/20"
                          : "border border-border bg-surface text-muted hover:border-muted hover:text-foreground"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-3xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Задание {currentTask.egeNumber}
                </span>
                <DifficultyBadge difficulty={currentTask.difficulty} />
                <span className="text-xs text-muted">#{currentTask.id}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed">
                {currentTask.statement}
              </p>
              <input
                value={drafts[currentTask.id] ?? ""}
                onChange={(event) =>
                  setDrafts({
                    ...drafts,
                    [currentTask.id]: event.target.value,
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") goToTask(1);
                }}
                placeholder="Ответ"
                className="mt-5 h-11 w-full rounded-full border border-border bg-background px-5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => goToTask(1)}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                Следующее задание <ArrowRight size={16} />
              </button>

              {isSignedIn ? (
                <button
                  onClick={finishVariant}
                  disabled={finishing}
                  className="flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {finishing ? "Проверяем…" : "Завершить вариант"}
                </button>
              ) : (
                <button
                  onClick={startYandexLogin}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90"
                >
                  <LogIn size={15} /> Войти, чтобы завершить
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="rounded-3xl border border-border bg-surface p-8 text-center">
              <p className="text-4xl font-semibold tracking-tight">
                {correctCount} из {resultRows.length}
              </p>
              <p className="mt-1 text-muted">{percent}% верных ответов</p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium tabular-nums">
                <Clock3 size={14} /> Время решения: {formatTime(finishedSeconds)}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={restart}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
                >
                  <RotateCcw size={16} /> Решить заново
                </button>
                <button
                  onClick={printVariant}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  <Printer size={16} /> Печать
                </button>
                <Link
                  href="/catalog"
                  className="flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  Собрать новый
                </Link>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-4 font-medium">№</th>
                    <th className="px-5 py-4 font-medium">Задание</th>
                    <th className="px-5 py-4 font-medium">Ваш ответ</th>
                    <th className="px-5 py-4 font-medium">Правильный ответ</th>
                    <th className="px-5 py-4 text-center font-medium">Итог</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resultRows.map((row, index) => (
                    <tr key={row.taskId}>
                      <td className="px-5 py-4 font-medium tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        ЕГЭ №{row.egeNumber} · #{row.taskId}
                      </td>
                      <td
                        className={`px-5 py-4 font-medium ${
                          row.draft === ""
                            ? "text-muted"
                            : row.correct
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500"
                        }`}
                      >
                        {row.draft === "" ? "—" : row.draft}
                      </td>
                      <td className="px-5 py-4">{row.correctAnswer ?? "—"}</td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${
                            row.correct ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {row.correct ? <Check size={13} /> : <X size={13} />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Вариант сохранён — полный разбор доступен в «Статистике».
            </p>
          </div>
        ))}
    </div>
  );
}