"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, ChevronRight, GraduationCap } from "lucide-react";
import { fetchCourses } from "@/lib/api";
import type { Course } from "@/types";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Моё обучение</h1>
      <p className="mt-2 text-muted">
        Теория и практика по темам ЕГЭ. Выбирай курс и проходи разделы по
        порядку.
      </p>

      {/* Работа над ошибками */}
      <Link
        href="/review"
        className="mt-8 flex items-center gap-4 rounded-3xl border border-border bg-surface p-6 transition-all hover:border-accent"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Brain size={22} />
        </span>
        <div className="flex-1">
          <p className="font-semibold tracking-tight">Работа над ошибками</p>
          <p className="text-sm text-muted">
            Повторяй задачи, в которых ошибался, по интервалам.
          </p>
        </div>
        <ChevronRight size={20} className="text-muted" />
      </Link>

      {/* Список курсов */}
      <h2 className="mt-10 text-xl font-semibold tracking-tight">Курсы</h2>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Загружаем…</p>
      ) : courses.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">Курсов пока нет</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Курсы создаются в админке. Загляните позже — они появятся здесь.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="flex flex-col rounded-3xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <GraduationCap size={22} />
              </span>
              <p className="mt-4 font-semibold tracking-tight">
                {course.title}
              </p>
              <p className="mt-1 flex-1 text-sm text-muted">
                {course.description}
              </p>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
                Открыть <ChevronRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}