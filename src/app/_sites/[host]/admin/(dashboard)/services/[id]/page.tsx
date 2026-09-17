import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ServiceForm } from "@/components/admin/shared/service-form";
import { asLocalized, asLocalizedList } from "@/modules/shared/content-types";
import type { ServiceInput } from "@/modules/shared/services-actions";
import { serviceLabels } from "@/components/admin/shared/service-labels";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const row = await db.service.findFirst({ where: { id, tenantId: ctx.tenant.id } });
  if (!row) notFound();
  const labels = serviceLabels(ctx.category.key);
  const initial: ServiceInput = {
    name: asLocalized(row.name),
    slug: row.slug,
    summary: asLocalized(row.summary),
    description: asLocalized(row.description),
    priceFrom: row.priceFrom ?? "",
    priceNote: row.priceNote ?? "",
    imageUrl: row.imageUrl ?? "",
    icon: row.icon ?? "",
    features: asLocalizedList(row.features),
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
  return (
    <>
      <PageHeader
        title={initial.name.en}
        backHref="/admin/services"
        actions={
          <Link href={`/services/${row.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink /> View on site
          </Link>
        }
      />
      <ServiceForm id={row.id} initial={initial} urduEnabled={ctx.settings.languages.urduEnabled} entityLabel={labels.singular} showPricing={labels.pricing} />
    </>
  );
}
