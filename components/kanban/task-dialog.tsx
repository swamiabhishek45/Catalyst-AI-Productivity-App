"use client";

import { useState, useEffect } from "react";
import { X, Calendar, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskDialogProps {
  task?: KanbanTask | null;
  onClose: () => void;
  onSave: (taskData: Omit<KanbanTask, "id" | "boardId" | "columnId" | "createdAt">) => void;
}

export interface KanbanTask {
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
}

export const defaultLabels = [
  { name: "Feature", color: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  { name: "Bug", color: "bg-coral-200/20 text-coral-400 border-coral-200", dot: "bg-coral-400" },
  { name: "Marketing", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { name: "Research", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { name: "Design", color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
];

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function TaskDialog({ task, onClose, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getTodayString());
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [linkToNotes, setLinkToNotes] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate || getTodayString());
      setPriority(task.priority);
      setSelectedLabels(task.labels || []);
      setSyncToCalendar(task.syncToCalendar || false);
      setLinkToNotes(task.linkToNotes || false);
    } else {
      setTitle("");
      setDescription("");
      setDueDate(getTodayString());
      setPriority("medium");
      setSelectedLabels([]);
      setSyncToCalendar(false);
      setLinkToNotes(false);
    }
  }, [task]);

  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      labels: selectedLabels,
      syncToCalendar,
      linkToNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-3 backdrop-blur-sm sm:items-center">
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-2xl sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {task ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Define the scope, priority, and schedules.
            </p>
          </div>
          <Button
            aria-label="Close dialog"
            size="icon"
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground/80">Title</span>
            <input
              autoFocus
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition placeholder:text-muted-foreground focus:border-primary focus:ring-4"
              placeholder="e.g. Plan sprint kick-off..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground/80">Description</span>
            <textarea
              className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/20 transition placeholder:text-muted-foreground focus:border-primary focus:ring-4"
              placeholder="Provide a short description of the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground/80">Due Date</span>
              <input
                type="date"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground/80">Priority</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </label>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground/80">Labels</span>
            <div className="flex flex-wrap gap-2">
              {defaultLabels.map((lbl) => {
                const isSelected = selectedLabels.includes(lbl.name);
                return (
                  <button
                    key={lbl.name}
                    type="button"
                    onClick={() => toggleLabel(lbl.name)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition hover:-translate-y-0.5",
                      lbl.color,
                      isSelected
                        ? "ring-1 ring-foreground border-foreground/60 opacity-100"
                        : "opacity-60"
                    )}
                  >
                    <span className={cn("size-2 rounded-full", lbl.dot)} />
                    {lbl.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 space-y-3 rounded-lg border border-border bg-muted/20 p-3.5">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded bg-emerald-50 text-emerald-600">
                  <Calendar className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">Sync with Calendar</p>
                  <p className="text-[10px] text-muted-foreground">Add to calendar grid on due date</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="size-4 rounded border-input text-primary focus:ring-primary/20"
                checked={syncToCalendar}
                onChange={(e) => setSyncToCalendar(e.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded bg-rose-50 text-rose-600">
                  <NotebookPen className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">Link with Notes</p>
                  <p className="text-[10px] text-muted-foreground">Attach quick references and templates</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="size-4 rounded border-input text-primary focus:ring-primary/20"
                checked={linkToNotes}
                onChange={(e) => setLinkToNotes(e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} className="h-9">
            Cancel
          </Button>
          <Button type="submit" className="h-9">
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
