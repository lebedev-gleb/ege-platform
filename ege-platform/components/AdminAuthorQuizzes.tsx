"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateQuizApi,
  adminDeleteQuizApi,
  adminUpdateQuizApi,
  fetchAdminQuizQuestions,
  fetchAuthorQuizzes,
} from "@/lib/api";
import type { AdminQuizQuestion, AuthorQuiz } from "@/types";

const emptyForm = {
  id: "",
  title: "",
  description: "",
  questionIds: [] as string[],
};

export default function AdminAuthorQuizzes() {
  const [quizzes, setQuizzes] = useState<AuthorQuiz[]>([]);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchAuthorQuizzes()
      .then(setQuizzes)
      .catch(() => {});
    fetchAdminQuizQuestions()
      .then(setQuestions)
      .catch(() => {});
  }, []);

  async function refresh() {
    try {
      setQuizzes(await fetchAuthorQuizzes());
    } catch {
      // бэкенд недоступен
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setQuery("");
  }

  function toggleQuestion(id: string) {
    setForm((f) => ({
      ...f,
      questionIds: f.questionIds.includes(id)
        ? f.questionIds.filter((q) => q !== id)
        : [...f.questionIds, id],
    }));
  }

  function startEdit(quiz: AuthorQuiz) {
    setEditingId(quiz.id);
    setForm({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionIds: quiz.questionIds,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (saving) return;
    if (!form.id.trim() || !form.title.trim()) {
      toast.error("Заполните ID и название");
      return;
    }
    if (form.questionIds.length === 0) {
      toast.error("Выберите хотя бы один вопрос");
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id.trim(),
      title: form.title.trim(),
      description: form.description,
      questionIds: form.questionIds,
    };
    try {
      if (editingId) {
        await adminUpdateQuizApi(editingId, payload);
        toast.success("Квиз обновлён");
      } else {
        await adminCreateQuizApi(payload);
        toast.success("Квиз создан");
      }
      await refresh();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Удалить квиз «${id}»?`)) return;
    try {
      await adminDeleteQuizApi(id);
      if (editingId === id) resetForm();
      await refresh();
      toast.success("Квиз удалён");
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  const filtered = questions.filter((q) => {
    const s = query.trim().toLowerCase();
    if (s === "") return true;
    return q.question.toLowerCase().includes(s) || q.topicId.includes(s);
  });

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Авторские квизы</h2>
      <p className="mt-1 text-sm text-muted">
        Появятся каруселью под конструктором квизов. Новый — первым слева.
      </p>

      <div className="mt-5 rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">
            {editingId ? `Редактирование «${editingId}»` : "Новый квиз"}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <X size={14} /> Отменить
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">ID квиза</span>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={editingId !== null}
              placeholder="quiz-logic-1"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Название</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Логика: разминка"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Описание</span>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Короткое описание квиза"
            className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
          />
        </label>

        <div className="mt-5">
          <span className="text-sm font-medium">
            Вопросы ({form.questionIds.length} выбрано)
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск вопроса по тексту или теме"
            className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-border">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                Вопросы не найдены. Добавляйте вопросы через сид/миграции.
              </p>
            ) : (
              filtered.map((q) => {
                const picked = form.questionIds.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-0 ${
                      picked ? "bg-accent/5" : "hover:bg-background"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        picked
                          ? "border-accent bg-accent text-white"
                          : "border-border"
                      }`}
                    >
                      {picked && <Check size={12} />}
                    </span>
                    <span className="min-w-0">
                      <span className="text-xs text-muted">
                        {q.topicId} · {q.seconds}с
                      </span>
                      <span className="line-clamp-1">{q.question}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          <Plus size={16} />
          {saving ? "Сохраняем…" : editingId ? "Сохранить квиз" : "Создать квиз"}
        </button>
      </div>

      {/* Список квизов (со скроллом) */}
      {quizzes.length > 0 && (
        <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto rounded-2xl border border-border p-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{quiz.title}</p>
                <p className="text-xs text-muted">
                  #{quiz.id} · {quiz.questionIds.length} вопросов
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(quiz)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}