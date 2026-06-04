"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  FolderPlus,
  FilePlus,
  LayoutGrid,
  List,
  ChevronDown,
  RefreshCw,
  Folder,
  FileText,
  AlertCircle,
  Users,
  Archive,
} from "lucide-react";
import { Space, SpaceCard } from "./space-card";
import { Page, PageRow } from "./page-row";
import { SpaceModal } from "./space-modal";
import { PageModal } from "./page-modal";
import { PagePreview } from "./page-preview";
import { cn } from "@/lib/utils";

// Seed data
const INITIAL_SPACES: Space[] = [
  {
    id: "space-1",
    name: "Productivity Hub",
    description: "Daily planning, notes, tasks, and productivity workflows.",
    color: "purple",
    members: ["JD", "AM", "SK"],
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    favorite: true,
    archived: false,
  },
  {
    id: "space-2",
    name: "Work Projects",
    description: "Project plans, documentation, and team collaboration.",
    color: "indigo",
    members: ["AM", "TL", "JD"],
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    favorite: true,
    archived: false,
  },
  {
    id: "space-3",
    name: "Personal",
    description: "Personal notes, goals, and life organization.",
    color: "rose",
    members: ["JD"],
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    favorite: false,
    archived: false,
  },
  {
    id: "space-4",
    name: "Learning & Growth",
    description: "Courses, books, and research notes.",
    color: "emerald",
    members: ["SK", "AM"],
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    favorite: false,
    archived: false,
  },
  {
    id: "space-5",
    name: "Ideas & Research",
    description: "Brainstorming, references, and future ideas.",
    color: "blue",
    members: ["TL", "SK"],
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    favorite: false,
    archived: false,
  },
  {
    id: "space-6",
    name: "Archive",
    description: "Old projects and completed work.",
    color: "gray",
    members: ["JD", "TL"],
    updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // 7 days ago
    favorite: false,
    archived: true,
  },
];

const INITIAL_PAGES: Page[] = [
  // For Productivity Hub
  {
    id: "page-prod-1",
    spaceId: "space-1",
    title: "Daily Focus Tracker",
    template: "Task Plan",
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedBy: "JD",
    favorite: true,
    archived: false,
    description: "Daily tracker for tasks, calendar sync, and habits checklist.",
    commentsCount: 3,
    linkedTasksCount: 15,
    content: "## Daily Focus Tracker\n\n- [ ] 08:30 AM: Standup\n- [ ] 09:00 AM: Deep Work on spaces UI\n- [ ] 02:00 PM: Sync on API specs",
  },
  {
    id: "page-prod-2",
    spaceId: "space-1",
    title: "Weekly Review Template",
    template: "Meeting Notes",
    updatedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    updatedBy: "SK",
    favorite: false,
    archived: false,
    description: "Structure for weekly planning, reviewing goals, and reflection.",
    commentsCount: 1,
    linkedTasksCount: 4,
    content: "## Weekly Reflection\n\n### Accomplishments\n- Completed Kanban layout views.\n- Integrated Clerk auth setup.\n\n### Blockers\n- Wait for API deployment for workspace synchronization.",
  },
  // For Work Projects
  {
    id: "page-work-1",
    spaceId: "space-2",
    title: "Q2 Roadmap",
    template: "Project Plan",
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedBy: "JD",
    favorite: true,
    archived: false,
    description: "Strategic plans and milestones for the Q2 product launch, tracking feature progress and target dates.",
    commentsCount: 4,
    linkedTasksCount: 8,
    content: "## Q2 Roadmap\n\n### Milestones\n- **M1**: User Authentication and Profile settings (Target: June 15)\n- **M2**: Space & Page Layout structure implementation (Target: June 25)\n- **M3**: Collaboration Hub & Shared States (Target: July 10)\n\n### Action Items\n- [x] Design whiteboard prototypes\n- [ ] Integrate real-time state store\n- [ ] Audit application performance",
  },
  {
    id: "page-work-2",
    spaceId: "space-2",
    title: "Sprint Planning",
    template: "Task Plan",
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedBy: "AM",
    favorite: false,
    archived: false,
    description: "Sprint planning notes, capacity assessment, and task assignment details for the active engineering cycle.",
    commentsCount: 2,
    linkedTasksCount: 12,
    content: "## Active Sprint (Sprint 14)\n\n**Goal**: Implement local persistence and workspace management layouts.\n\n### Team Capacity\n- Abhishek: 40h\n- JD: 35h\n- TL: 40h\n\n### Sprint Backlog\n- Implement spaces UI layout grid & list views\n- Write sidebar navigation active routing middleware\n- Code space/page modals and transition actions",
  },
  {
    id: "page-work-3",
    spaceId: "space-2",
    title: "Meeting Notes - 12 May",
    template: "Meeting Notes",
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedBy: "SK",
    favorite: false,
    archived: false,
    description: "Sync with stakeholders regarding the design refinements and API integration deadlines.",
    commentsCount: 0,
    linkedTasksCount: 2,
    content: "## Design Review Meeting - May 12\n\n**Attendees**: JD, SK, AM, TL\n\n### Discussion Topics\n- Cozy aesthetic: clean white background, soft purple accents.\n- Rounded corner styles should be 6-8px, borders low contrast.\n- Ensure page preview details look like cards.",
  },
  {
    id: "page-work-4",
    spaceId: "space-2",
    title: "Project PRD",
    template: "PRD",
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedBy: "TL",
    favorite: true,
    archived: false,
    description: "Product Requirements Document covering user onboarding, authentication service, and workspace state synchronization.",
    commentsCount: 15,
    linkedTasksCount: 5,
    content: "## Product Requirements Document (PRD)\n\n### 1. Executive Summary\nCanvasDesk is designed to combine hierarchical Notion-like organization with whiteboard visualization tools.\n\n### 2. Feature Requirements\n- Spaces function as folders.\n- Pages function as editable documents with template support.",
  },
  {
    id: "page-work-5",
    spaceId: "space-2",
    title: "Resources & Links",
    template: "Research Notes",
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedBy: "AM",
    favorite: false,
    archived: false,
    description: "Useful reference documents, Figma mockups, API definitions, and staging environment credentials.",
    commentsCount: 1,
    linkedTasksCount: 0,
    content: "## Reference Hub\n\n- Figma Design: [Link to CanvasDesk Prototypes]\n- API Endpoint: `https://api.canvasdesk.studio/v1`\n- Staging URL: `https://staging.canvasdesk.studio`",
  },
  // For Personal
  {
    id: "page-pers-1",
    spaceId: "space-3",
    title: "Life Goals 2026",
    template: "Blank Page",
    updatedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    updatedBy: "JD",
    favorite: true,
    archived: false,
    description: "Personal values mapping, vision statement, and annual target goals.",
    commentsCount: 0,
    linkedTasksCount: 1,
    content: "## Vision for 2026\n\n- Focus on building solid, clean user interfaces.\n- Travel to 3 new countries.\n- Maintain healthy daily routines.",
  },
  // For Learning & Growth
  {
    id: "page-learn-1",
    spaceId: "space-4",
    title: "React 19 & Next.js 16 Overview",
    template: "Research Notes",
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedBy: "SK",
    favorite: false,
    archived: false,
    description: "A summary of key updates in React 19 (Server Actions, useActionState) and Next.js 16.",
    commentsCount: 2,
    linkedTasksCount: 3,
    content: "## Key Features of React 19\n\n- **Server Actions**: Native async transitions.\n- **Asset Loading**: Stylesheets, fonts, and scripts preloading native support.\n- **New Hooks**: `useActionState`, `useFormStatus`, `useOptimistic`.",
  },
  // For Ideas & Research
  {
    id: "page-idea-1",
    spaceId: "space-5",
    title: "Brainstorming AI Canvas",
    template: "Blank Page",
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedBy: "TL",
    favorite: false,
    archived: false,
    description: "Rough notes and layouts for linking whiteboard tools with real-time LLM agents.",
    commentsCount: 5,
    linkedTasksCount: 1,
    content: "## AI Canvas Ideas\n- Dynamic sticky notes generated by prompts.\n- Mindmap node suggestions on user selection.\n- One-click block diagram generation.",
  },
  // For Archive
  {
    id: "page-arch-1",
    spaceId: "space-6",
    title: "Q1 Review Notes",
    template: "Meeting Notes",
    updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updatedBy: "JD",
    favorite: false,
    archived: true,
    description: "Historical retrospective notes from Q1 work cycle.",
    commentsCount: 1,
    linkedTasksCount: 0,
    content: "## Q1 Review\nWe successfully shipped the Calendar component and Kanban initial board layouts. Retention increased by 15%.",
  },
];

export function SpacesWorkspace() {
  // Core states
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [view, setView] = useState<"spaces" | "space-detail" | "page-detail">("spaces");
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Search & Filter & View state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "favorites" | "recent" | "archived">("all");
  const [sortOption, setSortOption] = useState<"updated" | "name" | "pages" | "favorites">("updated");
  const [layoutView, setLayoutView] = useState<"grid" | "list">("grid");

  // Modals state
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [spaceModalData, setSpaceModalData] = useState<Space | null>(null); // null means Create mode

  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [pageModalData, setPageModalData] = useState<Page | null>(null); // null means Create mode
  const [pageModalMode, setPageModalMode] = useState<"create" | "rename" | "move">("create");

  // Load from localStorage on mount
  useEffect(() => {
    const savedSpaces = localStorage.getItem("canvasdesk_spaces");
    const savedPages = localStorage.getItem("canvasdesk_pages");

    if (savedSpaces && savedPages) {
      setSpaces(JSON.parse(savedSpaces));
      setPages(JSON.parse(savedPages));
    } else {
      // Seed default data
      setSpaces(INITIAL_SPACES);
      setPages(INITIAL_PAGES);
      localStorage.setItem("canvasdesk_spaces", JSON.stringify(INITIAL_SPACES));
      localStorage.setItem("canvasdesk_pages", JSON.stringify(INITIAL_PAGES));
    }
  }, []);

  // Save to localStorage whenever spaces/pages change
  const saveSpaces = (newSpaces: Space[]) => {
    setSpaces(newSpaces);
    localStorage.setItem("canvasdesk_spaces", JSON.stringify(newSpaces));
  };

  const savePages = (newPages: Page[]) => {
    setPages(newPages);
    localStorage.setItem("canvasdesk_pages", JSON.stringify(newPages));
  };

  // Find active records
  const activeSpace = useMemo(() => {
    return spaces.find((s) => s.id === activeSpaceId) || null;
  }, [spaces, activeSpaceId]);

  const activePage = useMemo(() => {
    return pages.find((p) => p.id === activePageId) || null;
  }, [pages, activePageId]);

  // Compute page count per space ID
  const pageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    spaces.forEach((s) => {
      counts[s.id] = pages.filter((p) => p.spaceId === s.id && !p.archived).length;
    });
    return counts;
  }, [spaces, pages]);

  // Filtered & Sorted Spaces for Spaces Grid
  const filteredSpaces = useMemo(() => {
    return spaces
      .filter((space) => {
        // Filter tabs logic
        if (filterTab === "archived") {
          if (!space.archived) return false;
        } else {
          if (space.archived) return false;
          if (filterTab === "favorites" && !space.favorite) return false;
          if (filterTab === "recent") {
            // Updated in the last 2 days
            const twoDaysAgo = Date.now() - 2 * 24 * 3600 * 1000;
            if (new Date(space.updatedAt).getTime() < twoDaysAgo) return false;
          }
        }

        // Search query logic (matches space name, description, or contained pages)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesSpace =
            space.name.toLowerCase().includes(query) ||
            space.description.toLowerCase().includes(query);

          const matchesPages = pages.some(
            (p) => p.spaceId === space.id && p.title.toLowerCase().includes(query)
          );

          return matchesSpace || matchesPages;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort options
        if (sortOption === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortOption === "pages") {
          const countA = pageCounts[a.id] || 0;
          const countB = pageCounts[b.id] || 0;
          return countB - countA;
        }
        if (sortOption === "favorites") {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        // "updated" is default
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [spaces, pages, filterTab, searchQuery, sortOption, pageCounts]);

  // Filtered Pages for Active Space
  const filteredPages = useMemo(() => {
    if (!activeSpaceId) return [];
    return pages.filter((page) => {
      if (page.spaceId !== activeSpaceId) return false;
      if (page.archived) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          page.title.toLowerCase().includes(query) ||
          page.description.toLowerCase().includes(query) ||
          page.template.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [pages, activeSpaceId, searchQuery]);

  // Combined Search statistics for top header when searching
  const searchResultsCount = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const matchedSpaces = spaces.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
    ).length;
    const matchedPages = pages.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    ).length;
    return { spaces: matchedSpaces, pages: matchedPages };
  }, [searchQuery, spaces, pages]);

  // Space Actions handler
  const handleSpaceAction = (spaceId: string, action: string, e?: React.MouseEvent) => {
    const spaceToAct = spaces.find((s) => s.id === spaceId);
    if (!spaceToAct) return;

    switch (action) {
      case "rename":
      case "change-color":
        setSpaceModalData(spaceToAct);
        setSpaceModalOpen(true);
        break;
      case "add-page":
        setPageModalData(null);
        setPageModalMode("create");
        setActiveSpaceId(spaceId);
        setPageModalOpen(true);
        break;
      case "invite":
        // Simulated Invite: prompt for email/initials
        const personInitials = prompt("Enter team member's initials (e.g. TL, AM):");
        if (personInitials && personInitials.trim()) {
          const cleanInitials = personInitials.trim().slice(0, 3).toUpperCase();
          const updatedSpaces = spaces.map((s) => {
            if (s.id === spaceId) {
              const newMembers = s.members.includes(cleanInitials)
                ? s.members
                : [...s.members, cleanInitials];
              return { ...s, members: newMembers, updatedAt: new Date().toISOString() };
            }
            return s;
          });
          saveSpaces(updatedSpaces);
        }
        break;
      case "duplicate":
        const newSpaceId = `space-${Date.now()}`;
        const duplicatedSpace: Space = {
          ...spaceToAct,
          id: newSpaceId,
          name: `${spaceToAct.name} (Copy)`,
          favorite: false,
          updatedAt: new Date().toISOString(),
        };

        // Clone pages inside this space
        const spacePages = pages.filter((p) => p.spaceId === spaceId);
        const duplicatedPages = spacePages.map((p) => ({
          ...p,
          id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          spaceId: newSpaceId,
          title: `${p.title} (Copy)`,
          favorite: false,
          updatedAt: new Date().toISOString(),
        }));

        saveSpaces([...spaces, duplicatedSpace]);
        savePages([...pages, ...duplicatedPages]);
        break;
      case "archive":
        const isArchiving = !spaceToAct.archived;
        const updatedSpaceList = spaces.map((s) => {
          if (s.id === spaceId) {
            return { ...s, archived: isArchiving, updatedAt: new Date().toISOString() };
          }
          return s;
        });

        // If archiving a space, archive all pages inside it too
        const updatedPageList = pages.map((p) => {
          if (p.spaceId === spaceId) {
            return { ...p, archived: isArchiving, updatedAt: new Date().toISOString() };
          }
          return p;
        });

        saveSpaces(updatedSpaceList);
        savePages(updatedPageList);
        if (activeSpaceId === spaceId) {
          setView("spaces");
          setActiveSpaceId(null);
        }
        break;
      case "delete":
        if (
          confirm(
            `Are you sure you want to delete the space "${spaceToAct.name}"? This will permanently delete all pages inside it.`
          )
        ) {
          const remSpaces = spaces.filter((s) => s.id !== spaceId);
          const remPages = pages.filter((p) => p.spaceId !== spaceId);
          saveSpaces(remSpaces);
          savePages(remPages);
          if (activeSpaceId === spaceId) {
            setView("spaces");
            setActiveSpaceId(null);
          }
        }
        break;
      default:
        break;
    }
  };

  // Toggle Space Favorite
  const handleSpaceFavorite = (spaceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = spaces.map((s) => {
      if (s.id === spaceId) {
        return { ...s, favorite: !s.favorite, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSpaces(updated);
  };

  // Page Actions handler
  const handlePageAction = (pageId: string, action: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pageToAct = pages.find((p) => p.id === pageId);
    if (!pageToAct) return;

    switch (action) {
      case "rename":
        setPageModalData(pageToAct);
        setPageModalMode("rename");
        setPageModalOpen(true);
        break;
      case "move":
        setPageModalData(pageToAct);
        setPageModalMode("move");
        setPageModalOpen(true);
        break;
      case "duplicate":
        const duplicatedPage: Page = {
          ...pageToAct,
          id: `page-${Date.now()}`,
          title: `${pageToAct.title} (Copy)`,
          favorite: false,
          updatedAt: new Date().toISOString(),
        };
        savePages([...pages, duplicatedPage]);

        // Update containing space updated timestamp
        const updatedS = spaces.map((s) => {
          if (s.id === pageToAct.spaceId) {
            return { ...s, updatedAt: new Date().toISOString() };
          }
          return s;
        });
        saveSpaces(updatedS);
        break;
      case "favorite":
        handlePageFavorite(pageId);
        break;
      case "share":
        // Simple visual share alert
        alert(`Sharing settings opened for page: "${pageToAct.title}". Link generated: https://canvasdesk.studio/shared/page-${pageToAct.id}`);
        break;
      case "export":
        // Export file as simple download
        const fileContent = `Title: ${pageToAct.title}\nTemplate: ${pageToAct.template}\nDescription: ${pageToAct.description}\n\nContent:\n${pageToAct.content || ""}`;
        const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pageToAct.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        break;
      case "archive":
        const isArch = !pageToAct.archived;
        const upPages = pages.map((p) => {
          if (p.id === pageId) {
            return { ...p, archived: isArch, updatedAt: new Date().toISOString() };
          }
          return p;
        });
        savePages(upPages);
        if (activePageId === pageId) {
          setView("space-detail");
          setActivePageId(null);
        }
        break;
      case "delete":
        if (confirm(`Are you sure you want to delete the page "${pageToAct.title}"?`)) {
          const remaining = pages.filter((p) => p.id !== pageId);
          savePages(remaining);
          if (activePageId === pageId) {
            setView("space-detail");
            setActivePageId(null);
          }
        }
        break;
      default:
        break;
    }
  };

  // Toggle Page Favorite
  const handlePageFavorite = (pageId: string) => {
    const updated = pages.map((p) => {
      if (p.id === pageId) {
        return { ...p, favorite: !p.favorite, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    savePages(updated);
  };

  // Save/Update page content details
  const handleUpdatePageContent = (pageId: string, description: string, content: string) => {
    const updated = pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          description,
          content,
          updatedAt: new Date().toISOString(),
          updatedBy: "AM", // Simulated current editor
        };
      }
      return p;
    });
    savePages(updated);

    // Update space updated timestamp too
    const activePg = pages.find((p) => p.id === pageId);
    if (activePg) {
      const upSpaces = spaces.map((s) => {
        if (s.id === activePg.spaceId) {
          return { ...s, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      saveSpaces(upSpaces);
    }
  };

  // Create or update space handler from modal submit
  const handleSaveSpaceModal = (data: { name: string; description: string; color: string }) => {
    if (spaceModalData) {
      // Edit mode
      const updated = spaces.map((s) => {
        if (s.id === spaceModalData.id) {
          return {
            ...s,
            name: data.name,
            description: data.description,
            color: data.color,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      saveSpaces(updated);
    } else {
      // Create mode
      const newSpace: Space = {
        id: `space-${Date.now()}`,
        name: data.name,
        description: data.description,
        color: data.color,
        members: ["AM"], // Created by current user Abhishek
        favorite: false,
        archived: false,
        updatedAt: new Date().toISOString(),
      };
      saveSpaces([...spaces, newSpace]);
    }
  };

  // Create or update/move page handler from modal submit
  const handleSavePageModal = (data: { title: string; spaceId: string; template: string }) => {
    if (pageModalData) {
      // Rename or Move mode
      const updated = pages.map((p) => {
        if (p.id === pageModalData.id) {
          return {
            ...p,
            title: pageModalMode === "rename" ? data.title : p.title,
            spaceId: pageModalMode === "move" ? data.spaceId : p.spaceId,
            updatedAt: new Date().toISOString(),
            updatedBy: "AM",
          };
        }
        return p;
      });
      savePages(updated);

      // Trigger space time update for target space
      const targetSpaceId = pageModalMode === "move" ? data.spaceId : pageModalData.spaceId;
      const upSpaces = spaces.map((s) => {
        if (s.id === targetSpaceId) {
          return { ...s, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      saveSpaces(upSpaces);

      // If page was moved and we were viewing it, sync space view
      if (activePageId === pageModalData.id) {
        setActiveSpaceId(targetSpaceId);
      }
    } else {
      // Create page mode
      const newPage: Page = {
        id: `page-${Date.now()}`,
        spaceId: data.spaceId || activeSpaceId || "",
        title: data.title,
        template: data.template,
        updatedAt: new Date().toISOString(),
        updatedBy: "AM",
        favorite: false,
        archived: false,
        description: `This page stores details for ${data.title}.`,
        commentsCount: 0,
        linkedTasksCount: 0,
        content: `## ${data.title}\n\nTemplate: ${data.template}\n\nStart typing document notes here...`,
      };
      savePages([...pages, newPage]);

      // Update space timestamp
      const upSpaces = spaces.map((s) => {
        if (s.id === (data.spaceId || activeSpaceId)) {
          return { ...s, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      saveSpaces(upSpaces);
    }
  };

  // Reset to initial demo seed state
  const handleResetData = () => {
    if (confirm("Reset layout to default workspace data? This will clear all your custom changes.")) {
      setSpaces(INITIAL_SPACES);
      setPages(INITIAL_PAGES);
      localStorage.setItem("canvasdesk_spaces", JSON.stringify(INITIAL_SPACES));
      localStorage.setItem("canvasdesk_pages", JSON.stringify(INITIAL_PAGES));
      setView("spaces");
      setActiveSpaceId(null);
      setActivePageId(null);
      setSearchQuery("");
      setFilterTab("all");
    }
  };

  // UI state for number of active spaces
  const nonArchivedSpacesCount = useMemo(() => {
    return spaces.filter((s) => !s.archived).length;
  }, [spaces]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50/40">
      {/* 1. VIEW = ALL SPACES */}
      {view === "spaces" && (
        <>
          {/* Header */}
          <header className="flex flex-col gap-4 border-b border-slate-100 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                Workspace Folders
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2.5">
                All Spaces
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-600">
                  {nonArchivedSpacesCount} spaces
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                title="Reset local changes to demo state"
              >
                <RefreshCw className="size-3.5" />
                Reset Demo
              </button>

              <button
                type="button"
                onClick={() => {
                  setPageModalData(null);
                  setPageModalMode("create");
                  setPageModalOpen(true);
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3.5 text-xs font-semibold text-violet-600 hover:bg-violet-100/70 transition"
              >
                <Plus className="size-3.5" />
                New Page
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpaceModalData(null);
                  setSpaceModalOpen(true);
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-bold text-white shadow-md hover:bg-violet-700 active:scale-[0.98] transition-all"
              >
                <FolderPlus className="size-3.5" />
                New Space
              </button>
            </div>
          </header>

          {/* Filters and Search Bar controls */}
          <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 bg-white md:flex-row md:items-center md:justify-between md:px-8">
            {/* Filter tabs */}
            <div className="flex border-b border-slate-100 pb-1 md:border-none md:pb-0 gap-1.5 overflow-x-auto">
              {(["all", "favorites", "recent", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    filterTab === tab
                      ? "bg-violet-50 text-violet-600 border border-violet-100 shadow-[0_1px_2px_rgba(124,58,237,0.04)]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  {tab === "all" && "All Spaces"}
                  {tab === "favorites" && "Favorites"}
                  {tab === "recent" && "Recently Opened"}
                  {tab === "archived" && "Archived"}
                </button>
              ))}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative min-w-[220px] flex-1 md:flex-none">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search spaces or pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white"
                />
              </div>

              {/* Sort selector */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="appearance-none h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-50"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name</option>
                  <option value="pages">Most Pages</option>
                  <option value="favorites">Favorites</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 size-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLayoutView("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition",
                    layoutView === "grid"
                      ? "bg-slate-100 text-slate-700"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutView("list")}
                  className={cn(
                    "p-1.5 rounded-md transition",
                    layoutView === "list"
                      ? "bg-slate-100 text-slate-700"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                  title="List view"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Result summary */}
          {searchResultsCount && (
            <div className="px-5 py-3 bg-violet-50/50 border-b border-slate-100 text-xs text-violet-700 font-semibold md:px-8">
              Found {searchResultsCount.spaces} spaces and {searchResultsCount.pages} pages matching &quot;{searchQuery}&quot;
            </div>
          )}

          {/* Grid/List Spaces display */}
          <div className="flex-1 p-5 md:p-8">
            {filteredSpaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="grid size-12 place-items-center rounded-full bg-violet-50 text-violet-500 mb-4 border border-violet-100">
                  <Folder className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No spaces found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  {searchQuery
                    ? "Try adjusting your search terms or filter constraints."
                    : filterTab === "favorites"
                    ? "Mark spaces as favorites to see them listed here."
                    : filterTab === "archived"
                    ? "You haven't archived any spaces yet."
                    : "Get started by creating your very first space folder to organize documents."}
                </p>
                {!searchQuery && filterTab === "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpaceModalData(null);
                      setSpaceModalOpen(true);
                    }}
                    className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-violet-700 transition"
                  >
                    Create Space Folder
                  </button>
                )}
              </div>
            ) : layoutView === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSpaces.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    pageCount={pageCounts[space.id] || 0}
                    layoutView="grid"
                    onClick={() => {
                      setActiveSpaceId(space.id);
                      setView("space-detail");
                      setSearchQuery(""); // Clear search to see all pages initially
                    }}
                    onFavorite={handleSpaceFavorite}
                    onAction={handleSpaceAction}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col">
                  {filteredSpaces.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      pageCount={pageCounts[space.id] || 0}
                      layoutView="list"
                      onClick={() => {
                        setActiveSpaceId(space.id);
                        setView("space-detail");
                        setSearchQuery("");
                      }}
                      onFavorite={handleSpaceFavorite}
                      onAction={handleSpaceAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. VIEW = SINGLE SPACE DETAILS (SHOWS PAGES ONLY, NO SPACES SHOWING) */}
      {view === "space-detail" && activeSpace && (
        <>
          {/* Breadcrumb Header */}
          <header className="border-b border-slate-100 bg-white px-5 py-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] md:px-8">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <button
                onClick={() => {
                  setView("spaces");
                  setActiveSpaceId(null);
                }}
                className="hover:text-violet-600 transition"
              >
                All Spaces
              </button>
              <span>&gt;</span>
              <span className="font-semibold text-slate-700 truncate max-w-[150px]">{activeSpace.name}</span>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                  {activeSpace.name}
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-600">
                    {pageCounts[activeSpace.id] || 0} Pages
                  </span>
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {activeSpace.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Space level more menu */}
                <div className="relative inline-block text-left">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSpaceAction(activeSpace.id, e.target.value);
                        e.target.value = ""; // reset selection
                      }
                    }}
                    defaultValue=""
                    className="h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-50"
                  >
                    <option value="" disabled>Space Actions...</option>
                    <option value="rename">Rename Space</option>
                    <option value="change-color">Change Color</option>
                    <option value="invite">Invite Collaborators</option>
                    <option value="duplicate">Duplicate Space</option>
                    <option value="archive">Archive Space</option>
                    <option value="delete">Delete Space</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPageModalData(null);
                    setPageModalMode("create");
                    setPageModalOpen(true);
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-bold text-white shadow hover:bg-violet-700 transition active:scale-[0.98]"
                >
                  <FilePlus className="size-3.5" />
                  New Page
                </button>
              </div>
            </div>
          </header>

          {/* Controls Bar for Pages List */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white md:px-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Documents Table
            </h2>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search pages in this space..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white"
              />
            </div>
          </div>

          {/* Pages Table */}
          <div className="flex-1 p-5 md:p-8">
            {filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="grid size-12 place-items-center rounded-full bg-violet-50 text-violet-500 mb-4 border border-violet-100">
                  <FileText className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No pages inside this space</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  {searchQuery
                    ? "No pages match your filter keywords."
                    : "Spaces keep your notes organized. Create a new page document template to get started."}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setPageModalData(null);
                      setPageModalMode("create");
                      setPageModalOpen(true);
                    }}
                    className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-violet-700 transition"
                  >
                    Add Document Page
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                        <th className="pl-4 pr-2 py-3.5 w-10 text-center">Fav</th>
                        <th className="px-3 py-3.5">Page Name</th>
                        <th className="px-3 py-3.5">Template Type</th>
                        <th className="px-3 py-3.5">Last Updated</th>
                        <th className="px-3 py-3.5">Author</th>
                        <th className="pr-4 pl-2 py-3.5 w-12 text-center">More</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPages.map((page) => (
                        <PageRow
                          key={page.id}
                          page={page}
                          onClick={() => {
                            setActivePageId(page.id);
                            setView("page-detail");
                          }}
                          onFavorite={handlePageFavorite}
                          onAction={handlePageAction}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 3. VIEW = PAGE DETAIL VIEW WITH PREVIEW CARD & CANVAS (NO SPACES SHOWING) */}
      {view === "page-detail" && activePage && activeSpace && (
        <PagePreview
          page={activePage}
          space={activeSpace}
          onBack={() => {
            setView("space-detail");
            setActivePageId(null);
          }}
          onFavorite={handlePageFavorite}
          onAction={handlePageAction}
          onUpdateContent={handleUpdatePageContent}
        />
      )}

      {/* 4. MODALS FOR WORKSPACE MANAGEMENT */}

      {/* Space Modal */}
      <SpaceModal
        isOpen={spaceModalOpen}
        onClose={() => {
          setSpaceModalOpen(false);
          setSpaceModalData(null);
        }}
        onSave={handleSaveSpaceModal}
        initialData={spaceModalData}
      />

      {/* Page Modal */}
      <PageModal
        isOpen={pageModalOpen}
        onClose={() => {
          setPageModalOpen(false);
          setPageModalData(null);
        }}
        spaces={spaces}
        onSave={handleSavePageModal}
        initialData={pageModalData}
        mode={pageModalMode}
        currentSpaceId={activeSpaceId || undefined}
      />
    </div>
  );
}
