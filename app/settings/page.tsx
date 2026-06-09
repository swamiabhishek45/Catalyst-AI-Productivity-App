import { AppShell } from "@/components/dashboard/app-shell";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export const metadata = {
  title: "Settings | Catalyst",
  description: "Configure your Catalyst profile, billing, categories, and AI preferences.",
};

export default function SettingsPage() {
  return (
    <AppShell activeNav="settings">
      <SettingsWorkspace />
    </AppShell>
  );
}
