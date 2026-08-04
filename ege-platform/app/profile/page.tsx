"use client";

import { useState } from "react";
import { ExternalLink, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { startYandexLogin } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/hooks/useHydrated";

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function ProfilePage() {
  const { isSignedIn, user, signOut } = useAuth();
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const hydrated = useHydrated();

  const [phone, setPhone] = useState(profile.phone);
  const [social, setSocial] = useState(profile.social);

  function handleSave() {
    updateProfile({ phone, social });
    toast.success("Сохранено");
  }

  const initials =
    user?.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Профиль</h1>
        <p className="mt-2 text-muted">
          Имя, почта и вход — через Яндекс ID. Контакты для связи — здесь.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        {!isSignedIn || !user ? (
          <div className="rounded-3xl border border-dashed border-border p-14 text-center">
            <p className="font-medium">Вы не вошли</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Войдите через Яндекс, чтобы видеть аккаунт и сохранять прогресс.
            </p>
            <button
              onClick={startYandexLogin}
              className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              <LogIn size={15} /> Войти
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-8 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-accent text-lg font-semibold text-white">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt="Аватар"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </span>
                <div>
                  <p className="font-semibold tracking-tight">{user.name}</p>
                  {user.email && (
                    <p className="text-sm text-muted">{user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://id.yandex.ru"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  Яндекс ID <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-red-500 transition-colors hover:border-red-500"
                >
                  <LogOut size={14} /> Выйти
                </button>
              </div>
            </div>

            {hydrated && (
              <div className="mt-8 grid gap-4">
                <Field
                  label="Телефон"
                  value={phone}
                  onChange={setPhone}
                  hint="Хранится локально на этом устройстве"
                />
                <Field
                  label="Соцсеть для связи"
                  value={social}
                  onChange={setSocial}
                  hint="Ссылка или ник в VK либо Telegram"
                />
                <button
                  onClick={handleSave}
                  className="mt-2 flex h-11 w-fit items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Сохранить
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}