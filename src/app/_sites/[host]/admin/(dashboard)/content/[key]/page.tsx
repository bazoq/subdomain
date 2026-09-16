import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/server/auth/guards";
import { getTemplateMeta } from "@/templates/registry";
import { loadSections } from "@/server/site-content";
import { PageHeader } from "@/components/ui/card";
import { SectionEditor } from "@/components/admin/section-editor";

export default async function EditSectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const ctx = await requireTenantAdmin();
  const meta = getTemplateMeta(ctx.tenant.templateId);
  const def = meta?.sections.find((s) => s.key === key);
  if (!meta || !def) notFound();
  const state = await loadSections(ctx.tenant.id, meta);
  return (
    <>
      <PageHeader title={def.label} backHref="/admin/content" description="Changes go live on your website as soon as you save." />
      <SectionEditor
        sectionKey={def.key}
        label={def.label}
        description={def.description}
        fields={def.fields}
        initial={state[def.key]?.data ?? (def.defaults as Record<string, unknown>)}
        urduEnabled={ctx.settings.languages.urduEnabled}
      />
    </>
  );
}
