"use client";

import { useState } from "react";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutTemplate,
  NotebookPen,
  PanelLeft,
  PenTool,
  Plus,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  Trello,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        color: "text-sky-500",
        active: true,
      },
      { label: "AI Assistant", icon: Bot, color: "text-violet-500" },
      { label: "Calendar", icon: CalendarDays, color: "text-emerald-500" },
      { label: "Task / Kanban", icon: Trello, color: "text-orange-500" },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Notes", icon: NotebookPen, color: "text-rose-500" },
      { label: "Whiteboard", icon: PenTool, color: "text-cyan-500" },
      { label: "Pages / Spaces", icon: StickyNote, color: "text-amber-500" },
      {
        label: "AI Template Builder",
        icon: LayoutTemplate,
        color: "text-fuchsia-500",
      },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", icon: Settings, color: "text-slate-500" }],
  },
];

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

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card/92 px-3 py-4 shadow-[8px_0_30px_rgba(50,64,84,0.06)] backdrop-blur transition-all duration-300",
            collapsed ? "w-[76px]" : "w-[244px]"
          )}
        >
          <div
            className={cn(
              "mb-5 flex items-center gap-3",
              collapsed && "justify-center"
            )}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <PanelLeft className="size-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">CanvasDesk</p>
                <p className="truncate text-xs text-muted-foreground">
                  Think, plan, ship
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((current) => !current)}
            className={cn(
              "mb-4 flex h-9 items-center rounded-md border border-border bg-background px-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            {!collapsed && <span>Collapse</span>}
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>

          <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1.5 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={item.label}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-[0.82rem] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                          item.active &&
                            "bg-primary/8 text-foreground shadow-[inset_0_0_0_1px_rgba(44,123,229,0.12)]",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", item.color)} />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div
            className={cn(
              "mt-5 rounded-lg border border-border bg-background p-2.5",
              collapsed && "grid place-items-center p-2"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-mint-100 text-emerald-600">
                <UsersRound className="size-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    Studio Workspace
                  </p>
                  <p className="truncate text-[0.7rem] text-muted-foreground">
                    4 teammates online
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
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
                    <p className="text-sm font-medium text-primary">
                      Today&apos;s flow
                    </p>
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
                              action.color
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
                          card.progressClass
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
                  Summarize today&apos;s notes and turn loose ideas into a
                  launch checklist.
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
                    )
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
