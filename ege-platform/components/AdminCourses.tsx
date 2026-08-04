"use client";

import { useEffect, useState } from "react";
import { Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateCourseApi,
  adminCreateSectionApi,
  adminDeleteCourseApi,
  adminDeleteSectionApi,
  adminUpdateCourseApi,
  adminUpdateSectionApi,
  fetchCourse,
  fetchCourses,
} from "@/lib/api";
import AdminTheoryEditor from "@/components/AdminTheoryEditor";
import type { Course, Topic } from "@/types";

const emptyCourse = { id: "", title: "", description: "", order: 0 };
const emptySection = { id: "", title: "", order: 0 };

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [sections, setSections] = useState<Topic[]>([]);

  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  const [sectionForm, setSectionForm] = useState(emptySection);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [theoryEditId, setTheoryEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .catch(() => {});
  }, []);

  async function refreshCourses() {
    try {
      setCourses(await fetchCourses());
    } catch {
      // бэкенд недоступен
    }
  }

  async function loadSections(courseId: string) {
    setSelectedCourse(courseId);
    setEditingSection(null);
    setSectionForm(emptySection);
    try {
      const course = await fetchCourse(courseId);
      setSections(course.topics);
    } catch {
      setSections([]);
    }
  }

  // ---------- Курсы ----------
  function resetCourseForm() {
    setEditingCourse(null);
    setCourseForm(emptyCourse);
  }

  function startEditCourse(course: Course) {
    setEditingCourse(course.id);
    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description,
      order: course.order,
    });
  }

  async function submitCourse() {
    if (saving) return;
    if (!courseForm.id.trim() || !courseForm.title.trim()) {
      toast.error("Заполните ID и название курса");
      return;
    }
    setSaving(true);
    const payload = {
      id: courseForm.id.trim(),
      title: courseForm.title.trim(),
      description: courseForm.description,
      order: Number(courseForm.order) || 0,
    };
    try {
      if (editingCourse) {
        await adminUpdateCourseApi(editingCourse, payload);
        toast.success("Курс обновлён");
      } else {
        await adminCreateCourseApi(payload);
        toast.success("Курс создан");
      }
      await refreshCourses();
      resetCourseForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(id: string) {
    if (!window.confirm(`Удалить курс «${id}»?`)) return;
    try {
      await adminDeleteCourseApi(id);
      if (selectedCourse === id) {
        setSelectedCourse(null);
        setSections([]);
      }
      await refreshCourses();
      toast.success("Курс удалён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить");
    }
  }

  // ---------- Разделы ----------
  function resetSectionForm() {
    setEditingSection(null);
    setSectionForm(emptySection);
  }

  function startEditSection(section: Topic) {
    setEditingSection(section.id);
    setSectionForm({
      id: section.id,
      title: section.title,
      order: section.order,
    });
  }

  async function submitSection() {
    if (saving || !selectedCourse) return;
    if (!sectionForm.id.trim() || !sectionForm.title.trim()) {
      toast.error("Заполните ID и название раздела");
      return;
    }
    setSaving(true);
    try {
      if (editingSection) {
        const current = sections.find((s) => s.id === editingSection);
        await adminUpdateSectionApi(editingSection, {
          id: editingSection,
          courseId: selectedCourse,
          title: sectionForm.title.trim(),
          order: Number(sectionForm.order) || 0,
          theoryBlocks: JSON.stringify(current?.theoryBlocks ?? []),
        });
        toast.success("Раздел обновлён");
      } else {
        await adminCreateSectionApi({
          id: sectionForm.id.trim(),
          courseId: selectedCourse,
          title: sectionForm.title.trim(),
          order: Number(sectionForm.order) || 0,
          theoryBlocks: "[]",
        });
        toast.success("Раздел создан");
      }
      await loadSections(selectedCourse);
      resetSectionForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(id: string) {
    if (!window.confirm(`Удалить раздел «${id}»?`)) return;
    try {
      await adminDeleteSectionApi(id);
      if (selectedCourse) await loadSections(selectedCourse);
      toast.success("Раздел удалён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить");
    }
  }

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Layers size={22} className="text-accent" /> Курсы и разделы
      </h2>
      <p className="mt-1 text-sm text-muted">
        Создавайте курсы и разделы. Теорию к разделам добавите в редакторе
        теории.
      </p>

      {/* Форма курса */}
      <div className="mt-5 rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">
            {editingCourse
              ? `Редактирование курса «${editingCourse}»`
              : "Новый курс"}
          </h3>
          {editingCourse && (
            <button
              onClick={resetCourseForm}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <X size={14} /> Отменить
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">ID курса</span>
            <input
              value={courseForm.id}
              onChange={(e) =>
                setCourseForm({ ...courseForm, id: e.target.value })
              }
              disabled={editingCourse !== null}
              placeholder="python-ege"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Название</span>
            <input
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm({ ...courseForm, title: e.target.value })
              }
              placeholder="Python для ЕГЭ"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Описание</span>
            <input
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm({ ...courseForm, description: e.target.value })
              }
              placeholder="Короткое описание курса"
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Порядок</span>
            <input
              type="number"
              value={courseForm.order}
              onChange={(e) =>
                setCourseForm({ ...courseForm, order: Number(e.target.value) })
              }
              className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <button
          onClick={submitCourse}
          disabled={saving}
          className="mt-5 flex h-11 items-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
        >
          <Plus size={16} />
          {editingCourse ? "Сохранить курс" : "Создать курс"}
        </button>
      </div>

      {/* Список курсов (со скроллом) */}
      {courses.length > 0 && (
        <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-2xl border border-border p-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
                selectedCourse === course.id
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface"
              }`}
            >
              <button
                onClick={() => loadSections(course.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="font-medium">{course.title}</p>
                <p className="text-xs text-muted">
                  #{course.id} · порядок {course.order}
                </p>
              </button>
              <span className="text-xs text-muted">
                {selectedCourse === course.id ? "разделы ниже" : "разделы"}
              </span>
              <button
                onClick={() => startEditCourse(course)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => deleteCourse(course.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Разделы выбранного курса */}
      {selectedCourse && (
        <div className="mt-6 rounded-3xl border border-border bg-surface p-6">
          <h3 className="font-semibold tracking-tight">
            Разделы курса «
            {courses.find((c) => c.id === selectedCourse)?.title}»
          </h3>

          {/* Форма раздела */}
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">ID раздела</span>
              <input
                value={sectionForm.id}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, id: e.target.value })
                }
                disabled={editingSection !== null}
                placeholder="py-loops"
                className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Название</span>
              <input
                value={sectionForm.title}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, title: e.target.value })
                }
                placeholder="Циклы"
                className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Порядок</span>
              <input
                type="number"
                value={sectionForm.order}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    order: Number(e.target.value),
                  })
                }
                className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={submitSection}
              disabled={saving}
              className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              <Plus size={16} />
              {editingSection ? "Сохранить раздел" : "Добавить раздел"}
            </button>
            {editingSection && (
              <button
                onClick={resetSectionForm}
                className="flex h-11 items-center gap-1.5 rounded-full border border-border px-4 text-sm text-muted transition-colors hover:text-foreground"
              >
                <X size={14} /> Отменить
              </button>
            )}
          </div>

          {/* Список разделов (со скроллом) */}
          {sections.length > 0 && (
            <div className="mt-5 flex max-h-96 flex-col gap-2 overflow-y-auto rounded-2xl border border-border p-3">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted">
                        #{section.id} · порядок {section.order}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setTheoryEditId(
                          theoryEditId === section.id ? null : section.id
                        )
                      }
                      className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                        theoryEditId === section.id
                          ? "bg-accent text-white"
                          : "text-accent hover:bg-accent/10"
                      }`}
                    >
                      Теория
                    </button>
                    <button
                      onClick={() => startEditSection(section)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {theoryEditId === section.id && selectedCourse && (
                    <AdminTheoryEditor
                      courseId={selectedCourse}
                      section={section}
                      onClose={() => setTheoryEditId(null)}
                      onSaved={() => {
                        setTheoryEditId(null);
                        loadSections(selectedCourse);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}