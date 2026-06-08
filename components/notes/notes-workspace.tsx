"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Search, Trash2, FolderPlus, ArrowLeft, Loader2, NotebookPen } from "lucide-react";
import { NotesListPanel } from "./notes-list-panel";
import { NotesEditor } from "./notes-editor";
import { Note } from "@/db/schema";

export function NotesWorkspace() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error" | "Offline">("Saved");

  // Keep a ref to the selectedNoteId to avoid saving to the wrong note during quick swaps
  const activeNoteIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all notes
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        
        // Select the first active note by default if none selected
        if (data.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const noteIdParam = params.get("noteId");
          if (noteIdParam && data.some((n: Note) => n.id === noteIdParam)) {
            setSelectedNoteId(noteIdParam);
            activeNoteIdRef.current = noteIdParam;
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
          } else {
            const activeNotes = data.filter((n: Note) => !n.isTrash);
            if (activeNotes.length > 0) {
              setSelectedNoteId(activeNotes[0].id);
              activeNoteIdRef.current = activeNotes[0].id;
            } else {
              setSelectedNoteId(data[0].id);
              activeNoteIdRef.current = data[0].id;
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Update selectedNoteId safely and flush pending saves
  const selectNote = (id: string | null) => {
    if (saveTimeoutRef.current) {
      // Immediately run any pending saves before switching
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setSelectedNoteId(id);
    activeNoteIdRef.current = id;
  };

  // Immediate database save function
  const saveNoteData = async (noteId: string, updates: Partial<Note>) => {
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local state
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, ...updated } : n))
        );
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Error");
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("Offline");
    }
  };

  // Debounced auto-save function (used for content typing)
  const triggerAutoSave = useCallback((noteId: string, updates: Partial<Note>) => {
    setSaveStatus("Saving...");
    
    // Update local state instantly so sidebar/title updates in real-time
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updates, updatedAt: new Date() } : n))
    );

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNoteData(noteId, updates);
    }, 1200); // 1.2s debounce
  }, []);

  // Create a new note
  const handleCreateNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "<h1>Untitled Note</h1><p>Start writing here...</p>",
          color: "gray",
          icon: "FileText",
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes((prev) => [newNote, ...prev]);
        selectNote(newNote.id);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  // Duplicate an existing note
  const handleDuplicateNote = async (note: Note) => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Copy of ${note.title}`,
          content: note.content,
          color: note.color,
          icon: note.icon,
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes((prev) => [newNote, ...prev]);
        selectNote(newNote.id);
      }
    } catch (error) {
      console.error("Error duplicating note:", error);
    }
  };

  // Trash or delete permanently
  const handleDeleteNote = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    if (note.isTrash) {
      // Hard delete (permanent)
      if (confirm("Are you sure you want to permanently delete this note? This cannot be undone.")) {
        try {
          const res = await fetch(`/api/notes/${noteId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
            if (selectedNoteId === noteId) {
              const active = notes.filter((n) => n.id !== noteId && !n.isTrash);
              selectNote(active.length > 0 ? active[0].id : null);
            }
          }
        } catch (error) {
          console.error("Error hard-deleting note:", error);
        }
      }
    } else {
      // Soft delete (send to trash)
      await saveNoteData(noteId, { isTrash: true, isPinned: false });
      
      // Auto select another active note if the deleted one was selected
      if (selectedNoteId === noteId) {
        const active = notes.filter((n) => n.id !== noteId && !n.isTrash);
        selectNote(active.length > 0 ? active[0].id : null);
      }
    }
  };

  // Restore note from trash
  const handleRestoreNote = async (noteId: string) => {
    await saveNoteData(noteId, { isTrash: false });
    selectNote(noteId);
  };

  // Toggle favorite pin
  const handleTogglePin = async (noteId: string, currentPin: boolean) => {
    await saveNoteData(noteId, { isPinned: !currentPin });
  };

  // Update note color
  const handleUpdateColor = async (noteId: string, color: string) => {
    await saveNoteData(noteId, { color });
  };

  // Update note emoji icon
  const handleUpdateIcon = async (noteId: string, icon: string) => {
    await saveNoteData(noteId, { icon });
  };

  // Get currently selected note
  const activeNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="flex h-[calc(100vh-36px)] overflow-hidden bg-background">
      <NotesListPanel
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={selectNote}
        onCreateNote={handleCreateNote}
        onDuplicateNote={handleDuplicateNote}
        onDeleteNote={handleDeleteNote}
        onRestoreNote={handleRestoreNote}
        onTogglePin={handleTogglePin}
        onUpdateColor={handleUpdateColor}
        onUpdateIcon={handleUpdateIcon}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-card border-l border-border">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary mb-2" />
            <p className="text-sm">Loading your creative space...</p>
          </div>
        ) : activeNote ? (
          <NotesEditor
            note={activeNote}
            onUpdateNote={triggerAutoSave}
            saveStatus={saveStatus}
            onUpdateColor={(color) => handleUpdateColor(activeNote.id, color)}
            onUpdateIcon={(icon) => handleUpdateIcon(activeNote.id, icon)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <NotebookPen className="size-16 text-primary/20 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No note selected</h3>
            <p className="text-sm max-w-sm mt-1">
              Select a note from the panel or click "New Note" to begin writing.
            </p>
            <button
              onClick={handleCreateNote}
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Create a note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
