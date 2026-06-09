"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, X, Loader2, Calendar } from "lucide-react";
import { useThreads, useCreateThread, useCreateComment, useSelf } from "@liveblocks/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanbanTask } from "./task-dialog";

interface TaskCommentsPanelProps {
  task: KanbanTask;
  onClose: () => void;
}

// User Profile cache type
type UserProfile = {
  name: string;
  imageUrl: string | null;
  email: string;
};

export function TaskCommentsPanel({ task, onClose }: TaskCommentsPanelProps) {
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Liveblocks Hooks
  const { threads, isLoading } = useThreads();
  const createThread = useCreateThread();
  const createComment = useCreateComment();
  const self = useSelf();


  // Load user profiles map for resolving Clerk User ID to Name/Avatar
  useEffect(() => {
    async function loadUserMap() {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          setUserMap(data);
        }
      } catch (err) {
        console.error("Failed to load user map", err);
      }
    }
    loadUserMap();
  }, []);

  // Filter threads for this task ID
  const taskThread = threads?.find((t) => t.metadata.taskId === task.id);
  const comments = taskThread?.comments || [];

  // Scroll to bottom on new comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length, isLoading]);

  // Helper to extract text from Liveblocks Slate CommentBody
  const getCommentText = (body: any): string => {
    if (!body) return "";
    const content = body.content || body.children;
    if (Array.isArray(content)) {
      return content
        .map((child: any) => {
          if (child.type === "paragraph" && Array.isArray(child.children)) {
            return child.children.map((c: any) => c.text || "").join("");
          }
          return "";
        })
        .join("\n");
    }
    if (body.type === "root" && Array.isArray(body.children)) {
      return body.children
        .map((child: any) => {
          if (child.type === "paragraph" && Array.isArray(child.children)) {
            return child.children.map((c: any) => c.text || "").join("");
          }
          return "";
        })
        .join("\n");
    }
    return typeof body === "string" ? body : JSON.stringify(body);
  };


  // Helper to format date
  const formatCommentDate = (dateString: string | number | Date) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Resolve user info from cache or construct defaults
  const resolveUser = (userId: string) => {
    if (userMap[userId]) {
      return userMap[userId];
    }
    // Fallback if not found in db yet
    return {
      name: userId.startsWith("user_") ? "Collaborator" : userId,
      imageUrl: null,
      email: "",
    };
  };

  // Handle comment submit
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);

    const formattedBody = {
      version: 1,
      content: [
        {
          type: "paragraph",
          children: [{ text: commentText.trim() }],
        },
      ],
    } as any;

    try {
      if (taskThread) {
        // Thread exists, append comment
        createComment({
          threadId: taskThread.id,
          body: formattedBody,
        });
      } else {
        // No thread, create thread with first comment
        createThread({
          body: formattedBody,
          metadata: {
            taskId: task.id,
          },
        });
      }
      setCommentText("");
    } catch (err) {
      console.error("Error posting comment to Liveblocks", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-border bg-card shadow-2xl transition-all duration-300 animate-in slide-in-from-right sm:max-w-md">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-4">
        <div className="min-w-0 text-left">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <MessageSquare className="size-3" />
            Task Comments
          </span>
          <h3 className="truncate text-sm font-bold text-foreground mt-0.5" title={task.title}>
            {task.title}
          </h3>
        </div>
        <Button
          aria-label="Close comments panel"
          size="icon"
          variant="outline"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Task Context Card */}
      <div className="border-b border-border/60 bg-muted/10 p-4 text-left">
        <p className="text-xs text-muted-foreground line-clamp-3">
          {task.description || "No description provided for this task card."}
        </p>
        {task.dueDate && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <Calendar className="size-3 text-primary/70" />
            Due: {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(task.dueDate))}
          </div>
        )}
      </div>

      {/* Discussion List */}
      <div className="flex-1 overflow-y-auto bg-background/50 p-4 space-y-4">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => {
              const user = resolveUser(comment.userId);
              const isSelf = comment.userId === self?.id;

              return (
                <div
                  key={comment.id}
                  className={cn(
                    "flex gap-3 max-w-[85%] text-left",
                    isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* User Circle */}
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      className="size-7.5 rounded-full object-cover shrink-0 mt-0.5 ring-2 ring-primary/5"
                    />
                  ) : (
                    <div className="grid size-7.5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-primary shrink-0 mt-0.5">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Comment Bubble */}
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2 px-1">
                      <span className="text-[10px] font-bold text-foreground/80">
                        {isSelf ? "You" : user.name}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "mt-1 rounded-2xl px-3 py-2 text-xs leading-normal shadow-sm whitespace-pre-wrap break-words",
                        isSelf
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border text-foreground rounded-tl-none"
                      )}
                    >
                      {getCommentText(comment.body)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          /* Empty state */
          <div className="flex h-48 flex-col items-center justify-center text-center p-4">
            <div className="grid size-10 place-items-center rounded-full bg-accent/40 text-primary mb-3">
              <MessageSquare className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground/80">No discussions yet</p>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
              Type a message below to start real-time collaboration on this task.
            </p>
          </div>
        )}
      </div>

      {/* Composer Input */}
      <form onSubmit={handleSendComment} className="border-t border-border bg-card p-3">
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submitting}
            className="h-9.5 flex-1 rounded-md border border-input bg-background px-3 text-xs outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
          <Button
            type="submit"
            size="icon"
            disabled={submitting || !commentText.trim()}
            className="size-9.5 shrink-0 rounded-md"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </aside>
  );
}
