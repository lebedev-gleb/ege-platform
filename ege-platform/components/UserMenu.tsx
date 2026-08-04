"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const initials =
    user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-accent text-xs font-semibold text-white transition-transform active:scale-95"
        aria-label="Меню пользователя"
      >
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
      </button>

      {open && (
        <>
          {/* Прозрачный слой на весь экран: клик по нему закрывает меню */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
            <div className="border-b border-border p-4">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {user.email && (
                <p className="truncate text-xs text-muted">{user.email}</p>
              )}
            </div>
            <div className="p-1.5">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface"
              >
                <UserIcon size={15} className="text-muted" /> Профиль
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                  router.push("/");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut size={15} /> Выйти
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}