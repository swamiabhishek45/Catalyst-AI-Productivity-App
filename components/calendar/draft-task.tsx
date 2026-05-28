"use client";

import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { categories } from "./calendar-data";
import type { CalendarItem } from "./types";

type DraftTaskProps = {
  item: CalendarItem;
  onOpen: () => void;
};

export function DraftTask({ item, onOpen }: DraftTaskProps) {
  const category = categories[item.category];

  return (
    <button
      draggable
      className={cn(
        "w-full rounded-lg border bg-black/15 p-3 text-left shadow-lg transition hover:-translate-y-0.5 hover:bg-white/[0.04]",
        category.border,
      )}
      onClick={onOpen}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", category.dot)} />
            <span className="truncate text-sm font-semibold text-white">{item.title}</span>
          </div>
          {item.notes && <p className="mt-2 line-clamp-2 text-sm text-stone-400">{item.notes}</p>}
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-stone-500" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-400">
        <span className={cn("rounded px-2 py-1", category.chip)}>{category.label}</span>
        <span className="rounded bg-white/5 px-2 py-1 capitalize">{item.type}</span>
      </div>
    </button>
  );
}
