"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BoardDialogProps {
  board?: { id: string; name: string; color: string } | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

export const boardColors = [
  { name: "Blue", value: "bg-sky-500", border: "border-sky-300", text: "text-sky-600", dot: "bg-sky-500" },
  { name: "Emerald", value: "bg-emerald-500", border: "border-emerald-300", text: "text-emerald-600", dot: "bg-emerald-500" },
  { name: "Violet", value: "bg-violet-500", border: "border-violet-300", text: "text-violet-600", dot: "bg-violet-500" },
  { name: "Rose", value: "bg-rose-500", border: "border-rose-300", text: "text-rose-600", dot: "bg-rose-500" },
  { name: "Amber", value: "bg-amber-500", border: "border-amber-300", text: "text-amber-600", dot: "bg-amber-500" },
  { name: "Coral", value: "bg-coral-400", border: "border-coral-300", text: "text-coral-500", dot: "bg-coral-400" },
  { name: "Cyan", value: "bg-cyan-500", border: "border-cyan-300", text: "text-cyan-600", dot: "bg-cyan-500" },
];

export function BoardDialog({ board, onClose, onSave }: BoardDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("bg-sky-500");

  useEffect(() => {
    if (board) {
      setName(board.name);
      setColor(board.color);
    } else {
      setName("");
      setColor("bg-sky-500");
    }
  }, [board]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-3 backdrop-blur-sm sm:items-center">
      <form
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {board ? "Edit Board" : "Create New Board"}
          </h2>
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
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground/80">Board Name</span>
            <input
              autoFocus
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary/20 transition placeholder:text-muted-foreground focus:border-primary focus:ring-4"
              placeholder="e.g. Project Alpha, Design Sprint..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground/80">Select Theme Color</span>
            <div className="flex flex-wrap gap-2.5 py-1">
              {boardColors.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-label={`Select ${item.name} color`}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-all hover:scale-110",
                    item.value,
                    color === item.value
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105"
                      : "opacity-85"
                  )}
                  onClick={() => setColor(item.value)}
                >
                  {color === item.value && (
                    <span className="size-2 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} className="h-9">
            Cancel
          </Button>
          <Button type="submit" className="h-9">
            {board ? "Save Changes" : "Create Board"}
          </Button>
        </div>
      </form>
    </div>
  );
}
