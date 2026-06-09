"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  CalendarDays,
  NotebookPen,
  PenTool,
  Plus,
  Search,
  Sparkles,
  Trello,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Bot,
  Loader2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Inbox,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Types mapping matching local structures
interface CalendarItem {
  id: string;
  title: string;
  notes: string;
  date: string | null;
  time: string;
  type: "task" | "reminder";
  category: "focus" | "home" | "work" | "wellness" | "finance";
  completed?: boolean;
}

interface KanbanTask {
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
  completed?: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string | null;
  userId: string;
  icon: string;
  color: string;
  isPinned: boolean;
  isTrash: boolean;
  createdAt: any;
  updatedAt: any;
}

interface Board {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  createdAt: any;
}

interface AITemplate {
  id: string;
  userId: string;
  appName: string;
  description: string | null;
  icon: string;
  color: string;
  layout: string;
  config: string;
  inSidebar: boolean;
  createdAt: any;
  updatedAt: any;
}

const categoryColors: Record<string, { dot: string; text: string; bg: string }> = {
  focus: { dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50 dark:bg-sky-950/20 dark:text-sky-300" },
  home: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-300" },
  work: { dot: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950/20 dark:text-violet-300" },
  wellness: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50 dark:bg-rose-950/20 dark:text-rose-300" },
  finance: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300" },
};

export function DashboardHome() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // App data state
  const [notes, setNotes] = useState<Note[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [newNoteLoading, setNewNoteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  // Fetch all user specific data on mount
  useEffect(() => {
    if (!userId) return;

    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const fetchWithCheck = async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) {
            console.error(`Failed to fetch ${url}: Status ${res.status}`);
            if (res.status === 401) {
              router.push("/sign-in");
              throw new Error("Unauthorized");
            }
            throw new Error(`Failed to fetch ${url}: Status ${res.status}`);
          }
          return res.json();
        };

        const [notesData, boardsData, templatesData, settingsData] = await Promise.all([
          fetchWithCheck("/api/notes"),
          fetchWithCheck("/api/boards"),
          fetchWithCheck("/api/template-builder"),
          fetchWithCheck("/api/settings"),
        ]);

        // Filter out soft-deleted trash notes
        setNotes(notesData.filter((n: Note) => !n.isTrash));
        setBoards(boardsData);
        setTemplates(templatesData);
        setSettings(settingsData);

        // Fetch local storage client-side items
        const savedCal = localStorage.getItem("catalyst_calendar_items");
        if (savedCal) {
          setCalendarItems(JSON.parse(savedCal));
        }

        const savedKanban = localStorage.getItem("catalyst_kanban_tasks");
        if (savedKanban) {
          setKanbanTasks(JSON.parse(savedKanban));
        }
      } catch (err) {
        console.error("Dashboard mount error:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Quick Action: Create note programmatically and redirect
  const handleCreateNoteAction = async () => {
    try {
      setNewNoteLoading(true);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "<h1>Untitled Note</h1><p>Start writing your cozy notes here...</p>",
          color: "rose",
          icon: "NotebookPen",
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        router.push(`/notes?noteId=${newNote.id}`);
      }
    } catch (err) {
      console.error("Failed to create quick note", err);
    } finally {
      setNewNoteLoading(false);
    }
  };

  // Interactive Task Completion Toggle
  const handleToggleTask = (taskId: string, isKanban: boolean) => {
    if (isKanban) {
      const updated = kanbanTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed };
        }
        return t;
      });
      setKanbanTasks(updated);
      localStorage.setItem("catalyst_kanban_tasks", JSON.stringify(updated));
    } else {
      const updated = calendarItems.map((item) => {
        if (item.id === taskId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });
      setCalendarItems(updated);
      localStorage.setItem("catalyst_calendar_items", JSON.stringify(updated));
    }
  };

  // Task Summary aggregation
  const allTasks = useMemo(() => {
    const calTasks = calendarItems
      .filter((item) => item.type === "task")
      .map((item) => ({
        id: item.id,
        title: item.title,
        dueDate: item.date,
        time: item.time,
        priority: "medium",
        completed: !!item.completed,
        isKanban: false,
        category: item.category,
      }));

    const kbTasks = kanbanTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      time: "09:00",
      priority: t.priority,
      completed: !!t.completed,
      isKanban: true,
      category: "work",
    }));

    return [...calTasks, ...kbTasks];
  }, [calendarItems, kanbanTasks]);

  const totalTasks = allTasks.length;
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const pendingTasksCount = totalTasks - completedTasksCount;

  const overdueTasksCount = allTasks.filter((t) => {
    if (t.completed) return false;
    if (!t.dueDate) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return t.dueDate < todayStr;
  }).length;

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return allTasks.slice(0, 5);
    return allTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [allTasks, searchQuery]);

  // AI Insights Generation based on real-time data metrics
  const aiInsights = useMemo(() => {
    const insights = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    // Insight 1: Overdue Alerts
    if (overdueTasksCount > 0) {
      insights.push({
        text: `You have ${overdueTasksCount} overdue task${overdueTasksCount > 1 ? "s" : ""}. We suggest prioritizing those first.`,
        type: "warning",
      });
    } else {
      insights.push({
        text: "Cozy vibes! You have 0 overdue tasks currently.",
        type: "success",
      });
    }

    // Insight 2: Workspace Distribution
    const counts = [
      { name: "Notes", count: notes.length },
      { name: "Kanban Boards", count: boards.length },
      { name: "Calendar Events", count: calendarItems.length },
    ];
    const maxVal = Math.max(...counts.map((c) => c.count));
    const active = counts.find((c) => c.count === maxVal);
    if (active && maxVal > 0) {
      insights.push({
        text: `Your most active workspace is ${active.name} with ${maxVal} entry${maxVal > 1 ? "s" : ""}.`,
        type: "info",
      });
    }

    // Insight 3: Completion rate metrics
    if (totalTasks > 0) {
      insights.push({
        text: `You have completed ${progressPercentage}% of all tasks. Keep the momentum going!`,
        type: "success",
      });
    }

    // Insight 4: Today's scheduled reminder count
    const scheduledToday = calendarItems.filter((c) => c.date === todayStr).length;
    if (scheduledToday > 0) {
      insights.push({
        text: `You have ${scheduledToday} upcoming scheduled task${scheduledToday > 1 ? "s/reminders" : "/reminder"} today.`,
        type: "info",
      });
    }

    // Insight 5: High priority focus suggestion
    const nextHighPriority = allTasks.find((t) => !t.completed && t.priority === "high");
    if (nextHighPriority) {
      insights.push({
        text: `Suggested focus: Finish your high-priority task "${nextHighPriority.title}" first.`,
        type: "focus",
      });
    } else {
      const pendingTask = allTasks.find((t) => !t.completed);
      if (pendingTask) {
        insights.push({
          text: `Suggested focus: Tackle "${pendingTask.title}" next to stay structured.`,
          type: "focus",
        });
      } else {
        insights.push({
          text: "Suggested focus: You've completed everything! Enjoy your peaceful workspace.",
          type: "focus",
        });
      }
    }

    return insights;
  }, [notes, boards, calendarItems, totalTasks, completedTasksCount, overdueTasksCount, progressPercentage, allTasks]);

  // Aggregate user activities dynamically
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      text: string;
      time: Date;
      icon: any;
      color: string;
    }> = [];

    // Notes updates
    notes.forEach((note) => {
      list.push({
        id: `note-${note.id}-${note.updatedAt || note.createdAt}`,
        text: `Updated note "${note.title}"`,
        time: new Date(note.updatedAt || note.createdAt),
        icon: NotebookPen,
        color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
      });
    });

    // Boards updates
    boards.forEach((board) => {
      list.push({
        id: `board-${board.id}`,
        text: `Created whiteboard & kanban board "${board.name}"`,
        time: new Date(board.createdAt || Date.now()),
        icon: Trello,
        color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
      });
    });

    // Calendar & Reminder items updates
    calendarItems.forEach((item) => {
      list.push({
        id: `cal-${item.id}`,
        text: `Added calendar ${item.type} "${item.title}"`,
        time: new Date(), // Simulating recent entry
        icon: CalendarDays,
        color: item.type === "reminder" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "text-sky-500 bg-sky-50 dark:bg-sky-950/20",
      });
    });

    // AI templates updates
    templates.forEach((tpl) => {
      list.push({
        id: `tpl-${tpl.id}`,
        text: `Generated custom app template "${tpl.appName}"`,
        time: new Date(tpl.updatedAt || tpl.createdAt),
        icon: Sparkles,
        color: "text-violet-500 bg-violet-50 dark:bg-violet-950/20",
      });
    });

    // Sort latest first
    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }, [notes, boards, calendarItems, templates]);

  // Filter and sort scheduled items from today onwards
  const upcomingCalendarItems = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return calendarItems
      .filter((item) => item.date && item.date >= todayStr)
      .sort((a, b) => {
        const dateDiff = a.date!.localeCompare(b.date!);
        if (dateDiff !== 0) return dateDiff;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  }, [calendarItems]);

  if (!isLoaded || (isLoaded && !userId)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-10 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold animate-pulse">Authenticating workspace...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-10 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold animate-pulse">Gathering app metrics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-background">
        <div className="rounded-full bg-rose-50 p-4 dark:bg-rose-950/30 text-rose-500 mb-4 border border-rose-100 dark:border-rose-900/50">
          <AlertCircle className="size-10" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Failed to load Dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          There was an error communicating with the database. Please ensure the workspace server is responsive and try again.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-5">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border bg-card/60 px-5 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="text-sm font-medium text-primary flex items-center gap-1.5">
            <Sparkles className="size-4 animate-pulse text-amber-500" />
            Productivity Workspace
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Your command center
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex h-9 w-full sm:w-[260px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm shadow-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-xs"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-5 md:p-8 xl:grid-cols-[minmax(0,1fr)_340px] overflow-y-auto">
        <div className="space-y-6">
          
          {/* 1. App Functionality Status Cards */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 pl-1">
              App Workspace Status
            </h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              {/* Calendar Card */}
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600">
                    <CalendarDays className="size-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-3">Calendar</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {calendarItems.length} items scheduled
                </p>
              </article>

              {/* Kanban / Tasks Card */}
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-600">
                    <Trello className="size-5" />
                  </div>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-3">Kanban Tasks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {kanbanTasks.length} boards syncing
                </p>
              </article>

              {/* Notes Card */}
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-rose-100 dark:bg-rose-950/30 text-rose-600">
                    <NotebookPen className="size-5" />
                  </div>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-3">Notes</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {notes.length} documents saved
                </p>
              </article>

              {/* Whiteboard Card */}
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600">
                    <PenTool className="size-5" />
                  </div>
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-3">Whiteboard</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {boards.length} Miro-style canvases
                </p>
              </article>

              {/* AI Assistant Card */}
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-violet-100 dark:bg-violet-950/30 text-violet-600">
                    <Bot className="size-5" />
                  </div>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    Ready
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-3">AI assistant</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {settings?.aiModel || "gemini-2.5-flash"} ({settings?.aiTone || "cozy"})
                </p>
              </article>

              {/* AI Template Builder Card */}
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-fuchsia-100 dark:bg-fuchsia-950/30 text-fuchsia-600">
                    <Flame className="size-5" />
                  </div>
                  <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mt-3">Template Builder</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {templates.length} sidebar apps custom generated
                </p>
              </article>
            </div>
          </section>

          {/* 2. Quick Action Grid */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Quick Actions</p>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">
                  Build and organize flow in real-time
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                <Link
                  href="/calendar?action=create-task"
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 text-center text-[10px] font-semibold hover:-translate-y-0.5 hover:shadow-sm transition cursor-pointer"
                >
                  <PlusCircle className="size-5 text-sky-500" />
                  Create Task
                </Link>

                <Link
                  href="/calendar?action=create-reminder"
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 text-center text-[10px] font-semibold hover:-translate-y-0.5 hover:shadow-sm transition cursor-pointer"
                >
                  <CalendarDays className="size-5 text-emerald-500" />
                  Add Reminder
                </Link>

                <button
                  onClick={handleCreateNoteAction}
                  disabled={newNoteLoading}
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 text-center text-[10px] font-semibold hover:-translate-y-0.5 hover:shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {newNoteLoading ? (
                    <Loader2 className="size-5 animate-spin text-rose-500" />
                  ) : (
                    <NotebookPen className="size-5 text-rose-500" />
                  )}
                  Create Note
                </button>

                <Link
                  href="/whiteboard"
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 text-center text-[10px] font-semibold hover:-translate-y-0.5 hover:shadow-sm transition cursor-pointer"
                >
                  <PenTool className="size-5 text-cyan-500" />
                  Open Whiteboard
                </Link>

                <Link
                  href="/assistant"
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 text-center text-[10px] font-semibold hover:-translate-y-0.5 hover:shadow-sm transition cursor-pointer"
                >
                  <Bot className="size-5 text-violet-500" />
                  Ask Assistant
                </Link>

                <Link
                  href="/template-builder"
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 text-center text-[10px] font-semibold hover:-translate-y-0.5 hover:shadow-sm transition cursor-pointer"
                >
                  <Flame className="size-5 text-fuchsia-500" />
                  New Template
                </Link>
              </div>
            </div>
          </section>

          {/* 3. Task Summary & Recent Pages */}
          <section className="grid gap-6 md:grid-cols-2">
            
            {/* Task summary */}
            <article className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <TrendingUp className="size-4.5 text-primary" />
                    Task summary & progress
                  </h3>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {progressPercentage}% Completed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-muted/30 border border-border/60 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Tasks</p>
                    <p className="text-xl font-bold text-foreground mt-1">{totalTasks}</p>
                  </div>
                  <div className="bg-muted/30 border border-border/60 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                    <p className="text-xl font-bold text-emerald-600 mt-1">{completedTasksCount}</p>
                  </div>
                  <div className="bg-muted/30 border border-border/60 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending</p>
                    <p className="text-xl font-bold text-orange-500 mt-1">{pendingTasksCount}</p>
                  </div>
                  <div className="bg-muted/30 border border-border/60 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overdue</p>
                    <p className="text-xl font-bold text-rose-600 mt-1">{overdueTasksCount}</p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Task checklist flow</span>
                    <span>{completedTasksCount} of {totalTasks} cleared</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Tasks lists checks */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Checklist</p>
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-border rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground font-medium">No tasks found</p>
                    </div>
                  ) : (
                    filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 bg-background border border-border p-2.5 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(t.id, t.isKanban)}
                            className="text-muted-foreground hover:text-primary transition shrink-0 cursor-pointer"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="size-4.5 text-emerald-500" />
                            ) : (
                              <Circle className="size-4.5" />
                            )}
                          </button>
                          <span className={cn("truncate font-medium text-foreground", t.completed && "line-through text-muted-foreground")}>
                            {t.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {t.dueDate && (
                            <span className={cn(
                              "text-[10px] font-medium border rounded px-1.5 py-0.5",
                              t.completed ? "bg-muted text-muted-foreground" : "bg-accent/40 text-muted-foreground"
                            )}>
                              {t.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>

            {/* Recent Pages */}
            <article className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-1.5">
                  <NotebookPen className="size-4.5 text-rose-500" />
                  Recent workspace files
                </h3>
                <div className="space-y-3">
                  {/* Notes List */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                    {notes.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-1 mb-2">No notes created yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        {notes.slice(0, 2).map((note) => (
                          <Link
                            key={note.id}
                            href={`/notes?noteId=${note.id}`}
                            className="flex items-center justify-between p-2 rounded-lg border border-border bg-background hover:bg-accent/40 transition text-xs font-semibold"
                          >
                            <span className="truncate pr-4 flex items-center gap-2">
                              <NotebookPen className="size-3.5 text-rose-500" />
                              {note.title}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Boards List */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Multiplayer Spaces</p>
                    {boards.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-1 mb-2">No boards created yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        {boards.slice(0, 2).map((board) => (
                          <div
                            key={board.id}
                            className="flex items-center justify-between p-2 rounded-lg border border-border bg-background text-xs font-semibold"
                          >
                            <span className="truncate pr-4 flex items-center gap-2">
                              <span className={cn("size-2 rounded-full", board.color)} />
                              {board.name}
                            </span>
                            <div className="flex gap-2">
                              <Link
                                href="/kanban"
                                className="text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded hover:bg-orange-100/50 transition"
                              >
                                Kanban
                              </Link>
                              <Link
                                href="/whiteboard"
                                className="text-[10px] text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-900/30 px-2 py-0.5 rounded hover:bg-cyan-100/50 transition"
                              >
                                Whiteboard
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <Link
                  href="/notes"
                  className="text-xs text-primary font-semibold flex items-center justify-center gap-1 hover:underline"
                >
                  View all workspace directories
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          </section>
        </div>

        {/* Right Side Panel */}
        <aside className="space-y-6">
          
          {/* AI Insights Section */}
          <section className="rounded-xl border dark:border-violet-850 bg-gradient-to-br from-violet-50/70 via-indigo-50/50 to-transparent p-5 shadow-sm dark:from-violet-950/10 dark:via-indigo-950/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid size-8 place-items-center rounded-lg bg-violet-600 text-white shadow-sm">
                <Bot className="size-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">AI insights & logs</h3>
                <p className="text-[10px] text-muted-foreground">Workspace telemetry analysis</p>
              </div>
            </div>

            <div className="space-y-3">
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/80 bg-background/80 p-3 text-xs shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-start gap-2.5">
                    {insight.type === "warning" ? (
                      <AlertCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : insight.type === "success" ? (
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : insight.type === "focus" ? (
                      <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    ) : (
                      <Bot className="size-4 text-violet-500 shrink-0 mt-0.5" />
                    )}
                    <p className="font-medium text-foreground leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Calendar Items */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <CalendarDays className="size-4.5 text-emerald-500" />
                Upcoming timeline
              </h3>
              <Link href="/calendar" className="text-xs text-primary font-bold hover:underline">
                Grid view
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingCalendarItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-lg bg-muted/20">
                  <Inbox className="size-7 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground font-semibold">Timeline clear</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Nothing scheduled from today</p>
                </div>
              ) : (
                upcomingCalendarItems.map((item) => {
                  const colors = categoryColors[item.category] || categoryColors.focus;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 bg-background border border-border p-3 rounded-lg text-xs hover:border-border/100 transition"
                    >
                      <span className={cn("size-2.5 rounded-full shrink-0 mt-1", colors.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1 text-[10px] font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {item.date} {item.time && `• ${item.time}`}
                          </span>
                          <span className={cn("px-1.5 py-0.5 rounded text-[9px] uppercase font-bold", colors.bg, colors.text)}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Recent activity timeline */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-4">Recent activity</h3>
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center pl-0 before:hidden">No recent logs recorded.</p>
              ) : (
                recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex gap-3 text-xs items-start relative">
                      <div className={cn("grid size-7 place-items-center rounded-md shrink-0 z-10 border border-border", act.color)}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-semibold text-foreground leading-tight">{act.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
