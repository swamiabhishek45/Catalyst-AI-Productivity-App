import { KanbanWorkspace } from "@/components/kanban/kanban-workspace";
import { AppShell } from "@/components/dashboard/app-shell";

export default function KanbanPage() {
  return (
    <AppShell activeNav="kanban">
      <KanbanWorkspace />
    </AppShell>
  );
}
