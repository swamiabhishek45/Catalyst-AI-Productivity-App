"use client";

import { useEffect, useState } from "react";
import { Mail, UserPlus, X, Loader2, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Collaborator {
  email: string;
  name: string;
  imageUrl: string;
  isOwner: boolean;
}

interface CollaborationDialogProps {
  boardId: string;
  boardName: string;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function CollaborationDialog({
  boardId,
  boardName,
  onClose,
  showToast,
}: CollaborationDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch board collaborators
  useEffect(() => {
    async function fetchCollaborators() {
      try {
        const response = await fetch(`/api/boards/${boardId}/shares`);
        if (response.ok) {
          const data = await response.json();
          setCollaborators(data);
        } else {
          setErrorMsg("Failed to load collaborators.");
        }
      } catch (err) {
        console.error("Error fetching shares", err);
        setErrorMsg("Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    }

    fetchCollaborators();
  }, [boardId]);

  // Handle invite submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/boards/${boardId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (response.ok) {
        const newCollaborator = await response.json();
        setCollaborators((prev) => [...prev, newCollaborator]);
        showToast(`Shared board "${boardName}" with ${inviteEmail}.`);
        setInviteEmail("");
      } else {
        const errMsg = await response.text();
        setErrorMsg(errMsg || "Failed to invite collaborator.");
      }
    } catch (err) {
      console.error("Error inviting", err);
      setErrorMsg("Failed to connect to server.");
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-3 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-border bg-card p-5 shadow-2xl sm:p-6">
        
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserPlus className="size-4.5 text-primary" />
              Settings / Collaboration
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage who has access to <span className="font-semibold text-foreground/80">{boardName}</span>.
            </p>
          </div>
          <Button
            aria-label="Close settings"
            size="icon"
            variant="outline"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-5">
          <label className="block text-xs font-semibold text-foreground/75 mb-1.5">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="collaborator@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={sendingInvite}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs outline-none ring-primary/20 transition placeholder:text-muted-foreground focus:border-primary focus:ring-4"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={sendingInvite || !inviteEmail.trim()}
              className="h-9 font-semibold gap-1.5"
            >
              {sendingInvite ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserPlus className="size-3.5" />
              )}
              Invite
            </Button>
          </div>
          {errorMsg && (
            <p className="mt-2 text-xs font-medium text-destructive animate-in fade-in duration-200">
              ⚠️ {errorMsg}
            </p>
          )}
        </form>

        {/* Share List */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-foreground/75 mb-2 flex items-center justify-between">
            <span>Collaborators ({collaborators.length})</span>
            {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          </h3>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {collaborators.map((c) => (
              <div
                key={c.email}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="size-7 rounded-full object-cover ring-2 ring-primary/5"
                    />
                  ) : (
                    <div className="grid size-7 place-items-center rounded-full bg-secondary text-[10px] font-bold text-primary">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {c.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {c.email}
                    </p>
                  </div>
                </div>

                <div>
                  {c.isOwner ? (
                    <span className="flex items-center gap-1 rounded bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[9px] font-bold">
                      <Shield className="size-2.5" />
                      Owner
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[9px] font-semibold border border-emerald-100">
                      <UserCheck className="size-2.5" />
                      Shared
                    </span>
                  )}
                </div>
              </div>
            ))}

            {!loading && collaborators.length === 0 && (
              <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground">No collaborators yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
