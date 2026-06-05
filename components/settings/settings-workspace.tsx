"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  User,
  CreditCard,
  FolderHeart,
  Bot,
  Sliders,
  ShieldCheck,
  Save,
  Trash2,
  Edit2,
  Plus,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Home,
  Briefcase,
  Heart,
  DollarSign,
  CheckSquare,
  BookOpen,
  Lightbulb,
  Bell,
  Phone,
  Target,
  Tag,
  ChevronRight,
  Download,
  Laptop,
  Sun,
  Moon,
  Info,
  ExternalLink
} from "lucide-react";
import * as Icons from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// Types
type Category = {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
};

type UserSettings = {
  theme: string;
  notificationsEnabled: boolean;
  defaultCalendarView: string;
  defaultTaskPriority: string;
  autoSaveEnabled: boolean;
  aiModel: string;
  aiBehavior: string;
  aiTone: string;
  aiFeatures: string; // Comma-separated features
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionRenewal: string | null;
};

// Cozy preselected colors for Categories
const COZY_COLORS = [
  { name: "Sky Blue", value: "#38bdf8" },
  { name: "Mint Green", value: "#34d399" },
  { name: "Lavender", value: "#a78bfa" },
  { name: "Rose Pink", value: "#f43f5e" },
  { name: "Amber Yellow", value: "#fbbf24" },
  { name: "Orange Peel", value: "#f97316" },
  { name: "Deep Violet", value: "#8b5cf6" },
  { name: "Teal Glow", value: "#06b6d4" },
  { name: "Crimson", value: "#ef4444" },
  { name: "Emerald", value: "#10b981" },
];

// Available icons for Categories
const ICON_OPTIONS = [
  { name: "Tag", icon: Tag },
  { name: "Target", icon: Target },
  { name: "Home", icon: Home },
  { name: "Briefcase", icon: Briefcase },
  { name: "Heart", icon: Heart },
  { name: "DollarSign", icon: DollarSign },
  { name: "CheckSquare", icon: CheckSquare },
  { name: "BookOpen", icon: BookOpen },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Bell", icon: Bell },
  { name: "Phone", icon: Phone },
  { name: "Sparkles", icon: Sparkles },
];

// Helper to render Lucide icon dynamically
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name] || Tag;
  return <IconComponent className={className} />;
}

export function SettingsWorkspace() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { openUserProfile } = useClerk();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "categories" | "ai" | "preferences" | "privacy">("profile");

  // Local state for profile details
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    notificationsEnabled: true,
    defaultCalendarView: "month",
    defaultTaskPriority: "medium",
    autoSaveEnabled: true,
    aiModel: "gemini-2.5-flash",
    aiBehavior: "",
    aiTone: "cozy",
    aiFeatures: "refine,assistant,template",
    subscriptionPlan: "Free Tier",
    subscriptionStatus: "active",
    subscriptionRenewal: null,
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Categories state
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Category Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("calendar");
  const [categoryColor, setCategoryColor] = useState("#38bdf8");
  const [categoryIcon, setCategoryIcon] = useState("Tag");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Success Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync Clerk data once loaded
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || "");
      setProfileEmail(user.primaryEmailAddress?.emailAddress || "");
      setProfileAvatar(user.imageUrl || "");
    }
  }, [user]);

  // Load Settings and Categories
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsSettingsLoading(true);
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsSettingsLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategoriesList(data);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    loadSettings();
    loadCategories();
  }, []);

  // Theme Syncing
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.theme]);

  // Save profile details to local database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          imageUrl: profileAvatar,
        }),
      });

      if (res.ok) {
        triggerToast("Profile updated successfully!");
      } else {
        triggerToast("Failed to save profile. Please try again.");
      }
    } catch (error) {
      console.error(error);
      triggerToast("An error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save User Settings
  const handleSaveSettings = async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings); // Optimistic update
    setIsSavingSettings(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        triggerToast("Settings saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      triggerToast("Error saving settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Category Operations
  const handleAddOrEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        // Edit mode
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName,
            type: categoryType,
            color: categoryColor,
            icon: categoryIcon,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setCategoriesList((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          triggerToast("Category updated!");
          resetCategoryForm();
        }
      } else {
        // Add mode
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName,
            type: categoryType,
            color: categoryColor,
            icon: categoryIcon,
          }),
        });

        if (res.ok) {
          const created = await res.json();
          setCategoriesList((prev) => [...prev, created]);
          triggerToast("Category created!");
          resetCategoryForm();
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save category.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategoriesList((prev) => prev.filter((c) => c.id !== id));
        triggerToast("Category deleted.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete category.");
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryType(cat.type);
    setCategoryColor(cat.color);
    setCategoryIcon(cat.icon);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryColor("#38bdf8");
    setCategoryIcon("Tag");
  };

  // Export Data to JSON file
  const handleExportData = () => {
    const dataStr = JSON.stringify(
      {
        profile: {
          name: profileName,
          email: profileEmail,
        },
        settings,
        categories: categoriesList,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `canvasdesk_settings_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    triggerToast("Data settings exported successfully!");
  };

  // Helper for rendering sidebar tags
  const renderTabButton = (tab: typeof activeTab, label: string, Icon: any) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg text-left transition-all",
          isActive
            ? "bg-secondary text-secondary-foreground font-semibold shadow-sm border-l-4 border-primary/70 pl-3"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur px-6 py-5 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="size-6 text-primary" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal profile, categories, workspace, and AI preferences.
          </p>
        </div>

        {/* Global Save Loader */}
        {isSavingSettings && (
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse">
            <Loader2 className="size-3 animate-spin" /> Saving changes...
          </div>
        )}
      </header>

      {/* Main Layout Workspace */}
      <div className="flex flex-col md:flex-row flex-1 max-w-6xl w-full mx-auto p-6 gap-8">
        
        {/* Mobile Navigation Selector */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 border-b border-border">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "subscription", label: "Subscription", icon: CreditCard },
            { id: "categories", label: "Categories", icon: FolderHeart },
            { id: "ai", label: "AI Config", icon: Bot },
            { id: "preferences", label: "Preferences", icon: Sliders },
            { id: "privacy", label: "Data & Privacy", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shrink-0 transition-colors",
                  isSel
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 space-y-1">
          {renderTabButton("profile", "Profile details", User)}
          {renderTabButton("subscription", "Subscription Plan", CreditCard)}
          {renderTabButton("categories", "Custom Categories", FolderHeart)}
          {renderTabButton("ai", "AI Assistant settings", Bot)}
          {renderTabButton("preferences", "App preferences", Sliders)}
          {renderTabButton("privacy", "Data & Security", ShieldCheck)}
        </aside>

        {/* Active View Display */}
        <main className="flex-1 min-w-0">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="size-5 text-primary" /> Profile details
                </CardTitle>
                <CardDescription>
                  Configure your personal information displayed on CanvasDesk.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-6">
                  {/* User Profile display card */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-accent/30 border border-border">
                    <img
                      src={profileAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                      alt="Avatar Preview"
                      className="size-20 rounded-full border-2 border-primary/20 object-cover shadow-inner"
                    />
                    <div className="text-center sm:text-left">
                      <h4 className="font-semibold text-lg">{profileName || "Anonymous User"}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{profileEmail || "No email linked"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs flex items-center gap-1.5 h-8"
                          onClick={() => openUserProfile()}
                        >
                          <ExternalLink className="size-3" /> Account settings (Clerk)
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name-input" className="text-xs font-semibold text-muted-foreground">Full Name</label>
                      <input
                        id="name-input"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email-input" className="text-xs font-semibold text-muted-foreground">Email Address</label>
                      <input
                        id="email-input"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="avatar-input" className="text-xs font-semibold text-muted-foreground">Custom Avatar URL</label>
                      <input
                        id="avatar-input"
                        type="text"
                        value={profileAvatar}
                        onChange={(e) => setProfileAvatar(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border pt-4 flex justify-end">
                  <Button type="submit" disabled={isSavingProfile} className="gap-2">
                    {isSavingProfile ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save profile
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === "subscription" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" /> Plan & billing
                </CardTitle>
                <CardDescription>
                  Review your current usage levels and upgrade options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Highlights */}
                <div className="p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/10 to-transparent relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 size-32 bg-primary/5 rounded-full blur-2xl" />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-primary/15 text-primary rounded-full">
                        Current Tier
                      </span>
                      <h3 className="text-2xl font-bold mt-2 text-foreground flex items-center gap-2">
                        {settings.subscriptionPlan === "Free Tier" ? "Cozy Starter (Free)" : settings.subscriptionPlan}
                        <Sparkles className="size-4.5 text-amber-500 fill-amber-500" />
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <span className="text-emerald-500 font-semibold uppercase">{settings.subscriptionStatus}</span>
                        {settings.subscriptionRenewal && ` • Renews on ${new Date(settings.subscriptionRenewal).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">$0</p>
                      <p className="text-[10px] text-muted-foreground">Forever free tier</p>
                    </div>
                  </div>

                  <div className="border-t border-border/60 my-4 pt-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">Resource usage limits:</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>AI Planning assistant queries</span>
                          <span className="font-semibold text-foreground">35 / 100 queries</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div className="h-full bg-primary/70 rounded-full w-[35%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Spaces / Boards created</span>
                          <span className="font-semibold text-foreground">4 / 10 boards</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div className="h-full bg-primary/70 rounded-full w-[40%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border space-y-2">
                    <h4 className="font-bold text-sm text-foreground">Cozy Creator Pro</h4>
                    <p className="text-xs text-muted-foreground">
                      Unlock unlimited AI template builds, speech-to-text transcriptions, and custom domain shares.
                    </p>
                    <p className="text-lg font-bold text-foreground pt-1">$9 / mo</p>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleSaveSettings({ subscriptionPlan: "Cozy Creator Pro", subscriptionStatus: "active", subscriptionRenewal: new Date(Date.now() + 365*24*60*60*1000).toISOString() })}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl border border-border space-y-2">
                    <h4 className="font-bold text-sm text-foreground">Cozy Studio Team</h4>
                    <p className="text-xs text-muted-foreground">
                      Perfect for collaborators. Liveblocks multiplayer spaces, team directories, and priority STT.
                    </p>
                    <p className="text-lg font-bold text-foreground pt-1">$19 / mo</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleSaveSettings({ subscriptionPlan: "Cozy Studio Team", subscriptionStatus: "active", subscriptionRenewal: new Date(Date.now() + 365*24*60*60*1000).toISOString() })}
                    >
                      Choose Studio Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Info className="size-3.5" /> Billing is processed securely.</span>
                <button
                  onClick={() => handleSaveSettings({ subscriptionPlan: "Free Tier", subscriptionStatus: "active", subscriptionRenewal: null })}
                  className="hover:underline text-muted-foreground"
                >
                  Downgrade / cancel
                </button>
              </CardFooter>
            </Card>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FolderHeart className="size-5 text-primary" /> Category management
                  </CardTitle>
                  <CardDescription>
                    Create and customize categorization tags for Calendar events, Kanban, Notes, and Reminders.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddOrEditCategory} className="p-4 rounded-xl bg-accent/20 border border-border/80 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {editingCategory ? <Edit2 className="size-4" /> : <Plus className="size-4" />}
                      {editingCategory ? "Edit Custom Category" : "Create Custom Category"}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="cat-name" className="text-xs font-semibold text-muted-foreground">Category Name</label>
                        <input
                          id="cat-name"
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="e.g. Health & Fitness"
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="cat-type" className="text-xs font-semibold text-muted-foreground">Application Area</label>
                        <select
                          id="cat-type"
                          value={categoryType}
                          onChange={(e) => setCategoryType(e.target.value)}
                          className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
                        >
                          <option value="calendar">Calendar events</option>
                          <option value="kanban">Tasks / Kanban Board</option>
                          <option value="notes">Notes / Documents</option>
                          <option value="reminders">Reminders / Alerts</option>
                        </select>
                      </div>

                      {/* Color Picker */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground">Accent Color</label>
                        <div className="flex flex-wrap gap-2.5">
                          {COZY_COLORS.map((col) => (
                            <button
                              key={col.value}
                              type="button"
                              onClick={() => setCategoryColor(col.value)}
                              className={cn(
                                "size-7 rounded-full border transition hover:scale-105 active:scale-95 shadow-sm relative flex items-center justify-center",
                                categoryColor === col.value ? "border-foreground ring-2 ring-primary/40" : "border-border"
                              )}
                              style={{ backgroundColor: col.value }}
                              title={col.name}
                            >
                              {categoryColor === col.value && (
                                <Check className="size-3.5 text-white stroke-[3px]" />
                              )}
                            </button>
                          ))}
                          {/* Custom Color Input */}
                          <div className="relative size-7 rounded-full border border-border overflow-hidden">
                            <input
                              type="color"
                              value={categoryColor}
                              onChange={(e) => setCategoryColor(e.target.value)}
                              className="absolute inset-0 size-full cursor-pointer opacity-0"
                            />
                            <div className="size-full" style={{ backgroundColor: categoryColor }} />
                          </div>
                        </div>
                      </div>

                      {/* Icon Picker */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground">Category Icon</label>
                        <div className="flex flex-wrap gap-2">
                          {ICON_OPTIONS.map((item) => {
                            const IconComp = item.icon;
                            const isSel = categoryIcon === item.name;
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => setCategoryIcon(item.name)}
                                className={cn(
                                  "size-9 rounded-lg border border-border flex items-center justify-center transition-all hover:bg-muted active:scale-95",
                                  isSel ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
                                )}
                                title={item.name}
                              >
                                <IconComp className="size-4 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button type="submit" size="sm" disabled={isSavingCategory} className="gap-1.5">
                        {isSavingCategory ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          editingCategory ? <Check className="size-3.5" /> : <Plus className="size-3.5" />
                        )}
                        {editingCategory ? "Update Category" : "Add Category"}
                      </Button>
                      {editingCategory && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetCategoryForm}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              {/* Existing Categories Dashboard */}
              <div className="grid gap-4 sm:grid-cols-2">
                {["calendar", "kanban", "notes", "reminders"].map((appType) => {
                  const items = categoriesList.filter((c) => c.type === appType);
                  return (
                    <Card key={appType} className="border-border shadow-sm">
                      <CardHeader className="py-4 border-b border-border/40">
                        <CardTitle className="text-sm font-bold capitalize flex items-center gap-1.5 text-foreground">
                          {appType === "kanban" ? "Tasks / Kanban" : appType} Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {isCategoriesLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="size-5 animate-spin text-primary" />
                          </div>
                        ) : items.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-3">No categories defined</p>
                        ) : (
                          <div className="space-y-2.5">
                            {items.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-card/40 transition hover:bg-card"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className="size-7 rounded-full flex items-center justify-center text-white"
                                    style={{ backgroundColor: cat.color }}
                                  >
                                    <DynamicIcon name={cat.icon} className="size-3.5 stroke-[2.5px]" />
                                  </div>
                                  <span className="text-sm font-semibold truncate text-foreground">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEditCategory(cat)}
                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Edit category"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Delete category"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI SETTINGS TAB */}
          {activeTab === "ai" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Bot className="size-5 text-primary" /> AI Model Configurator
                </CardTitle>
                <CardDescription>
                  Choose preferred model levels, system instructions, and response tone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Model Choice */}
                  <div className="space-y-1.5">
                    <label htmlFor="ai-model" className="text-xs font-semibold text-muted-foreground">Default AI Engine</label>
                    <select
                      id="ai-model"
                      value={settings.aiModel}
                      onChange={(e) => handleSaveSettings({ aiModel: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended for speed)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep planning & layout coding)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Legacy reasoning)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Lightweight text)</option>
                    </select>
                  </div>

                  {/* Tone Choice */}
                  <div className="space-y-1.5">
                    <label htmlFor="ai-tone" className="text-xs font-semibold text-muted-foreground">Response Style / Tone</label>
                    <select
                      id="ai-tone"
                      value={settings.aiTone}
                      onChange={(e) => handleSaveSettings({ aiTone: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
                    >
                      <option value="cozy">Cozy & Welcoming (Empathetic workspace guidance)</option>
                      <option value="concise">Concise & Direct (Bulleted, summary-focused)</option>
                      <option value="formal">Formal & Technical (Analytical logic flow)</option>
                      <option value="creative">Creative & Adventurous (Ideation brainstorming)</option>
                    </select>
                  </div>

                  {/* Custom Behavior */}
                  <div className="space-y-1.5">
                    <label htmlFor="ai-behavior" className="text-xs font-semibold text-muted-foreground">Default AI Behavior Guidelines</label>
                    <textarea
                      id="ai-behavior"
                      value={settings.aiBehavior}
                      onChange={(e) => setSettings({ ...settings, aiBehavior: e.target.value })}
                      onBlur={(e) => handleSaveSettings({ aiBehavior: e.target.value })}
                      placeholder="Add custom context (e.g., 'Prefer clean summaries. I work as a designer. Format dates as DD/MM.')"
                      className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition resize-y font-sans"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      This instructions block is automatically appended to all template-builder and assistant prompts.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground">Active AI Features:</h4>
                  
                  <div className="space-y-2">
                    {[
                      { id: "refine", label: "AI Refine", desc: "Enable semantic formatting and tone rewriting inside Tiptap notes editor." },
                      { id: "assistant", label: "AI Assistant panel", desc: "Show chat layout assistant inside workspace dashboard sidebar." },
                      { id: "template", label: "AI Template Builder", desc: "Allow generative workspace app building inside layout tools." },
                    ].map((feat) => {
                      const enabledList = settings.aiFeatures.split(",").map((f) => f.trim());
                      const isEnabled = enabledList.includes(feat.id);
                      
                      const handleToggleFeat = () => {
                        let newList = [...enabledList];
                        if (isEnabled) {
                          newList = newList.filter((f) => f !== feat.id);
                        } else {
                          newList.push(feat.id);
                        }
                        handleSaveSettings({ aiFeatures: newList.join(",") });
                      };

                      return (
                        <label
                          key={feat.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={handleToggleFeat}
                            className="mt-1 size-4 rounded accent-primary cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{feat.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{feat.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Sliders className="size-5 text-primary" /> Application preferences
                </CardTitle>
                <CardDescription>
                  Configure defaults, display themes, notifications, and saving details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  {/* Theme Select */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Display Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "light", label: "Light Theme", icon: Sun },
                        { value: "dark", label: "Dark Theme", icon: Moon },
                        { value: "system", label: "System Default", icon: Laptop },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSel = settings.theme === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleSaveSettings({ theme: item.value })}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all hover:bg-muted active:scale-[0.98]",
                              isSel
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border"
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notification Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled}
                      onChange={(e) => handleSaveSettings({ notificationsEnabled: e.target.checked })}
                      className="mt-1 size-4 rounded accent-primary cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Email Notifications & Reminders</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Receive calendar reminders and space update notifications via email.
                      </p>
                    </div>
                  </label>

                  {/* Auto-Save Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={settings.autoSaveEnabled}
                      onChange={(e) => handleSaveSettings({ autoSaveEnabled: e.target.checked })}
                      className="mt-1 size-4 rounded accent-primary cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Auto-Save Editor Content</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Instantly auto-save modifications to notes and whiteboard sketches every few seconds.
                      </p>
                    </div>
                  </label>

                  {/* Default Calendar View */}
                  <div className="space-y-1.5">
                    <label htmlFor="calendar-view" className="text-xs font-semibold text-muted-foreground">Default Calendar Layout</label>
                    <select
                      id="calendar-view"
                      value={settings.defaultCalendarView}
                      onChange={(e) => handleSaveSettings({ defaultCalendarView: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
                    >
                      <option value="month">Month View Grid</option>
                      <option value="week">Week View Columns</option>
                    </select>
                  </div>

                  {/* Default Task Priority */}
                  <div className="space-y-1.5">
                    <label htmlFor="task-priority" className="text-xs font-semibold text-muted-foreground">Default Task Priority</label>
                    <select
                      id="task-priority"
                      value={settings.defaultTaskPriority}
                      onChange={(e) => handleSaveSettings({ defaultTaskPriority: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DATA & PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="size-5 text-primary" /> Data management & safety
                  </CardTitle>
                  <CardDescription>
                    Export backup files, manage privacy configurations, or clean up workspace items.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Export */}
                  <div className="p-4 rounded-xl border border-border bg-accent/10 space-y-3">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Download className="size-4 text-primary" /> Export Local Workspace Details
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Downloads a complete profile backup, settings presets, and categories data file inside a local JSON format.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportData}
                      className="gap-1.5"
                    >
                      <Download className="size-3.5" /> Export as JSON
                    </Button>
                  </div>

                  {/* Privacy Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Privacy Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="mt-0.5 size-4 rounded accent-primary"
                        />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Anonymous Analytics Tracking</p>
                          <p className="text-[10px] text-muted-foreground">
                            Share user interface interactions to assist deep analysis and feature development.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          className="mt-0.5 size-4 rounded accent-primary"
                        />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Make Profile Publicly Discoverable</p>
                          <p className="text-[10px] text-muted-foreground">
                            Allow teammates to look up your dashboard email address to send workspace collaboration shares.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                    <AlertCircle className="size-5" /> Danger zone
                  </CardTitle>
                  <CardDescription className="text-destructive/80">
                    Permanently delete databases records or disable profile access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Deleting your account deletes all boards, comments, settings, template logs, and tiptap documents. This operation is absolute and cannot be undone.
                  </p>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("WARNING: Are you absolutely sure you want to permanently delete your CanvasDesk workspace? This action is irreversible.")) {
                        alert("Account deletion requested. Please contact workspace support for final processing.");
                      }
                    }}
                  >
                    Delete my account
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Cozy notification toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background dark:bg-card dark:text-foreground border border-border/80 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 max-w-sm transition-all duration-300 animate-slide-up">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
