"use client";

import { useState } from "react";
import { Sparkles, X, Activity, GitFork, Network, Milestone, RefreshCw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DiagramType = "flowchart" | "mindmap" | "architecture" | "journey" | "process";

interface AIDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, type: DiagramType) => Promise<void>;
}

const DIAGRAM_TYPES: Array<{
  id: DiagramType;
  label: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
}> = [
  {
    id: "flowchart",
    label: "Flowchart",
    description: "Decision flows and sequential process paths",
    icon: GitFork,
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-950/20",
  },
  {
    id: "mindmap",
    label: "Mind Map",
    description: "Radial brain dumps and concept maps",
    icon: Network,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/20",
  },
  {
    id: "architecture",
    label: "System Architecture",
    description: "Server layouts, DB models, APIs, frontend clients",
    icon: Activity,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    id: "journey",
    label: "User Journey",
    description: "Timeline steps tracking user experience phases",
    icon: Milestone,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    id: "process",
    label: "Process Workflow",
    description: "Sequential business operations and operations lists",
    icon: RefreshCw,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/20",
  },
];

export function AIDiagramDialog({ isOpen, onClose, onGenerate }: AIDiagramDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<DiagramType>("flowchart");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      await onGenerate(prompt, selectedType);
      setPrompt("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to generate diagram. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl transition-all zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="grid size-9 place-items-center rounded-lg bg-violet-100 dark:bg-violet-950/30 text-violet-600">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Diagram Generator</h2>
            <p className="text-xs text-muted-foreground">Describe your layout and let Gemini build it directly onto your board</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              1. Choose Diagram Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {DIAGRAM_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "flex flex-col text-left p-3 rounded-lg border border-border hover:border-primary/50 transition duration-200 cursor-pointer bg-background/50",
                      isSelected && "border-primary bg-primary/5 ring-1 ring-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("grid p-1 rounded-md", type.bg)}>
                        <Icon className={cn("size-4", type.color)} />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{type.label}</span>
                    </div>
                    <span className="text-[0.7rem] text-muted-foreground leading-normal">
                      {type.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="prompt-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              2. Describe what you want to visualize
            </label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A user registration flow: starts with checking email, if it exists, show login, otherwise send verification OTP and then redirect to profile creation..."
              className="w-full h-32 rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none"
              disabled={isGenerating}
              required
            />
          </div>

          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition disabled:opacity-50 cursor-pointer"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition shadow-sm disabled:opacity-50 cursor-pointer"
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Wand2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Diagram
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
