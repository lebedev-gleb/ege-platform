"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

// Контейнер для уведомлений, который подстраивается под текущую тему сайта
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"       // тема = класс .dark на теге <html>
      defaultTheme="system"   // по умолчанию — как в операционной системе
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}