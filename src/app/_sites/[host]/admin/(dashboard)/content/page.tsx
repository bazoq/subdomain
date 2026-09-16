import { requireTenantAdmin } from "@/server/auth/guards";
import { getTemplateMeta } from "@/templates/registry";
import { loadSections } from "@/server/site-content";
import { PageHeader } from "@/components/ui/card";
import { SectionsList } from "@/components/admin/sections-list";

export default async function ContentPage() {
  const ctx = await requireTenantAdmin();
  const meta = getTemplateMeta(ctx.tenant.templateId);
  if (!meta) return <p>Template not found.</p>;
  const state = await loadSections(ctx.tenant.id, meta);
  const rows = meta.sections
    .map((s) => ({
      key: s.key,
      label: s.label,
      description: s.description,
      enabled: state[s.key]?.enabled ?? true,
      canDisable: s.canDisable !== false,
      sortOrder: state[s.key]?.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <PageHeader
        title="Page sections"
        description={`Your website uses the "${meta.name}" template. Turn sections on or off, reorder them, and edit their content.`}
      />
      <SectionsList rows={rows} />
    </>
  );
}
