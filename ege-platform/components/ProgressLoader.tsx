"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { fetchProgress } from "@/lib/api";

export default function ProgressLoader() {
  const token = useAuthStore((state) => state.token);
  const setProgress = useAppStore((state) => state.setProgress);
  const clearProgress = useAppStore((state) => state.clearProgress);

  useEffect(() => {
    if (!token) {
      clearProgress();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProgress();
        if (!cancelled) setProgress(data.taskResults, data.mistakes);
      } catch {
        // сервер выключен — останемся с пустым прогрессом
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setProgress, clearProgress]);

  return null;
}