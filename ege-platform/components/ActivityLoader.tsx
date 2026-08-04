"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { useActivityStore } from "@/store/useActivityStore";
import { fetchActivity } from "@/lib/api";

export default function ActivityLoader() {
  const token = useAuthStore((state) => state.token);
  // taskResults меняется после каждого решения — используем как сигнал обновить
  const taskResults = useAppStore((state) => state.taskResults);
  const setActivity = useActivityStore((state) => state.setActivity);

  useEffect(() => {
    if (!token) {
      setActivity(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchActivity();
        if (!cancelled) setActivity(data);
      } catch {
        // сервер недоступен — просто нет данных
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, taskResults, setActivity]);

  return null;
}