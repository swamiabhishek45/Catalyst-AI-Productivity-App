"use client";

import { useState, useEffect } from "react";
import { Page, templateColors } from "./page-row";
import { Space } from "./space-card";
import {
  FileText,
  Folder,
  MessageSquare,
  CheckSquare,
  Clock,
  User,
  Star,
  Pencil,
  ArrowRightLeft,
  Copy,
  Share2,
  Download,
  Archive,
  Trash,
  ChevronLeft,
  Save,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PagePreviewProps {
  page: Page;
  space: Space;
  onBack: () => void;
  onFavorite: (id: string) => void;
  onAction: (id: string, action: string) => void;
  onUpdateContent: (id: string, description: string, content: string) => void;
}

export function PagePreview({
  page,
  space,
  onBack,
  onFavorite,
  onAction,
  onUpdateContent,
}: PagePreviewProps) {
  const [description, setDescription] = useState(page.description);
  const [content, setContent] = useState(page.content || "");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setDescription(page.description);
    setContent(page.content || "");
    setIsSaved(false);
  }, [page]);

  const templateStyle = templateColors[page.template] || templateColors["Blank Page"];

  const handleSave = () => {
    onUpdateContent(page.id, description, content);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const getFriendlyTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "recently";
    }
  };

  const actions = [
    { label: "Rename", icon: Pencil, action: "rename" },
    { label: "Move Page", icon: ArrowRightLeft, action: "move" },
    { label: "Duplicate", icon: Copy, action: "duplicate" },
    { label: "Share Settings", icon: Share2, action: "share" },
    { label: "Export File", icon: Download, action: "export" },
    { label: page.archived ? "Unarchive" : "Archive", icon: Archive, action: "archive" },
    {
      label: "Delete Page",
      icon: Trash,
      action: "delete",
      className: "text-rose-600 hover:bg-rose-50 hover:border-rose-100",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-5 md:p-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronLeft className="size-4" />
            Back to Space
          </button>

          <span className="text-slate-300">/</span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Folder className="size-3.5 text-violet-500" />
            <span className="font-semibold text-slate-600">{space.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onFavorite(page.id)}
            className={cn(
              "grid size-9 place-items-center rounded-lg border bg-white text-slate-400 hover:bg-slate-50 transition",
              page.favorite ? "border-amber-200 text-amber-500 shadow-sm" : "border-slate-200"
            )}
            title={page.favorite ? "Unfavorite" : "Favorite"}
          >
            <Star className={cn("size-4.5", page.favorite && "fill-amber-400 text-amber-400")} />
          </button>

          <button
            onClick={handleSave}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white shadow-sm transition active:scale-[0.98]",
              isSaved
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-violet-600 hover:bg-violet-700"
            )}
          >
            {isSaved ? (
              <>
                <Check className="size-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Document Editor Canvas */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] md:p-8">
          <div className="mb-4">
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.01)] mb-3", templateStyle.bg)}>
              {page.template}
            </span>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-normal">
              {page.title}
            </h1>
          </div>

          <div className="space-y-6">
            {/* Description Textarea */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Summary Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a brief summary description of the page..."
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2 text-xs leading-relaxed text-slate-600 outline-none transition focus:border-violet-300 focus:bg-white"
              />
            </div>

            {/* Document Content */}
            <div className="pt-2 border-t border-slate-50">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Document Body (Markdown Supported)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing notes, guides, checklists..."
                rows={16}
                className="w-full rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition focus:border-violet-300 focus:ring-1 focus:ring-violet-300/20 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Quick Preview Panel */}
        <aside className="space-y-6">
          {/* Preview Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-4">
              Page Info Card
            </h3>

            <div className="space-y-4">
              {/* Space name */}
              <div className="flex justify-between items-start text-xs">
                <span className="text-slate-400">Space:</span>
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Folder className="size-3.5 text-violet-500" />
                  <span>{space.name}</span>
                </div>
              </div>

              {/* Template Badge */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Template:</span>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.01)]", templateStyle.bg)}>
                  {page.template}
                </span>
              </div>

              {/* Comments count */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Comments:</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <MessageSquare className="size-3.5 text-slate-400" />
                  <span>{page.commentsCount} comments</span>
                </div>
              </div>

              {/* Linked Tasks count */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Linked Tasks:</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <CheckSquare className="size-3.5 text-slate-400" />
                  <span>{page.linkedTasksCount} tasks</span>
                </div>
              </div>

              {/* Last Edited By */}
              <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-3">
                <span className="text-slate-400">Last edited:</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 ring-2 ring-white">
                    {page.updatedBy}
                  </span>
                  <div className="text-[10px] text-right">
                    <p className="font-semibold text-slate-700">{page.updatedBy}</p>
                    <p className="text-slate-400">{getFriendlyTime(page.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">
              Page Actions
            </h3>

            <div className="flex flex-col gap-1.5">
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.action}
                    onClick={() => onAction(page.id, act.action)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all",
                      act.className
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
