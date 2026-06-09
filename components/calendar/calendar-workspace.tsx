"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Inbox,
  ListPlus,
  Plus,
  X,
  Sparkles,
  Trello,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week";
type ItemType = "task" | "reminder";
type CategoryId = "focus" | "home" | "work" | "wellness" | "finance";

type CalendarItem = {
  id: string;
  title: string;
  notes: string;
  date: string | null;
  time: string;
  type: ItemType;
  category: CategoryId;
  completed?: boolean;
};

type KanbanTask = {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  syncToCalendar: boolean;
  linkToNotes: boolean;
  createdAt: number;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const categories: Record<
  CategoryId,
  { label: string; dot: string; chip: string; border: string }
> = {
  focus: {
    label: "Focus",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700",
    border: "border-sky-200",
  },
  home: {
    label: "Home",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
  },
  work: {
    label: "Work",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700",
    border: "border-violet-200",
  },
  wellness: {
    label: "Wellness",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700",
    border: "border-rose-200",
  },
  finance: {
    label: "Finance",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
  },
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return toDateKey(next);
}

function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthDays(activeDate: Date) {
  const firstDay = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
  const firstGridDay = new Date(firstDay);
  firstGridDay.setDate(firstGridDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstGridDay);
    day.setDate(firstGridDay.getDate() + index);
    return day;
  });
}

function getWeekDays(activeDate: Date) {
  const start = new Date(activeDate);
  start.setDate(activeDate.getDate() - activeDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateLabel(dateKey: string | null) {
  if (!dateKey) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(fromDateKey(dateKey));
}

function createStarterItems(today: Date): CalendarItem[] {
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

function emptyForm(date: string | null): CalendarItem {
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

export function CalendarWorkspace() {
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);
  const [activeDate, setActiveDate] = useState(today);
  const [view, setView] = useState<CalendarView>("month");
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
  const [dialogItem, setDialogItem] = useState<CalendarItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedCal = localStorage.getItem("catalyst_calendar_items");
    if (savedCal) {
      setItems(JSON.parse(savedCal));
    } else {
      const starter = createStarterItems(today);
      setItems(starter);
      localStorage.setItem("catalyst_calendar_items", JSON.stringify(starter));
    }

    const savedKanban = localStorage.getItem("catalyst_kanban_tasks");
    if (savedKanban) {
      setKanbanTasks(JSON.parse(savedKanban));
    }
  }, [today]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "create-task" || action === "create-reminder") {
        const type = action === "create-reminder" ? "reminder" : "task";
        setDialogItem({
          id: "",
          title: "",
          notes: "",
          date: todayKey,
          time: "",
          type,
          category: "focus",
        });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [todayKey]);

  const combinedItems = useMemo(() => {
    const syncedKanban = kanbanTasks
      .filter((t) => t.syncToCalendar && t.dueDate)
      .map((t) => {
        let cat: CategoryId = "work";
        if (t.priority === "high") cat = "wellness";
        else if (t.priority === "low") cat = "focus";

        return {
          id: `kanban-${t.id}`,
          title: t.title,
          notes: t.description || "",
          date: t.dueDate,
          time: "09:00",
          type: "task" as const,
          category: cat,
          isKanban: true,
        };
      });
    return [...items, ...syncedKanban];
  }, [items, kanbanTasks]);

  const visibleDays = useMemo(
    () => (view === "month" ? getMonthDays(activeDate) : getWeekDays(activeDate)),
    [activeDate, view],
  );

  const scheduledItems = useMemo(() => combinedItems.filter((item) => item.date), [combinedItems]);
  const draftItems = useMemo(() => combinedItems.filter((item) => !item.date), [combinedItems]);

  const movePeriod = (direction: -1 | 1) => {
    setActiveDate((current) => {
      const next = new Date(current);
      if (view === "month") {
        next.setMonth(current.getMonth() + direction);
      } else {
        next.setDate(current.getDate() + direction * 7);
      }
      return next;
    });
  };

  const openDialog = (date: string | null, item?: CalendarItem & { isKanban?: boolean }) => {
    if (item && item.isKanban) {
      setToastMessage("This is a synced Kanban task. Go to the Kanban Board to edit details.");
      return;
    }
    setDialogItem(item ?? emptyForm(date));
  };
  

  const saveItem = (item: CalendarItem, saveAsDraft = false) => {
    const normalized = {
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
      const updated = exists
        ? current.map((entry) => (entry.id === normalized.id ? normalized : entry))
        : [...current, normalized];
      localStorage.setItem("catalyst_calendar_items", JSON.stringify(updated));
      return updated;
    });
    setDialogItem(null);
  };

  const moveItemToDate = (itemId: string, date: string | null) => {
    if (itemId.startsWith("kanban-")) {
      const realId = itemId.replace("kanban-", "");
      const updatedKanban = kanbanTasks.map((t) =>
        t.id === realId ? { ...t, dueDate: date || "" } : t
      );
      setKanbanTasks(updatedKanban);
      localStorage.setItem("catalyst_kanban_tasks", JSON.stringify(updatedKanban));
      
      const movedTask = kanbanTasks.find((t) => t.id === realId);
      if (movedTask) {
        setToastMessage(`Updated board task "${movedTask.title}" due date to ${date}.`);
      }
      return;
    }

    setItems((current) => {
      const updated = current.map((item) => (item.id === itemId ? { ...item, date } : item));
      localStorage.setItem("catalyst_calendar_items", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setDialogItem(null);
  };

  const toggleComplete = (itemId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const dayItems = (date: Date) =>
    scheduledItems
      .filter((item) => item.date === toDateKey(date))
      .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      {toastMessage && (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-lg border border-primary/20 bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in slide-in-from-top duration-300">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
      <header className="flex flex-col gap-4 border-b border-border bg-background/85 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <CalendarDays className="size-4" />
            Calendar
          </p>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            Schedule tasks and reminders
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 rounded-md border border-border bg-card p-1 shadow-sm">
            {(["month", "week"] as CalendarView[]).map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "rounded px-3 py-2 text-sm font-semibold capitalize text-muted-foreground transition",
                  view === option && "bg-primary text-primary-foreground shadow-sm",
                )}
                onClick={() => setView(option)}
              >
                {option} View
              </button>
            ))}
          </div>
          <Button className="gap-2" onClick={() => openDialog(todayKey)}>
            <Plus className="size-4" />
            Add Task
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 flex-1 gap-5 p-5 md:p-8 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button
                aria-label="Previous period"
                size="icon"
                variant="outline"
                onClick={() => movePeriod(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                aria-label="Next period"
                size="icon"
                variant="outline"
                onClick={() => movePeriod(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" onClick={() => setActiveDate(new Date())}>
                Today
              </Button>
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{formatMonth(activeDate)}</h2>
              <p className="text-sm text-muted-foreground">
                {view === "month"
                  ? "Complete month overview"
                  : `Week of ${formatDateLabel(toDateKey(visibleDays[0]))}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {Object.entries(categories).map(([id, category]) => (
                <span key={id} className="inline-flex items-center gap-1.5">
                  <span className={cn("size-2.5 rounded-full", category.dot)} />
                  {category.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-muted/45">
            {weekdays.map((day) => (
              <div
                key={day}
                className="px-1 py-3 text-center text-xs font-semibold uppercase text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className={cn(
              "grid grid-cols-7",
              view === "month"
                ? "auto-rows-[minmax(118px,1fr)]"
                : "auto-rows-[minmax(520px,1fr)]",
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
                    "group flex min-w-0 flex-col border-b border-r border-border bg-card p-2 text-left transition hover:bg-accent/40",
                    view === "month" && !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isToday && "bg-accent/55",
                  )}
                  onClick={() => openDialog(dateKey)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openDialog(dateKey);
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
                        "grid size-7 place-items-center rounded-full text-sm font-semibold",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground group-hover:bg-background",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <span className="rounded bg-background px-1.5 py-1 text-[11px] font-medium text-muted-foreground opacity-0 transition group-hover:opacity-100 cursor-pointer">
                      Add
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5 scrollbar-none",
                      view === "month" ? "max-h-[96px]" : "max-h-[480px]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {itemsForDay.map((item) => (
                      <CalendarTask
                        key={item.id}
                        item={item}
                        onOpen={() => openDialog(item.date, item)}
                        onToggleComplete={() => toggleComplete(item.id)}
                        todayKey={todayKey}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="flex min-h-[350px] min-w-0 flex-col rounded-lg border border-border bg-card shadow-sm xl:max-h-[calc(100vh-8rem)]">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Draft Task Panel</h2>
                <p className="text-sm text-muted-foreground">
                  Save now, schedule when ready.
                </p>
              </div>
              <Button
                aria-label="Add draft"
                size="icon"
                onClick={() => openDialog(null)}
              >
                <ListPlus className="size-4" />
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
                moveItemToDate(itemId, null);
              }
            }}
          >
            {draftItems.length === 0 ? (
              <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-background p-6 text-center">
                <div>
                  <Inbox className="mx-auto mb-3 size-8 text-muted-foreground" />
                  <p className="text-sm font-semibold">No drafts yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save unscheduled tasks here and drag them onto the calendar.
                  </p>
                </div>
              </div>
            ) : (
              draftItems.map((item) => (
                <DraftTask
                  key={item.id}
                  item={item}
                  onOpen={() => openDialog(null, item)}
                  onToggleComplete={() => toggleComplete(item.id)}
                />
              ))
            )}
          </div>
        </aside>
      </div>

      {dialogItem && (
        <TaskDialog
          item={dialogItem}
          onClose={() => setDialogItem(null)}
          onSave={saveItem}
          onDelete={deleteItem}
        />
      )}
    </>
  );
}

function CalendarTask({
  item,
  onOpen,
  onToggleComplete,
  todayKey,
}: {
  item: CalendarItem & { isKanban?: boolean };
  onOpen: () => void;
  onToggleComplete: () => void;
  todayKey: string;
}) {
  const category = categories[item.category];
  const isOverdue =
    item.type === "task" &&
    !item.completed &&
    item.date !== null &&
    item.date < todayKey;

  return (
    <button
      draggable
      type="button"
      className={cn(
        "min-w-0 rounded-md border px-2 py-1.5 text-left text-xs shadow-sm transition hover:-translate-y-0.5 flex flex-col gap-1 w-full",
        item.completed && "opacity-50 line-through text-muted-foreground",
        isOverdue
          ? "border-destructive/40 bg-destructive/5 text-destructive opacity-50"
          : item.isKanban
          ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70"
          : cn(category.chip, category.border)
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
      <span className="flex min-w-0 items-center gap-1.5 w-full">
        {item.type === "task" ? (
          <input
            type="checkbox"
            checked={!!item.completed}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              onToggleComplete();
            }}
            className="size-3.5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        ) : item.isKanban ? (
          <Trello className="size-3.5 shrink-0 text-orange-500" />
        ) : item.type === "reminder" ? (
          <Bell className="size-3.5 shrink-0" />
        ) : (
          <GripVertical className="size-3.5 shrink-0" />
        )}
        <span className={cn("truncate font-semibold flex-1", item.completed && "line-through")}>
          {item.title}
        </span>
      </span>
      <div className="flex w-full items-center justify-between gap-1 text-[11px] opacity-80">
        {item.time && <span>{item.time}</span>}
        {isOverdue && (
          <span className="font-bold text-destructive animate-pulse ml-auto">Overdue</span>
        )}
      </div>
    </button>
  );
}

function DraftTask({
  item,
  onOpen,
  onToggleComplete,
}: {
  item: CalendarItem;
  onOpen: () => void;
  onToggleComplete: () => void;
}) {
  const category = categories[item.category];

  return (
    <button
      draggable
      type="button"
      className={cn(
        "w-full rounded-lg border bg-background p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/45",
        category.border,
        item.completed && "opacity-50"
      )}
      onClick={onOpen}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {item.type === "task" ? (
              <input
                type="checkbox"
                checked={!!item.completed}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                  event.stopPropagation();
                  onToggleComplete();
                }}
                className="size-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            ) : (
              <span className={cn("size-2.5 shrink-0 rounded-full", category.dot)} />
            )}
            <span className={cn("truncate text-sm font-semibold flex-1", item.completed && "line-through text-muted-foreground")}>
              {item.title}
            </span>
          </div>
          {item.notes && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {item.notes}
            </p>
          )}
        </div>
        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className={cn("rounded px-2 py-1", category.chip)}>
          {category.label}
        </span>
        <span className="rounded bg-muted px-2 py-1 capitalize text-muted-foreground">
          {item.type}
        </span>
      </div>
    </button>
  );
}

function TaskDialog({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: CalendarItem;
  onClose: () => void;
  onSave: (item: CalendarItem, saveAsDraft?: boolean) => void;
  onDelete?: (itemId: string) => void;
}) {
  const [form, setForm] = useState(item);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-3 backdrop-blur-sm sm:items-center">
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-2xl sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {form.id ? "Edit task" : "Create task"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.date ? `Scheduling for ${formatDateLabel(form.date)}` : "Saving as a draft"}
            </p>
          </div>
          <Button
            aria-label="Close dialog"
            size="icon"
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <input
              autoFocus
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition placeholder:text-muted-foreground focus:ring-4"
              placeholder="Plan sprint tasks"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Type</span>
              <select
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as ItemType })
                }
              >
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Date</span>
              <input
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                type="date"
                value={form.date ?? ""}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value || null })
                }
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Time</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Category</span>
              <select
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
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
                type="button"
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border px-2 py-2 text-xs font-medium transition",
                  form.category === id
                    ? cn("bg-background", category.border)
                    : "border-border bg-background/65 hover:bg-accent",
                )}
                onClick={() => setForm({ ...form, category: id as CategoryId })}
              >
                <span className={cn("size-2.5 shrink-0 rounded-full", category.dot)} />
                <span className="truncate">{category.label}</span>
              </button>
            ))}
          </div>

          {form.type === "task" && (
            <label className="flex items-center gap-2 rounded-md border border-border bg-background/65 p-3 hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.completed}
                onChange={(event) => setForm({ ...form, completed: event.target.checked })}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm font-medium">Mark as Completed</span>
            </label>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              className="min-h-24 resize-none rounded-md border border-input bg-background px-3 py-3 text-sm outline-none ring-primary/20 transition placeholder:text-muted-foreground focus:ring-4"
              placeholder="Add details, links, or reminders..."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSave({ ...form, date: null }, true)}
          >
            Save Draft
          </Button>
          {form.id ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (onDelete && form.id) {
                  onDelete(form.id);
                }
              }}
            >
              {form.date ? "Delete Task" : "Delete Draft"}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit">{form.date ? "Schedule Task" : "Save Draft"}</Button>
        </div>
      </form>
    </div>
  );
}
