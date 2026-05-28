"use client";

import { Clock, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categories } from "./calendar-data";
import { formatDateLabel } from "./date-utils";
import type { CalendarItem, CategoryId, ItemType } from "./types";

type TaskDialogProps = {
  item: CalendarItem;
  defaultDate: string | null;
  onClose: () => void;
  onSave: (item: CalendarItem, saveAsDraft?: boolean) => void;
};

export function TaskDialog({ item, defaultDate, onClose, onSave }: TaskDialogProps) {
  const [form, setForm] = useState<CalendarItem>({
    ...item,
    date: item.date ?? defaultDate,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center">
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-[#1d1e23] p-4 shadow-2xl shadow-black/40 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {form.id ? "Edit task" : "Create task"}
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              {form.date ? `Scheduling for ${formatDateLabel(form.date)}` : "Saving as a draft"}
            </p>
          </div>
          <Button
            aria-label="Close dialog"
            className="h-9 w-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
            size="icon"
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-300">Title</span>
            <input
              autoFocus
              className="h-11 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none ring-teal-300/30 transition placeholder:text-stone-600 focus:ring-4"
              placeholder="Plan sprint tasks"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-300">Type</span>
              <select
                className="h-11 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none ring-teal-300/30 transition focus:ring-4"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as ItemType })}
              >
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-300">Date</span>
              <input
                className="h-11 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none ring-teal-300/30 transition focus:ring-4"
                type="date"
                value={form.date ?? ""}
                onChange={(event) => setForm({ ...form, date: event.target.value || null })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-300">Time</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  className="h-11 w-full rounded-md border border-white/10 bg-black/20 pl-9 pr-3 text-sm text-white outline-none ring-teal-300/30 transition focus:ring-4"
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-300">Category</span>
              <select
                className="h-11 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none ring-teal-300/30 transition focus:ring-4"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value as CategoryId })
                }
              >
                {Object.entries(categories).map(([id, category]) => (
                  <option key={id} value={id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Object.entries(categories).map(([id, category]) => (
              <button
                key={id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2 py-2 text-xs font-medium text-stone-300 transition",
                  form.category === id
                    ? cn("bg-white/10", category.border)
                    : "border-white/10 bg-black/10 hover:bg-white/5",
                )}
                type="button"
                onClick={() => setForm({ ...form, category: id as CategoryId })}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", category.dot)} />
                <span className="truncate">{category.label}</span>
              </button>
            ))}
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-300">Notes</span>
            <textarea
              className="min-h-24 resize-none rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none ring-teal-300/30 transition placeholder:text-stone-600 focus:ring-4"
              placeholder="Add details, links, or reminders..."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Button
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            type="button"
            variant="outline"
            onClick={() => onSave({ ...form, date: null }, true)}
          >
            Save Draft
          </Button>
          <Button
            className="border-white/10 bg-transparent text-white hover:bg-white/10"
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="bg-teal-300 text-stone-950 hover:bg-teal-200" type="submit">
            {form.date ? "Schedule Task" : "Save Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
