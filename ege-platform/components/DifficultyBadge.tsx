import type { Difficulty } from "@/types";

// Все настройки уровней в одном объекте: захочешь изменить подпись
// или цвет — правишь одну строчку здесь, меняется везде.
const config: Record<Difficulty, { label: string; className: string }> = {
  easy: {
    label: "Лёгкий",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  medium: {
    label: "Средний",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  hard: {
    label: "Сложный",
    className: "bg-red-500/10 text-red-500 dark:text-red-400",
  },
};

// Снова без "use client": только разметка, ни кликов, ни состояния
export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  const { label, className } = config[difficulty];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}