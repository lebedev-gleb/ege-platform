"use client";

import { theoryImageUrl } from "@/lib/api";
import type { TheoryBlock } from "@/types";

// Разбор **жирного**: нечётные куски между ** — полужирные
function renderRich(text: string) {
  const parts = text.split("**");
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export default function TheoryContent({ blocks }: { blocks: TheoryBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-sm text-muted">Теория для этого раздела пока не добавлена.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={index}
              className="text-lg font-semibold tracking-tight"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="rounded-r-xl border-l-4 border-accent bg-accent/5 px-4 py-3 text-sm italic leading-relaxed text-muted"
            >
              {renderRich(block.text)}
            </blockquote>
          );
        }
        if (block.type === "image") {
          return (
            <figure
              key={index}
              className="overflow-hidden rounded-2xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theoryImageUrl(block.imageId)}
                alt={block.caption ?? ""}
                className="w-full"
              />
              {block.caption && (
                <figcaption className="px-4 py-2 text-xs text-muted">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        // paragraph
        return (
          <p
            key={index}
            className="whitespace-pre-wrap text-sm leading-relaxed"
          >
            {renderRich(block.text)}
          </p>
        );
      })}
    </div>
  );
}