import type { CalendarItem, CategoryId } from "./types";
import { addDays, toDateKey } from "./date-utils";

export const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const categories: Record<
  CategoryId,
  {
    label: string;
    dot: string;
    chip: string;
    border: string;
    glow: string;
  }
> = {
  focus: {
    label: "Focus",
    dot: "bg-sky-400",
    chip: "bg-sky-500/12 text-sky-100",
    border: "border-sky-400/35",
    glow: "shadow-sky-950/25",
  },
  home: {
    label: "Home",
    dot: "bg-emerald-400",
    chip: "bg-emerald-500/12 text-emerald-100",
    border: "border-emerald-400/35",
    glow: "shadow-emerald-950/25",
  },
  work: {
    label: "Work",
    dot: "bg-violet-400",
    chip: "bg-violet-500/12 text-violet-100",
    border: "border-violet-400/35",
    glow: "shadow-violet-950/25",
  },
  wellness: {
    label: "Wellness",
    dot: "bg-rose-400",
    chip: "bg-rose-500/12 text-rose-100",
    border: "border-rose-400/35",
    glow: "shadow-rose-950/25",
  },
  finance: {
    label: "Finance",
    dot: "bg-amber-400",
    chip: "bg-amber-500/12 text-amber-100",
    border: "border-amber-400/35",
    glow: "shadow-amber-950/25",
  },
};

export function createStarterItems(today: Date): CalendarItem[] {
  return [
    {
      id: "seed-1",
      title: "Deep work planning",
      notes: "Block the first hour for priorities.",
      date: toDateKey(today),
      time: "09:00",
      type: "task",
      category: "focus",
    },
    {
      id: "seed-2",
      title: "Renew software subscription",
      notes: "",
      date: addDays(today, 2),
      time: "14:30",
      type: "reminder",
      category: "finance",
    },
    {
      id: "seed-3",
      title: "Draft weekly review",
      notes: "Keep it short and useful.",
      date: null,
      time: "",
      type: "task",
      category: "work",
    },
  ];
}

export function emptyForm(date: string | null): CalendarItem {
  return {
    id: "",
    title: "",
    notes: "",
    date,
    time: "",
    type: "task",
    category: "focus",
  };
}
