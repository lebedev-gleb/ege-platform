"use client";

import type { Topic } from "@/types";

// Компонент получает через props и данные (topics, selectedTopicId),
// и функцию-колбэк onSelectTopic. Сам он ничего не решает и не хранит:
// при клике просто сообщает родителю «выбрали тему такую-то»,
// а родитель (страница курса) обновляет состояние.
// Это главный паттерн общения компонентов в React.

type CourseSidebarProps = {
  topics: Topic[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
};

export default function CourseSidebar({
  topics,
  selectedTopicId,
  onSelectTopic,
}: CourseSidebarProps) {
  return (
    <aside className="w-full shrink-0 md:w-72">
      <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted">
        Темы курса
      </p>
      <nav className="mt-3 flex flex-col gap-1">
        {topics.map((topic, index) => {
          const isActive = topic.id === selectedTopicId;
          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className={`flex items-baseline gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {/* Номер темы: 01, 02, 03... */}
              <span className="text-xs tabular-nums opacity-60">
                {String(index + 1).padStart(2, "0")}
              </span>
              {topic.title}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}