import { SpacesWorkspace } from "@/components/spaces/spaces-workspace";
import { AppShell } from "@/components/dashboard/app-shell";

export default function SpacesPage() {
  return (
    <AppShell activeNav="spaces">
      <SpacesWorkspace />
    </AppShell>
  );
}
