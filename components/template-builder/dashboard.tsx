"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  ArrowRight,
  Pin,
  PinOff,
  AlertCircle,
  FolderPlus,
  Compass,
} from "lucide-react";
import * as Icons from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Template = {
  id: string;
  appName: string;
  description: string;
  icon: string;
  color: string;
  inSidebar: boolean;
  createdAt: string;
};

const SUGGESTIONS = [
  { label: "Daily Habit Tracker", prompt: "A cozy daily habit tracker with streaks, water intake checklist, and weekly history table." },
  { label: "Monthly Budget Companion", prompt: "A personal finance budget tracker with balance stats, log transaction form, recent expense table, and bar chart placeholder." },
  { label: "Cozy Meal Planner", prompt: "A weekly meal scheduler with ingredients shopping list, nutrition target progress bar, and add grocery form." },
  { label: "Student Study Hub", prompt: "A study planner for assignments, revision checklist, study streak stats card, and add subject form." }
];

export function TemplateBuilderDashboard() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/template-builder");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    
    // Listen for sidebar updates to keep pin states in sync
    const handleSidebarUpdated = () => {
      fetchTemplates();
    };
    window.addEventListener("sidebar-updated", handleSidebarUpdated);
    return () => {
      window.removeEventListener("sidebar-updated", handleSidebarUpdated);
    };
  }, []);

  const handleSuggestClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setWarningMessage("");

    try {
      const res = await fetch("/api/template-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate template");
      }

      const data = await res.json();
      setPrompt("");
      fetchTemplates();
      
      // Dispatch sidebar update event just in case
      window.dispatchEvent(new Event("sidebar-updated"));
      
      // Redirect to the newly created preview page
      window.location.href = `/template-builder/${data.id}`;
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong during generation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this app?")) return;

    try {
      const res = await fetch(`/api/template-builder/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        // Update sidebar
        window.dispatchEvent(new Event("sidebar-updated"));
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const handleToggleSidebar = async (template: Template) => {
    setWarningMessage("");
    const newInSidebar = !template.inSidebar;

    try {
      const res = await fetch(`/api/template-builder/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inSidebar: newInSidebar }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error) {
          setWarningMessage(data.error);
          // Auto clear warning after 5 seconds
          setTimeout(() => setWarningMessage(""), 5000);
        } else {
          setErrorMessage("Failed to update sidebar status");
        }
        return;
      }

      fetchTemplates();
      // Update sidebar
      window.dispatchEvent(new Event("sidebar-updated"));
    } catch (err) {
      console.error("Failed to toggle sidebar:", err);
    }
  };

  const getLucideIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.LayoutTemplate;
    return <IconComponent className="size-5" />;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
      {/* Header */}
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600 shadow-[inset_0_0_0_1px_rgba(217,70,239,0.15)]">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Template Builder</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Describe your productivity workflow or application idea below. Catalyst AI will design and render a custom single-page tracker, logger, or planner widget tailored precisely to your needs.
          </p>
        </div>

        {/* Warning Banner */}
        {warningMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="size-4 shrink-0 text-amber-600" />
            <span className="font-medium">{warningMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Generation Input Card */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">What would you like to build?</CardTitle>
            <CardDescription className="text-xs">Provide a clear description of the tracking blocks, columns, or checklist entries you want.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="e.g. A plant watering scheduler with last watered dates and a checklist of fertilizer routines..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
              <Button 
                type="submit" 
                disabled={loading || !prompt.trim()} 
                className="gap-2 shrink-0 bg-fuchsia-600 hover:bg-fuchsia-700 text-white h-9.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate App
                  </>
                )}
              </Button>
            </form>

            {/* Suggestions */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                <Compass className="size-3.5" />
                <span>Need Inspiration?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSuggestClick(s.prompt)}
                    disabled={loading}
                    className="rounded-full border border-border bg-accent/30 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition text-left"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Overlay State */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card/60 p-12 text-center backdrop-blur shadow-sm">
            <div className="relative flex size-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-fuchsia-100 animate-pulse"></div>
              <Loader2 className="size-6 text-fuchsia-600 animate-spin" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-semibold text-foreground">AI is designing your app layout</h3>
              <p className="text-xs text-muted-foreground">
                Generating layout sections, mapping input forms, constructing sample database logs, and painting color schemes...
              </p>
            </div>
          </div>
        )}

        {/* Created Apps Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                <FolderPlus className="size-3.5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Created Applications</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium bg-accent px-2 py-0.5 rounded-full">
              {templates.length} {templates.length === 1 ? 'app' : 'apps'}
            </span>
          </div>

          {templates.length === 0 ? (
            !loading && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <Compass className="size-6" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-semibold text-foreground">No apps created yet</p>
                  <p className="text-xs text-muted-foreground">
                    Describe your custom workflow above to generate your very first single-page application.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <Card 
                  key={tpl.id} 
                  className="group overflow-hidden border-border bg-card shadow-sm hover:border-primary/20 hover:shadow transition-all duration-300"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: tpl.color }}></div>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div 
                        className="flex size-9 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: tpl.color }}
                      >
                        {getLucideIcon(tpl.icon)}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleSidebar(tpl)}
                          className="size-7 text-muted-foreground hover:text-primary rounded-md"
                          title={tpl.inSidebar ? "Unpin from sidebar" : "Pin to sidebar"}
                        >
                          {tpl.inSidebar ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tpl.id)}
                          className="size-7 text-muted-foreground hover:text-destructive rounded-md"
                          title="Delete template"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-3 text-sm font-bold truncate text-foreground">{tpl.appName}</CardTitle>
                    <CardDescription className="line-clamp-2 text-[0.78rem] leading-relaxed mt-1 text-muted-foreground/90 h-[2.5rem]">
                      {tpl.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 py-2">
                    <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3 text-[0.72rem] text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium text-foreground">
                          {new Date(tpl.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Sidebar status:</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.62rem] font-semibold ${tpl.inSidebar ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {tpl.inSidebar ? 'Pinned' : 'Not Pinned'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-3">
                    <div className="flex w-full gap-2">
                      <Link href={`/template-builder/${tpl.id}`} className="flex-1">
                        <Button variant="outline" className="w-full text-xs font-semibold h-8.5 gap-1 shadow-none hover:bg-accent/40 border-border hover:text-foreground">
                          <span>Open Preview</span>
                          <ArrowRight className="size-3" />
                        </Button>
                      </Link>
                      <Button
                        variant={tpl.inSidebar ? "secondary" : "default"}
                        onClick={() => handleToggleSidebar(tpl)}
                        className={`text-xs font-semibold h-8.5 px-3 shadow-none ${
                          !tpl.inSidebar 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                        }`}
                      >
                        {tpl.inSidebar ? "Unpin" : "Pin Sidebar"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
