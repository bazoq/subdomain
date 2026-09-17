import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { ServiceForm } from "@/components/admin/shared/service-form";
import { serviceLabels } from "@/components/admin/shared/service-labels";

export default async function NewServicePage() {
  const ctx = await requireTenantAdmin();
  const labels = serviceLabels(ctx.category.key);
  return (
    <>
      <PageHeader title={`New ${labels.singular.toLowerCase()}`} backHref="/admin/services" />
      <ServiceForm urduEnabled={ctx.settings.languages.urduEnabled} entityLabel={labels.singular} showPricing={labels.pricing} />
    </>
  );
}
