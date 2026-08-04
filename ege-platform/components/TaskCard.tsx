"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  LogIn,
  Play,
  Terminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import CodeEditor from "@/components/CodeEditor";
import DifficultyBadge from "@/components/DifficultyBadge";
import HintsPanel from "@/components/HintsPanel";
import SolutionContent from "@/components/SolutionContent";
import { runPython } from "@/lib/python";
import { fetchProgress, fetchSolution, submitAnswerApi } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuth } from "@/hooks/useAuth";
import { startYandexLogin } from "@/lib/auth";
import type { Task } from "@/types";
import TaskFiles from "@/components/TaskFiles";

type TaskCardProps = {
  task: Task;
  onNext?: () => void;
  showStats?: boolean;
  hideHelp?: boolean;
};

export default function TaskCard({
  task,
  onNext,
  showStats,
  hideHelp,
}: TaskCardProps) {
  const { isSignedIn } = useAuth();
  const taskResults = useAppStore((state) => state.taskResults);
  const setProgress = useAppStore((state) => state.setProgress);
  const hydrated = useHydrated();

  const isCode = task.kind === "code";

  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);

  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);

  // Редактор-решение для код-задач
  const [code, setCode] = useState(task.starterCode ?? "");
  const [output, setOutput] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Черновой редактор для обычных задач (не проверяется)
  const [editorOpen, setEditorOpen] = useState(false);
  const [scratch, setScratch] = useState("# черновик: посчитайте ответ\n");
  const [scratchOut, setScratchOut] = useState<string | null>(null);
  const [scratchErr, setScratchErr] = useState<string | null>(null);
  const [scratchRun, setScratchRun] = useState(false);

  const result = hydrated ? taskResults[task.id] : undefined;
  const solved = result?.solved ?? false;
  const attempts = result?.attempts ?? 0;
  const attempted = attempts > 0;
  const failed = attempted && !solved;

  async function toggleSolution() {
    if (solutionOpen) {
      setSolutionOpen(false);
      return;
    }
    setSolutionOpen(true);
    if (solution !== null) return;
    setLoadingSolution(true);
    try {
      const text = await fetchSolution(task.id);
      setSolution(text);
    } catch {
      setSolution("");
    } finally {
      setLoadingSolution(false);
    }
  }

  async function submit(answer: string) {
    const res = await submitAnswerApi(task.id, answer);
    const progress = await fetchProgress();
    setProgress(progress.taskResults, progress.mistakes);
    return res;
  }

  async function handleCheck() {
    if (solved || checking || value.trim() === "") return;
    setChecking(true);
    try {
      const res = await submit(value);
      if (res.correct) {
        setWrong(false);
        toast.success("Верно! Задача решена");
      } else {
        setWrong(true);
      }
    } catch {
      toast.error("Не удалось отправить ответ", {
        description: "Проверьте, запущен ли бэкенд (go run .)",
      });
    } finally {
      setChecking(false);
    }
  }

  async function handleRun() {
    if (solved || running) return;
    setRunning(true);
    setOutput(null);
    setRunError(null);
    setWrong(false);
    try {
      const res = await runPython(code);
      setOutput(res.output);
      if (res.error) {
        setRunError(res.error);
        await submit("");
        return;
      }
      const submitResult = await submit(res.output.trim());
      if (submitResult.correct) {
        toast.success("Верно! Вывод совпал с ожидаемым");
      } else {
        setWrong(true);
      }
    } catch (err) {
      setRunError(
        err instanceof Error ? err.message : "Не удалось запустить Python"
      );
    } finally {
      setRunning(false);
    }
  }

  // Черновой запуск: просто показать вывод, без проверки и записи
  async function runScratch() {
    if (scratchRun) return;
    setScratchRun(true);
    setScratchOut(null);
    setScratchErr(null);
    try {
      const res = await runPython(scratch);
      setScratchOut(res.output);
      if (res.error) setScratchErr(res.error);
    } catch (err) {
      setScratchErr(
        err instanceof Error ? err.message : "Не удалось запустить Python"
      );
    } finally {
      setScratchRun(false);
    }
  }

  return (
    <article className="rounded-3xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          Задание {task.egeNumber}
        </span>
        <DifficultyBadge difficulty={task.difficulty} />
        {isCode && (
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Terminal size={12} /> Python
          </span>
        )}
        <span className="text-xs text-muted">#{task.id}</span>
        {showStats && (
          <span
            className="rounded-full bg-border/60 px-2 py-0.5 text-xs font-medium text-muted"
            title="Доля принятых решений по всем пользователям"
          >
            {task.acceptance !== undefined
              ? `${task.acceptance}% решают`
              : "Не решали"}
          </span>
        )}
        {solved ? (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            <Check size={12} /> Решено
          </span>
        ) : failed ? (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
            <X size={12} /> Ошибка
          </span>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-wrap leading-relaxed">
        {task.statement}
      </p>
      <TaskFiles taskId={task.id} />

      {!isSignedIn ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Войдите, чтобы решать задачи и сохранять прогресс.
          </p>
          <button
            onClick={startYandexLogin}
            className="flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition-all hover:opacity-90"
          >
            <LogIn size={15} /> Войти
          </button>
        </div>
      ) : isCode ? (
        <div className="mt-5">
          <CodeEditor
            value={code}
            onChange={setCode}
            disabled={solved}
            starterCode={task.starterCode ?? ""}
          />
          <p className="mt-2 text-xs text-muted">
            Первый запуск скачивает среду Python (~10 МБ) и может занять до
            минуты. Дальше — мгновенно.
          </p>

          {(output !== null || runError) && (
            <div className="mt-3 rounded-2xl border border-border bg-[#0d1117] p-4">
              <p className="text-xs font-medium text-[#8b949e]">Вывод:</p>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-sm text-[#e6edf3]">
                {output || "(пусто)"}
              </pre>
              {runError && (
                <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-red-400">
                  {runError}
                </p>
              )}
            </div>
          )}

          {wrong && (
            <p className="mt-2 px-2 text-sm text-red-500">
              Вывод не совпал с ожидаемым. Проверьте программу и запустите ещё
              раз.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            {solved && onNext ? (
              <button
                onClick={onNext}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Далее <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={solved || running}
                className={`flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-all ${
                  solved
                    ? "cursor-default border border-border bg-background text-muted"
                    : "bg-accent text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                }`}
              >
                <Play size={16} />
                {running ? "Выполняю…" : solved ? "Решено" : "Запустить и проверить"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Черновой редактор кода — сворачиваемый, не проверяется */}
          <div className="mt-5">
            <button
              onClick={() => setEditorOpen((v) => !v)}
              className={`flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                editorOpen
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-accent hover:text-accent"
              }`}
            >
              <Code2 size={15} />
              {editorOpen ? "Скрыть редактор кода" : "Редактор кода"}
              <ChevronDown
                size={15}
                className={`transition-transform ${editorOpen ? "rotate-180" : ""}`}
              />
            </button>

            {editorOpen && (
              <div className="mt-3">
                <CodeEditor
                  value={scratch}
                  onChange={setScratch}
                  starterCode={"# черновик: посчитайте ответ\n"}
                />
                <p className="mt-2 text-xs text-muted">
                  Черновик для вычислений — вывод не проверяется. Ответ впишите
                  ниже.
                </p>
                <button
                  onClick={runScratch}
                  disabled={scratchRun}
                  className="mt-2 flex h-9 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                >
                  <Play size={14} /> {scratchRun ? "Выполняю…" : "Запустить"}
                </button>

                {(scratchOut !== null || scratchErr) && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-[#f6f8fa]">
                    <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted">
                      Вывод
                    </div>
                    <pre className="whitespace-pre-wrap p-4 font-mono text-sm text-[#24292f]">
                      {scratchOut || "(пусто)"}
                    </pre>
                    {scratchErr && (
                      <p className="whitespace-pre-wrap px-4 pb-4 font-mono text-xs text-red-500">
                        {scratchErr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ввод ответа */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setWrong(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCheck();
              }}
              disabled={solved}
              placeholder={solved ? "Решено" : "Ответ"}
              className={`h-11 flex-1 rounded-full border bg-background px-5 text-sm outline-none transition-colors placeholder:text-muted disabled:text-muted ${
                wrong ? "border-red-500" : "border-border focus:border-accent"
              }`}
            />
            {solved && onNext ? (
              <button
                onClick={onNext}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Далее <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleCheck}
                disabled={solved || checking}
                className={`h-11 shrink-0 rounded-full px-6 text-sm font-medium transition-all ${
                  solved
                    ? "cursor-default border border-border bg-background text-muted"
                    : "bg-accent text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                }`}
              >
                {checking ? "Проверяем…" : solved ? "Решено" : "Проверить"}
              </button>
            )}
          </div>
          {wrong && (
            <p className="mt-2 px-2 text-sm text-red-500">
              Неверно. Попробуйте ещё раз.
            </p>
          )}
        </>
      )}

      {/* Подсказки и решение */}
      {!hideHelp && isSignedIn && (
        <>
          <HintsPanel taskId={task.id} />

          {attempted && (
            <>
              <button
                onClick={toggleSolution}
                className={`mt-4 flex h-10 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors ${
                  solutionOpen
                    ? "border-accent text-accent"
                    : "border-border text-muted hover:border-accent hover:text-accent"
                }`}
              >
                <BookOpen size={15} />
                {loadingSolution
                  ? "Загружаем…"
                  : solutionOpen
                    ? "Скрыть решение"
                    : "Показать решение"}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${solutionOpen ? "rotate-180" : ""}`}
                />
              </button>

              {solutionOpen && (
                <div className="mt-3 rounded-2xl border border-border bg-background p-5">
                  {loadingSolution ? (
                    <p className="text-sm text-muted">Загружаем решение…</p>
                  ) : solution && solution.trim() !== "" ? (
                    <SolutionContent text={solution} />
                  ) : (
                    <p className="text-sm text-muted">
                      Для этой задачи решение пока не добавлено.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </article>
  );
}