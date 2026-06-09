"use client";

import { useState } from "react";
import { FileText, MoreVertical, Star, Pencil, Trash, Archive, Copy, Share2, Download, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Page {
  id: string;
  spaceId: string;
  title: string;
  template: string;
  updatedAt: string;
  updatedBy: string;
  favorite: boolean;
  archived: boolean;
  description: string;
  commentsCount: number;
  linkedTasksCount: number;
  content?: string;
}

interface PageRowProps {
  page: Page;
  onClick: () => void;
  onFavorite: (id: string, e: React.MouseEvent) => void;
  onAction: (id: string, action: string, e: React.MouseEvent) => void;
}

export const templateColors: Record<string, { bg: string }> = {
  "Blank Page": { bg: "bg-slate-100 text-slate-700" },
  "Project Plan": { bg: "bg-violet-100 text-violet-700 border-violet-200" },
  "Meeting Notes": { bg: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "PRD": { bg: "bg-rose-100 text-rose-700 border-rose-200" },
  "Research Notes": { bg: "bg-amber-100 text-amber-700 border-amber-200" },
  "Task Plan": { bg: "bg-sky-100 text-sky-700 border-sky-200" },
};

export function PageRow({ page, onClick, onFavorite, onAction }: PageRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const templateStyle = templateColors[page.template] || templateColors["Blank Page"];

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onAction(page.id, action, e);
  };

  const getFriendlyTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "recently";
    }
  };

  const menuItems = [
    { label: "Rename Page", icon: Pencil, action: "rename" },
    { label: "Move Page", icon: ArrowRightLeft, action: "move" },
    { label: "Duplicate Page", icon: Copy, action: "duplicate" },
    { label: "Share Page", icon: Share2, action: "share" },
    { label: "Export Page", icon: Download, action: "export" },
    { label: page.archived ? "Unarchive" : "Archive", icon: Archive, action: "archive" },
    { label: "Delete Page", icon: Trash, action: "delete", className: "text-rose-600 hover:bg-rose-50" },
  ];

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
    >
      {/* Favorite column */}
      <td className="pl-4 pr-2 py-3 w-10 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(page.id, e);
          }}
          className="grid size-7 place-items-center rounded text-slate-300 hover:bg-slate-100 hover:text-amber-500 transition-colors"
        >
          <Star className={cn("size-3.5", page.favorite && "fill-amber-400 text-amber-400")} />
        </button>
      </td>

      {/* Page Title */}
      <td className="px-3 py-3 min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="flex size-7.5 items-center justify-center rounded-md bg-violet-50 text-violet-500 border border-violet-100">
            <FileText className="size-4" />
          </div>
          <span className="font-semibold text-slate-700 text-[0.88rem] group-hover:text-violet-600 transition-colors">
            {page.title}
          </span>
        </div>
      </td>

      {/* Template Type */}
      <td className="px-3 py-3">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.01)]", templateStyle.bg)}>
          {page.template}
        </span>
      </td>

      {/* Last Updated */}
      <td className="px-3 py-3 text-xs text-slate-500">
        Updated {getFriendlyTime(page.updatedAt)}
      </td>

      {/* Updated By */}
      <td className="px-3 py-3">
        <span className="inline-flex size-6.5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 ring-2 ring-white">
          {page.updatedBy}
        </span>
      </td>

      {/* More Actions Menu */}
      <td className="pr-4 pl-2 py-3 w-12 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block text-left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <MoreVertical className="size-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 rounded-lg border border-slate-100 bg-white py-1 shadow-md ring-1 ring-black/5 z-20">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.action}
                      onClick={(e) => handleAction(item.action, e)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors",
                        item.className
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
