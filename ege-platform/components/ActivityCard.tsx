"use client";

import { Flame } from "lucide-react";
import { useActivityStore } from "@/store/useActivityStore";

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

// Возвращает YYYY-MM-DD в локальной зоне (совпадает с серверной датой при
// одинаковом часовом поясе; для учебного проекта этого достаточно)
function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ActivityCard() {
  const activity = useActivityStore((state) => state.activity);
  if (!activity) return null;

  // Карта "дата -> сколько решено" для быстрого поиска
  const byDate = new Map(activity.days.map((d) => [d.date, d.count]));

  // Дни текущей недели: от воскресенья до субботы
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // getDay(): 0 = вс

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = toKey(date);
    return {
      key,
      count: byDate.get(key) ?? 0,
      isToday: key === activity.today,
    };
  });

  const alive = activity.streak > 0;

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              alive
                ? "bg-orange-500/10 text-orange-500"
                : "bg-surface text-muted"
            }`}
          >
            <Flame size={22} className={alive ? "fill-orange-500/20" : ""} />
          </span>
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              {activity.streak}{" "}
              <span className="text-base font-normal text-muted">
                {activity.streak === 1
                  ? "день"
                  : activity.streak >= 2 && activity.streak <= 4
                    ? "дня"
                    : "дней"}{" "}
                без перерыва
              </span>
            </p>
            <p className="text-sm text-muted">Рекорд — {activity.best} дн.</p>
          </div>
        </div>
      </div>

      {/* Дни недели */}
      <div className="mt-6">
        <div className="grid grid-cols-7 gap-2 text-center">
          {WEEKDAYS.map((label) => (
            <div key={label} className="text-xs text-muted">
              {label}
            </div>
          ))}
          {week.map((day) => {
            const active = day.count > 0;
            return (
              <div
                key={day.key}
                title={`${day.key}: решено ${day.count}`}
                className={`flex aspect-square items-center justify-center rounded-xl text-sm font-medium ${
                  active
                    ? "bg-accent text-white"
                    : day.isToday
                      ? "border-2 border-accent bg-background"
                      : "bg-border/50 text-muted"
                }`}
              >
                {active ? day.count : ""}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">
          {week.some((d) => d.isToday && d.count > 0)
            ? "Сегодня вы уже занимались — так держать!"
            : "Решите сегодня хотя бы одну задачу"}
        </p>
      </div>

      {/* Итоги */}
      <div className="mt-6 flex gap-8 border-t border-border pt-5">
        <div>
          <span className="text-2xl font-semibold tracking-tight">
            {activity.totalSolved}
          </span>{" "}
          <span className="text-sm text-muted">задач решено</span>
        </div>
        <div>
          <span className="text-2xl font-semibold tracking-tight">
            {activity.activeDays}
          </span>{" "}
          <span className="text-sm text-muted">
            {activity.activeDays >= 2 && activity.activeDays <= 4
              ? "дня занятий"
              : "дней занятий"}
          </span>
        </div>
      </div>
    </div>
  );
}