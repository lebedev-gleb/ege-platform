"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { loginWithYandexCode } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Разбор адреса и вход — во внутренней async-функции.
    // setState тут вызывается как реакция на внешнюю систему (адрес, сеть),
    // а не синхронно в теле эффекта — новое правило React довольно.
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const yandexError = params.get("error");

      if (yandexError) {
        if (!cancelled) setError("Вход не завершён. Возможно, вы отменили доступ.");
        return;
      }
      if (!code) {
        if (!cancelled) setError("Код авторизации не получен.");
        return;
      }

      try {
        const data = await loginWithYandexCode(code);
        if (cancelled) return;
        setAuth(data.token, data.user);
        router.replace("/");
      } catch {
        if (!cancelled) setError("Не удалось войти. Попробуйте ещё раз.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, setAuth]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="font-medium">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
          >
            На главную
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted">
          <Loader2 size={20} className="animate-spin" />
          Входим…
        </div>
      )}
    </div>
  );
}