"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Trello,
  NotebookPen,
  PenTool,
  LayoutTemplate,
  Settings,
  Check,
  X,
  AlertCircle,
  User,
  Moon,
  Sun,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { createClient, LiveList } from "@liveblocks/client";

import { AppShell } from "@/components/dashboard/app-shell";
import { useAssemblyAIStreaming } from "@/hooks/useAssemblyAIStreaming";
import { Button } from "@/components/ui/button";

interface ActionProposal {
  type:
    | "CREATE_BOARD"
    | "ADD_KANBAN_TASK"
    | "ADD_CALENDAR_TASK"
    | "CREATE_NOTE"
    | "UPDATE_NOTE"
    | "CREATE_WHITEBOARD_DIAGRAM"
    | "GENERATE_TEMPLATE_APP"
    | "UPDATE_SETTINGS";
  payload: any;
  status: "pending" | "confirming" | "executed" | "cancelled" | "error";
  errorMessage?: string;
  result?: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionProposal;
}

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  // AssemblyAI Voice transcription handler
  const {
    isRecording,
    isConnecting,
    partialTranscript,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useAssemblyAIStreaming({
    onFinalTranscript: (text) => {
      if (text && text.trim()) {
        setInputValue((prev) => (prev ? prev + " " + text : text));
      }
    },
  });

  // Handle errors from speech to text
  useEffect(() => {
    if (voiceError) {
      showToast(voiceError, "error");
    }
  }, [voiceError]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputValue.trim();
    if (!prompt) return;

    if (!textToSend) {
      setInputValue("");
    }

    // Append user message
    const userMsgId = `user-${crypto.randomUUID()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: prompt,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          currentTime: new Date().toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const responseData = await response.json();

      // Formulate assistant message
      const assistantMessage: Message = {
        id: `ai-${crypto.randomUUID()}`,
        role: "assistant",
        content: responseData.message,
      };

      // Wrap action if it is proposed
      if (responseData.action) {
        assistantMessage.action = {
          type: responseData.action.type,
          payload: responseData.action.payload,
          status: "pending",
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${crypto.randomUUID()}`,
          role: "assistant",
          content: "I encountered a communication error. Please ensure the workspace server is responsive.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  const executeAction = async (messageId: string, action: ActionProposal) => {
    // Set status to confirming
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.action) {
          return {
            ...m,
            action: { ...m.action, status: "confirming" },
          };
        }
        return m;
      })
    );

    const { type, payload } = action;

    try {
      switch (type) {
        case "CREATE_BOARD": {
          const res = await fetch("/api/boards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: payload.name, color: payload.color }),
          });

          if (!res.ok) throw new Error("Failed to create board in database");
          const data = await res.json();

          updateActionStatus(messageId, "executed", data);
          showToast(`Board "${payload.name}" created!`, "success");
          break;
        }

        case "CREATE_NOTE": {
          const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: payload.title,
              content: payload.content,
              color: payload.color,
              icon: payload.icon,
            }),
          });

          if (!res.ok) throw new Error("Failed to create note");
          const data = await res.json();

          updateActionStatus(messageId, "executed", data);
          showToast(`Note "${payload.title}" saved!`, "success");
          break;
        }

        case "UPDATE_NOTE": {
          const res = await fetch(`/api/notes/${payload.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: payload.title,
              content: payload.content,
              color: payload.color,
              icon: payload.icon,
            }),
          });

          if (!res.ok) throw new Error("Failed to update note");
          const data = await res.json();

          updateActionStatus(messageId, "executed", data);
          showToast(`Note "${payload.title}" updated successfully!`, "success");
          break;
        }

        case "GENERATE_TEMPLATE_APP": {
          const res = await fetch("/api/template-builder/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: payload.prompt }),
          });

          if (!res.ok) throw new Error("Failed to generate template app");
          const data = await res.json();

          updateActionStatus(messageId, "executed", data);
          showToast(`App "${data.appName}" generated in sidebar!`, "success");
          break;
        }

        case "ADD_CALENDAR_TASK": {
          // Read from LocalStorage
          const savedCal = localStorage.getItem("canvasdesk_calendar_items");
          const items = savedCal ? JSON.parse(savedCal) : [];

          const newItem = {
            id: `cal-${crypto.randomUUID()}`,
            title: payload.title,
            notes: payload.notes || "",
            date: payload.date || null,
            time: payload.time || "",
            type: payload.type || "task",
            category: payload.category || "focus",
          };

          items.push(newItem);
          localStorage.setItem("canvasdesk_calendar_items", JSON.stringify(items));

          updateActionStatus(messageId, "executed", newItem);
          showToast(`Scheduled "${payload.title}" on calendar!`, "success");
          break;
        }

        case "UPDATE_SETTINGS": {
          const { theme } = payload;
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          localStorage.setItem("canvasdesk_theme", theme);
          localStorage.setItem("canvasdesk_user_settings", JSON.stringify({ theme }));

          // Dispatch standard event
          window.dispatchEvent(new Event("theme-changed"));

          updateActionStatus(messageId, "executed");
          showToast(`Theme updated to ${theme} mode!`, "success");
          break;
        }

        case "CREATE_WHITEBOARD_DIAGRAM": {
          // 1. Create board
          const boardRes = await fetch("/api/boards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: payload.name, color: payload.color || "bg-violet-500" }),
          });

          if (!boardRes.ok) throw new Error("Failed to create whiteboard board container");
          const board = await boardRes.json();

          // 2. Fetch diagram structure from AI diagram service
          const diagRes = await fetch("/api/ai/diagram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: payload.prompt, diagramType: payload.diagramType }),
          });

          if (!diagRes.ok) throw new Error("AI diagram layout service failed");
          const diagram = await diagRes.json();

          // 3. Compile Excalidraw Elements
          const elements = compileExcalidrawDiagram(diagram);

          // 4. Save to local storage
          localStorage.setItem(`excalidraw-board-${board.id}`, JSON.stringify(elements));

          updateActionStatus(messageId, "executed", board);
          showToast(`Whiteboard "${payload.name}" loaded with diagram!`, "success");
          break;
        }

        case "ADD_KANBAN_TASK": {
          const client = createClient({
            authEndpoint: "/api/liveblocks-auth",
          });

          const { room, leave } = client.enterRoom(`kanban-board-${payload.boardId}`, {
            initialPresence: { cursor: null, isEditing: false },
            initialStorage: {
              columns: new LiveList([
                { id: "col-1", name: "Todo", order: 1 },
                { id: "col-2", name: "In Progress", order: 2 },
                { id: "col-3", name: "Done", order: 3 },
              ]),
              tasks: new LiveList([]),
            },
          });

          // Await room storage resolution
          const { root } = await room.getStorage();
          const columnsList = root.get("columns") as any;
          const tasksList = root.get("tasks") as any;

          if (!columnsList || !tasksList) {
            leave();
            throw new Error("Could not connect to Board storage root.");
          }

          // Resolve column match or select first column
          const colsArray = columnsList.toArray();
          const matchCol = colsArray.find(
            (c: any) => c.name.toLowerCase() === (payload.columnName || "todo").toLowerCase()
          );
          const colId = matchCol ? matchCol.id : colsArray[0]?.id || "col-1";

          const taskData = {
            id: `task-${crypto.randomUUID()}`,
            columnId: colId,
            title: payload.task.title,
            description: payload.task.description || "",
            dueDate: payload.task.dueDate || "",
            priority: payload.task.priority || "medium",
            labels: [],
            createdAt: Date.now(),
          };

          tasksList.push(taskData);
          leave();

          updateActionStatus(messageId, "executed", taskData);
          showToast(`Task "${payload.task.title}" added to Kanban board!`, "success");
          break;
        }

        default:
          throw new Error("Unknown action type requested.");
      }
    } catch (err: any) {
      console.error("Action execution exception:", err);
      updateActionStatus(messageId, "error", undefined, err.message || "Execution failed");
      showToast(err.message || "Failed to execute proposed workspace action", "error");
    }
  };

  const cancelAction = (messageId: string) => {
    updateActionStatus(messageId, "cancelled");
    showToast("Proposed action cancelled.", "info");
  };

  const updateActionStatus = (
    messageId: string,
    status: ActionProposal["status"],
    result?: any,
    errorMessage?: string
  ) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.action) {
          return {
            ...m,
            action: { ...m.action, status, result, errorMessage },
          };
        }
        return m;
      })
    );
  };

  return (
    <AppShell activeNav="assistant">
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top duration-300 ${
              toastType === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : toastType === "info"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {toastType === "error" ? (
              <AlertCircle className="size-4 text-rose-600 animate-bounce" />
            ) : (
              <Sparkles className="size-4 text-emerald-600 animate-pulse" />
            )}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">AI assistant</h1>
              <p className="text-[11px] text-muted-foreground">Your cozy productivity command center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.contains("dark");
                if (isDark) {
                  document.documentElement.classList.remove("dark");
                  localStorage.setItem("canvasdesk_theme", "light");
                } else {
                  document.documentElement.classList.add("dark");
                  localStorage.setItem("canvasdesk_theme", "dark");
                }
              }}
              title="Toggle Theme"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
            >
              <Moon className="size-4 block dark:hidden" />
              <Sun className="size-4 hidden dark:block" />
            </button>
            <span className="rounded bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Connected
            </span>
          </div>
        </header>

        {/* Chat / Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Empty State Layout */
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center pt-8 text-center">
              <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-400 text-white shadow-md mb-6">
                <Bot className="size-9 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Cozy AI command desk</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                Talk or text to plan, build, and organize. I can automate calendar meetings, Kanban board tasks, whiteboard diagram flowcharts, template apps, and keep track of your notes.
              </p>

              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: "Create a task for tomorrow", prompt: "Schedule a task for tomorrow at 10:00 AM titled 'Finish slides'" },
                  { label: "Add meeting reminder on calendar", prompt: "Add a meeting reminder to my calendar for next Monday at 2:00 PM" },
                  { label: "Summarize my notes", prompt: "Summarize my notes" },
                  { label: "Create a Kanban board", prompt: "Create a new Kanban board named 'Q2 Milestones'" },
                  { label: "Plan my week", prompt: "Plan my week and draft a weekly schedule note for me" },
                  { label: "Generate a habit tracker template", prompt: "Generate a custom habit tracker template app" },
                ].map((s, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(s.prompt)}
                    className="flex flex-col rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-foreground">{s.label}</span>
                    <span className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message Feed */
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((m) => {
                const isAI = m.role === "assistant";
                return (
                  <div key={m.id} className={`flex gap-3.5 ${isAI ? "justify-start" : "justify-end"}`}>
                    {isAI && (
                      <div className="grid size-8.5 shrink-0 place-items-center rounded-xl bg-violet-500 text-white shadow-sm font-bold">
                        <Bot className="size-4.5" />
                      </div>
                    )}

                    <div className="flex flex-col gap-2.5 max-w-[85%]">
                      {/* Bubble content */}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm border ${
                          isAI
                            ? "bg-card border-border text-foreground"
                            : "bg-slate-800 border-slate-700 text-slate-100 dark:bg-slate-900"
                        }`}
                      >
                        {isAI ? (
                          <MarkdownMessage content={m.content} />
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>

                      {/* Action Proposal Card wrapper */}
                      {isAI && m.action && (
                        <ActionProposalCard
                          messageId={m.id}
                          action={m.action}
                          onConfirm={executeAction}
                          onCancel={cancelAction}
                        />
                      )}
                    </div>

                    {!isAI && (
                      <div className="grid size-8.5 shrink-0 place-items-center rounded-xl bg-slate-200 dark:bg-slate-700 text-muted-foreground shadow-sm">
                        <User className="size-4.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing state */}
              {isLoading && (
                <div className="flex gap-3.5 justify-start">
                  <div className="grid size-8.5 shrink-0 place-items-center rounded-xl bg-violet-500 text-white shadow-sm animate-pulse">
                    <Bot className="size-4.5" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-card border border-border shadow-sm flex items-center gap-1.5">
                    <Loader2 className="size-4 animate-spin text-violet-600" />
                    <span className="text-xs text-muted-foreground font-semibold">AI is typing...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Real-time Voice Transcript Bar (shown only while recording) */}
        {(isRecording || isConnecting) && (
          <div className="mx-auto w-full max-w-3xl px-4 md:px-6 mb-2">
            <div className="flex items-center gap-3.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:bg-rose-950/20 px-4 py-3 shadow-md backdrop-blur-sm animate-pulse">
              <div className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-rose-500"></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                  {isConnecting ? "Establishing audio link..." : "Listening (AssemblyAI universal STT)"}
                </p>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-200 truncate mt-0.5">
                  {partialTranscript || "Speak clearly into your microphone..."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopRecording}
                className="h-7 px-2.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 bg-white shadow-sm border border-rose-200/50"
              >
                Done Speaking
              </Button>
            </div>
          </div>
        )}

        {/* Prompt Input Box */}
        <div className="border-t border-border bg-card/40 p-4 md:p-6 backdrop-blur-md">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask AI or tell it to create task, calendar event, board..."
                className="flex-1 resize-none bg-transparent py-2.5 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground min-h-[40px] max-h-40 font-medium"
              />

              <div className="flex items-center gap-1.5 px-1.5 pb-1">
                {/* Voice button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isConnecting}
                  className={`flex size-9.5 items-center justify-center rounded-xl transition cursor-pointer shadow-sm border ${
                    isRecording
                      ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600"
                      : "bg-secondary text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                  }`}
                  title={isRecording ? "Stop Listening" : "Speak to Assistant"}
                >
                  {isConnecting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="size-4" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </button>

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex size-9.5 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/95 disabled:opacity-45 disabled:cursor-not-allowed shadow-sm border border-primary/20 cursor-pointer"
                  title="Send prompt"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground font-medium">
              Multiline prompts supported (Shift + Enter). Action executions are client-approved.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// -------------------------------------------------------------
// SIMPLE MARKDOWN MESSAGE COMPONENT
// -------------------------------------------------------------
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  let inList = false;
  let listItems: string[] = [];
  const renderedElements: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-foreground/90 font-medium">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("- ") || line.startsWith("* ")) {
      inList = true;
      listItems.push(line.substring(2));
    } else {
      flushList(i);

      if (line.startsWith("### ")) {
        renderedElements.push(
          <h3 key={i} className="text-sm font-bold mt-4 mb-1.5 text-foreground leading-tight">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        renderedElements.push(
          <h2 key={i} className="text-base font-bold mt-5 mb-2 text-foreground leading-tight">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("# ")) {
        renderedElements.push(
          <h1 key={i} className="text-lg font-bold mt-6 mb-3 text-foreground leading-tight">
            {line.substring(2)}
          </h1>
        );
      } else if (line) {
        renderedElements.push(
          <p
            key={i}
            className="text-sm my-1.5 text-foreground/90 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }}
          />
        );
      }
    }
  }
  flushList(lines.length);

  return <div className="space-y-0.5">{renderedElements}</div>;
}

function parseInlineMarkdown(text: string): string {
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-rose-600 font-mono text-xs border border-border/60">$1</code>');
  return html;
}

// -------------------------------------------------------------
// ACTION PROPOSAL CARD COMPONENT
// -------------------------------------------------------------
interface ActionCardProps {
  messageId: string;
  action: ActionProposal;
  onConfirm: (msgId: string, action: ActionProposal) => void;
  onCancel: (msgId: string) => void;
}

function ActionProposalCard({ messageId, action, onConfirm, onCancel }: ActionCardProps) {
  const { type, payload, status, errorMessage, result } = action;

  // Icon mapping
  const getActionIcon = () => {
    switch (type) {
      case "CREATE_BOARD":
        return <Trello className="size-5 text-sky-500" />;
      case "ADD_KANBAN_TASK":
        return <Trello className="size-5 text-orange-500" />;
      case "ADD_CALENDAR_TASK":
        return <Calendar className="size-5 text-emerald-500" />;
      case "CREATE_NOTE":
      case "UPDATE_NOTE":
        return <NotebookPen className="size-5 text-rose-500" />;
      case "CREATE_WHITEBOARD_DIAGRAM":
        return <PenTool className="size-5 text-cyan-500" />;
      case "GENERATE_TEMPLATE_APP":
        return <LayoutTemplate className="size-5 text-violet-500" />;
      case "UPDATE_SETTINGS":
        return <Settings className="size-5 text-slate-500" />;
      default:
        return <Sparkles className="size-5 text-indigo-500" />;
    }
  };

  // Border theme mapping
  const getCardTheme = () => {
    if (status === "executed") return "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/30";
    if (status === "cancelled") return "border-border/60 bg-muted/20 opacity-70";
    if (status === "error") return "border-rose-200 bg-rose-50/20 dark:border-rose-900/30";

    switch (type) {
      case "CREATE_BOARD":
        return "border-sky-100 hover:border-sky-200 dark:border-sky-950";
      case "ADD_KANBAN_TASK":
        return "border-orange-100 hover:border-orange-200 dark:border-orange-950";
      case "ADD_CALENDAR_TASK":
        return "border-emerald-100 hover:border-emerald-200 dark:border-emerald-950";
      case "CREATE_NOTE":
      case "UPDATE_NOTE":
        return "border-rose-100 hover:border-rose-200 dark:border-rose-950";
      case "CREATE_WHITEBOARD_DIAGRAM":
        return "border-cyan-100 hover:border-cyan-200 dark:border-cyan-950";
      case "GENERATE_TEMPLATE_APP":
        return "border-violet-100 hover:border-violet-200 dark:border-violet-950";
      default:
        return "border-indigo-100 hover:border-indigo-200 dark:border-indigo-950";
    }
  };

  const renderPayloadSummary = () => {
    switch (type) {
      case "CREATE_BOARD":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Create board</p>
            <p className="text-xs font-semibold text-foreground">{payload.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`size-2.5 rounded-full ${payload.color}`} />
              <span className="text-[10px] text-muted-foreground capitalize font-bold">Theme</span>
            </div>
          </div>
        );
      case "ADD_KANBAN_TASK":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Add Kanban task</p>
            <p className="text-xs font-bold text-foreground">{payload.task.title}</p>
            {payload.task.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-1">{payload.task.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] font-bold">
              <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">Col: {payload.columnName || "Todo"}</span>
              <span className="rounded bg-coral-400/10 px-1.5 py-0.5 text-coral-500 uppercase tracking-wide">
                {payload.task.priority}
              </span>
              {payload.task.dueDate && (
                <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">Due: {payload.task.dueDate}</span>
              )}
            </div>
          </div>
        );
      case "ADD_CALENDAR_TASK":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Schedule item</p>
            <p className="text-xs font-semibold text-foreground">{payload.title}</p>
            {payload.notes && <p className="text-[11px] text-muted-foreground line-clamp-1">{payload.notes}</p>}
            <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] font-bold">
              <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-100 capitalize">
                {payload.category}
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">
                Date: {payload.date || "Draft"}
              </span>
              {payload.time && <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">Time: {payload.time}</span>}
            </div>
          </div>
        );
      case "CREATE_NOTE":
      case "UPDATE_NOTE":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              {type === "CREATE_NOTE" ? "Create note" : "Update note"}
            </p>
            <p className="text-xs font-semibold text-foreground">{payload.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-muted-foreground">
              <span className="rounded bg-secondary px-1.5 py-0.5 capitalize">{payload.color || "gray"} color</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">{payload.icon || "FileText"} icon</span>
            </div>
          </div>
        );
      case "CREATE_WHITEBOARD_DIAGRAM":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Generate diagram</p>
            <p className="text-xs font-semibold text-foreground">{payload.name}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-muted-foreground">
              <span className="rounded bg-violet-100 text-violet-700 px-1.5 py-0.5 capitalize">
                {payload.diagramType}
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 capitalize">{payload.color || "bg-violet-500"} indicators</span>
            </div>
          </div>
        );
      case "GENERATE_TEMPLATE_APP":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Generate App Workspace</p>
            <p className="text-xs font-semibold text-foreground">{payload.appName}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1 italic">"{payload.prompt}"</p>
          </div>
        );
      case "UPDATE_SETTINGS":
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Update preferences</p>
            <p className="text-xs font-bold text-foreground">Theme preference: {payload.theme}</p>
          </div>
        );
      default:
        return <p className="text-xs text-muted-foreground">Loading action description...</p>;
    }
  };

  const renderCardFooter = () => {
    if (status === "executed") {
      let linkHref = "";
      let linkLabel = "";

      if (type === "CREATE_BOARD" && result) {
        linkHref = "/kanban";
        linkLabel = "Open Kanban Workspace";
      } else if ((type === "CREATE_NOTE" || type === "UPDATE_NOTE") && result) {
        linkHref = "/notes";
        linkLabel = "Open Notes Board";
      } else if (type === "ADD_CALENDAR_TASK") {
        linkHref = "/calendar";
        linkLabel = "View in Calendar";
      } else if (type === "CREATE_WHITEBOARD_DIAGRAM" && result) {
        linkHref = "/whiteboard";
        linkLabel = "Go to Whiteboard";
      } else if (type === "GENERATE_TEMPLATE_APP" && result) {
        linkHref = `/template-builder/${result.id}`;
        linkLabel = "Launch Template App";
      } else if (type === "ADD_KANBAN_TASK") {
        linkHref = "/kanban";
        linkLabel = "Check board tasks";
      }

      return (
        <div className="mt-3 flex items-center justify-between border-t border-emerald-100 dark:border-emerald-950 pt-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Action completed
          </span>

          {linkHref && (
            <Link
              href={linkHref}
              className="flex items-center gap-1 hover:underline text-primary/95 flex-row cursor-pointer"
            >
              <span>{linkLabel}</span>
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
      );
    }

    if (status === "cancelled") {
      return (
        <div className="mt-2 text-[11px] font-bold text-muted-foreground border-t border-border/40 pt-1.5 flex items-center gap-1">
          <X className="size-3" />
          Proposals rejected
        </div>
      );
    }

    if (status === "confirming") {
      return (
        <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-2 text-xs font-semibold text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span>Executing action...</span>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="mt-3 border-t border-rose-100 pt-2 text-[10px] font-bold text-rose-700 dark:text-rose-300">
          <p className="flex items-center gap-1">
            <AlertCircle className="size-3 text-rose-600" />
            Failed: {errorMessage || "Network timeout"}
          </p>
          <button
            onClick={() => onConfirm(messageId, action)}
            className="mt-1.5 hover:underline text-rose-600 font-bold"
          >
            Retry Execution
          </button>
        </div>
      );
    }

    return (
      <div className="mt-3.5 flex items-center gap-2 border-t border-border/80 pt-2.5">
        <Button
          size="sm"
          onClick={() => onConfirm(messageId, action)}
          className="h-8 gap-1 font-semibold text-xs rounded-lg cursor-pointer bg-primary hover:bg-primary/95 text-white flex items-center"
        >
          <Check className="size-3.5" />
          Confirm Action
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCancel(messageId)}
          className="h-8 gap-1 font-semibold text-xs rounded-lg text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
        >
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border bg-card p-3.5 shadow-sm transition-all max-w-sm ${getCardTheme()}`}>
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background border border-border/80">
          {getActionIcon()}
        </div>
        <div className="min-w-0 flex-1">{renderPayloadSummary()}</div>
      </div>
      {renderCardFooter()}
    </div>
  );
}

// -------------------------------------------------------------
// COMPILER TO GENERATE VALID EXCALIDRAW BLOCKS
// -------------------------------------------------------------
function compileExcalidrawDiagram(diagram: any) {
  const newElements: any[] = [];
  const nodeMap = new Map<string, { x: number; y: number; w: number; h: number; containerId: string }>();

  const colorPalette: Record<string, { bg: string; stroke: string }> = {
    yellow: { bg: "#fef08a", stroke: "#ca8a04" },
    mint: { bg: "#bbf7d0", stroke: "#16a34a" },
    blue: { bg: "#bfdbfe", stroke: "#2563eb" },
    coral: { bg: "#ffedd5", stroke: "#ea580c" },
    purple: { bg: "#f3e8ff", stroke: "#9333ea" },
    white: { bg: "#ffffff", stroke: "#475569" },
  };

  // Center alignment offset
  const offsetX = 300;
  const offsetY = 150;

  // 1. Generate Nodes
  (diagram.nodes || []).forEach((node: any) => {
    const containerId = `ai-container-${node.id}-${Math.random().toString(36).substr(2, 9)}`;
    const textId = `ai-text-${node.id}-${Math.random().toString(36).substr(2, 9)}`;

    const w = node.w || 165;
    const h = node.h || 80;
    const x = (node.x || 0) + offsetX;
    const y = (node.y || 0) + offsetY;

    nodeMap.set(node.id, { x, y, w, h, containerId });

    const colors = colorPalette[node.color] || colorPalette.white;
    const isDiamond = node.type === "diamond";
    const isEllipse = node.type === "ellipse";

    const container = {
      id: containerId,
      type: isDiamond ? "diamond" : isEllipse ? "ellipse" : "rectangle",
      x,
      y,
      width: w,
      height: h,
      strokeColor: colors.stroke,
      backgroundColor: colors.bg,
      fillStyle: "solid",
      strokeWidth: 1.5,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      roundness: !isDiamond && !isEllipse ? { type: 3 } : null,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: [{ id: textId, type: "text" }],
      updated: Date.now(),
    };

    const text = {
      id: textId,
      type: "text",
      x: x + 10,
      y: y + 10,
      width: w - 20,
      height: h - 20,
      strokeColor: "#1e293b",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      containerId: containerId,
      text: node.label || "",
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: h / 2,
      updated: Date.now(),
    };

    newElements.push(container, text);
  });

  // 2. Generate Connections
  if (diagram.edges && Array.isArray(diagram.edges)) {
    diagram.edges.forEach((edge: any) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const startX = fromNode.x + fromNode.w / 2;
      const startY = fromNode.y + fromNode.h / 2;
      const endX = toNode.x + toNode.w / 2;
      const endY = toNode.y + toNode.h / 2;

      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let actualStartX = startX;
      let actualStartY = startY;
      let actualEndX = endX;
      let actualEndY = endY;

      if (dist > 20) {
        const startOffset = Math.min(fromNode.w / 2, 45);
        const endOffset = Math.min(toNode.w / 2, 45);
        actualStartX = startX + (dx / dist) * startOffset;
        actualStartY = startY + (dy / dist) * startOffset;
        actualEndX = endX - (dx / dist) * endOffset;
        actualEndY = endY - (dy / dist) * endOffset;
      }

      const arrowId = `ai-arrow-${edge.id}-${Math.random().toString(36).substr(2, 9)}`;

      const arrow = {
        id: arrowId,
        type: "arrow",
        x: actualStartX,
        y: actualStartY,
        width: Math.abs(actualEndX - actualStartX),
        height: Math.abs(actualEndY - actualStartY),
        strokeColor: "#475569",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1.5,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        points: [
          [0, 0],
          [actualEndX - actualStartX, actualEndY - actualStartY],
        ],
        updated: Date.now(),
      };

      newElements.push(arrow);

      // Render link labels
      if (edge.label) {
        const labelX = (actualStartX + actualEndX) / 2 - 40;
        const labelY = (actualStartY + actualEndY) / 2 - 10;
        const labelId = `ai-arrow-label-${edge.id}-${Math.random().toString(36).substr(2, 9)}`;
        const labelText = {
          id: labelId,
          type: "text",
          x: labelX,
          y: labelY,
          width: 80,
          height: 20,
          strokeColor: "#64748b",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          seed: Math.floor(Math.random() * 100000),
          version: 1,
          versionNonce: Math.floor(Math.random() * 100000),
          isDeleted: false,
          text: edge.label,
          fontSize: 12,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          baseline: 10,
          updated: Date.now(),
        };
        newElements.push(labelText);
      }
    });
  }

  return newElements;
}
