"use client";

import { useEffect, useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { fetchCourse, fetchCourses } from "@/lib/api";
import { useTasksStore } from "@/store/useTasksStore";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuth } from "@/hooks/useAuth";
import type { Course, Topic } from "@/types";

type CourseWithTopics = Course & { topics: Topic[] };

// Полоска прогресса
function ProgressBar({ percent }: { percent: number }) {
  const done = percent >= 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className={`h-full rounded-full transition-all ${
          done ? "bg-green-500" : "bg-accent"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function CourseProgress() {
  const { isSignedIn } = useAuth();
  const tasks = useTasksStore((state) => state.tasks);
  const taskResults = useAppStore((state) => state.taskResults);
  const hydrated = useHydrated();

  const [courses, setCourses] = useState<CourseWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchCourses();
        // Догружаем разделы каждого курса
        const detailed = await Promise.all(
          list.map((course) =>
            fetchCourse(course.id).catch(() => ({ ...course, topics: [] }))
          )
        );
        if (!cancelled) setCourses(detailed as CourseWithTopics[]);
      } catch {
        // бэкенд недоступен
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  // Прогресс раздела: сколько задач раздела решено
  function sectionStats(topicId: string) {
    const practice = tasks.filter((t) => t.topicId === topicId);
    const total = practice.length;
    const solved = practice.filter(
      (t) => taskResults[t.id]?.solved ?? false
    ).length;
    const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
    return { total, solved, percent };
  }

  // Прогресс курса: сумма по всем его разделам
  function courseStats(course: CourseWithTopics) {
    let total = 0;
    let solved = 0;
    for (const topic of course.topics) {
      const s = sectionStats(topic.id);
      total += s.total;
      solved += s.solved;
    }
    const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
    return { total, solved, percent };
  }

  if (!hydrated || !isSignedIn) return null;

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <GraduationCap size={20} className="text-accent" /> Прогресс по курсам
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-muted">Загружаем…</p>
      ) : courses.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Курсов пока нет. Прогресс появится, когда будут курсы с задачами.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {courses.map((course) => {
            const isOpen = openId === course.id;
            const stats = courseStats(course);
            return (
              <div
                key={course.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                {/* Заголовок курса */}
                <button
                  onClick={() => setOpenId(isOpen ? null : course.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-background/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{course.title}</p>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {stats.percent}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar percent={stats.percent} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Решено {stats.solved} из {stats.total} задач
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Разделы курса */}
                {isOpen && (
                  <div className="border-t border-border p-5">
                    {course.topics.length === 0 ? (
                      <p className="text-sm text-muted">
                        В этом курсе пока нет разделов.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {course.topics.map((topic) => {
                          const s = sectionStats(topic.id);
                          return (
                            <div key={topic.id}>
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-medium">
                                  {topic.title}
                                </p>
                                <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
                                  {s.solved}/{s.total} · {s.percent}%
                                </span>
                              </div>
                              <div className="mt-1.5">
                                <ProgressBar percent={s.percent} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}