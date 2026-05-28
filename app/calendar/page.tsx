import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { AppShell } from "@/components/dashboard/app-shell";

export default function CalendarPage() {
  return (
    <AppShell activeNav="calendar">
      <CalendarWorkspace />
    </AppShell>
  );
}
