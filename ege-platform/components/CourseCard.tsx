"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Layers, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";
import type { Course } from "@/types";

export default function CourseCard({ course }: { course: Course }) {
  const myCourses = useAppStore((state) => state.myCourses);
  const addCourse = useAppStore((state) => state.addCourse);
  const hydrated = useHydrated();

  const isAdded = hydrated && myCourses.includes(course.id);

  function handleAdd() {
    addCourse(course.id);
    toast.success(`Курс «${course.title}» добавлен`, {
      description: "Найдёте его в разделе «Мои курсы»",
    });
  }

  return (
    <article className="group flex flex-col rounded-3xl border border-border bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/40">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <BookOpen size={22} />
        </div>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
          {course.level}
        </span>
      </div>

      <h3 className="mt-6 text-xl font-semibold tracking-tight">
        {course.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {course.description}
      </p>

      <div className="mt-6 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Layers size={14} /> {course.topicsCount} тем
        </span>
        <span className="flex items-center gap-1.5">
          <ListChecks size={14} /> {course.tasksCount} задач
        </span>
      </div>

      {/* Добавлен — «Перейти» (ссылка в курс), не добавлен — «Добавить» */}
      {isAdded ? (
        <Link
          href={`/course/${course.id}`}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Перейти <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          onClick={handleAdd}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus size={16} /> Добавить
        </button>
      )}
    </article>
  );
}