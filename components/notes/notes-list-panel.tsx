"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Pin, 
  Search, 
  Trash2, 
  MoreHorizontal, 
  Plus, 
  Copy, 
  RotateCcw, 
  Edit3, 
  Heart,
  Palette,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Sparkles,
  Pencil,
  FileText
} from "lucide-react";
import { Note } from "@/db/schema";
import { NoteIcon } from "./note-icon";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: "gray", label: "Neutral Gray", dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-300" },
  { name: "red", label: "Rose Coral", dot: "bg-rose-400", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300" },
  { name: "orange", label: "Warm Sunset", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300" },
  { name: "yellow", label: "Mellow Yellow", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
  { name: "green", label: "Soft Mint", dot: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
  { name: "blue", label: "Calm Water", dot: "bg-sky-400", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-300" },
  { name: "purple", label: "Lavender", dot: "bg-violet-400", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-300" },
  { name: "pink", label: "Blossom Pink", dot: "bg-pink-400", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-300" },
];

function formatTimeAgo(dateInput: string | Date | null) {
  if (!dateInput) return "Just now";
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(seconds) || seconds < 0) return "Just now";
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface NotesListPanelProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onCreateNote: () => void;
  onDuplicateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onTogglePin: (id: string, currentPin: boolean) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateIcon: (id: string, icon: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  isLoading: boolean;
}

export function NotesListPanel({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDuplicateNote,
  onDeleteNote,
  onRestoreNote,
  onTogglePin,
  onUpdateColor,
  onUpdateIcon,
  searchTerm,
  onSearchChange,
  isLoading,
}: NotesListPanelProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close context menus on click-outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter notes
  const activeNotes = notes.filter((n) => !n.isTrash);
  const trashNotes = notes.filter((n) => n.isTrash);

  const filteredActiveNotes = activeNotes.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrashNotes = trashNotes.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedNotes = filteredActiveNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredActiveNotes.filter((n) => !n.isPinned);

  const handleStartRename = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingNoteId(note.id);
    setRenameValue(note.title);
    setActiveMenuId(null);
  };

  const handleFinishRename = (noteId: string) => {
    if (renameValue.trim()) {
      // Save changes immediately
      const note = notes.find((n) => n.id === noteId);
      if (note && note.title !== renameValue.trim()) {
        // Trigger save callback in parent
        onUpdateColor(noteId, note.color); // Trick to update title inside updates
        fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: renameValue.trim() }),
        });
        // Mutate locally in parent through updates or refresh, we just cheat and trigger rename manually:
        note.title = renameValue.trim();
      }
    }
    setRenamingNoteId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, noteId: string) => {
    if (e.key === "Enter") {
      handleFinishRename(noteId);
    } else if (e.key === "Escape") {
      setRenamingNoteId(null);
    }
  };

  const toggleMenu = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === noteId ? null : noteId);
  };

  // Helper to resolve CSS colors based on note color property
  const getColorClasses = (colorName: string) => {
    const col = COLORS.find((c) => c.name === colorName) || COLORS[0];
    return col;
  };

  return (
    <div className="w-[280px] h-full flex flex-col shrink-0 bg-card border-r border-border select-none relative">
      {/* Header & New Note */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-1.5">
            <span>📝</span> Notes
          </h2>
          <button
            onClick={onCreateNote}
            title="Create a new note"
            className="inline-flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/20"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Search */}
        <label className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs text-muted-foreground shadow-inner">
          <Search className="size-3.5 shrink-0 text-sky-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent py-1 outline-none text-foreground text-xs"
          />
        </label>
      </div>

      {/* Notes Scrolling Area */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-1">
            <h3 className="px-2 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1">
              <Pin className="size-3 text-orange-400 rotate-[45deg]" /> Pinned
            </h3>
            <div className="space-y-0.5">
              {pinnedNotes.map((note) => renderNoteItem(note, true))}
            </div>
          </div>
        )}

        {/* Regular Notes Section */}
        <div className="space-y-1">
          {pinnedNotes.length > 0 && (
            <h3 className="px-2 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              All Notes
            </h3>
          )}
          <div className="space-y-0.5">
            {unpinnedNotes.length > 0 ? (
              unpinnedNotes.map((note) => renderNoteItem(note, false))
            ) : pinnedNotes.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No notes found. Create one to begin!
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Trash Section at the bottom */}
      <div className="border-t border-border bg-slate-50/50 p-2">
        <button
          onClick={() => setIsTrashOpen(!isTrashOpen)}
          className="flex w-full items-center justify-between rounded-md p-2 text-xs font-semibold text-muted-foreground transition hover:bg-slate-100"
        >
          <span className="flex items-center gap-1.5">
            <Trash2 className="size-3.5 text-rose-500" />
            <span>Trash ({trashNotes.length})</span>
          </span>
          {isTrashOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>

        {isTrashOpen && (
          <div className="max-h-[160px] overflow-y-auto px-1 py-1.5 space-y-1 bg-white border border-border rounded-md mt-1 shadow-sm">
            {filteredTrashNotes.length > 0 ? (
              filteredTrashNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={cn(
                    "group flex items-center justify-between rounded px-2 py-1.5 text-xs text-left cursor-pointer transition hover:bg-rose-50/50 border border-transparent",
                    selectedNoteId === note.id && "bg-rose-50/30 border-rose-100"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <NoteIcon name={note.icon} className="size-4 shrink-0 text-slate-400" />
                    <span className="truncate text-muted-foreground line-through font-normal">
                      {note.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreNote(note.id);
                      }}
                      title="Restore note"
                      className="size-5 rounded hover:bg-slate-200 text-emerald-600 flex items-center justify-center transition"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      title="Delete permanently"
                      className="size-5 rounded hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-[11px] text-muted-foreground italic">
                Trash is empty
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu Dropdown */}
      {activeMenuId && (() => {
        const activeMenuNote = notes.find((n) => n.id === activeMenuId);
        return (
          <div
            ref={menuRef}
            className="absolute z-30 w-56 bg-white border border-border rounded-xl shadow-xl p-3.5 text-xs text-slate-700"
            style={{
              top: `${resolveMenuPosition(activeMenuId)}px`,
              left: "12px",
            }}
          >
            {/* Color section */}
            <div className="mb-4">
              <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Color
              </div>
              <div className="flex items-center justify-between gap-1">
                {[
                  { name: "green", bg: "bg-emerald-500", label: "Green" },
                  { name: "red", bg: "bg-rose-500", label: "Red" },
                  { name: "orange", bg: "bg-orange-500", label: "Orange" },
                  { name: "blue", bg: "bg-sky-500", label: "Blue" },
                  { name: "purple", bg: "bg-violet-500", label: "Purple" }
                ].map((c) => {
                  const isSelected = activeMenuNote?.color === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => onUpdateColor(activeMenuId, c.name)}
                      title={c.label}
                      className={cn(
                        "w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer",
                        isSelected ? "border-slate-800 bg-slate-50 shadow-sm" : "border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("w-3 h-3 rounded-full", c.bg)} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon section */}
            <div className="mb-4">
              <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Icon
              </div>
              <div className="flex items-center justify-between gap-1">
                {[
                  { name: "FileText", icon: FileText, label: "File" },
                  { name: "BookOpen", icon: BookOpen, label: "Book" },
                  { name: "Lightbulb", icon: Lightbulb, label: "Idea" },
                  { name: "Sparkles", icon: Sparkles, label: "Star" },
                  { name: "Pencil", icon: Pencil, label: "Edit" }
                ].map((i) => {
                  const IconComponent = i.icon;
                  const isSelected = activeMenuNote?.icon === i.name;
                  return (
                    <button
                      key={i.name}
                      onClick={() => onUpdateIcon(activeMenuId, i.name)}
                      title={i.label}
                      className={cn(
                        "w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer",
                        isSelected ? "border-slate-800 bg-slate-50 text-slate-900 shadow-sm" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <IconComponent className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2.5" />

            {/* Actions */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  if (activeMenuNote) onDuplicateNote(activeMenuNote);
                  setActiveMenuId(null);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-50 text-slate-700 text-left text-[13px] font-medium transition cursor-pointer"
              >
                <Copy className="size-4 text-slate-400" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => {
                  onDeleteNote(activeMenuId);
                  setActiveMenuId(null);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-red-50 text-red-600 text-left text-[13px] font-medium transition cursor-pointer"
              >
                <Trash2 className="size-4 text-red-500" />
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // Helper to calculate top offset for the context menu based on item list position
  function resolveMenuPosition(noteId: string) {
    const element = document.getElementById(`note-item-${noteId}`);
    if (element) {
      const container = element.offsetParent as HTMLElement;
      if (container) {
        return element.offsetTop - container.scrollTop + 28;
      }
    }
    return 100;
  }

  // Helper to determine border colors without Tailwind purging issues
  function getBorderColorClass(colorName: string, selected: boolean) {
    if (selected) {
      switch (colorName) {
        case "gray": return "border-l-slate-400 border-l-4";
        case "red": return "border-l-rose-400 border-l-4";
        case "orange": return "border-l-orange-400 border-l-4";
        case "yellow": return "border-l-amber-400 border-l-4";
        case "green": return "border-l-emerald-400 border-l-4";
        case "blue": return "border-l-sky-400 border-l-4";
        case "purple": return "border-l-violet-400 border-l-4";
        case "pink": return "border-l-pink-400 border-l-4";
        default: return "border-l-slate-400 border-l-4";
      }
    } else {
      switch (colorName) {
        case "gray": return "border-l-slate-300/40 border-l-2";
        case "red": return "border-l-rose-300/40 border-l-2";
        case "orange": return "border-l-orange-300/40 border-l-2";
        case "yellow": return "border-l-amber-300/40 border-l-2";
        case "green": return "border-l-emerald-300/40 border-l-2";
        case "blue": return "border-l-sky-300/40 border-l-2";
        case "purple": return "border-l-violet-300/40 border-l-2";
        case "pink": return "border-l-pink-300/40 border-l-2";
        default: return "border-l-slate-300/40 border-l-2";
      }
    }
  }

  // Helper to determine dot colors for note items to match screenshot
  function getDotColorClass(colorName: string) {
    switch (colorName) {
      case "green": return "bg-emerald-500";
      case "red": return "bg-rose-500";
      case "orange": return "bg-orange-500";
      case "blue": return "bg-sky-500";
      case "purple": return "bg-violet-500";
      case "yellow": return "bg-amber-500";
      case "pink": return "bg-pink-500";
      default: return "bg-slate-400";
    }
  }

  // Renders a single Note item
  function renderNoteItem(note: Note, isPinned: boolean) {
    const isSelected = selectedNoteId === note.id;
    const isRenaming = renamingNoteId === note.id;

    return (
      <div
        key={note.id}
        id={`note-item-${note.id}`}
        onClick={() => {
          if (!isRenaming) onSelectNote(note.id);
        }}
        className={cn(
          "group flex items-center justify-between rounded-md p-2 text-left cursor-pointer transition relative border border-transparent gap-2",
          isSelected 
            ? "bg-primary/8 text-foreground font-semibold shadow-[inset_0_0_0_1px_rgba(44,123,229,0.12)]"
            : "hover:bg-slate-100 text-muted-foreground",
          getBorderColorClass(note.color, isSelected)
        )}
      >
        {/* Left indicators: emoji and Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Note icon */}
          <NoteIcon name={note.icon} className="size-4 shrink-0 text-slate-400" />

          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleFinishRename(note.id)}
              onKeyDown={(e) => handleRenameKeyDown(e, note.id)}
              className="flex-1 bg-white border border-primary px-1 py-0.5 outline-none rounded text-xs text-foreground font-normal"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-foreground font-medium">
                {note.title || "Untitled Note"}
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", getDotColorClass(note.color))} />
                <span>{formatTimeAgo(note.updatedAt)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Action overlays */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, note.isPinned);
            }}
            title={note.isPinned ? "Unfavorite Note" : "Favorite Note"}
            className={cn(
              "size-6 rounded hover:bg-slate-200 flex items-center justify-center transition",
              note.isPinned ? "text-orange-500 opacity-100" : "text-slate-400"
            )}
          >
            <Pin className={cn("size-3", note.isPinned ? "rotate-[45deg] fill-current" : "")} />
          </button>
          
          <button
            onClick={(e) => toggleMenu(note.id, e)}
            className="size-6 rounded hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }
}
