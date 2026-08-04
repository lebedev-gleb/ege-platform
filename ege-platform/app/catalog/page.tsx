"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap } from "lucide-react";
import { toast } from "sonner";
import TaskCard from "@/components/TaskCard";
import AuthorVariantsCarousel from "@/components/AuthorVariantsCarousel";
import { shuffle } from "@/lib/shuffle";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useHydrated } from "@/hooks/useHydrated";
import type { Difficulty } from "@/types";

type StatusFilter = "all" | "solved" | "unsolved";
type DifficultyFilter = "all" | Difficulty;
type VariantDifficulty = "any" | Difficulty;

const difficultyOptions: { value: VariantDifficulty; label: string }[] = [
  { value: "any", label: "Любая" },
  { value: "easy", label: "Лёгкий" },
  { value: "medium", label: "Средний" },
  { value: "hard", label: "Сложный" },
];

export default function CatalogPage() {
  const router = useRouter();

  const [egeNumber, setEgeNumber] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [query, setQuery] = useState("");

  const [variantDifficulty, setVariantDifficulty] =
    useState<VariantDifficulty>("any");
  const [variantCount, setVariantCount] = useState(5);

  const tasks = useTasksStore((state) => state.tasks);
  const tasksLoaded = useTasksStore((state) => state.loaded);
  const taskResults = useAppStore((state) => state.taskResults);
  const setVariant = useAppStore((state) => state.setVariant);
  const hydrated = useHydrated();

  const egeNumbers = [...new Set(tasks.map((task) => task.egeNumber))].sort(
    (a, b) => a - b
  );

  function generateVariant() {
    const pool = tasks.filter((task) => {
      const isSolved = taskResults[task.id]?.solved ?? false;
      const matchesDifficulty =
        variantDifficulty === "any" || task.difficulty === variantDifficulty;
      return !isSolved && matchesDifficulty && task.kind !== "code";
    });

    if (pool.length === 0) {
      toast.error("Нерешённых задач с такими условиями не осталось", {
        description: "Попробуйте другую сложность",
      });
      return;
    }

    const picked = shuffle(pool).slice(0, Math.min(variantCount, pool.length));
    if (picked.length < variantCount) {
      toast.info(`Нерешённых задач хватило только на ${picked.length}`);
    }

    setVariant(
      picked.map((task) => task.id),
      "Случайный вариант"
    );
    router.push("/variant");
  }

  // Поиск: по тексту условия ИЛИ по id задачи (#14001, 14001)
  const normalizedQuery = query.trim().toLowerCase();
  const idQuery = normalizedQuery.replace("#", "");

  const filteredTasks = tasks.filter((task) => {
    const matchesNumber =
      egeNumber === "all" || task.egeNumber === Number(egeNumber);

    const matchesDifficulty =
      difficulty === "all" || task.difficulty === difficulty;

    const matchesQuery =
      normalizedQuery === "" ||
      task.statement.toLowerCase().includes(normalizedQuery) ||
      (idQuery !== "" && task.id.toLowerCase().includes(idQuery));

    const isSolved = hydrated && (taskResults[task.id]?.solved ?? false);
    const matchesStatus =
      status === "all" ||
      (status === "solved" && isSolved) ||
      (status === "unsolved" && !isSolved);

    return matchesNumber && matchesDifficulty && matchesQuery && matchesStatus;
  });

  return (
    <div className="py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Каталог задач</h1>
      <p className="mt-2 text-muted">
        Весь банк задач, конструктор случайного варианта и авторские подборки.
      </p>

      {/* ===== Конструктор варианта ===== */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Zap size={20} />
          </span>
          <div>
            <p className="font-semibold tracking-tight">Конструктор варианта</p>
            <p className="text-sm text-muted">
              Случайный набор из нерешённых задач. Проверка — в конце, как на
              экзамене.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted">Сложность</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVariantDifficulty(option.value)}
                  className={`h-9 rounded-full px-4 text-sm font-medium transition-all ${
                    variantDifficulty === option.value
                      ? "bg-accent text-white"
                      : "border border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted">Задач</p>
            <div className="mt-2 flex gap-2">
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setVariantCount(n)}
                  className={`h-9 w-11 rounded-full text-sm font-medium transition-all ${
                    variantCount === n
                      ? "bg-accent text-white"
                      : "border border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateVariant}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Zap size={16} /> Сгенерировать
          </button>
        </div>
      </div>

      {/* ===== Авторские варианты (карусель) ===== */}
      <AuthorVariantsCarousel />

      {/* ===== Фильтры каталога ===== */}
      <h2 className="mt-10 text-xl font-semibold tracking-tight">Все задачи</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select
          value={egeNumber}
          onChange={(event) => setEgeNumber(event.target.value)}
          className="h-11 rounded-full border border-border bg-surface px-4 text-sm outline-none"
        >
          <option value="all">Все номера</option>
          {egeNumbers.map((number) => (
            <option key={number} value={number}>
              Задание {number}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(event) =>
            setDifficulty(event.target.value as DifficultyFilter)
          }
          className="h-11 rounded-full border border-border bg-surface px-4 text-sm outline-none"
        >
          <option value="all">Любая сложность</option>
          <option value="easy">Лёгкий</option>
          <option value="medium">Средний</option>
          <option value="hard">Сложный</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="h-11 rounded-full border border-border bg-surface px-4 text-sm outline-none"
        >
          <option value="all">Все задачи</option>
          <option value="solved">Решённые</option>
          <option value="unsolved">Нерешённые</option>
        </select>

        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по условию или номеру (#14001)"
            className="h-11 w-full rounded-full border border-border bg-surface pl-11 pr-5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>

      {!tasksLoaded ? (
        <p className="mt-6 text-sm text-muted">Загружаем задачи…</p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">
            Найдено задач: {filteredTasks.length}
          </p>

          {filteredTasks.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-border p-12 text-center">
              <p className="font-medium">Ничего не нашлось</p>
              <p className="mt-2 text-sm text-muted">
                Попробуйте изменить фильтры или запрос поиска.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} showStats />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}