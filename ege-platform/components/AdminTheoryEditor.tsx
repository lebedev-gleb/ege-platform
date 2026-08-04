"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Heading,
  Image as ImageIcon,
  Quote,
  Save,
  Text,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { adminUpdateSectionApi, adminUploadTheoryImageApi } from "@/lib/api";
import TheoryContent from "@/components/TheoryContent";
import type { TheoryBlock, Topic } from "@/types";

type Props = {
  courseId: string;
  section: Topic;
  onClose: () => void;
  onSaved: () => void;
};

export default function AdminTheoryEditor({
  courseId,
  section,
  onClose,
  onSaved,
}: Props) {
  const [blocks, setBlocks] = useState<TheoryBlock[]>(
    Array.isArray(section.theoryBlocks) ? section.theoryBlocks : []
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function addBlock(block: TheoryBlock) {
    setBlocks((prev) => [...prev, block]);
  }

  function updateBlock(index: number, patch: Partial<TheoryBlock>) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? ({ ...b, ...patch } as TheoryBlock) : b))
    );
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { id } = await adminUploadTheoryImageApi(file);
      addBlock({ type: "image", imageId: id, caption: "" });
      toast.success("Картинка добавлена");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save() {
    setSaving(true);
    try {
      await adminUpdateSectionApi(section.id, {
        id: section.id,
        courseId,
        title: section.title,
        order: section.order,
        theoryBlocks: JSON.stringify(blocks),
      });
      toast.success("Теория сохранена");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-accent/40 bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold tracking-tight">
          Теория раздела «{section.title}»
        </p>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {/* Кнопки добавления блоков */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => addBlock({ type: "heading", text: "" })}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Heading size={14} /> Заголовок
        </button>
        <button
          onClick={() => addBlock({ type: "paragraph", text: "" })}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Text size={14} /> Абзац
        </button>
        <button
          onClick={() => addBlock({ type: "quote", text: "" })}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Quote size={14} /> Цитата
        </button>
        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent">
          <ImageIcon size={14} /> {uploading ? "Загрузка…" : "Фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickImage}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        В тексте выделяйте важное двумя звёздочками: **жирный**.
      </p>

      {/* Список блоков-редакторов */}
      <div className="mt-4 flex flex-col gap-3">
        {blocks.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Блоков нет. Добавьте заголовок, абзац, цитату или фото.
          </p>
        )}
        {blocks.map((block, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {block.type === "heading"
                  ? "Заголовок"
                  : block.type === "quote"
                    ? "Цитата"
                    : block.type === "image"
                      ? "Фото"
                      : "Абзац"}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-background disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-background disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => removeBlock(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {block.type === "image" ? (
              <div className="mt-2">
                <input
                  value={block.caption ?? ""}
                  onChange={(e) =>
                    updateBlock(index, { caption: e.target.value })
                  }
                  placeholder="Подпись к фото (необязательно)"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
            ) : (
              <textarea
                value={block.text}
                onChange={(e) => updateBlock(index, { text: e.target.value })}
                rows={block.type === "heading" ? 1 : 3}
                placeholder={
                  block.type === "heading"
                    ? "Текст заголовка"
                    : block.type === "quote"
                      ? "Текст цитаты"
                      : "Текст абзаца. **жирный** — двумя звёздочками"
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}
          </div>
        ))}
      </div>

      {/* Предпросмотр */}
      {blocks.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Предпросмотр
          </p>
          <div className="mt-2 rounded-2xl border border-border bg-background p-4">
            <TheoryContent blocks={blocks} />
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 flex h-11 items-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
      >
        <Save size={16} /> {saving ? "Сохраняем…" : "Сохранить теорию"}
      </button>
    </div>
  );
}