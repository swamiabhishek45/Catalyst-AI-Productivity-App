import { WhiteboardWorkspace } from "@/components/whiteboard/whiteboard-workspace";
import { AppShell } from "@/components/dashboard/app-shell";

export default function WhiteboardPage() {
  return (
    <AppShell activeNav="whiteboard">
      <WhiteboardWorkspace />
    </AppShell>
  );
}
