import type { Course } from "@/types";

// Временные данные. Когда появится бэкенд, этот файл заменит запрос к API —
// а компоненты менять не придётся, потому что форма данных (тип Course) та же.

export const courses: Course[] = [
  {
    id: "ege-informatics",
    title: "ЕГЭ Информатика",
    description:
      "Основной курс подготовки: теория и практика по всем 27 заданиям экзамена.",
    level: "Основной курс",
    topicsCount: 27,
    tasksCount: 120,
  },
  {
    id: "python-ege",
    title: "Python для ЕГЭ",
    description:
      "Программирование с нуля: всё, что нужно для заданий 2, 5, 6, 12, 14–17 и 22–27.",
    level: "Дополнительный",
    topicsCount: 12,
    tasksCount: 60,
  },
];