"use client";

import { Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";
import type { Task } from "@/types";

type TaskNavigatorProps = {
  tasks: Task[];
  currentTaskId: string;
  onSelect: (taskId: string) => void;
};

export default function TaskNavigator({
  tasks,
  currentTaskId,
  onSelect,
}: TaskNavigatorProps) {
  const taskResults = useAppStore((state) => state.taskResults);
  const hydrated = useHydrated();

  return (
    <div className="flex flex-wrap gap-2">
      {tasks.map((task, index) => {
        const isCurrent = task.id === currentTaskId;
        const isSolved = hydrated && (taskResults[task.id]?.solved ?? false);

        return (
          <button
            key={task.id}
            onClick={() => onSelect(task.id)}
            aria-label={`Задача ${index + 1}`}
            // Квадратно-закруглённая «плитка» в духе иконок Apple:
            // квадрат 44×44 со скруглением rounded-2xl
            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-medium transition-all ${
              isCurrent
                ? "bg-accent text-white shadow-md shadow-accent/30"
                : isSolved
                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
                  : "border border-border bg-surface text-muted hover:border-muted hover:text-foreground"
            }`}
          >
            {index + 1}
            {/* Маленькая галочка в углу у решённых (кроме текущей) */}
            {isSolved && !isCurrent && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white">
                <Check size={10} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}