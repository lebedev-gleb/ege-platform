"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Target, TrendingUp } from "lucide-react";
import { tasks } from "@/data/tasks";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";
import ActivityCard from "@/components/ActivityCard";
import CourseProgress from "@/components/CourseProgress";
import QuizHistory from "@/components/QuizHistory";
import VariantHistory from "@/components/VariantHistory";

// Маленький компонент только для этой страницы — живёт прямо здесь.
function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function StatisticsPage() {
  const taskResults = useAppStore((state) => state.taskResults);
  const hydrated = useHydrated();

  // ---------- Общие показатели ----------
  const totalTasks = tasks.length;
  const solvedCount = tasks.filter(
    (task) => taskResults[task.id]?.solved
  ).length;
  const totalAttempts = tasks.reduce(
    (sum, task) => sum + (taskResults[task.id]?.attempts ?? 0),
    0
  );

  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((solvedCount / totalTasks) * 100);

  // Верных попыток ровно столько, сколько решённых задач:
  // после верного ответа поле блокируется. Точность = решённые / все попытки.
  const accuracyPercent =
    totalAttempts === 0 ? 0 : Math.round((solvedCount / totalAttempts) * 100);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Статистика</h1>
      <p className="mt-2 text-muted">
        Все цифры считаются из ваших настоящих решений.
      </p>

      <div className="mt-8">
        <ActivityCard />
      </div>

      {hydrated && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Решено задач"
              value={`${solvedCount} из ${totalTasks}`}
              hint="во всех курсах и каталоге"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Выполнение"
              value={`${completionPercent}%`}
              hint="от всего банка задач"
            />
            <StatCard
              icon={<Target size={20} />}
              label="Точность"
              value={`${accuracyPercent}%`}
              hint={`верных ответов из ${totalAttempts} попыток`}
            />
          </div>
        </>
      )}

      {/* Прогресс по курсам — раскрывается в разделы с полосками (из базы) */}
      <CourseProgress />

      {/* История квизов */}
      <QuizHistory />

      {/* История вариантов */}
      <VariantHistory />
    </div>
  );
}