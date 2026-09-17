import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { PropertyForm } from "@/components/admin/realestate/property-form";
import type { LocalizedString } from "@/lib/i18n";

export default async function NewPropertyPage() {
  const ctx = await requireTenantAdmin();
  const agents = await db.teamMember.findMany({ where: { tenantId: ctx.tenant.id, isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, role: true } });
  return (
    <>
      <PageHeader title="Add listing" backHref="/admin/properties" description="Fill in the property details and photos. It appears on /properties as soon as you save with 'Live' on." />
      <PropertyForm urduEnabled={ctx.settings.languages.urduEnabled} agents={agents.map((a) => ({ id: a.id, name: a.name, role: (a.role as LocalizedString | null)?.en ?? "" }))} />
    </>
  );
}
