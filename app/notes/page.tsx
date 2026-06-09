import { AppShell } from "@/components/dashboard/app-shell";
import { NotesWorkspace } from "@/components/notes/notes-workspace";

export default function NotesPage() {
  return (
    <AppShell activeNav="notes">
      <NotesWorkspace />
    </AppShell>
  );
}
