"use client";

import { useEffect, useState } from "react";
import AdminAuthorVariants from "@/components/AdminAuthorVariants";
import { Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AdminAuthorQuizzes from "@/components/AdminAuthorQuizzes";
import AdminCourses from "@/components/AdminCourses";
import { useAuth } from "@/hooks/useAuth";
import {
  adminCreateTaskApi,
  adminDeleteTaskApi,
  adminListTasksApi,
  adminUpdateTaskApi,
  fetchCourse,
  fetchCourses,
  fetchTasks,
} from "@/lib/api";
import { useTasksStore } from "@/store/useTasksStore";
import type { AdminTask, Course, Difficulty, Topic } from "@/types";
import AdminTaskFiles from "@/components/AdminTaskFiles";

const emptyForm = {
  id: "",
  courseId: "",
  topicId: "",
  egeNumber: "",
  difficulty: "easy" as Difficulty,
  statement: "",
  answer: "",
  isCode: false,
  starterCode: "",
  solution: "",
  hints: [] as string[],
};

export default function AdminPage() {
  const { hydrated, user } = useAuth();
  const setTasksStore = useTasksStore((state) => state.setTasks);

  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = hydrated && user?.isAdmin;

  // Первичная загрузка: список задач и курсов
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const [taskList, courseList] = await Promise.all([
          adminListTasksApi(),
          fetchCourses(),
        ]);
        setTasks(taskList);
        setCourses(courseList);
        if (courseList.length > 0) {
          const first = courseList[0].id;
          const course = await fetchCourse(first);
          setTopics(course.topics);
          setForm((f) => ({
            ...f,
            courseId: first,
            topicId: course.topics[0]?.id ?? "",
          }));
        }
      } catch {
        toast.error("Не удалось загрузить данные админки");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  async function onCourseChange(courseId: string) {
    setForm((f) => ({ ...f, courseId }));
    try {
      const course = await fetchCourse(courseId);
      setTopics(course.topics);
      setForm((f) => ({ ...f, courseId, topicId: course.topics[0]?.id ?? "" }));
    } catch {
      toast.error("Не удалось загрузить темы курса");
    }
  }

  async function refreshTasks() {
    const [taskList] = await Promise.all([adminListTasksApi()]);
    setTasks(taskList);
    // Обновляем и публичный стор — чтобы каталог сразу увидел изменения
    try {
      const publicTasks = await fetchTasks();
      setTasksStore(publicTasks);
    } catch {
      // не критично
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm((f) => ({
      ...emptyForm,
      courseId: f.courseId,
      topicId: topics[0]?.id ?? "",
    }));
  }

  async function startEdit(task: AdminTask) {
    setEditingId(task.id);
    // Подгрузим темы курса задачи
    try {
      const course = await fetchCourse(task.courseId);
      setTopics(course.topics);
    } catch {
      // оставим текущие темы
    }
    setForm({
      id: task.id,
      courseId: task.courseId,
      topicId: task.topicId,
      egeNumber: String(task.egeNumber),
      difficulty: task.difficulty,
      statement: task.statement,
      answer: task.answer,
      isCode: task.kind === "code",
      starterCode: task.starterCode ?? "",
      solution: task.solution ?? "",
      hints: (task.hints ?? []).map((h) => h.body),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addHint() {
    setForm((f) => ({ ...f, hints: [...f.hints, ""] }));
  }

  function updateHint(index: number, value: string) {
    setForm((f) => ({
      ...f,
      hints: f.hints.map((hint, i) => (i === index ? value : hint)),
    }));
  }

  function removeHint(index: number) {
    setForm((f) => ({
      ...f,
      hints: f.hints.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    if (saving) return;
    if (!form.id.trim()) {
      toast.error("Укажите ID задания");
      return;
    }
    if (!form.topicId || !form.statement.trim() || !form.answer.trim()) {
      toast.error("Заполните тему, условие и ответ");
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id.trim(),
      topicId: form.topicId,
      egeNumber: Number(form.egeNumber) || 0,
      difficulty: form.difficulty,
      statement: form.statement,
      answer: form.answer,
      kind: form.isCode ? "code" : "",
      starterCode: form.isCode ? form.starterCode : "",
      solution: form.solution,
      hints: form.hints.map((hint) => hint.trim()).filter((hint) => hint !== ""),
    };
    try {
      if (editingId) {
        await adminUpdateTaskApi(editingId, payload);
        toast.success("Задача обновлена");
      } else {
        await adminCreateTaskApi(payload);
        toast.success("Задача создана");
      }
      await refreshTasks();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Удалить задачу #${id}? Прогресс по ней тоже сотрётся.`)) {
      return;
    }
    try {
      await adminDeleteTaskApi(id);
      toast.success("Задача удалена");
      if (editingId === id) resetForm();
      await refreshTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить");
    }
  }

  // ----- Экран без доступа -----
  if (!hydrated) {
    return <div className="py-10 text-center text-muted">Загрузка…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <Shield size={22} />
        </div>
        <p className="mt-5 text-lg font-medium">Доступ только для администраторов</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Эта страница доступна только владельцам платформы.
        </p>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="flex items-center gap-2">
        <Shield size={22} className="text-accent" />
        <h1 className="text-3xl font-semibold tracking-tight">Админка</h1>
      </div>
      <p className="mt-2 text-muted">
        Создание, редактирование и удаление задач. Изменения сразу видны на
        сайте.
      </p>
      <AdminCourses />
      {/* ===== Форма ===== */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {editingId ? `Редактирование #${editingId}` : "Новая задача"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <X size={14} /> Отменить
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">ID задания</span>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={editingId !== null}
              placeholder="например, 14006"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent disabled:opacity-60"
            />
            <span className="mt-1 block text-xs text-muted">
              Схема: номер ЕГЭ + порядковый (14006). После создания не меняется.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Номер задания ЕГЭ</span>
            <input
              type="number"
              value={form.egeNumber}
              onChange={(e) => setForm({ ...form, egeNumber: e.target.value })}
              placeholder="14"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Курс</span>
            <select
              value={form.courseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Тема</span>
            <select
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Сложность</span>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value as Difficulty })
              }
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            >
              <option value="easy">Лёгкая</option>
              <option value="medium">Средняя</option>
              <option value="hard">Сложная</option>
            </select>
          </label>

          <label className="flex items-center gap-2 self-end pb-2">
            <input
              type="checkbox"
              checked={form.isCode}
              onChange={(e) => setForm({ ...form, isCode: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span className="text-sm font-medium">Код-задача (Python)</span>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Условие</span>
          <textarea
            value={form.statement}
            onChange={(e) => setForm({ ...form, statement: e.target.value })}
            rows={4}
            placeholder="Текст задачи. Переносы строк сохраняются."
            className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            {form.isCode ? "Ожидаемый вывод программы" : "Ответ"}
          </span>
          <input
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            placeholder={form.isCode ? "то, что должна вывести программа" : "правильный ответ"}
            className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

                {/* ===== Подсказки ===== */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Подсказки</span>
            <button
              type="button"
              onClick={addHint}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Plus size={13} /> Добавить подсказку
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            По порядку: первая мягкая, последняя — почти решение. Доступны
            ученику сразу.
          </p>

          {form.hints.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Подсказок пока нет.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {form.hints.map((hint, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-2.5 w-6 shrink-0 text-center text-sm font-medium text-muted">
                    {index + 1}
                  </span>
                  <textarea
                    value={hint}
                    onChange={(e) => updateHint(index, e.target.value)}
                    rows={2}
                    placeholder={`Подсказка ${index + 1}`}
                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    title="Удалить подсказку"
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Решение ===== */}
        <label className="mt-6 block">
          <span className="text-sm font-medium">Полное решение</span>
          <p className="mt-1 text-xs text-muted">
            Текст с разбором. Блоки кода оборачивайте в тройные кавычки ```
``` — они покажутся моноширинным шрифтом.
          </p>
          <textarea
            value={form.solution}
            onChange={(e) => setForm({ ...form, solution: e.target.value })}
            rows={6}
            placeholder={"Разбор решения.\n\nПример кода:\n```\nn = int(input())\nprint(n * 2)\n```"}
            className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        {form.isCode && (
          <label className="mt-4 block">
            <span className="text-sm font-medium">Заготовка кода</span>
            <textarea
              value={form.starterCode}
              onChange={(e) =>
                setForm({ ...form, starterCode: e.target.value })
              }
              rows={4}
              placeholder="# начальный код в редакторе"
              className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-accent"
            />
          </label>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          <Plus size={16} />
          {saving ? "Сохраняем…" : editingId ? "Сохранить изменения" : "Создать задачу"}
        </button>
        {editingId ? (
          <AdminTaskFiles taskId={editingId} />
        ) : (
          <p className="mt-6 text-xs text-muted">
            Файлы можно добавить после создания задачи — сохраните её и откройте
            на редактирование.
          </p>
        )}
      </div>

      {/* ===== Список задач ===== */}
      <h2 className="mt-10 text-xl font-semibold tracking-tight">
        Все задачи ({tasks.length})
      </h2>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Загружаем…</p>
      ) : (
        <div className="mt-4 flex max-h-[32rem] flex-col gap-3 overflow-y-auto rounded-2xl border border-border p-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    ЕГЭ {task.egeNumber}
                  </span>
                  <span className="text-xs text-muted">#{task.id}</span>
                  {task.kind === "code" && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                      код
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    ответ: {task.answer}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm">{task.statement}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(task)}
                  title="Редактировать"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  title="Удалить"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AdminAuthorVariants />
      <AdminAuthorQuizzes />
    </div>
  );
}