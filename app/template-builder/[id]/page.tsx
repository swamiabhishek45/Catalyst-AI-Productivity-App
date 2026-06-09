import { AppShell } from "@/components/dashboard/app-shell";
import { TemplatePreviewWorkspace } from "@/components/template-builder/preview-workspace";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplatePreviewPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AppShell activeNav={`app-${id}`}>
      <TemplatePreviewWorkspace id={id} />
    </AppShell>
  );
}
