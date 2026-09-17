import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { PageForm } from "@/components/admin/shared/page-form";

export default async function NewSitePage() {
  const ctx = await requireTenantAdmin();
  return (
    <>
      <PageHeader title="New page" backHref="/admin/pages" />
      <PageForm urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
