"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateVariantApi,
  adminDeleteVariantApi,
  adminUpdateVariantApi,
  fetchAuthorVariants,
} from "@/lib/api";
import { useTasksStore } from "@/store/useTasksStore";
import type { AuthorVariant } from "@/types";

const emptyForm = {
  id: "",
  title: "",
  description: "",
  taskIds: [] as string[],
};

export default function AdminAuthorVariants() {
  const tasks = useTasksStore((state) => state.tasks);
  const [variants, setVariants] = useState<AuthorVariant[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");

  useEffect(() => {
    fetchAuthorVariants()
      .then(setVariants)
      .catch(() => {});
  }, []);

  async function refresh() {
    try {
      setVariants(await fetchAuthorVariants());
    } catch {
      // бэкенд недоступен
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setTaskQuery("");
  }

  function toggleTask(id: string) {
    setForm((f) => ({
      ...f,
      taskIds: f.taskIds.includes(id)
        ? f.taskIds.filter((t) => t !== id)
        : [...f.taskIds, id],
    }));
  }

  function startEdit(variant: AuthorVariant) {
    setEditingId(variant.id);
    setForm({
      id: variant.id,
      title: variant.title,
      description: variant.description,
      taskIds: variant.taskIds,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (saving) return;
    if (!form.id.trim() || !form.title.trim()) {
      toast.error("Заполните ID и название");
      return;
    }
    if (form.taskIds.length === 0) {
      toast.error("Выберите хотя бы одно задание");
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id.trim(),
      title: form.title.trim(),
      description: form.description,
      taskIds: form.taskIds,
    };
    try {
      if (editingId) {
        await adminUpdateVariantApi(editingId, payload);
        toast.success("Вариант обновлён");
      } else {
        await adminCreateVariantApi(payload);
        toast.success("Вариант создан");
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
    if (!window.confirm(`Удалить вариант «${id}»?`)) return;
    try {
      await adminDeleteVariantApi(id);
      if (editingId === id) resetForm();
      await refresh();
      toast.success("Вариант удалён");
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  const pickableTasks = tasks
    .filter((t) => t.kind !== "code")
    .filter((t) => {
      const q = taskQuery.trim().toLowerCase();
      if (q === "") return true;
      return (
        t.statement.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q.replace("#", ""))
      );
    });

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">
        Авторские варианты
      </h2>
      <p className="mt-1 text-sm text-muted">
        Появятся каруселью в каталоге. Новый — первым слева.
      </p>

      {/* Форма */}
      <div className="mt-5 rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">
            {editingId ? `Редактирование «${editingId}»` : "Новый вариант"}
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
            <span className="text-sm font-medium">ID варианта</span>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={editingId !== null}
              placeholder="var-2026-01"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Название</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Пробный вариант №1"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Описание</span>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Короткое описание варианта"
            className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
          />
        </label>

        {/* Выбор заданий */}
        <div className="mt-5">
          <span className="text-sm font-medium">
            Задания ({form.taskIds.length} выбрано)
          </span>
          <input
            value={taskQuery}
            onChange={(e) => setTaskQuery(e.target.value)}
            placeholder="Поиск задания по условию или #номеру"
            className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-border">
            {pickableTasks.length === 0 ? (
              <p className="p-4 text-sm text-muted">Задачи не найдены.</p>
            ) : (
              pickableTasks.map((task) => {
                const picked = form.taskIds.includes(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
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
                        ЕГЭ {task.egeNumber} · #{task.id}
                      </span>
                      <span className="line-clamp-1">{task.statement}</span>
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
          {saving
            ? "Сохраняем…"
            : editingId
              ? "Сохранить вариант"
              : "Создать вариант"}
        </button>
      </div>

      {/* Список вариантов (со скроллом) */}
      {variants.length > 0 && (
        <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto rounded-2xl border border-border p-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{variant.title}</p>
                <p className="text-xs text-muted">
                  #{variant.id} · {variant.taskIds.length} заданий
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(variant)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(variant.id)}
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