"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Space } from "./space-card";
import { cn } from "@/lib/utils";

interface PageModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: Space[];
  onSave: (data: { title: string; spaceId: string; template: string }) => void;
  initialData?: { title: string; spaceId: string; template: string } | null;
  mode?: "create" | "rename" | "move";
  currentSpaceId?: string;
}

export function PageModal({
  isOpen,
  onClose,
  spaces,
  onSave,
  initialData,
  mode = "create",
  currentSpaceId,
}: PageModalProps) {
  const [title, setTitle] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [template, setTemplate] = useState("Blank Page");
  const [error, setError] = useState("");

  const templatesList = [
    "Blank Page",
    "Project Plan",
    "Meeting Notes",
    "PRD",
    "Research Notes",
    "Task Plan",
  ];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setSpaceId(initialData.spaceId);
      setTemplate(initialData.template);
    } else {
      setTitle("");
      setSpaceId(currentSpaceId || (spaces.length > 0 ? spaces[0].id : ""));
      setTemplate("Blank Page");
    }
    setError("");
  }, [initialData, isOpen, currentSpaceId, spaces]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((mode === "create" || mode === "rename") && !title.trim()) {
      setError("Page title is required");
      return;
    }

    if ((mode === "create" || mode === "move") && !spaceId) {
      setError("Target space is required");
      return;
    }

    onSave({
      title: title.trim(),
      spaceId,
      template,
    });
    onClose();
  };

  const activeSpaces = spaces.filter((s) => !s.archived);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === "create" && "Create New Page"}
            {mode === "rename" && "Rename Page"}
            {mode === "move" && "Move Page to Space"}
          </h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Page Title */}
          {(mode === "create" || mode === "rename") && (
            <div>
              <label htmlFor="pageTitle" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Page Title
              </label>
              <input
                id="pageTitle"
                type="text"
                placeholder="e.g. Q2 Roadmap, Marketing Assets"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
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
          )}

          {/* Add to Space Dropdown */}
          {(mode === "create" || mode === "move") && (
            <div>
              <label htmlFor="targetSpace" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Target Space
              </label>
              <select
                id="targetSpace"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white"
              >
                {activeSpaces.length === 0 ? (
                  <option value="" disabled>No active spaces available</option>
                ) : (
                  activeSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Template Dropdown */}
          {mode === "create" && (
            <div>
              <label htmlFor="templateSelect" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Template Type
              </label>
              <select
                id="templateSelect"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white"
              >
                {templatesList.map((tpl) => (
                  <option key={tpl} value={tpl}>
                    {tpl}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {mode === "create" && "Create Page"}
              {mode === "rename" && "Rename Page"}
              {mode === "move" && "Move Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
