"use client";

import { useState } from "react";
import { Folder, MoreVertical, Star, Pencil, Trash, Archive, Copy, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Space {
  id: string;
  name: string;
  description: string;
  color: string;
  members: string[];
  pageCount?: number;
  updatedAt: string;
  favorite: boolean;
  archived: boolean;
}

interface SpaceCardProps {
  space: Space;
  pageCount: number;
  layoutView: "grid" | "list";
  onClick: () => void;
  onFavorite: (id: string, e: React.MouseEvent) => void;
  onAction: (id: string, action: string, e: React.MouseEvent) => void;
}

export const colorMaps: Record<string, { bg: string; text: string; border: string; accent: string; hoverBg: string }> = {
  purple: {
    bg: "bg-purple-50/80",
    text: "text-purple-600",
    border: "border-purple-200/80",
    accent: "bg-purple-500",
    hoverBg: "hover:bg-purple-100/50",
  },
  indigo: {
    bg: "bg-indigo-50/80",
    text: "text-indigo-600",
    border: "border-indigo-200/80",
    accent: "bg-indigo-500",
    hoverBg: "hover:bg-indigo-100/50",
  },
  rose: {
    bg: "bg-rose-50/80",
    text: "text-rose-600",
    border: "border-rose-200/80",
    accent: "bg-rose-500",
    hoverBg: "hover:bg-rose-100/50",
  },
  emerald: {
    bg: "bg-emerald-50/80",
    text: "text-emerald-600",
    border: "border-emerald-200/80",
    accent: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-100/50",
  },
  amber: {
    bg: "bg-amber-50/80",
    text: "text-amber-600",
    border: "border-amber-200/80",
    accent: "bg-amber-500",
    hoverBg: "hover:bg-amber-100/50",
  },
  blue: {
    bg: "bg-blue-50/80",
    text: "text-blue-600",
    border: "border-blue-200/80",
    accent: "bg-blue-500",
    hoverBg: "hover:bg-blue-100/50",
  },
  gray: {
    bg: "bg-slate-50/80",
    text: "text-slate-600",
    border: "border-slate-200/80",
    accent: "bg-slate-500",
    hoverBg: "hover:bg-slate-100/50",
  },
};

export function SpaceCard({
  space,
  pageCount,
  layoutView,
  onClick,
  onFavorite,
  onAction,
}: SpaceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const colors = colorMaps[space.color] || colorMaps.purple;

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onAction(space.id, action, e);
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
    { label: "Rename", icon: Pencil, action: "rename" },
    { label: "Change Color", icon: Folder, action: "change-color" },
    { label: "Add Page", icon: Plus, action: "add-page" },
    { label: "Invite Collaborators", icon: UserPlus, action: "invite" },
    { label: "Duplicate Space", icon: Copy, action: "duplicate" },
    { label: space.archived ? "Unarchive" : "Archive", icon: Archive, action: "archive" },
    { label: "Delete Space", icon: Trash, action: "delete", className: "text-rose-600 hover:bg-rose-50" },
  ];

  if (layoutView === "list") {
    return (
      <div
        onClick={onClick}
        className="group relative flex cursor-pointer items-center justify-between border-b border-slate-100 bg-white px-5 py-4 transition-all hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn("flex size-9 items-center justify-center rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.02)]", colors.bg, colors.border)}>
            <Folder className={cn("size-4.5", colors.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-[0.92rem] group-hover:text-violet-700 transition-colors">
                {space.name}
              </span>
              {space.favorite && (
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
              )}
            </div>
            <p className="truncate text-xs text-slate-500 max-w-[400px]">
              {space.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {pageCount} {pageCount === 1 ? "Page" : "Pages"}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">
              Updated {getFriendlyTime(space.updatedAt)}
            </p>
          </div>

          <div className="flex -space-x-1.5 overflow-hidden">
            {space.members.map((member, i) => (
              <span
                key={i}
                className="inline-flex size-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 ring-2 ring-white"
                title={member}
              >
                {member}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(space.id, e);
              }}
              className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-amber-500 transition"
              title={space.favorite ? "Unfavorite" : "Favorite"}
            >
              <Star className={cn("size-4", space.favorite && "fill-amber-400 text-amber-400")} />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <MoreVertical className="size-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-20">
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
          </div>
        </div>
      </div>
    );
  }

  // Grid view (card)
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_4px_16px_rgba(109,40,217,0.05)] cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className={cn("flex size-10 items-center justify-center rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.02)]", colors.bg, colors.border)}>
            <Folder className={cn("size-5", colors.text)} />
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(space.id, e);
              }}
              className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-amber-500 transition-colors"
            >
              <Star className={cn("size-4", space.favorite && "fill-amber-400 text-amber-400")} />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <MoreVertical className="size-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-100 bg-white py-1 shadow-md ring-1 ring-black/5 z-20">
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
          </div>
        </div>

        <h3 className="mt-4 font-semibold text-slate-800 text-[0.98rem] group-hover:text-violet-700 transition-colors">
          {space.name}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 h-8 leading-relaxed">
          {space.description || "No description provided."}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex -space-x-1.5 overflow-hidden">
          {space.members.map((member, i) => (
            <span
              key={i}
              className="inline-flex size-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 ring-2 ring-white"
              title={member}
            >
              {member}
            </span>
          ))}
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
            {pageCount} {pageCount === 1 ? "Page" : "Pages"}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">
            Updated {getFriendlyTime(space.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
