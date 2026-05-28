"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ListPlus,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  categories,
  createStarterItems,
  emptyForm,
  weekdays,
} from "./calendar-data";
import { CalendarTask } from "./calendar-task";
import {
  formatDateLabel,
  formatMonth,
  getMonthDays,
  getWeekDays,
  toDateKey,
} from "./date-utils";
import { DraftTask } from "./draft-task";
import { TaskDialog } from "./task-dialog";
import type { CalendarItem, CalendarView, DialogState } from "./types";

export function CalendarDashboard() {
  const [today, setToday] = useState<Date | null>(null);
  const todayKey = today ? toDateKey(today) : "";
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const visibleDays = useMemo(() => {
    if (!activeDate) {
      return [];
    }

    return view === "month" ? getMonthDays(activeDate) : getWeekDays(activeDate);
  }, [activeDate, view]);

  const scheduledItems = items.filter((item) => item.date);
  const draftItems = items.filter((item) => !item.date);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setActiveDate(now);
    setItems(createStarterItems(now));
  }, []);

  const movePeriod = (direction: -1 | 1) => {
    setActiveDate((current) => {
      if (!current) {
        return new Date();
      }

      const next = new Date(current);

      if (view === "month") {
        next.setMonth(current.getMonth() + direction);
        return next;
      }

      next.setDate(current.getDate() + direction * 7);
      return next;
    });
  };

  const openCreateDialog = (date: string | null) => {
    setDialog({ date, item: emptyForm(date) });
  };

  const saveItem = (item: CalendarItem, saveAsDraft = false) => {
    const normalized: CalendarItem = {
      ...item,
      id: item.id || crypto.randomUUID(),
      title: item.title.trim(),
      notes: item.notes.trim(),
      date: saveAsDraft ? null : item.date,
    };

    if (!normalized.title) {
      return;
    }

    setItems((current) => {
      const exists = current.some((entry) => entry.id === normalized.id);
      return exists
        ? current.map((entry) => (entry.id === normalized.id ? normalized : entry))
        : [...current, normalized];
    });
    setDialog(null);
  };

  const moveItemToDate = (itemId: string, date: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, date } : item)),
    );
  };

  const dayItems = (date: Date) =>
    scheduledItems
      .filter((item) => item.date === toDateKey(date))
      .sort((a, b) => a.time.localeCompare(b.time));

  if (!today || !activeDate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#101114] px-4 text-stone-100">
        <div className="rounded-lg border border-white/10 bg-[#18191d] p-6 text-center shadow-2xl shadow-black/20">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-teal-200" />
          <p className="text-sm font-medium text-stone-300">Preparing your calendar...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#101114] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#18191d]/90 px-4 py-4 shadow-2xl shadow-black/20 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-200">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </div>
            <h1 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              Plan tasks and reminders
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 rounded-md border border-white/10 bg-black/20 p-1">
              {(["month", "week"] as CalendarView[]).map((option) => (
                <button
                  key={option}
                  className={cn(
                    "rounded px-3 py-2 text-sm font-medium capitalize text-stone-300 transition",
                    view === option && "bg-white text-stone-950 shadow-sm",
                  )}
                  onClick={() => setView(option)}
                >
                  {option} View
                </button>
              ))}
            </div>
            <Button
              className="gap-2 bg-teal-300 text-stone-950 hover:bg-teal-200"
              onClick={() => openCreateDialog(todayKey)}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-lg border border-white/10 bg-[#17181c] shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Previous period"
                  className="h-9 w-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  size="icon"
                  variant="outline"
                  onClick={() => movePeriod(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  aria-label="Next period"
                  className="h-9 w-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  size="icon"
                  variant="outline"
                  onClick={() => movePeriod(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  variant="outline"
                  onClick={() => setActiveDate(new Date())}
                >
                  Today
                </Button>
              </div>

              <div className="min-w-0 text-left sm:text-center">
                <h2 className="text-xl font-semibold text-white">{formatMonth(activeDate)}</h2>
                <p className="text-sm text-stone-400">
                  {view === "month"
                    ? "Complete month overview"
                    : `Week of ${formatDateLabel(toDateKey(visibleDays[0]))}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                {Object.entries(categories).map(([id, category]) => (
                  <span key={id} className="inline-flex items-center gap-1.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full", category.dot)} />
                    {category.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-normal text-stone-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div
              className={cn(
                "grid grid-cols-7",
                view === "month"
                  ? "auto-rows-[minmax(132px,1fr)]"
                  : "auto-rows-[minmax(560px,1fr)]",
              )}
            >
              {visibleDays.map((date) => {
                const dateKey = toDateKey(date);
                const isCurrentMonth = date.getMonth() === activeDate.getMonth();
                const isToday = dateKey === todayKey;
                const itemsForDay = dayItems(date);

                return (
                  <div
                    key={dateKey}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "group flex min-w-0 flex-col border-b border-r border-white/10 bg-[#17181c] p-2 text-left transition hover:bg-[#202126]",
                      !isCurrentMonth && view === "month" && "bg-[#131417] text-stone-500",
                      isToday && "bg-teal-950/25",
                    )}
                    onClick={() => openCreateDialog(dateKey)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCreateDialog(dateKey);
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const itemId = event.dataTransfer.getData("text/plain");
                      if (itemId) {
                        moveItemToDate(itemId, dateKey);
                      }
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                          isToday
                            ? "bg-teal-300 text-stone-950"
                            : "text-stone-300 group-hover:bg-white/10",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      <span className="rounded bg-white/5 px-1.5 py-1 text-[11px] font-medium text-stone-500 opacity-0 transition group-hover:opacity-100">
                        Add
                      </span>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                      {itemsForDay.slice(0, view === "week" ? 12 : 4).map((item) => (
                        <CalendarTask
                          key={item.id}
                          item={item}
                          onOpen={() => setDialog({ date: item.date, item })}
                        />
                      ))}
                      {itemsForDay.length > (view === "week" ? 12 : 4) && (
                        <span className="text-xs text-stone-500">
                          +{itemsForDay.length - (view === "week" ? 12 : 4)} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="flex min-h-[360px] flex-col rounded-lg border border-white/10 bg-[#18191d] shadow-2xl shadow-black/20 xl:max-h-[calc(100vh-8.5rem)]">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Draft Task Panel</h2>
                  <p className="text-sm text-stone-400">Drop drafts onto any date when ready.</p>
                </div>
                <Button
                  aria-label="Add draft"
                  className="h-9 w-9 bg-teal-300 text-stone-950 hover:bg-teal-200"
                  size="icon"
                  onClick={() => openCreateDialog(null)}
                >
                  <ListPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const itemId = event.dataTransfer.getData("text/plain");
                if (itemId) {
                  setItems((current) =>
                    current.map((item) => (item.id === itemId ? { ...item, date: null } : item)),
                  );
                }
              }}
            >
              {draftItems.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                  <Inbox className="mb-3 h-8 w-8 text-stone-500" />
                  <p className="text-sm font-medium text-stone-300">No drafts yet</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Save unscheduled tasks here and drag them onto the calendar.
                  </p>
                </div>
              ) : (
                draftItems.map((item) => (
                  <DraftTask
                    key={item.id}
                    item={item}
                    onOpen={() => setDialog({ date: null, item })}
                  />
                ))
              )}
            </div>
          </aside>
        </section>
      </div>

      {dialog?.item && (
        <TaskDialog
          item={dialog.item}
          defaultDate={dialog.date}
          onClose={() => setDialog(null)}
          onSave={saveItem}
        />
      )}
    </main>
  );
}
