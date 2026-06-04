"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  Palette,
  FolderOpen,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define a board interface since it mirrors our DB model
interface BoardItem {
  id: string;
  name: string;
  color: string;
  createdAt: any;
}

interface WhiteboardListPanelProps {
  boards: BoardItem[];
  selectedBoardId: string | null;
  onSelectBoard: (id: string) => void;
  onCreateBoard: (name: string, color: string) => Promise<void>;
  onRenameBoard: (id: string, newName: string) => Promise<void>;
  onDeleteBoard: (id: string) => Promise<void>;
  isLoading: boolean;
}

const COLOR_OPTIONS = [
  { value: "bg-sky-500", label: "Sky Blue" },
  { value: "bg-emerald-500", label: "Emerald Green" },
  { value: "bg-orange-500", label: "Sunset Orange" },
  { value: "bg-rose-500", label: "Rose Pink" },
  { value: "bg-violet-500", label: "Violet Purple" },
  { value: "bg-amber-500", label: "Amber Yellow" },
];

export function WhiteboardListPanel({
  boards,
  selectedBoardId,
  onSelectBoard,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  isLoading,
}: WhiteboardListPanelProps) {
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColor, setNewBoardColor] = useState("bg-sky-500");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Filter boards
  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setIsActionSubmitting(true);
    try {
      await onCreateBoard(newBoardName.trim(), newBoardColor);
      setNewBoardName("");
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleStartRename = (board: BoardItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the board
    setEditingId(board.id);
    setEditName(board.name);
  };

  const handleRenameSubmit = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsActionSubmitting(true);
    try {
      await onRenameBoard(id, editName.trim());
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the board
    if (confirm(`Are you sure you want to delete "${name}"? This will permanently remove all drawing contents.`)) {
      setIsActionSubmitting(true);
      try {
        await onDeleteBoard(id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsActionSubmitting(false);
      }
    }
  };

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-card">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-primary" />
          <h2 className="text-[0.88rem] font-semibold text-foreground">Whiteboards</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
          {boards.length} total
        </span>
      </div>

      {/* Action / Search Section */}
      <div className="flex flex-col gap-2 p-3 border-b border-border bg-background/40">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search boards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="rounded-lg border border-primary/20 bg-background p-2.5 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              placeholder="Board Name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              autoFocus
              required
              disabled={isActionSubmitting}
            />
            
            <div className="flex flex-col gap-1">
              <span className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Indicator Color</span>
              <div className="flex gap-1.5 flex-wrap">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.label}
                    onClick={() => setNewBoardColor(opt.value)}
                    className={cn(
                      "size-4 rounded-full border transition cursor-pointer",
                      opt.value,
                      newBoardColor === opt.value ? "border-foreground ring-2 ring-primary/20 scale-110" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded border border-border px-2 py-1 text-[0.68rem] font-medium text-muted-foreground hover:bg-accent cursor-pointer"
                disabled={isActionSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-primary text-primary-foreground font-semibold px-2.5 py-1 text-[0.68rem] hover:bg-primary/95 shadow-sm flex items-center gap-1 cursor-pointer"
                disabled={isActionSubmitting || !newBoardName.trim()}
              >
                {isActionSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                Create
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/8 border border-primary/10 text-primary py-1.5 text-xs font-semibold hover:bg-primary/15 transition cursor-pointer"
          >
            <Plus className="size-3.5" />
            New Whiteboard
          </button>
        )}
      </div>

      {/* Board List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary mb-1.5" />
            <span className="text-[0.72rem]">Fetching whiteboards...</span>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-muted-foreground">
            <p className="text-xs font-medium">No whiteboards found</p>
            <p className="text-[0.68rem] mt-0.5">Create a whiteboard to start sketching your ideas.</p>
          </div>
        ) : (
          filteredBoards.map((board) => {
            const isSelected = selectedBoardId === board.id;
            const isEditing = editingId === board.id;

            // Formulate date string
            const formattedDate = board.createdAt
              ? new Date(board.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now";

            return (
              <div
                key={board.id}
                onClick={() => !isEditing && onSelectBoard(board.id)}
                className={cn(
                  "group relative flex flex-col rounded-md px-3 py-2 text-left transition select-none cursor-pointer border border-transparent",
                  isSelected
                    ? "bg-primary/8 text-foreground font-medium shadow-[inset_0_0_0_1px_rgba(44,123,229,0.12)]"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleRenameSubmit(board.id, e)}
                    className="flex items-center gap-1.5 w-full py-0.5"
                    onClick={(e) => e.stopPropagation()} // Avoid triggering selection
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      autoFocus
                      required
                    />
                    <button
                      type="submit"
                      disabled={isActionSubmitting}
                      className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded p-0.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <X className="size-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 pr-6">
                        {/* Indicator Color Dot */}
                        <span className={cn("size-2 shrink-0 rounded-full", board.color || "bg-sky-500")} />
                        <span className="truncate text-xs font-semibold text-foreground">
                          {board.name}
                        </span>
                      </div>

                      {/* Actions hover menu */}
                      <div className="absolute right-2 top-2.5 hidden group-hover:flex items-center gap-1 bg-gradient-to-l from-card via-card pl-3">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(board, e)}
                          title="Rename Board"
                          className="rounded p-1 hover:bg-background text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          <Edit3 className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(board.id, board.name, e)}
                          title="Delete Board"
                          className="rounded p-1 hover:bg-background text-rose-500 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-[0.66rem] text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
