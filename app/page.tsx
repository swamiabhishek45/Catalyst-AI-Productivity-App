import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default function Home() {
  return (
    <AppShell activeNav="dashboard">
      <DashboardHome />
    </AppShell>
  );
}
