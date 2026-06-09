"use client";

import { useOthers, useSelf } from "@liveblocks/react";
import { cn } from "@/lib/utils";

interface ActiveCollaboratorsProps {
  className?: string;
}

export function ActiveCollaborators({ className }: ActiveCollaboratorsProps) {
  const others = useOthers();
  const self = useSelf();

  const totalCollaborators = others.length + (self ? 1 : 0);

  if (totalCollaborators === 0) {
    return null;
  }

  // Limit avatars displayed to avoid overflow
  const maxAvatars = 4;
  const displayOthers = others.slice(0, maxAvatars - 1);
  const remainingCount = Math.max(0, others.length - displayOthers.length);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Presence stack */}
      <div className="flex -space-x-2.5 overflow-hidden">
        {/* Render Self First */}
        {self && (
          <div
            className="group relative z-20 transition-transform duration-200 hover:-translate-y-1 hover:z-30 cursor-default"
            key="self"
          >
            {self.info?.avatar ? (
              <img
                src={self.info.avatar as string}
                alt={`${self.info.name} (You)`}
                className="size-7.5 rounded-full object-cover border-2 bg-card"
                style={{ borderColor: (self.info.color as string) || "hsl(214 82% 54%)" }}
              />
            ) : (
              <div
                className="grid size-7.5 place-items-center rounded-full border-2 text-[10px] font-bold text-foreground bg-accent/60"
                style={{ borderColor: (self.info?.color as string) || "hsl(214 82% 54%)" }}
              >
                {(self.info?.name as string || "ME").substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Glowing online dot */}
            <span
              className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background animate-pulse"
              style={{ backgroundColor: (self.info?.color as string) || "hsl(214 82% 54%)" }}
            />

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 z-50">
              <div className="rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-md whitespace-nowrap text-center leading-normal">
                <p>{self.info?.name} (You)</p>
                <p className="text-[8px] text-slate-300 font-normal">{(self.info as any)?.email}</p>
              </div>
              <div className="mx-auto size-1.5 -translate-y-1 rotate-45 bg-slate-900" />
            </div>
          </div>
        )}

        {/* Render Others */}
        {displayOthers.map(({ connectionId, info }) => {
          const name = (info?.name as string) || "Collaborator";
          const avatar = info?.avatar as string;
          const color = (info?.color as string) || "hsl(166 57% 92%)";
          const email = (info as any)?.email || "";

          return (
            <div
              className="group relative z-10 transition-transform duration-200 hover:-translate-y-1 hover:z-30 cursor-default"
              key={connectionId}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="size-7.5 rounded-full object-cover border-2 bg-card"
                  style={{ borderColor: color }}
                />
              ) : (
                <div
                  className="grid size-7.5 place-items-center rounded-full border-2 text-[10px] font-bold text-foreground bg-accent/60"
                  style={{ borderColor: color }}
                >
                  {name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Glowing active dot */}
              <span
                className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background animate-pulse"
                style={{ backgroundColor: color }}
              />

              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 z-50">
                <div className="rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-md whitespace-nowrap text-center leading-normal">
                  <p>{name}</p>
                  {email && <p className="text-[8px] text-slate-300 font-normal">{email}</p>}
                </div>
                <div className="mx-auto size-1.5 -translate-y-1 rotate-45 bg-slate-900" />
              </div>
            </div>
          );
        })}

        {/* Remaining Count Circle */}
        {remainingCount > 0 && (
          <div className="relative z-0 grid size-7.5 place-items-center rounded-full border-2 border-border bg-slate-200 text-[10px] font-bold text-muted-foreground select-none">
            +{remainingCount}
          </div>
        )}
      </div>

      <span className="hidden sm:inline text-[10px] font-semibold text-muted-foreground">
        {others.length === 0 ? "Only you active" : `${totalCollaborators} online`}
      </span>
    </div>
  );
}
