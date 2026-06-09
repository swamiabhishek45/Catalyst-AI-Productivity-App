import { AppShell } from "@/components/dashboard/app-shell";
import { TemplateBuilderDashboard } from "@/components/template-builder/dashboard";

export default function TemplateBuilderPage() {
  return (
    <AppShell activeNav="template-builder">
      <TemplateBuilderDashboard />
    </AppShell>
  );
}
