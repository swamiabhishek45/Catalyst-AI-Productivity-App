import {
  CalendarDays,
  NotebookPen,
  PenTool,
  Plus,
  Search,
  Sparkles,
  Trello,
} from "lucide-react";

import { cn } from "@/lib/utils";

const quickActions = [
  { label: "New note", icon: NotebookPen, color: "bg-rose-100 text-rose-600" },
  { label: "Plan sprint", icon: Trello, color: "bg-orange-100 text-orange-600" },
  { label: "Map ideas", icon: PenTool, color: "bg-cyan-100 text-cyan-600" },
  { label: "Ask AI", icon: Sparkles, color: "bg-violet-100 text-violet-600" },
];

const focusCards = [
  {
    title: "Product Launch",
    meta: "8 tasks",
    accent: "bg-sky-400",
    progressClass: "w-[72%]",
    progress: "72%",
  },
  {
    title: "Research Space",
    meta: "14 notes",
    accent: "bg-emerald-400",
    progressClass: "w-[46%]",
    progress: "46%",
  },
  {
    title: "Design Jam",
    meta: "3 boards",
    accent: "bg-coral-400",
    progressClass: "w-[58%]",
    progress: "58%",
  },
];

const tasks = ["Draft onboarding flow", "Review content map", "Sync calendar blocks"];

export function DashboardHome() {
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border bg-background/85 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Good afternoon
          </p>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            Your calm command center
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground shadow-sm sm:w-[260px]">
            <Search className="size-4 shrink-0 text-sky-500" />
            <span className="truncate">Search notes, boards, tasks...</span>
          </label>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create
          </button>
        </div>
      </header>

      <div className="grid gap-5 p-5 md:p-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Today&apos;s flow</p>
                <h2 className="mt-1 text-xl font-semibold">
                  Organize work without losing the thread.
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      className="flex h-20 min-w-[86px] flex-col items-center justify-center gap-2 rounded-md border border-border bg-background text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-md",
                          action.color,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {focusCards.map((card) => (
              <article
                key={card.title}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className={cn("size-2.5 rounded-full", card.accent)} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {card.meta}
                  </span>
                </div>
                <h3 className="font-semibold">{card.title}</h3>
                <div className="mt-4 h-2 rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      card.accent,
                      card.progressClass,
                    )}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {card.progress} shaped
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Kanban pulse</h3>
                <Trello className="size-4 text-orange-500" />
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {task}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Whiteboard sparks</h3>
                <PenTool className="size-4 text-cyan-500" />
              </div>
              <div className="grid h-36 place-items-center rounded-md border border-dashed border-cyan-200 bg-cyan-50/60">
                <div className="grid grid-cols-3 gap-3">
                  <span className="size-10 rounded-md bg-sky-200" />
                  <span className="size-10 rounded-full bg-emerald-200" />
                  <span className="size-10 rounded-md bg-coral-200" />
                </div>
              </div>
            </article>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-md bg-violet-100 text-violet-600">
                <Sparkles className="size-4" />
              </div>
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
              Summarize today&apos;s notes and turn loose ideas into a launch
              checklist.
            </div>
            <button
              type="button"
              className="mt-3 h-9 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Generate plan
            </button>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Calendar</h3>
              <CalendarDays className="size-4 text-emerald-500" />
            </div>
            <div className="space-y-3">
              {["Deep work", "Design review", "Weekly planning"].map(
                (event, index) => (
                  <div key={event} className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-md bg-secondary text-xs font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-sm">{event}</p>
                  </div>
                ),
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
