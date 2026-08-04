"use client";

import { Flame } from "lucide-react";
import { useActivityStore } from "@/store/useActivityStore";

export default function StreakBadge() {
  const activity = useActivityStore((state) => state.activity);
  if (!activity) return null;

  const alive = activity.streak > 0;

  return (
    <span
      title={`Стрик: ${activity.streak} дн. Рекорд: ${activity.best} дн.`}
      className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
        alive ? "text-orange-500" : "text-muted"
      }`}
    >
      <Flame
        size={18}
        className={alive ? "fill-orange-500/20" : ""}
      />
      {activity.streak}
    </span>
  );
}