"use client";

import { Bell, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { categories } from "./calendar-data";
import type { CalendarItem } from "./types";

type CalendarTaskProps = {
  item: CalendarItem;
  onOpen: () => void;
};

export function CalendarTask({ item, onOpen }: CalendarTaskProps) {
  const category = categories[item.category];

  return (
    <div
      draggable
      className={cn(
        "min-w-0 rounded-md border px-2 py-1.5 text-xs shadow-lg transition hover:-translate-y-0.5",
        category.chip,
        category.border,
        category.glow,
      )}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData("text/plain", item.id);
      }}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {item.type === "reminder" ? (
          <Bell className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <GripVertical className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate font-semibold">{item.title}</span>
      </div>
      {item.time && <div className="mt-1 text-[11px] opacity-80">{item.time}</div>}
    </div>
  );
}
