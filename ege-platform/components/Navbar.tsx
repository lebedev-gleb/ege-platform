"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ContactsDialog from "@/components/ContactsDialog";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { startYandexLogin } from "@/lib/auth";
import StreakBadge from "./StreakBadge";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/my-courses", label: "Моё обучение" },
  { href: "/catalog", label: "Каталог задач" },
  { href: "/quiz", label: "Квизы" },
  { href: "/statistics", label: "Статистика" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [contactsOpen, setContactsOpen] = useState(false);
  const { hydrated, isSignedIn, user } = useAuth();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
          >
            <GraduationCap size={22} className="text-accent" />
            ЕГЭ.Информатика
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  pathname === link.href
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setContactsOpen(true)}
              className="rounded-full px-4 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              Контакты
            </button>
            {/* Ссылка на админку — только для администраторов */}
            {hydrated && user?.isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  pathname === "/admin"
                    ? "font-medium text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Shield size={14} /> Админка
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {hydrated && isSignedIn && <StreakBadge />}
            {hydrated &&
              (isSignedIn ? (
                <UserMenu />
              ) : (
                <button
                  onClick={startYandexLogin}
                  className="flex h-9 items-center rounded-full bg-accent px-5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Войти
                </button>
              ))}
          </div>
        </nav>
      </header>

      <ContactsDialog
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
      />
    </>
  );
}