"use client";

import { useEffect, useState } from "react";
import { Download, Paperclip } from "lucide-react";
import { fetchFiles, fileDownloadUrl } from "@/lib/api";
import type { TaskFile } from "@/types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function TaskFiles({ taskId }: { taskId: string }) {
  const [files, setFiles] = useState<TaskFile[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchFiles(taskId).then((data) => {
      if (!cancelled) setFiles(data);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (files.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Paperclip size={15} className="text-muted" /> Материалы
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {files.map((file) => (
          <a
            key={file.id}
            href={fileDownloadUrl(file.id)}
            download
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors hover:border-accent"
          >
            <span className="min-w-0 truncate">{file.filename}</span>
            <span className="flex shrink-0 items-center gap-2 text-muted">
              {formatSize(file.size)}
              <Download size={15} className="text-accent" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}