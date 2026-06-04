"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawCanvasProps {
  initialElements: any[];
  onChange: (elements: readonly any[], appState: any) => void;
  excalidrawRef: (api: any) => void;
  theme?: "light" | "dark";
}

export default function ExcalidrawCanvas({
  initialElements,
  onChange,
  excalidrawRef,
  theme = "light",
}: ExcalidrawCanvasProps) {
  return (
    <div className="h-full w-full relative">
      <Excalidraw
        excalidrawAPI={excalidrawRef}
        initialData={{
          elements: initialElements,
          appState: {
            theme,
            viewBackgroundColor: theme === "dark" ? "#0f172a" : "#fafaf9",
            currentItemStrokeColor: "#1e293b",
            currentItemBackgroundColor: "transparent",
            currentItemFillStyle: "solid",
            currentItemStrokeWidth: 2,
            currentItemStrokeStyle: "solid",
            currentItemRoughness: 1,
            currentItemOpacity: 100,
          },
        }}
        onChange={onChange}
        // Excalidraw default styling configurations
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            toggleTheme: true,
            clearCanvas: true,
            export: false, // We use our own custom premium PNG export
            loadScene: true,
            saveToActiveFile: false,
          },
        }}
      />
    </div>
  );
}
