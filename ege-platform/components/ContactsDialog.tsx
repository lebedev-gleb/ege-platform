"use client";

import { useEffect } from "react";
import { Mail, MessageCircle, Phone, Send, X } from "lucide-react";

type ContactsDialogProps = {
  open: boolean;
  onClose: () => void;
};

// Иконка лежит в данных прямо как компонент — в JSX её можно
// отрисовать через точку: <contact.icon />
const contacts = [
  {
    icon: Send,
    label: "Telegram",
    value: "@ege_informatika",
    href: "https://t.me/ege_informatika",
  },
  {
    icon: MessageCircle,
    label: "VK",
    value: "vk.com/ege_informatika",
    href: "https://vk.com/ege_informatika",
  },
  {
    icon: Phone,
    label: "Телефон",
    value: "+7 (900) 123-45-67",
    href: "tel:+79001234567",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@ege-platform.ru",
    href: "mailto:hello@ege-platform.ru",
  },
];

export default function ContactsDialog({ open, onClose }: ContactsDialogProps) {
  // Закрытие по Esc. Помнишь ошибку из Урока 1 про setState внутри эффекта?
  // Вот пример, когда useEffect ИМЕННО уместен: подписка на внешнюю систему
  // (клавиатуру браузера). Функция после return — «уборка»: когда окно
  // закрывается, подписка снимается, чтобы не висеть в памяти.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Окно закрыто — не рисуем вообще ничего
  if (!open) return null;

  return (
    // Оверлей: затемнение и размытие на весь экран. Клик по нему закрывает окно.
    // z-[60] — выше шапки (у неё z-50), чтобы затемнить и её тоже.
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      {/* Само окно. stopPropagation не пускает клик «сквозь» окно к оверлею —
          без него окно закрывалось бы при клике в любое место внутри */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-background p-8 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Контакты</h2>
            <p className="mt-1 text-sm text-muted">Пишите — отвечаем быстро.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {contacts.map((contact) => (
            <a
              key={contact.label}
              href={contact.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <contact.icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-medium">
                  {contact.label}
                </span>
                <span className="block text-sm text-muted">
                  {contact.value}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}