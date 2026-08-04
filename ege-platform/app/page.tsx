import CourseCard from "@/components/CourseCard";
import { fetchCourses } from "@/lib/api";
import { ServerCrash } from "lucide-react";
import type { Course } from "@/types";

// Обрати внимание: здесь НЕТ "use client", а функция — async.
// Это серверный компонент: запрос к Go-бэкенду делает сервер Next.js,
// и в браузер уезжает уже готовый HTML с данными.
// Интерактивные карточки (CourseCard) остаются клиентскими — данные
// приходят сверху, интерактив живёт снизу. Это главный паттерн App Router.
export default async function HomePage() {
  let courses: Course[] | null = null;
  try {
    courses = await fetchCourses();
  } catch {
    // Бэкенд выключен или недоступен — покажем плашку, а не белый экран
  }

  return (
    <>
      <section className="py-14 text-center sm:py-20">
        <p className="text-sm font-semibold text-accent">
          Подготовка к ЕГЭ по информатике
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Учись. Решай.
          <br />
          Поступай.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Теория, банк задач и статистика прогресса — всё, что нужно для
          высокого балла, в одном месте.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Курсы</h2>

        {courses === null ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <ServerCrash size={22} />
            </div>
            <p className="mt-5 font-medium">Сервер недоступен</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Запустите бэкенд командой go run . в папке ege-backend и
              обновите страницу.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}