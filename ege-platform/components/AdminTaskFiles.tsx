"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteFileApi,
  adminUploadFileApi,
  fetchFiles,
  fileDownloadUrl,
} from "@/lib/api";
import type { TaskFile } from "@/types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function AdminTaskFiles({ taskId }: { taskId: string }) {
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFiles(taskId).then((data) => {
      if (!cancelled) setFiles(data);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const saved = await adminUploadFileApi(taskId, file);
      setFiles((prev) => [...prev, saved]);
      toast.success("Файл загружен");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: number) {
    try {
      await adminDeleteFileApi(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("Файл удалён");
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Paperclip size={15} /> Файлы задания
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          <Upload size={13} /> {uploading ? "Загрузка…" : "Загрузить файл"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onPick}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        До 15 МБ. Ученик сможет скачать эти файлы под условием задачи.
      </p>

      {files.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Файлов пока нет.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate">{file.filename}</span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted">
                  {formatSize(file.size)}
                </span>
                <a
                  href={fileDownloadUrl(file.id)}
                  download
                  title="Скачать"
                  className="text-muted transition-colors hover:text-accent"
                >
                  <Download size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  title="Удалить"
                  className="text-red-500 transition-colors hover:text-red-600"
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