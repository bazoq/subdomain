import { requireSuperPage } from "@/server/super/access";
import { PageHeader } from "@/components/ui/card";
import { TenantForm, type TemplateOption } from "@/components/admin/super/tenant-form";
import { TEMPLATES } from "@/templates/registry";
import { ROOT_DOMAIN } from "@/config/site";

export const metadata = { title: "New website" };

export default async function NewTenantPage() {
  await requireSuperPage(["SUPERADMIN"]);
  const templates: TemplateOption[] = TEMPLATES.map((t) => ({ id: t.id, code: t.code, category: t.category, name: t.name, tagline: t.tagline, style: t.style, sectionCount: t.sections.length }));
  return (
    <>
      <PageHeader title="New website" description="Provision a customer website: template, hostnames and the owner's login." backHref="/super/tenants" />
      <TenantForm templates={templates} rootDomain={ROOT_DOMAIN} />
    </>
  );
}
