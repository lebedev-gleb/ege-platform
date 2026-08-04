"use client";

import { useEffect } from "react";
import { fetchTasks } from "@/lib/api";
import { useTasksStore } from "@/store/useTasksStore";

export default function TasksLoader() {
  const setTasks = useTasksStore((state) => state.setTasks);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tasks = await fetchTasks();
        if (!cancelled) setTasks(tasks);
      } catch {
        // сервер выключен — останемся с пустым списком
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setTasks]);

  return null;
}