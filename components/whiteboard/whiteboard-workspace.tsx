"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Sparkles, 
  Download, 
  Save, 
  HelpCircle, 
  Trash2, 
  Layers, 
  Palette, 
  StickyNote as StickyIcon, 
  Menu, 
  Share2,
  FileJson,
  Upload,
  RefreshCw,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhiteboardListPanel } from "./whiteboard-list-panel";
import { AIDiagramDialog } from "./ai-diagram-dialog";

// Load Excalidraw dynamically to avoid SSR errors
const ExcalidrawCanvas = dynamic(() => import("./excalidraw-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background/50 text-muted-foreground">
      <RefreshCw className="size-8 animate-spin text-primary mb-2" />
      <p className="text-sm font-semibold">Loading whiteboard canvas...</p>
    </div>
  ),
});

interface Board {
  id: string;
  name: string;
  color: string;
  createdAt: any;
}

export function WhiteboardWorkspace() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Excalidraw API Reference
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom tool setting states for the properties panel
  const [selectedStrokeColor, setSelectedStrokeColor] = useState("#1e293b");
  const [selectedBgColor, setSelectedBgColor] = useState("transparent");
  const [selectedTextColor, setSelectedTextColor] = useState("#1e293b");

  // Fetch all boards
  const fetchBoards = async (selectFirst = true) => {
    try {
      setIsLoadingBoards(true);
      const res = await fetch("/api/boards");
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
        if (selectFirst && data.length > 0) {
          setSelectedBoardId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // Handle board switching
  const handleSelectBoard = (boardId: string) => {
    if (saveTimeoutRef.current) {
      // Flush pending saves immediately
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setSelectedBoardId(boardId);
    setSaveStatus("Saved");
  };

  // Create a new board
  const handleCreateBoard = async (name: string, color: string) => {
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (res.ok) {
        const newBoard = await res.json();
        setBoards((prev) => [newBoard, ...prev]);
        setSelectedBoardId(newBoard.id);
      }
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  // Rename a board
  const handleRenameBoard = async (boardId: string, newName: string) => {
    try {
      const activeBoard = boards.find((b) => b.id === boardId);
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, color: activeBoard?.color }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));
      }
    } catch (error) {
      console.error("Error renaming board:", error);
    }
  };

  // Delete a board
  const handleDeleteBoard = async (boardId: string) => {
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
        // Clear local storage for elements
        localStorage.removeItem(`excalidraw-board-${boardId}`);
        if (selectedBoardId === boardId) {
          const remaining = boards.filter((b) => b.id !== boardId);
          setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  // Auto-save elements to local storage
  const handleCanvasChange = (elements: readonly any[], appState: any) => {
    if (!selectedBoardId) return;

    // We only trigger auto-save if elements actually changed (to prevent infinite loops on pan/zoom changes)
    setSaveStatus("Saving...");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const activeElements = elements.filter((el) => !el.isDeleted);
        localStorage.setItem(`excalidraw-board-${selectedBoardId}`, JSON.stringify(activeElements));
        setSaveStatus("Saved");
      } catch (err) {
        console.error("Failed to save board:", err);
        setSaveStatus("Error");
      }
    }, 500);
  };

  // Fetch saved elements for selected board
  const getBoardElements = () => {
    if (!selectedBoardId) return [];
    try {
      const data = localStorage.getItem(`excalidraw-board-${selectedBoardId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  // Programmatically add a Sticky Note
  const addStickyNote = (colorName: "yellow" | "mint" | "blue" | "coral") => {
    if (!excalidrawAPI) {
      alert("Canvas is not ready yet. Please wait.");
      return;
    }

    const appState = excalidrawAPI.getAppState();
    const viewportWidth = window.innerWidth - 260; // adjust for left list panel
    const viewportHeight = window.innerHeight - 56; // adjust for top bar

    // Center coordinates in Excalidraw world coords
    const worldX = (viewportWidth / 2 - appState.scrollX) / appState.zoom.value;
    const worldY = (viewportHeight / 2 - appState.scrollY) / appState.zoom.value;

    const stickyColors = {
      yellow: { bg: "#fef08a", stroke: "#ca8a04" },
      mint: { bg: "#bbf7d0", stroke: "#16a34a" },
      blue: { bg: "#bfdbfe", stroke: "#2563eb" },
      coral: { bg: "#ffedd5", stroke: "#ea580c" },
    };

    const colors = stickyColors[colorName];
    const containerId = `sticky-container-${Math.random().toString(36).substr(2, 9)}`;
    const textId = `sticky-text-${Math.random().toString(36).substr(2, 9)}`;
    
    const size = 160;

    const containerElement = {
      id: containerId,
      type: "rectangle",
      x: worldX - size / 2,
      y: worldY - size / 2,
      width: size,
      height: size,
      strokeColor: colors.stroke,
      backgroundColor: colors.bg,
      fillStyle: "solid",
      strokeWidth: 1.5,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      roundness: { type: 3 }, // Rounded corners
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: [{ id: textId, type: "text" }],
      updated: Date.now(),
    };

    const textElement = {
      id: textId,
      type: "text",
      x: worldX - size / 2 + 10,
      y: worldY - size / 2 + 10,
      width: size - 20,
      height: size - 20,
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
      text: "Sticky Note\n(double-click to edit)",
      fontSize: 15,
      fontFamily: 1, // Helvetica/Sans-serif
      textAlign: "center",
      verticalAlign: "middle",
      baseline: size / 2,
      updated: Date.now(),
    };

    const currentElements = excalidrawAPI.getSceneElements();
    excalidrawAPI.updateScene({
      elements: [...currentElements.filter((e: any) => !e.isDeleted), containerElement, textElement],
    });
  };

  // Custom tool properties sync
  const updateStrokeColor = (hex: string) => {
    setSelectedStrokeColor(hex);
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: { currentItemStrokeColor: hex },
      });
    }
  };

  const updateBgColor = (hex: string) => {
    setSelectedBgColor(hex);
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: { currentItemBackgroundColor: hex, currentItemFillStyle: hex === "transparent" ? "hachure" : "solid" },
      });
    }
  };

  const updateTextColor = (hex: string) => {
    setSelectedTextColor(hex);
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: { currentItemTextColor: hex },
      });
    }
  };

  // Export board as PNG file
  const handleExportPNG = async () => {
    if (!excalidrawAPI) return;

    try {
      const activeBoard = boards.find((b) => b.id === selectedBoardId);
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      
      // Dynamic import to prevent Node compilation of browser-based Excalidraw utils
      const { exportToBlob } = await import("@excalidraw/excalidraw");

      const blob = await exportToBlob({
        elements: elements.filter((el: any) => !el.isDeleted),
        appState: {
          ...appState,
          exportWithDarkMode: appState.theme === "dark",
          exportBackground: true,
        },
        mimeType: "image/png",
        exportPadding: 20,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeBoard?.name.replace(/[^a-z0-9_-]/gi, "_") || "whiteboard"}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export PNG. Make sure your browser supports canvas operations.");
    }
  };

  // Export board as JSON
  const handleExportJSON = () => {
    if (!excalidrawAPI) return;
    const activeBoard = boards.find((b) => b.id === selectedBoardId);
    const elements = excalidrawAPI.getSceneElements().filter((el: any) => !el.isDeleted);
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${activeBoard?.name.replace(/[^a-z0-9_-]/gi, "_") || "whiteboard"}.json`);
    link.click();
    setIsMoreMenuOpen(false);
  };

  // Import JSON elements
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !excalidrawAPI) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedElements = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedElements)) {
          const currentElements = excalidrawAPI.getSceneElements();
          excalidrawAPI.updateScene({
            elements: [...currentElements, ...importedElements],
          });
          alert("Whiteboard elements imported successfully!");
        } else {
          alert("Invalid file format. Elements must be a JSON array.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    setIsMoreMenuOpen(false);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (!excalidrawAPI) return;
    if (confirm("Are you sure you want to clear the entire whiteboard canvas? This cannot be undone.")) {
      excalidrawAPI.updateScene({
        elements: [],
      });
      // Instant save
      if (selectedBoardId) {
        localStorage.setItem(`excalidraw-board-${selectedBoardId}`, "[]");
      }
    }
    setIsMoreMenuOpen(false);
  };

  // Process and compile diagram generated by AI
  const handleAIGenerateDiagram = async (prompt: string, type: string) => {
    try {
      const res = await fetch("/api/ai/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, diagramType: type }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const diagram = await res.json();
      
      if (!diagram.nodes || diagram.nodes.length === 0) {
        throw new Error("No nodes were generated for this prompt. Try being more descriptive.");
      }

      if (!excalidrawAPI) {
        throw new Error("Canvas is not ready.");
      }

      // Calculate centering offset
      const appState = excalidrawAPI.getAppState();
      const viewportWidth = window.innerWidth - 260;
      const viewportHeight = window.innerHeight - 56;
      const viewportCenterX = (viewportWidth / 2 - appState.scrollX) / appState.zoom.value;
      const viewportCenterY = (viewportHeight / 2 - appState.scrollY) / appState.zoom.value;

      // Find boundaries of generated diagram relative grid
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      diagram.nodes.forEach((n: any) => {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x + (n.w || 160) > maxX) maxX = n.x + (n.w || 160);
        if (n.y + (n.h || 80) > maxY) maxY = n.y + (n.h || 80);
      });

      const diagramCenterX = (minX + maxX) / 2;
      const diagramCenterY = (minY + maxY) / 2;

      const offsetX = viewportCenterX - diagramCenterX;
      const offsetY = viewportCenterY - diagramCenterY;

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

      // 1. Generate Nodes
      diagram.nodes.forEach((node: any) => {
        const containerId = `ai-container-${node.id}-${Math.random().toString(36).substr(2, 9)}`;
        const textId = `ai-text-${node.id}-${Math.random().toString(36).substr(2, 9)}`;
        
        const w = node.w || 160;
        const h = node.h || 80;
        const x = node.x + offsetX;
        const y = node.y + offsetY;
        
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
          roundness: (!isDiamond && !isEllipse) ? { type: 3 } : null,
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

      // 2. Generate Connecting Arrows
      if (diagram.edges && Array.isArray(diagram.edges)) {
        diagram.edges.forEach((edge: any) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return;

          const startX = fromNode.x + fromNode.w / 2;
          const startY = fromNode.y + fromNode.h / 2;
          const endX = toNode.x + toNode.w / 2;
          const endY = toNode.y + toNode.h / 2;

          // Shorten vectors slightly so arrows start/end on node borders nicely
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

          // Render link label
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

      // Add to scene
      const current = excalidrawAPI.getSceneElements();
      excalidrawAPI.updateScene({
        elements: [...current.filter((e: any) => !e.isDeleted), ...newElements],
      });

    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Failed to generate visual nodes. Check console logs.");
    }
  };

  const activeBoard = boards.find((b) => b.id === selectedBoardId);
  const initialElements = selectedBoardId ? getBoardElements() : [];

  return (
    <div className="flex h-[calc(100vh-36px)] overflow-hidden bg-background">
      {/* 1. Left Sidebar */}
      <WhiteboardListPanel
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
        isLoading={isLoadingBoards}
      />

      {/* 2. Main Whiteboard Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-card border-l border-border relative">
        {/* Top Control Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            {activeBoard ? (
              <>
                <span className={cn("size-3 rounded-full shrink-0", activeBoard.color)} />
                <h1 className="text-sm font-semibold text-foreground truncate max-w-[180px]">
                  {activeBoard.name}
                </h1>
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-background">
                  <Save className="size-3 text-emerald-500" />
                  <span>{saveStatus}</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Select a board to start</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeBoard && (
              <>
                {/* AI Diagram Button */}
                <button
                  onClick={() => setIsAIDialogOpen(true)}
                  className="flex h-8 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700 transition cursor-pointer shadow-sm"
                >
                  <Sparkles className="size-3.5" />
                  AI Diagram
                </button>

                {/* Export PNG */}
                <button
                  onClick={handleExportPNG}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
                >
                  <Download className="size-3.5" />
                  Export PNG
                </button>

                {/* More Options Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
                  >
                    <Menu className="size-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)} />
                      <div className="absolute right-0 mt-1.5 z-50 w-44 rounded-lg border border-border bg-card p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={handleExportJSON}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
                        >
                          <FileJson className="size-3.5" />
                          Backup as JSON
                        </button>
                        
                        <label className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer">
                          <Upload className="size-3.5" />
                          Restore from JSON
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJSON}
                            className="hidden"
                          />
                        </label>

                        <div className="my-1 border-t border-border" />

                        <button
                          onClick={handleClearCanvas}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          Clear Canvas
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Canvas Display */}
        <div className="flex-1 relative overflow-hidden bg-background">
          {isLoadingBoards ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background">
              <RefreshCw className="size-8 animate-spin text-primary mb-2" />
              <p className="text-sm font-semibold">Loading boards...</p>
            </div>
          ) : activeBoard ? (
            <>
              {/* excalidraw component */}
              <ExcalidrawCanvas
                key={selectedBoardId}
                initialElements={initialElements}
                onChange={handleCanvasChange}
                excalidrawRef={setExcalidrawAPI}
                theme="light"
              />

              {/* FLOATING OVERLAY: Miro Sticky Notes Panel */}
              <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-2 rounded-lg border border-border bg-card/90 p-2.5 shadow-lg backdrop-blur">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1.5">
                  Sticky Notes
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => addStickyNote("yellow")}
                    title="Add Yellow Sticky Note"
                    className="size-8 rounded border border-yellow-400 bg-yellow-200 hover:scale-105 hover:shadow transition cursor-pointer"
                  />
                  <button
                    onClick={() => addStickyNote("mint")}
                    title="Add Mint Sticky Note"
                    className="size-8 rounded border-emerald-400 bg-emerald-200 hover:scale-105 hover:shadow transition cursor-pointer"
                  />
                  <button
                    onClick={() => addStickyNote("blue")}
                    title="Add Blue Sticky Note"
                    className="size-8 rounded border-blue-400 bg-blue-200 hover:scale-105 hover:shadow transition cursor-pointer"
                  />
                  <button
                    onClick={() => addStickyNote("coral")}
                    title="Add Coral Sticky Note"
                    className="size-8 rounded border-orange-300 bg-orange-100 hover:scale-105 hover:shadow transition cursor-pointer"
                  />
                </div>
              </div>

              {/* FLOATING OVERLAY: Modern Miro Properties Toolbar */}
              <div className="absolute bottom-5 right-5 z-20 flex gap-4 rounded-lg border border-border bg-card/90 p-3 shadow-lg backdrop-blur items-center">
                {/* 1. Stroke Color */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Stroke Color
                  </span>
                  <div className="flex gap-1">
                    {[
                      { hex: "#1e293b", bg: "bg-slate-800" },
                      { hex: "#ef4444", bg: "bg-red-500" },
                      { hex: "#3b82f6", bg: "bg-blue-500" },
                      { hex: "#10b981", bg: "bg-emerald-500" },
                      { hex: "#8b5cf6", bg: "bg-violet-500" }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => updateStrokeColor(c.hex)}
                        className={cn(
                          "size-4 rounded-full transition cursor-pointer border",
                          c.bg,
                          selectedStrokeColor === c.hex ? "border-foreground ring-1 ring-primary/45" : "border-transparent"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-6 w-px bg-border" />

                {/* 2. Shape Fill Color */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Fill Background
                  </span>
                  <div className="flex gap-1">
                    {[
                      { hex: "transparent", bg: "border-dashed border-muted bg-transparent" },
                      { hex: "#ffffff", bg: "bg-white border-border" },
                      { hex: "#dbeafe", bg: "bg-blue-100 border-blue-200" },
                      { hex: "#d1fae5", bg: "bg-emerald-100 border-emerald-200" },
                      { hex: "#fef9c3", bg: "bg-yellow-100 border-yellow-200" }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => updateBgColor(c.hex)}
                        className={cn(
                          "size-4 rounded-full transition cursor-pointer border",
                          c.bg,
                          selectedBgColor === c.hex ? "border-foreground ring-1 ring-primary/45 scale-110" : ""
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-6 w-px bg-border" />

                {/* 3. Text Color */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Text Color
                  </span>
                  <div className="flex gap-1">
                    {[
                      { hex: "#1e293b", bg: "bg-slate-800" },
                      { hex: "#ffffff", bg: "bg-white border border-border" },
                      { hex: "#ef4444", bg: "bg-red-500" },
                      { hex: "#3b82f6", bg: "bg-blue-500" },
                      { hex: "#10b981", bg: "bg-emerald-500" }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => updateTextColor(c.hex)}
                        className={cn(
                          "size-4 rounded-full transition cursor-pointer border",
                          c.bg,
                          selectedTextColor === c.hex ? "border-foreground ring-1 ring-primary/45" : "border-transparent"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-background/50">
              <Layout className="size-16 text-primary/10 mb-4" />
              <h3 className="text-base font-semibold text-foreground">No whiteboard active</h3>
              <p className="text-xs max-w-sm mt-1">
                Choose a whiteboard from the panel or click &quot;New Whiteboard&quot; to begin drawing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Diagram Generation Prompt Dialog */}
      <AIDiagramDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onGenerate={handleAIGenerateDiagram}
      />
    </div>
  );
}
