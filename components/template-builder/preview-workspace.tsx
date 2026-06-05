"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pin,
  PinOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";
import * as Icons from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type PreviewWorkspaceProps = {
  id: string;
};

export function TemplatePreviewWorkspace({ id }: PreviewWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [appState, setAppState] = useState<any>(null); // Interactive layout configuration
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form input states key-value dictionary: { [formComponentId_fieldName]: value }
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/template-builder/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load template data.");
      }
      const data = await res.json();
      setTemplate(data);
      
      const parsedConfig = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
      setAppState(parsedConfig);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not retrieve the template workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const saveWorkspaceChanges = async (updatedConfig: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/template-builder/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });
      if (res.ok) {
        showSuccessNotification("Workspace progress saved");
      }
    } catch (err) {
      console.error("Failed to auto-save workspace changes:", err);
    } finally {
      setSaving(false);
    }
  };

  const showSuccessNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleToggleSidebar = async () => {
    if (!template) return;
    const newInSidebar = !template.inSidebar;

    try {
      const res = await fetch(`/api/template-builder/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inSidebar: newInSidebar }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update sidebar status");
        return;
      }

      setTemplate((prev: any) => ({ ...prev, inSidebar: newInSidebar }));
      // Notify sidebar
      window.dispatchEvent(new Event("sidebar-updated"));
      showSuccessNotification(newInSidebar ? "Pinned to sidebar" : "Unpinned from sidebar");
    } catch (err) {
      console.error("Failed to toggle sidebar:", err);
    }
  };

  // Toggle checklist item checked state
  const handleToggleChecklist = (sectionId: string, itemId: string) => {
    if (!appState) return;

    const updatedSections = appState.sections.map((section: any) => {
      if (section.id === sectionId) {
        const updatedComponents = section.components.map((comp: any) => {
          if (comp.id === itemId && comp.type === "checklist-item") {
            return { ...comp, checked: !comp.checked };
          }
          return comp;
        });
        return { ...section, components: updatedComponents };
      }
      return section;
    });

    const updatedState = { ...appState, sections: updatedSections };
    
    // Check if we need to auto-update progress bars in this section or in other stats sections!
    const finalState = recalculateProgress(updatedState);
    
    setAppState(finalState);
    saveWorkspaceChanges(finalState);
  };

  // Recalculates any progress-bar component based on checklists progress
  const recalculateProgress = (state: any) => {
    // Find checklist items checked ratio
    let totalChecklistItems = 0;
    let checkedItems = 0;

    state.sections.forEach((sec: any) => {
      if (sec.type === "checklist") {
        sec.components.forEach((comp: any) => {
          if (comp.type === "checklist-item") {
            totalChecklistItems++;
            if (comp.checked) checkedItems++;
          }
        });
      }
    });

    if (totalChecklistItems === 0) return state;

    const completionRate = Math.round((checkedItems / totalChecklistItems) * 100);

    // Update first progress bar we find or stats-cards representing completion rate
    const updatedSections = state.sections.map((sec: any) => {
      const updatedComponents = sec.components.map((comp: any) => {
        if (comp.type === "progress-bar") {
          return { ...comp, value: completionRate };
        }
        if (comp.type === "stat-card" && comp.label.toLowerCase().includes("completion")) {
          return { ...comp, value: `${completionRate}%` };
        }
        return comp;
      });
      return { ...sec, components: updatedComponents };
    });

    return { ...state, sections: updatedSections };
  };

  // Handle Form field inputs
  const handleInputChange = (formId: string, fieldName: string, value: string) => {
    setFormInputs(prev => ({
      ...prev,
      [`${formId}_${fieldName}`]: value
    }));
  };

  // Handle form submissions: add data dynamically into target sections (checklist, table, or list)
  const handleFormSubmit = (e: React.FormEvent, sectionId: string, formWidget: any) => {
    e.preventDefault();
    if (!appState) return;

    const targetId = formWidget.targetSectionId;
    if (!targetId) {
      console.warn("Form does not specify targetSectionId");
      return;
    }

    // Extract input values
    const newEntry: Record<string, string> = {};
    formWidget.fields.forEach((field: any) => {
      const key = `${formWidget.id}_${field.name}`;
      newEntry[field.name] = formInputs[key] || "";
    });

    // Check if the form is empty
    const values = Object.values(newEntry).map(v => v.trim());
    if (values.every(v => v === "")) {
      alert("Please fill in at least one field.");
      return;
    }

    // Modify the target section in appState
    let targetSectionFound = false;
    const updatedSections = appState.sections.map((sec: any) => {
      if (sec.id === targetId) {
        targetSectionFound = true;
        const newId = `item-${crypto.randomUUID()}`;

        if (sec.type === "checklist") {
          const label = newEntry.label || Object.values(newEntry)[0] || "New Task";
          return {
            ...sec,
            components: [
              ...sec.components,
              { type: "checklist-item", id: newId, label, checked: false }
            ]
          };
        } 
        
        if (sec.type === "list") {
          const label = newEntry.label || newEntry.title || Object.values(newEntry)[0] || "New Item";
          const description = newEntry.description || newEntry.details || "";
          const tags = newEntry.tag || newEntry.category ? [newEntry.tag || newEntry.category] : [];
          return {
            ...sec,
            components: [
              ...sec.components,
              { type: "list-item", id: newId, label, description, tags }
            ]
          };
        }

        if (sec.type === "table") {
          // Find table-widget component
          const updatedComponents = sec.components.map((comp: any) => {
            if (comp.type === "table-widget") {
              // Construct row values matching headers
              const rowValues = comp.headers.map((hdr: string) => {
                const headerKey = hdr.toLowerCase().replace(/[^a-z0-9]/g, "");
                
                // Try matching input field names
                for (const k of Object.keys(newEntry)) {
                  const cleanedKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                  if (cleanedKey === headerKey || headerKey.includes(cleanedKey) || cleanedKey.includes(headerKey)) {
                    return newEntry[k];
                  }
                }
                
                // Fallback direct order mapping if header index matches fields
                const fieldIndex = comp.headers.indexOf(hdr);
                const fieldObj = formWidget.fields[fieldIndex];
                if (fieldObj) {
                  return newEntry[fieldObj.name];
                }

                // Default placeholders
                if (hdr.toLowerCase().includes("amount") || hdr.toLowerCase().includes("$")) {
                  return `$${newEntry.amount || "0.00"}`;
                }
                if (hdr.toLowerCase().includes("status")) {
                  return "New";
                }
                return Object.values(newEntry)[fieldIndex] || "-";
              });

              return {
                ...comp,
                rows: [...comp.rows, rowValues]
              };
            }
            return comp;
          });

          return { ...sec, components: updatedComponents };
        }
      }
      return sec;
    });

    if (!targetSectionFound) {
      alert(`Target section with ID "${targetId}" not found in layout.`);
      return;
    }

    // Reset form fields
    const resetInputs = { ...formInputs };
    formWidget.fields.forEach((field: any) => {
      resetInputs[`${formWidget.id}_${field.name}`] = "";
    });
    setFormInputs(resetInputs);

    // Apply and save
    const updatedState = { ...appState, sections: updatedSections };
    const finalState = recalculateProgress(updatedState);
    setAppState(finalState);
    saveWorkspaceChanges(finalState);
    showSuccessNotification("Logged item successfully!");
  };

  const handleActionClick = (actionLabel: string) => {
    alert(`Triggered action: "${actionLabel}"`);
  };

  const renderIcon = (iconName: string, customColor?: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.LayoutTemplate;
    return <IconComponent className="size-4" style={customColor ? { color: customColor } : undefined} />;
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading workspace layout...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !appState) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-red-100 p-3 text-red-600">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Could not load preview</h3>
            <p className="text-xs text-muted-foreground">{errorMsg || "Workspace configuration is invalid."}</p>
          </div>
          <Link href="/template-builder">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Builder
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = appState.color || "#F97316";

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/template-builder">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="size-4" />
              <span>Back to Builder</span>
            </Button>
          </Link>

          {/* Dynamic Pin Indicator / Success Toast */}
          <div className="flex items-center gap-2 self-end">
            {successMsg && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-1 text-[0.72rem] font-semibold animate-in fade-in slide-in-from-right-3 duration-300">
                <Check className="size-3 text-emerald-600" />
                {successMsg}
              </span>
            )}
            {saving && (
              <span className="flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
                <Loader2 className="size-3 animate-spin text-primary" />
                Saving...
              </span>
            )}
            <Button
              variant={template?.inSidebar ? "secondary" : "default"}
              size="sm"
              onClick={handleToggleSidebar}
              className={`gap-1.5 h-8.5 font-semibold text-xs ${
                !template?.inSidebar 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {template?.inSidebar ? (
                <>
                  <PinOff className="size-3.5" />
                  Unpin Sidebar
                </>
              ) : (
                <>
                  <Pin className="size-3.5" />
                  Pin to Sidebar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Generated App Branding Cover */}
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: primaryColor }}></div>
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start gap-5">
            <div 
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md animate-pulse"
              style={{ backgroundColor: primaryColor }}
            >
              {renderIcon(appState.icon)}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{appState.appName}</h1>
                {template?.mocked && (
                  <span className="inline-flex items-center gap-1 bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded text-[0.62rem] font-bold">
                    <Sparkles className="size-2.5" /> Designed by AI
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{appState.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Global actions banner if available */}
        {appState.actions && appState.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {appState.actions.map((act: any) => (
              <Button
                key={act.id}
                size="sm"
                variant={act.actionType === "danger" ? "destructive" : act.actionType === "secondary" ? "outline" : "default"}
                onClick={() => handleActionClick(act.label)}
                className="text-xs h-8 shadow-none"
              >
                {act.label}
              </Button>
            ))}
          </div>
        )}

        {/* Dynamic Interactive Rendered Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {appState.sections.map((section: any) => {
            const hasForm = section.type === "form";
            const isFullWidth = section.type === "table" || section.type === "chart-placeholder" || section.components?.some((c: any) => c.type === "table-widget" || c.type === "chart-widget");
            
            return (
              <Card 
                key={section.id} 
                className={`border-border bg-card shadow-sm ${isFullWidth ? "md:col-span-2" : ""}`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-foreground">{section.title}</CardTitle>
                    {section.actions && section.actions.length > 0 && (
                      <div className="flex gap-1.5">
                        {section.actions.map((act: any) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => handleActionClick(act.label)}
                            className={`text-[0.66rem] font-semibold px-2 py-1 rounded transition-colors ${
                              act.actionType === "danger"
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : act.actionType === "success"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-secondary text-secondary-foreground hover:bg-accent"
                            }`}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  
                  {/* TYPE: STATS */}
                  {section.type === "stats" && (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {section.components.map((comp: any) => {
                        if (comp.type === "stat-card") {
                          return (
                            <div 
                              key={comp.id} 
                              className="rounded-xl border border-border/80 bg-accent/10 p-3.5 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[0.68rem] font-semibold text-muted-foreground uppercase tracking-wider">{comp.label}</p>
                                <p className="text-base font-extrabold text-foreground truncate">{comp.value}</p>
                              </div>
                              <div 
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                                style={{ backgroundColor: comp.color || primaryColor }}
                              >
                                {renderIcon(comp.icon || "Activity")}
                              </div>
                            </div>
                          );
                        }

                        if (comp.type === "progress-bar") {
                          return (
                            <div key={comp.id} className="col-span-full rounded-xl border border-border/80 bg-accent/5 p-4 space-y-2">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">{comp.label}</span>
                                <span style={{ color: comp.color || primaryColor }}>{comp.value}%</span>
                              </div>
                              <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${comp.value}%`, 
                                    backgroundColor: comp.color || primaryColor 
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}

                  {/* TYPE: CHECKLIST */}
                  {section.type === "checklist" && (
                    <div className="space-y-2">
                      {section.components.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No checklist tasks loaded.</p>
                      ) : (
                        section.components.map((comp: any) => {
                          if (comp.type !== "checklist-item") return null;
                          return (
                            <button
                              key={comp.id}
                              type="button"
                              onClick={() => handleToggleChecklist(section.id, comp.id)}
                              className="flex w-full items-center gap-3 rounded-lg border border-border/40 hover:border-primary/20 bg-accent/5 hover:bg-accent/15 px-3.5 py-2.5 text-left text-xs transition"
                            >
                              {comp.checked ? (
                                <CheckCircle2 className="size-4 shrink-0" style={{ color: primaryColor }} />
                              ) : (
                                <Circle className="size-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className={`truncate font-medium ${comp.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {comp.label}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TYPE: LIST */}
                  {section.type === "list" && (
                    <div className="space-y-2.5">
                      {section.components.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No entries yet.</p>
                      ) : (
                        section.components.map((comp: any) => {
                          if (comp.type !== "list-item") return null;
                          return (
                            <div 
                              key={comp.id} 
                              className="rounded-lg border border-border bg-card p-3 space-y-1.5 hover:shadow-xs transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-xs font-bold text-foreground leading-snug">{comp.label}</h4>
                                {comp.tags && comp.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap justify-end">
                                    {comp.tags.map((t: string) => (
                                      <span 
                                        key={t} 
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.58rem] font-semibold"
                                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {comp.description && (
                                <p className="text-[0.72rem] text-muted-foreground leading-normal">{comp.description}</p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TYPE: TABLE */}
                  {section.type === "table" && (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      {section.components.map((comp: any) => {
                        if (comp.type !== "table-widget") return null;
                        return (
                          <table key={comp.id} className="w-full border-collapse text-left text-xs text-foreground">
                            <thead>
                              <tr className="border-b border-border bg-accent/20">
                                {comp.headers.map((hdr: string) => (
                                  <th key={hdr} className="px-4 py-2.5 font-bold uppercase tracking-wider text-muted-foreground text-[0.68rem]">{hdr}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {comp.rows.length === 0 ? (
                                <tr>
                                  <td colSpan={comp.headers.length} className="px-4 py-6 text-center text-xs text-muted-foreground italic">No rows recorded yet.</td>
                                </tr>
                              ) : (
                                comp.rows.map((row: string[], idx: number) => (
                                  <tr key={idx} className="border-b border-border/60 hover:bg-accent/10 transition-colors last:border-b-0">
                                    {row.map((cell: string, cIdx: number) => {
                                      const isStatus = cell.toLowerCase() === "completed" || cell.toLowerCase() === "settled" || cell.toLowerCase() === "yes";
                                      const isAlert = cell.toLowerCase() === "missed" || cell.toLowerCase() === "no" || cell.toLowerCase() === "pending";
                                      
                                      return (
                                        <td key={cIdx} className="px-4 py-3 font-medium">
                                          {isStatus ? (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[0.62rem]">
                                              {cell}
                                            </span>
                                          ) : isAlert ? (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[0.62rem]">
                                              {cell}
                                            </span>
                                          ) : (
                                            cell
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        );
                      })}
                    </div>  
                  )}
                  
                  {/* TYPE: FORM */}
                  {section.type === "form" && (
                    <div>
                      {section.components.map((comp: any) => {
                        if (comp.type !== "form-widget") return null;
                        return (
                          <form 
                            key={comp.id} 
                            onSubmit={(e) => handleFormSubmit(e, section.id, comp)} 
                            className="space-y-3.5"
                          >
                            <div className="grid gap-3 sm:grid-cols-2">
                              {comp.fields.map((field: any) => {
                                const inputKey = `${comp.id}_${field.name}`;
                                const val = formInputs[inputKey] || "";
                                const isSelect = field.type === "select";

                                return (
                                  <div key={field.name} className={`space-y-1 ${comp.fields.length === 1 ? "col-span-full" : ""}`}>
                                    <label className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</label>
                                    
                                    {isSelect ? (
                                      <select
                                        value={val}
                                        onChange={(e) => handleInputChange(comp.id, field.name, e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                                      >
                                        <option value="">-- Choose option --</option>
                                        {field.options?.map((opt: string) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type={field.type === "number" ? "number" : "text"}
                                        placeholder={field.placeholder || ""}
                                        value={val}
                                        onChange={(e) => handleInputChange(comp.id, field.name, e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <Button 
                              type="submit" 
                              size="sm" 
                              className="w-full text-xs font-semibold gap-1.5 h-8.5 text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Plus className="size-4" />
                              <span>{comp.submitButtonLabel || "Add Item"}</span>
                            </Button>
                          </form>
                        );
                      })}
                    </div>
                  )}

                  {/* TYPE: CHART PLACEHOLDER */}
                  {section.type === "chart-placeholder" && (
                    <div className="space-y-4 py-2">
                      {section.components.map((comp: any) => {
                        if (comp.type !== "chart-widget") return null;
                        
                        // Find max data point value to scale heights proportionally
                        const maxVal = Math.max(...comp.dataPoints.map((dp: any) => dp.value), 1);
                        
                        return (
                          <div key={comp.id} className="space-y-4">
                            <div className="text-xs font-semibold text-muted-foreground">{comp.label}</div>
                            
                            {/* Bar Chart Mock Visualization */}
                            {comp.chartType === "bar" ? (
                              <div className="flex items-end gap-4 h-32 border-b border-border/80 pb-2 pt-4 px-2">
                                {comp.dataPoints.map((dp: any, idx: number) => {
                                  const heightPercent = Math.round((dp.value / maxVal) * 100);
                                  return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                      <div className="text-[0.62rem] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: primaryColor }}>
                                        {dp.value}
                                      </div>
                                      <div 
                                        className="w-full rounded-t transition-all duration-500 hover:opacity-90"
                                        style={{ 
                                          height: `${heightPercent * 0.7}%`, // scale down a bit to leave room for labels
                                          backgroundColor: primaryColor 
                                        }}
                                      ></div>
                                      <div className="text-[0.65rem] font-bold text-muted-foreground truncate w-full text-center">
                                        {dp.name}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              // Line Chart Mock (Styled bar layout with overlay connectors or gradient tracks)
                              <div className="space-y-2">
                                {comp.dataPoints.map((dp: any, idx: number) => {
                                  const widthPercent = Math.round((dp.value / maxVal) * 100);
                                  return (
                                    <div key={idx} className="space-y-1">
                                      <div className="flex justify-between text-[0.65rem] font-bold">
                                        <span className="text-muted-foreground">{dp.name}</span>
                                        <span>{dp.value}</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-accent/25 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full rounded-full" 
                                          style={{ 
                                            width: `${widthPercent}%`, 
                                            backgroundColor: primaryColor 
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
