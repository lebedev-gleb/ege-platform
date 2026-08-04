"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronDown, Dumbbell } from "lucide-react";
import { fetchCourse } from "@/lib/api";
import { useTasksStore } from "@/store/useTasksStore";
import TaskCard from "@/components/TaskCard";
import TheoryContent from "@/components/TheoryContent";
import type { Course, Topic } from "@/types";

export default function CoursePage() {
  const params = useParams();
  const id = String(params.id);

  const tasks = useTasksStore((state) => state.tasks);
  const [course, setCourse] = useState<(Course & { topics: Topic[] }) | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCourse(id)
      .then((data) => {
        if (cancelled) return;
        setCourse(data);
        setOpenId(data.topics[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="py-10 text-center text-muted">Загружаем курс…</div>;
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium">Курс не найден</p>
        <Link
          href="/my-courses"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
        >
          К моим курсам
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10">
      <Link
        href="/my-courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> Мои курсы
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {course.title}
      </h1>
      <p className="mt-2 text-muted">{course.description}</p>

      {course.topics.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">В этом курсе пока нет разделов</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Разделы добавляются в админке.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {course.topics.map((topic, index) => {
            const isOpen = openId === topic.id;
            const practice = tasks.filter((t) => t.topicId === topic.id);
            return (
              <div
                key={topic.id}
                className="overflow-hidden rounded-3xl border border-border bg-surface"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : topic.id)}
                  className="flex w-full items-center gap-4 p-6 text-left transition-colors hover:bg-background/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-accent">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold tracking-tight">
                      {topic.title}
                    </p>
                    <p className="text-xs text-muted">
                      {practice.length} заданий практики
                    </p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border p-6">
                    {/* Теория */}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted">
                      <BookOpen size={15} /> Теория
                    </div>
                    <div className="mt-3">
                      <TheoryContent blocks={topic.theoryBlocks} />
                    </div>

                    {/* Практика */}
                    {practice.length > 0 && (
                      <>
                        <div className="mt-8 flex items-center gap-2 text-sm font-medium text-muted">
                          <Dumbbell size={15} /> Практика
                        </div>
                        <div className="mt-3 flex flex-col gap-4">
                          {practice.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </>
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