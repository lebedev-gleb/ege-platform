import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import ProgressLoader from "@/components/ProgressLoader";
import TasksLoader from "@/components/TasksLoader";
import ActivityLoader from "@/components/ActivityLoader";
import MeRefresher from "@/components/MeRefresher";

export const metadata: Metadata = {
  title: "ЕГЭ.Информатика — курсы и задачи",
  description:
    "Подготовка к ЕГЭ по информатике: курсы, каталог задач и статистика прогресса",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <Navbar />
          <ProgressLoader />
          <TasksLoader />
          <ActivityLoader />
          <MeRefresher />
          <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-28">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}