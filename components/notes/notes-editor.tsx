"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Undo,
  Redo,
  Sparkles,
  Cloud,
  RotateCw,
  AlertTriangle,
  Smile,
  Palette,
  Check
} from "lucide-react";
import { Note } from "@/db/schema";
import { cn } from "@/lib/utils";
import { NoteIcon, NOTE_ICONS } from "./note-icon";

const COLORS = [
  { name: "gray", label: "Neutral Gray", dot: "bg-slate-400" },
  { name: "red", label: "Rose Coral", dot: "bg-rose-400" },
  { name: "orange", label: "Warm Sunset", dot: "bg-orange-400" },
  { name: "yellow", label: "Mellow Yellow", dot: "bg-amber-400" },
  { name: "green", label: "Soft Mint", dot: "bg-emerald-400" },
  { name: "blue", label: "Calm Water", dot: "bg-sky-400" },
  { name: "purple", label: "Lavender", dot: "bg-violet-400" },
  { name: "pink", label: "Blossom Pink", dot: "bg-pink-400" },
];

const SLASH_COMMANDS = [
  { label: "Text", desc: "Start writing with plain text", icon: "✏️", action: (editor: any) => editor.chain().focus().setParagraph().run() },
  { label: "Heading 1", desc: "Large section heading", icon: "H1", action: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2", desc: "Medium section heading", icon: "H2", action: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3", desc: "Small section heading", icon: "H3", action: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bullet List", desc: "Simple bulleted list", icon: "•", action: (editor: any) => editor.chain().focus().toggleBulletList().run() },
  { label: "Numbered List", desc: "Ordered list of steps", icon: "1.", action: (editor: any) => editor.chain().focus().toggleOrderedList().run() },
  { label: "To-do List", desc: "Checkbox task checklist", icon: "☑️", action: (editor: any) => editor.chain().focus().toggleTaskList().run() },
  { label: "Blockquote", desc: "Format quotes or highlights", icon: "“", action: (editor: any) => editor.chain().focus().toggleBlockquote().run() },
  { label: "Code Block", desc: "Write formatted code syntax", icon: "</>", action: (editor: any) => editor.chain().focus().toggleCodeBlock().run() },
];

interface NotesEditorProps {
  note: Note;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  saveStatus: "Saved" | "Saving..." | "Error" | "Offline";
  onUpdateColor: (color: string) => void;
  onUpdateIcon: (icon: string) => void;
}

export function NotesEditor({
  note,
  onUpdateNote,
  saveStatus,
  onUpdateColor,
  onUpdateIcon,
}: NotesEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);

  // Slash commands states
  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // AI Refine states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const emojiRef = useRef<HTMLDivElement | null>(null);
  const colorRef = useRef<HTMLDivElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const aiRef = useRef<HTMLDivElement | null>(null);

  // Sync title input when note changes
  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdateNote(note.id, { title: newTitle });
  };

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setIsEmojiOpen(false);
      }
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setIsColorOpen(false);
      }
      if (aiRef.current && !aiRef.current.contains(event.target as Node)) {
        setIsAiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!slashQuery) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(slashQuery.toLowerCase())
    );
  }, [slashQuery]);

  // Handle reset selection on filter change
  useEffect(() => {
    setSelectedSlashIndex(0);
  }, [filteredCommands.length]);

  // Refs to resolve closures in editorProps handleKeyDown
  const isSlashOpenRef = useRef(isSlashOpen);
  const selectedSlashIndexRef = useRef(selectedSlashIndex);
  const filteredCommandsRef = useRef(filteredCommands);
  const executeCommandRef = useRef<((cmd: any) => void) | null>(null);

  useEffect(() => {
    isSlashOpenRef.current = isSlashOpen;
    selectedSlashIndexRef.current = selectedSlashIndex;
    filteredCommandsRef.current = filteredCommands;
  });

  // Tiptap Initialization
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          return "Press '/' for commands...";
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: note.content || "",
    onUpdate: ({ editor }) => {
      // Trigger debounced save
      onUpdateNote(note.id, { content: editor.getHTML() });

      // Check for Slash Command trigger
      const { from } = editor.state.selection;
      const textAround = editor.state.doc.textBetween(Math.max(0, from - 10), from);
      const match = textAround.match(/\/(\w*)$/);

      if (match) {
        setIsSlashOpen(true);
        setSlashQuery(match[1]);

        try {
          const coords = editor.view.coordsAtPos(from);
          const parent = editor.view.dom.closest(".relative");
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            setSlashCoords({
              top: coords.top - parentRect.top + 24,
              left: coords.left - parentRect.left,
            });
          } else {
            setSlashCoords({
              top: coords.top + window.scrollY + 24,
              left: coords.left + window.scrollX,
            });
          }
        } catch (err) {
          // coordinate resolve failed
        }
      } else {
        setIsSlashOpen(false);
        setSlashQuery("");
      }
    },
    editorProps: {
      handleKeyDown(view, event) {
        if (isSlashOpenRef.current) {
          if (event.key === "ArrowDown") {
            setSelectedSlashIndex((prev) => (prev + 1) % filteredCommandsRef.current.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            setSelectedSlashIndex((prev) => (prev - 1 + filteredCommandsRef.current.length) % filteredCommandsRef.current.length);
            return true;
          }
          if (event.key === "Enter") {
            const cmd = filteredCommandsRef.current[selectedSlashIndexRef.current];
            if (cmd && executeCommandRef.current) {
              executeCommandRef.current(cmd);
              return true;
            }
          }
          if (event.key === "Escape") {
            setIsSlashOpen(false);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync content when active note switches
  useEffect(() => {
    if (editor && note) {
      const currentHTML = editor.getHTML();
      if (note.content !== undefined && note.content !== currentHTML) {
        editor.commands.setContent(note.content || "");
      }
    }
  }, [note.id, editor]);

  // Execute Slash command action
  const executeCommand = (cmd: any) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const matchLength = slashQuery.length + 1; // plus '/'
    
    // Delete slash text
    editor.chain().focus().deleteRange({ from: from - matchLength, to: from }).run();
    // Run command format
    cmd.action(editor);
    setIsSlashOpen(false);
  };

  useEffect(() => {
    executeCommandRef.current = executeCommand;
  });

  // Execute AI Refine Operation
  const handleAiRefine = async (option: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (!selectedText.trim()) return;

    setIsAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, option }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace in editor
        editor.chain().focus().insertContentAt({ from, to }, data.refinedText).run();
        setIsAiOpen(false);
      } else {
        setAiError("AI rewrite failed. Try again.");
      }
    } catch (error) {
      setAiError("Network error. Check connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Word count helper
  const getWordCount = () => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card relative overflow-hidden select-text">
      {/* Top Header Bar */}
      <header className="h-12 shrink-0 border-b border-border px-5 flex items-center justify-between bg-card z-10 select-none">
        {/* Save status */}
        <div className="flex items-center gap-2">
          {saveStatus === "Saving..." && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RotateCw className="size-3.5 animate-spin text-primary" />
              <span>Saving draft...</span>
            </span>
          )}
          {saveStatus === "Saved" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Cloud className="size-4 text-emerald-500" />
              <span>Autosaved</span>
            </span>
          )}
          {saveStatus === "Offline" && (
            <span className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
              <Cloud className="size-4 text-orange-400 opacity-50" />
              <span>Cached (Offline)</span>
            </span>
          )}
          {saveStatus === "Error" && (
            <span className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
              <AlertTriangle className="size-3.5 text-rose-500" />
              <span>Save failed</span>
            </span>
          )}
        </div>

        {/* Note Metadata Actions (Colors & Emojis) */}
        <div className="flex items-center gap-2">
          {/* Theme Color Picker */}
          <div className="relative" ref={colorRef}>
            <button
              onClick={() => setIsColorOpen(!isColorOpen)}
              title="Update note color theme"
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium hover:bg-slate-100 border border-border bg-background transition"
            >
              <Palette className="size-3.5 text-slate-500" />
              <span>Theme</span>
            </button>

            {isColorOpen && (
              <div className="absolute right-0 mt-1.5 z-20 w-44 bg-white border border-border rounded-md shadow-lg p-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Select Theme Color
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        onUpdateColor(c.name);
                        setIsColorOpen(false);
                      }}
                      title={c.label}
                      className={cn(
                        "size-6 rounded-full flex items-center justify-center border border-transparent hover:scale-110 hover:border-slate-400 transition-all shadow-sm",
                        c.dot,
                        note.color === c.name && "border-slate-800 scale-105"
                      )}
                    >
                      {note.color === c.name && <Check className="size-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-xs text-muted-foreground/60 border-l border-border h-4 mx-1" />

          {/* Word count */}
          <span className="text-xs text-muted-foreground font-medium">
            {getWordCount()} words
          </span>
        </div>
      </header>

      {/* Editor Fixed Toolbar */}
      <div className="shrink-0 border-b border-border bg-slate-50/50 p-1.5 px-4 flex items-center gap-1 overflow-x-auto select-none">
        {editor && (
          <>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("bold") && "bg-slate-200 text-foreground font-bold")}
              title="Bold (Ctrl+B)"
            >
              <Bold className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("italic") && "bg-slate-200 text-foreground")}
              title="Italic (Ctrl+I)"
            >
              <Italic className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("strike") && "bg-slate-200 text-foreground")}
              title="Strikethrough"
            >
              <Strikethrough className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600 font-semibold text-xs", editor.isActive("heading", { level: 1 }) && "bg-slate-200 text-foreground")}
              title="Heading 1"
            >
              <Heading1 className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600 font-semibold text-xs", editor.isActive("heading", { level: 2 }) && "bg-slate-200 text-foreground")}
              title="Heading 2"
            >
              <Heading2 className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600 font-semibold text-xs", editor.isActive("heading", { level: 3 }) && "bg-slate-200 text-foreground")}
              title="Heading 3"
            >
              <Heading3 className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("bulletList") && "bg-slate-200 text-foreground")}
              title="Bullet list"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("orderedList") && "bg-slate-200 text-foreground")}
              title="Ordered list"
            >
              <ListOrdered className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("taskList") && "bg-slate-200 text-foreground")}
              title="Todo Checklist"
            >
              <CheckSquare className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("blockquote") && "bg-slate-200 text-foreground")}
              title="Blockquote"
            >
              <Quote className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition text-slate-600", editor.isActive("codeBlock") && "bg-slate-200 text-foreground")}
              title="Code block"
            >
              <Code2 className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-border mx-1 flex-grow" />

            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600"
              title="Undo"
            >
              <Undo className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600"
              title="Redo"
            >
              <Redo className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 py-8 select-text">
        <div className="max-w-2xl mx-auto">
          {/* Note Icon and Title Input */}
          <div className="flex items-center gap-3 mb-6 group relative select-none">
            {/* Note Icon */}
            <div className="relative" ref={emojiRef}>
              <button
                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg hover:scale-105 transition duration-150 flex items-center justify-center cursor-pointer border border-border bg-white"
                title="Change note icon"
              >
                <NoteIcon name={note.icon} className="size-7 text-primary" />
              </button>

              {isEmojiOpen && (
                <div className="absolute left-0 mt-2 z-20 w-64 bg-white border border-border rounded-md shadow-xl p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Choose Icon
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.keys(NOTE_ICONS).map((iconName) => (
                      <button
                        key={iconName}
                        onClick={() => {
                          onUpdateIcon(iconName);
                          setIsEmojiOpen(false);
                        }}
                        className="p-2 rounded hover:bg-slate-100 hover:scale-115 text-slate-600 hover:text-primary transition flex items-center justify-center border border-transparent hover:border-slate-200"
                        title={iconName}
                      >
                        <NoteIcon name={iconName} className="size-5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="flex-1 text-3xl md:text-4xl font-extrabold tracking-tight outline-none border-none border-transparent bg-transparent placeholder-slate-200 text-foreground"
            />
          </div>

          {/* Tiptap Core Editor */}
          <div className="min-h-[400px]">
            <EditorContent editor={editor} className="tiptap select-text" />
          </div>
        </div>
      </div>

      {/* Floating Bubble Menu */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 rounded-lg border border-border bg-white p-1 shadow-lg z-20 select-none"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("p-1.5 rounded hover:bg-slate-100 text-slate-500 transition", editor.isActive("bold") && "text-primary bg-primary/5")}
            title="Bold"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("p-1.5 rounded hover:bg-slate-100 text-slate-500 transition", editor.isActive("italic") && "text-primary bg-primary/5")}
            title="Italic"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("p-1.5 rounded hover:bg-slate-100 text-slate-500 transition", editor.isActive("strike") && "text-primary bg-primary/5")}
            title="Strikethrough"
          >
            <Strikethrough className="size-3.5" />
          </button>

          <span className="h-4 w-px bg-border mx-1" />

          {/* AI Refine Button inside bubble menu */}
          <div className="relative" ref={aiRef}>
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-all",
                isAiOpen && "bg-violet-100 ring-1 ring-violet-300"
              )}
            >
              <Sparkles className="size-3" />
              <span>AI Refine</span>
            </button>

            {isAiOpen && (
              <div className="absolute left-0 mt-1.5 z-30 w-44 bg-white border border-border rounded-md shadow-xl p-1 flex flex-col">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <RotateCw className="size-4 animate-spin text-violet-500 mb-1.5" />
                    <span className="text-[10px] text-muted-foreground">Rewriting...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleAiRefine("Improve grammar")}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-slate-100 text-slate-700 transition"
                    >
                      ✨ Improve grammar
                    </button>
                    <button
                      onClick={() => handleAiRefine("Rephrase")}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-slate-100 text-slate-700 transition"
                    >
                      🔄 Rephrase
                    </button>
                    <button
                      onClick={() => handleAiRefine("Make shorter")}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-slate-100 text-slate-700 transition"
                    >
                      📉 Make shorter
                    </button>
                    <button
                      onClick={() => handleAiRefine("Make longer")}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-slate-100 text-slate-700 transition"
                    >
                      📈 Make longer
                    </button>
                    <button
                      onClick={() => handleAiRefine("Simplify language")}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-slate-100 text-slate-700 transition"
                    >
                      💡 Simplify language
                    </button>
                    <button
                      onClick={() => handleAiRefine("Change tone")}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-slate-100 text-slate-700 transition"
                    >
                      👔 Professional tone
                    </button>

                    {aiError && (
                      <p className="text-[10px] text-rose-500 px-2 py-1 italic border-t border-border mt-1">
                        {aiError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </BubbleMenu>
      )}

      {/* Floating Slash Suggestions Menu */}
      {isSlashOpen && filteredCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="absolute z-40 w-52 bg-white border border-border rounded-lg shadow-xl p-1 flex flex-col max-h-60 overflow-y-auto select-none"
          style={{
            top: `${slashCoords.top}px`,
            left: `${slashCoords.left}px`,
          }}
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Basic Blocks
          </div>
          {filteredCommands.map((cmd, idx) => (
            <button
              key={cmd.label}
              onClick={() => executeCommand(cmd)}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-xs transition",
                idx === selectedSlashIndex
                  ? "bg-primary/8 text-foreground font-semibold"
                  : "hover:bg-slate-50 text-slate-700"
              )}
            >
              <span className="size-6 shrink-0 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold">
                {cmd.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{cmd.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{cmd.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
