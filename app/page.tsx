
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  return (
    <AppShell activeNav="dashboard">
      <DashboardHome />
      <Analytics />
    </AppShell>
  );
}
