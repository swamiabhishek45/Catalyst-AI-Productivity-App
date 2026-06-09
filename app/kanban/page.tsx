import { KanbanWorkspace } from "@/components/kanban/kanban-workspace";
import { AppShell } from "@/components/dashboard/app-shell";
import { LiveblocksAppProvider } from "@/components/kanban/liveblocks-provider";

export default function KanbanPage() {
  return (
    <LiveblocksAppProvider>
      <AppShell activeNav="kanban">
        <KanbanWorkspace />
      </AppShell>
    </LiveblocksAppProvider>
  );
}

