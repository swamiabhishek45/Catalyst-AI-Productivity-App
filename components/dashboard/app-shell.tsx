"use client";

import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutTemplate,
  NotebookPen,
  PanelLeft,
  PenTool,
  Settings,
  StickyNote,
  Trello,
  UsersRound,
  X,
} from "lucide-react";
import * as Icons from "lucide-react";

import { cn } from "@/lib/utils";

type ActiveNav = "dashboard" | "calendar" | "kanban" | "notes" | "whiteboard" | "template-builder" | string;

type NavItem = {
  id?: ActiveNav;
  label: string;
  icon: typeof LayoutDashboard;
  color: string;
  href?: string;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        color: "text-sky-500",
        href: "/",
      },
      {
        id: "assistant",
        label: "AI Assistant",
        icon: Bot,
        color: "text-violet-500",
        href: "/assistant",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: CalendarDays,
        color: "text-emerald-500",
        href: "/calendar",
      },
      {
        id: "kanban",
        label: "Task / Kanban",
        icon: Trello,
        color: "text-orange-500",
        href: "/kanban",
      },
    ],
  },
  {
    label: "Create",
    items: [
      { id: "notes", label: "Notes", icon: NotebookPen, color: "text-rose-500", href: "/notes" },
      { id: "whiteboard", label: "Whiteboard", icon: PenTool, color: "text-cyan-500", href: "/whiteboard" },
      {
        id: "spaces",
        label: "Pages / Spaces",
        icon: StickyNote,
        color: "text-amber-500",
        href: "/spaces",
      },
      {
        id: "template-builder",
        label: "AI Template Builder",
        icon: LayoutTemplate,
        color: "text-fuchsia-500",
        href: "/template-builder",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        color: "text-slate-500",
        href: "/settings",
      },
    ],
  },
];

function getLucideIcon(iconName: string) {
  const IconComponent = (Icons as any)[iconName] || Icons.LayoutTemplate;
  return IconComponent;
}

export function AppShell({
  activeNav,
  children,
}: {
  activeNav: ActiveNav;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarApps, setSidebarApps] = useState<Array<{ id: string; appName: string; icon: string; color: string }>>([]);

  const fetchSidebarApps = async () => {
    try {
      const res = await fetch("/api/template-builder/sidebar");
      if (res.ok) {
        const data = await res.json();
        setSidebarApps(data.apps || []);
      }
    } catch (error) {
      console.error("Failed to fetch sidebar apps:", error);
    }
  };

  useEffect(() => {
    fetchSidebarApps();
    window.addEventListener("sidebar-updated", fetchSidebarApps);
    return () => {
      window.removeEventListener("sidebar-updated", fetchSidebarApps);
    };
  }, []);

  const handleRemoveFromSidebar = async (appId: string) => {
    try {
      const res = await fetch(`/api/template-builder/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inSidebar: false }),
      });
      if (res.ok) {
        fetchSidebarApps();
        // Dispatch to sync dashboard components
        window.dispatchEvent(new Event("sidebar-updated"));
      }
    } catch (error) {
      console.error("Failed to remove app from sidebar:", error);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card/92 px-3 py-4 shadow-[8px_0_30px_rgba(50,64,84,0.06)] backdrop-blur transition-all duration-300",
            collapsed ? "w-[76px]" : "w-[244px]",
          )}
        >
          <div
            className={cn(
              "mb-5 flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <PanelLeft className="size-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">CanvasDesk</p>
                <p className="truncate text-xs text-muted-foreground">
                  Think, plan, ship
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((current) => !current)}
            className={cn(
              "mb-4 flex h-9 items-center rounded-md border border-border bg-background px-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            {!collapsed && <span>Collapse</span>}
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>

          <nav className="flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-none">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1.5 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeNav;
                    const itemClassName = cn(
                      "flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-[0.82rem] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                      isActive &&
                        "bg-primary/8 text-foreground shadow-[inset_0_0_0_1px_rgba(44,123,229,0.12)]",
                      !item.href && "cursor-not-allowed opacity-65 hover:bg-transparent",
                      collapsed && "justify-center px-0",
                    );

                    const content = (
                      <>
                        <Icon className={cn("size-4 shrink-0", item.color)} />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </>
                    );

                    return item.href ? (
                      <Link
                        key={item.label}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={item.label}
                        className={itemClassName}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={item.label}
                        className={itemClassName}
                        disabled
                        title={collapsed ? item.label : undefined}
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Dynamic Sidebar Apps */}
            {sidebarApps.length > 0 && (
              <div className="mt-2 border-t border-border/40 pt-4">
                {!collapsed && (
                  <p className="mb-1.5 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    My Apps
                  </p>
                )}
                <div className="space-y-1">
                  {sidebarApps.map((app) => {
                    const Icon = getLucideIcon(app.icon);
                    const href = `/template-builder/${app.id}`;
                    const isActive = activeNav === `app-${app.id}`;

                    return (
                      <div key={app.id} className="group relative flex items-center">
                        <Link
                          aria-current={isActive ? "page" : undefined}
                          aria-label={app.appName}
                          className={cn(
                            "flex h-9 flex-1 items-center gap-2.5 rounded-md px-2 text-left text-[0.82rem] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                            isActive && "bg-primary/8 text-foreground shadow-[inset_0_0_0_1px_rgba(44,123,229,0.12)]",
                            collapsed && "justify-center px-0"
                          )}
                          href={href}
                          title={collapsed ? app.appName : undefined}
                        >
                          <Icon className="size-4 shrink-0" style={{ color: app.color }} />
                          {!collapsed && <span className="truncate pr-4">{app.appName}</span>}
                        </Link>
                        {!collapsed && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveFromSidebar(app.id);
                            }}
                            className="absolute right-2 size-5 hidden group-hover:flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            title="Remove from sidebar"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          <div
            className={cn(
              "mt-5 rounded-lg border border-border bg-background p-2.5",
              collapsed && "grid place-items-center p-2",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-mint-100 text-emerald-600">
                <UsersRound className="size-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    Studio Workspace
                  </p>
                  <p className="truncate text-[0.7rem] text-muted-foreground">
                    4 teammates online
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">{children}</section>
      </div>
    </main>
  );
}
