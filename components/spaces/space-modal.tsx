"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { colorMaps } from "./space-card";
import { cn } from "@/lib/utils";

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; color: string }) => void;
  initialData?: { name: string; description: string; color: string } | null;
}

export function SpaceModal({ isOpen, onClose, onSave, initialData }: SpaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("purple");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setColor(initialData.color);
    } else {
      setName("");
      setDescription("");
      setColor("purple");
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Space name is required");
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      color,
    });
    onClose();
  };

  const colorsList = Object.keys(colorMaps);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? "Edit Space Settings" : "Create New Space"}
          </h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Space Name */}
          <div>
            <label htmlFor="spaceName" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Space Name
            </label>
            <input
              id="spaceName"
              type="text"
              placeholder="e.g. Work Projects, Productivity Hub"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className={cn(
                "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white",
                error && "border-rose-400 bg-rose-50/20"
              )}
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="spaceDesc" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </label>
            <textarea
              id="spaceDesc"
              placeholder="What will this space organize?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Color Theme
            </label>
            <div className="flex flex-wrap gap-2.5">
              {colorsList.map((colorKey) => {
                const map = colorMaps[colorKey];
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setColor(colorKey)}
                    className={cn(
                      "group relative flex size-8 items-center justify-center rounded-full border shadow-sm transition hover:scale-105",
                      map.bg,
                      map.border,
                      color === colorKey ? "ring-2 ring-violet-500/30 scale-105" : "hover:border-slate-300"
                    )}
                  >
                    <span className={cn("size-3 rounded-full", map.accent)} />
                    {color === colorKey && (
                      <Check className="absolute size-3.5 text-white" style={{ strokeWidth: 3 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-violet-700 active:scale-[0.98] transition-all"
            >
              {initialData ? "Save Changes" : "Create Space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
