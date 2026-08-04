"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchMe } from "@/lib/api";

// При загрузке приложения перепроверяем актуальные данные пользователя
// (в т.ч. isAdmin) — чтобы снятые права сразу отражались после обновления.
export default function MeRefresher() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        // токен протух — authFetch разлогинит при следующем запросе
      });
    return () => {
      cancelled = true;
    };
  }, [token, setUser]);

  return null;
}