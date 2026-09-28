import { requireTenantAdmin } from "@/server/auth/guards";
import { requireModulePage } from "@/modules/shared/module-gate";
import { PageHeader } from "@/components/ui/card";
import { PackageForm } from "@/components/admin/travel/package-form";

export default async function NewPackagePage() {
  const ctx = await requireTenantAdmin();
  requireModulePage(ctx, "travel");
  return (
    <>
      <PageHeader title="New package" backHref="/admin/packages" description="Add the itinerary, inclusions and departure dates. It appears on /packages as soon as you save with 'Live' on." />
      <PackageForm urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
