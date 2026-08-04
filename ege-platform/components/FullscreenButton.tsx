"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen API браузера — внешняя система: подписываемся на её событие.
  // Пользователь может выйти из полного экрана и клавишей Esc —
  // подписка узнает об этом и синхронизирует иконку.
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement !== null);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFullscreen ? "Выйти из полного экрана" : "На весь экран"}
      title={isFullscreen ? "Выйти из полного экрана (Esc)" : "На весь экран"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-foreground"
    >
      {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
    </button>
  );
}