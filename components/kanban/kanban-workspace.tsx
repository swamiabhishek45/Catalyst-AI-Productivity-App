"use client";

import { useState, useEffect } from "react";
import {
  Trello,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  NotebookPen,
  FolderPlus,
  Check,
  X,
  Sparkles,
  UsersRound,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useStorage, useMutation, useThreads } from "@liveblocks/react";
import { LiveList } from "@liveblocks/client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BoardDialog, boardColors } from "./board-dialog";
import { TaskDialog, KanbanTask, defaultLabels } from "./task-dialog";
import { KanbanRoomProvider } from "./liveblocks-provider";
import { ActiveCollaborators } from "./active-collaborators";
import { CollaborationDialog } from "./collaboration-dialog";
import { TaskCommentsPanel } from "./task-comments-panel";

interface KanbanBoard {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  createdAt: string;
}

// -------------------------------------------------------------
// MAIN WORKSPACE CONTAINER
// Handles Database Fetching/Mutating for Board Lists & Left Sidebar
// -------------------------------------------------------------
export function KanbanWorkspace() {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boardsLoading, setBoardsLoading] = useState(true);

  // Modals state
  const [boardDialog, setBoardDialog] = useState<{ isOpen: boolean; boardToEdit: KanbanBoard | null }>({
    isOpen: false,
    boardToEdit: null,
  });

  // Toast / feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Fetch boards from API
  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
        if (data.length > 0 && !activeBoardId) {
          setActiveBoardId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load boards", err);
    } finally {
      setBoardsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || null;

  // Board CRUD operations
  const handleOpenCreateBoard = () => {
    setBoardDialog({ isOpen: true, boardToEdit: null });
  };

  const handleOpenEditBoard = (board: KanbanBoard) => {
    setBoardDialog({ isOpen: true, boardToEdit: board });
  };

  const handleSaveBoard = async (name: string, color: string) => {
    if (boardDialog.boardToEdit) {
      // Edit Board DB API
      try {
        const response = await fetch(`/api/boards/${boardDialog.boardToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color }),
        });

        if (response.ok) {
          const updated = await response.json();
          setBoards(boards.map((b) => (b.id === updated.id ? updated : b)));
          showToast(`Board "${name}" updated successfully.`);
        }
      } catch (err) {
        console.error("Failed to edit board", err);
        showToast("Error updating board.");
      }
    } else {
      // Create Board DB API
      try {
        const response = await fetch("/api/boards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color }),
        });

        if (response.ok) {
          const created = await response.json();
          setBoards([created, ...boards]);
          setActiveBoardId(created.id);
          showToast(`Board "${name}" created successfully.`);
        }
      } catch (err) {
        console.error("Failed to create board", err);
        showToast("Error creating board.");
      }
    }
    setBoardDialog({ isOpen: false, boardToEdit: null });
  };

  const handleDeleteBoard = async (boardId: string) => {
    const boardToDelete = boards.find((b) => b.id === boardId);
    if (!boardToDelete) return;

    if (
      confirm(
        `Are you sure you want to delete the board "${boardToDelete.name}"? All columns, tasks, and comments inside will be permanently deleted.`
      )
    ) {
      try {
        const response = await fetch(`/api/boards/${boardId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          const remaining = boards.filter((b) => b.id !== boardId);
          setBoards(remaining);
          if (activeBoardId === boardId) {
            setActiveBoardId(remaining.length > 0 ? remaining[0].id : null);
          }
          showToast(`Deleted board "${boardToDelete.name}".`);
        }
      } catch (err) {
        console.error("Failed to delete board", err);
        showToast("Error deleting board.");
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-lg border border-primary/20 bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in slide-in-from-top duration-300">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Kanban Container Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Panel - Boards List */}
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-card/60 p-4 md:flex">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground/80">
              <Trello className="size-4 text-orange-500" />
              Kanban Boards
            </h2>
            <Button
              aria-label="Create Board"
              size="icon"
              variant="ghost"
              onClick={handleOpenCreateBoard}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {boardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              boards.map((b) => {
                const isActive = b.id === activeBoardId;
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition cursor-pointer hover:bg-accent/60",
                      isActive
                        ? "bg-primary/8 text-foreground shadow-[inset_0_0_0_1px_rgba(44,123,229,0.12)] font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveBoardId(b.id)}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={cn("size-2.5 shrink-0 rounded-full", b.color)} />
                      <span className="truncate">{b.name}</span>
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <button
                        aria-label="Edit board"
                        className="text-muted-foreground hover:text-primary p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditBoard(b);
                        }}
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        aria-label="Delete board"
                        className="text-muted-foreground hover:text-destructive p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBoard(b.id);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {!boardsLoading && boards.length === 0 && (
              <div className="text-center py-8 px-2 border border-dashed border-border rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground">No boards yet.</p>
                <Button
                  onClick={handleOpenCreateBoard}
                  variant="link"
                  className="text-xs text-primary p-0 mt-1 h-auto"
                >
                  Create Board
                </Button>
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-border pt-3">
            <Button
              className="w-full gap-2 text-xs font-semibold justify-start border-dashed bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              variant="outline"
              onClick={handleOpenCreateBoard}
            >
              <FolderPlus className="size-4 text-orange-500" />
              Add Workspace Board
            </Button>
          </div>
        </aside>

        {/* Right Side Panel - Collaborative Board Area */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeBoard ? (
            <KanbanBoardCollaborative
              board={activeBoard}
              onRenameBoard={() => handleOpenEditBoard(activeBoard)}
              onDeleteBoard={() => handleDeleteBoard(activeBoard.id)}
              showToast={showToast}
            />
          ) : boardsLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            /* No boards placeholder layout */
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <div className="max-w-md border border-border bg-card/50 rounded-2xl p-8 shadow-sm">
                <div className="mx-auto grid size-12 place-items-center rounded-xl bg-orange-100 text-orange-600 mb-4">
                  <Trello className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Welcome to Kanban boards</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Collaborate, track, and ship features. Create a board in the sidebar to organize your columns and tasks.
                </p>
                <Button onClick={handleOpenCreateBoard} className="mt-5 gap-2 font-semibold">
                  <FolderPlus className="size-4" />
                  Create Your First Board
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modals Mounting */}
      {boardDialog.isOpen && (
        <BoardDialog
          board={boardDialog.boardToEdit}
          onClose={() => setBoardDialog({ isOpen: false, boardToEdit: null })}
          onSave={handleSaveBoard}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// COLLABORATIVE WRAPPER
// Mounts RoomProvider for the selected Room ID
// -------------------------------------------------------------
interface CollaborativeProps {
  board: KanbanBoard;
  onRenameBoard: () => void;
  onDeleteBoard: () => void;
  showToast: (msg: string) => void;
}

function KanbanBoardCollaborative({
  board,
  onRenameBoard,
  onDeleteBoard,
  showToast,
}: CollaborativeProps) {
  return (
    <KanbanRoomProvider roomId={`kanban-board-${board.id}`}>
      <KanbanBoardInner
        board={board}
        onRenameBoard={onRenameBoard}
        onDeleteBoard={onDeleteBoard}
        showToast={showToast}
      />
    </KanbanRoomProvider>
  );
}

// -------------------------------------------------------------
// COLLABORATIVE INNER BOARD
// Subscribes and Mutates Liveblocks Room Storage (Columns/Tasks)
// -------------------------------------------------------------
function KanbanBoardInner({
  board,
  onRenameBoard,
  onDeleteBoard,
  showToast,
}: CollaborativeProps) {
  // Liveblocks Real-Time Storage
  const columns = useStorage((root) => root.columns as any) || [];
  const tasks = useStorage((root) => root.tasks as any) || [];
  const { threads } = useThreads();

  // Dialog and panel states
  const [collabDialogOpen, setCollabDialogOpen] = useState(false);
  const [activeCommentTask, setActiveCommentTask] = useState<KanbanTask | null>(null);
  const [taskDialog, setTaskDialog] = useState<{
    isOpen: boolean;
    columnId: string;
    taskToEdit: KanbanTask | null;
  }>({
    isOpen: false,
    columnId: "",
    taskToEdit: null,
  });

  // Column renaming state
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnRenameValue, setColumnRenameValue] = useState("");

  // Column Drag Over highlights
  const [draggedOverColumnId, setDraggedOverColumnId] = useState<string | null>(null);

  // Sorting columns by order
  const boardColumns = [...columns].sort((a, b) => a.order - b.order);

  // Helper to count task comments
  const getTaskCommentCount = (taskId: string) => {
    const thread = threads?.find((t) => t.metadata.taskId === taskId);
    return thread?.comments?.length || 0;
  };

  // --- Liveblocks Storage Mutations ---

  // Column Mutations
  const addColumnMutation = useMutation(({ storage }, name: string) => {
    const cols = storage.get("columns") as LiveList<any>;
    const order = cols.length > 0 ? cols.get(cols.length - 1).order + 1 : 1;
    cols.push({
      id: `col-${crypto.randomUUID()}`,
      name,
      order,
    });
  }, []);

  const renameColumnMutation = useMutation(({ storage }, colId: string, name: string) => {
    const cols = storage.get("columns") as LiveList<any>;
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.id === colId) {
        cols.set(i, { ...col, name });
        break;
      }
    }
  }, []);

  const deleteColumnMutation = useMutation(({ storage }, colId: string) => {
    const cols = storage.get("columns") as LiveList<any>;
    for (let i = 0; i < cols.length; i++) {
      if (cols.get(i).id === colId) {
        cols.delete(i);
        break;
      }
    }

    // Cascade delete tasks in that column
    const taskList = storage.get("tasks") as LiveList<any>;
    for (let i = taskList.length - 1; i >= 0; i--) {
      if (taskList.get(i).columnId === colId) {
        taskList.delete(i);
      }
    }
  }, []);

  // Task Mutations
  const addTaskMutation = useMutation(({ storage }, columnId: string, taskData: any) => {
    const taskList = storage.get("tasks") as LiveList<any>;
    taskList.push({
      id: `task-${crypto.randomUUID()}`,
      columnId,
      ...taskData,
      createdAt: Date.now(),
    });
  }, []);

  const updateTaskMutation = useMutation(({ storage }, taskId: string, taskData: any) => {
    const taskList = storage.get("tasks") as LiveList<any>;
    for (let i = 0; i < taskList.length; i++) {
      const t = taskList.get(i);
      if (t.id === taskId) {
        taskList.set(i, { ...t, ...taskData });
        break;
      }
    }
  }, []);

  const moveTaskMutation = useMutation(({ storage }, taskId: string, targetColId: string) => {
    const taskList = storage.get("tasks") as LiveList<any>;
    for (let i = 0; i < taskList.length; i++) {
      const t = taskList.get(i);
      if (t.id === taskId) {
        taskList.set(i, { ...t, columnId: targetColId });
        break;
      }
    }
  }, []);

  const deleteTaskMutation = useMutation(({ storage }, taskId: string) => {
    const taskList = storage.get("tasks") as LiveList<any>;
    for (let i = 0; i < taskList.length; i++) {
      if (taskList.get(i).id === taskId) {
        taskList.delete(i);
        break;
      }
    }
  }, []);

  // Column Handlers
  const handleAddColumn = () => {
    if (boardColumns.length >= 5) {
      showToast("Cannot add column. A board can have a maximum of 5 columns.");
      return;
    }
    const newColName = prompt("Enter the name of the new column:");
    if (!newColName || !newColName.trim()) return;

    addColumnMutation(newColName.trim());
    showToast(`Column "${newColName}" added.`);
  };

  const handleStartRenameColumn = (col: any) => {
    setEditingColumnId(col.id);
    setColumnRenameValue(col.name);
  };

  const handleSaveRenameColumn = (colId: string) => {
    if (!columnRenameValue.trim()) return;
    renameColumnMutation(colId, columnRenameValue.trim());
    setEditingColumnId(null);
  };

  const handleDeleteColumn = (colId: string) => {
    const colToDelete = columns.find((c: any) => c.id === colId);
    if (!colToDelete) return;

    const columnTasksCount = tasks.filter((t: any) => t.columnId === colId).length;
    let confirmMsg = `Are you sure you want to delete the column "${colToDelete.name}"?`;
    if (columnTasksCount > 0) {
      confirmMsg += ` This will also delete ${columnTasksCount} task(s) inside this column.`;
    }

    if (confirm(confirmMsg)) {
      deleteColumnMutation(colId);
      showToast(`Deleted column "${colToDelete.name}".`);
    }
  };

  // Task Handlers
  const handleOpenAddTask = (columnId: string) => {
    setTaskDialog({ isOpen: true, columnId, taskToEdit: null });
  };

  const handleOpenEditTask = (task: KanbanTask) => {
    setTaskDialog({ isOpen: true, columnId: task.columnId, taskToEdit: task });
  };

  const handleSaveTask = (taskData: Omit<KanbanTask, "id" | "boardId" | "columnId" | "createdAt">) => {
    if (taskDialog.taskToEdit) {
      // Edit Mutation
      updateTaskMutation(taskDialog.taskToEdit.id, taskData);
      showToast(`Updated task "${taskData.title}".`);
    } else {
      // Create Mutation
      addTaskMutation(taskDialog.columnId, taskData);
      showToast(`Created task "${taskData.title}".`);
    }
    setTaskDialog({ isOpen: false, columnId: "", taskToEdit: null });
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    if (confirm(`Are you sure you want to delete the task "${title}"?`)) {
      deleteTaskMutation(taskId);
      showToast(`Deleted task "${title}".`);
    }
  };

  // Drag and drop HTML5 handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOverColumnId !== colId) {
      setDraggedOverColumnId(colId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDraggedOverColumnId(null);
    const taskId = e.dataTransfer.getData("text/plain");

    if (taskId) {
      const targetTask = tasks.find((t: any) => t.id === taskId) as any;
      if (targetTask && targetTask.columnId !== targetColId) {
        moveTaskMutation(taskId, targetColId);
        const targetCol = columns.find((c: any) => c.id === targetColId) as any;
        showToast(`Moved "${targetTask.title}" to ${targetCol?.name || "new column"}`);
      }
    }
  };

  const handleNoteSyncClick = (title: string) => {
    showToast(`📋 Syncing "${title}": Note linking is configured. Open the Notes workspace to view details.`);
  };

  const handleCalendarSyncClick = (title: string) => {
    showToast(`📅 Syncing "${title}": Synced to your calendar. Navigate to the Calendar view to plan!`);
  };

  const getPriorityBadge = (priority: KanbanTask["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-coral-400/10 text-coral-500 border-coral-200/50";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-sky-100 text-sky-800 border-sky-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {/* Active Board Header */}
      <header className="flex flex-col gap-3 border-b border-border bg-card/40 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
        <div className="min-w-0 flex items-center gap-3">
          <span className={cn("size-3 shrink-0 rounded-full", board.color)} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{board.name}</h1>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-semibold">
            {boardColumns.length} Columns
          </span>
        </div>

        {/* Real-time active collaborators and tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Avatar stack */}
          <ActiveCollaborators className="mr-2 border-r border-border pr-3" />

          {/* Settings / Collaboration Dialog Trigger */}
          <Button
            onClick={() => setCollabDialogOpen(true)}
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary"
          >
            <UsersRound className="size-3.5" />
            Collaboration
          </Button>

          <Button
            onClick={onRenameBoard}
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 text-xs font-medium"
          >
            <Edit2 className="size-3.5" />
            Rename
          </Button>

          <Button
            onClick={onDeleteBoard}
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>

          <div className="h-6 w-[1px] bg-border mx-1" />

          <Button
            onClick={handleAddColumn}
            size="sm"
            className="h-8.5 gap-1.5 text-xs font-semibold"
            disabled={boardColumns.length >= 5}
          >
            <Plus className="size-4" />
            Add Column
          </Button>
        </div>
      </header>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-background p-5 md:p-8">
        <div className="flex h-full items-start gap-4 pb-2">
          {boardColumns.map((col) => {
            const colTasks = tasks.filter((t: any) => t.columnId === col.id);
            const isDraggingOver = draggedOverColumnId === col.id;

            return (
              <div
                key={col.id}
                className={cn(
                  "flex h-full w-[280px] shrink-0 flex-col rounded-xl border border-border/80 bg-muted/40 p-3 shadow-sm transition-all duration-200",
                  isDraggingOver && "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[0.99]"
                )}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between">
                  {editingColumnId === col.id ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <input
                        className="h-8 w-full rounded border border-input bg-background px-2 text-sm outline-none focus:border-primary"
                        value={columnRenameValue}
                        onChange={(e) => setColumnRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRenameColumn(col.id);
                          if (e.key === "Escape") setEditingColumnId(null);
                        }}
                        autoFocus
                      />
                      <button
                        aria-label="Save column name"
                        className="text-emerald-600 hover:bg-emerald-50 rounded p-1"
                        onClick={() => handleSaveRenameColumn(col.id)}
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        aria-label="Cancel editing"
                        className="text-rose-600 hover:bg-rose-50 rounded p-1"
                        onClick={() => setEditingColumnId(null)}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">{col.name}</h3>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <Button
                          aria-label={`Add task to ${col.name}`}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenAddTask(col.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-primary rounded-md"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                        <Button
                          aria-label={`Edit ${col.name} column`}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartRenameColumn(col)}
                          className="h-7 w-7 text-muted-foreground hover:text-primary rounded-md"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          aria-label={`Delete ${col.name} column`}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteColumn(col.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Task Card List */}
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 py-1">
                  {colTasks.map((task: any) => {
                    const formattedDate = task.dueDate
                      ? new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                        }).format(new Date(task.dueDate))
                      : null;

                    const commentCount = getTaskCommentCount(task.id);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-border/100 hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              getPriorityBadge(task.priority)
                            )}
                          >
                            {task.priority}
                          </span>

                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                            <button
                              aria-label="Edit task"
                              onClick={() => handleOpenEditTask(task)}
                              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition"
                            >
                              <Edit2 className="size-3" />
                            </button>
                            <button
                              aria-label="Delete task"
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-destructive transition"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="text-left">
                          <h4 className="text-[13px] font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Label badges */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {task.labels.map((lbl: string) => {
                              const match = defaultLabels.find((l) => l.name === lbl);
                              return (
                                <span
                                  key={lbl}
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-medium border",
                                    match ? match.color : "bg-slate-100 border-slate-200"
                                  )}
                                >
                                  {lbl}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Footer: Calendar & Notes & Comments Sync */}
                        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
                          {formattedDate ? (
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="size-3 text-primary/70" />
                              {formattedDate}
                            </span>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-1.5">
                            {/* Real-time Comments Badge */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentTask(task);
                              }}
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/80 transition",
                                commentCount > 0
                                  ? "bg-primary/5 text-primary border-primary/20 font-bold"
                                  : "bg-muted/40 hover:bg-accent text-muted-foreground hover:text-foreground"
                              )}
                              title="Task comments"
                            >
                              <MessageSquare className="size-3 shrink-0" />
                              <span className="text-[9px]">{commentCount}</span>
                            </button>

                            {task.syncToCalendar && (
                              <button
                                type="button"
                                onClick={() => handleCalendarSyncClick(task.title)}
                                className="grid size-5.5 place-items-center rounded bg-emerald-50 text-emerald-600 border border-emerald-100 hover:scale-105 transition"
                                title="Synced to Calendar"
                              >
                                <Calendar className="size-3" />
                              </button>
                            )}
                            {task.linkToNotes && (
                              <button
                                type="button"
                                onClick={() => handleNoteSyncClick(task.title)}
                                className="grid size-5.5 place-items-center rounded bg-rose-50 text-rose-600 border border-rose-100 hover:scale-105 transition"
                                title="Linked to Notes"
                              >
                                <NotebookPen className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex min-h-[90px] flex-col items-center justify-center rounded-lg border border-dashed border-border/60 p-4 text-center">
                      <span className="text-[10px] font-semibold text-muted-foreground">No tasks</span>
                      <Button
                        onClick={() => handleOpenAddTask(col.id)}
                        variant="link"
                        className="text-[10px] text-primary p-0 mt-0.5 h-auto font-medium"
                      >
                        Add card
                      </Button>
                    </div>
                  )}
                </div>

                {/* Add Task Footer Trigger */}
                <button
                  onClick={() => handleOpenAddTask(col.id)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card/30 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/20 hover:bg-card hover:text-primary"
                >
                  <Plus className="size-3.5 text-primary" />
                  Add Task Card
                </button>
              </div>
            );
          })}

          {/* Add Column Button */}
          {boardColumns.length < 5 && (
            <button
              onClick={handleAddColumn}
              className="flex h-[180px] w-[280px] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-primary/40 bg-card/20 text-muted-foreground hover:text-primary transition-all duration-200 group"
            >
              <div className="grid size-10 place-items-center rounded-full bg-muted group-hover:bg-primary/10 transition">
                <Plus className="size-5 group-hover:scale-110 transition" />
              </div>
              <span className="mt-3.5 text-sm font-semibold">Create Column</span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                ({5 - boardColumns.length} slots left)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mounting Settings / Share Dialog */}
      {collabDialogOpen && (
        <CollaborationDialog
          boardId={board.id}
          boardName={board.name}
          onClose={() => setCollabDialogOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Mounting Task Comments Sliding Panel */}
      {activeCommentTask && (
        <TaskCommentsPanel
          task={activeCommentTask}
          onClose={() => setActiveCommentTask(null)}
        />
      )}

      {/* Mounting Task Edit/Add Dialog */}
      {taskDialog.isOpen && (
        <TaskDialog
          task={taskDialog.taskToEdit}
          onClose={() => setTaskDialog({ isOpen: false, columnId: "", taskToEdit: null })}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}
