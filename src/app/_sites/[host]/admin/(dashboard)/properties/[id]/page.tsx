import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Inbox } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyForm } from "@/components/admin/realestate/property-form";
import type { PropertyFormValue } from "@/modules/realestate/schema";
import { isAreaUnit, isPropertyType, isPurpose } from "@/modules/realestate/helpers";
import type { LocalizedString } from "@/lib/i18n";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const [p, agents, inquiries] = await Promise.all([
    db.property.findFirst({ where: { id, tenantId: ctx.tenant.id } }),
    db.teamMember.findMany({ where: { tenantId: ctx.tenant.id, isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, role: true } }),
    db.lead.count({ where: { tenantId: ctx.tenant.id, formKey: "property_inquiry", data: { path: ["propertyId"], equals: id } } }),
  ]);
  if (!p) notFound();

  const initial: PropertyFormValue = {
    title: p.title as LocalizedString,
    slug: p.slug,
    purpose: isPurpose(p.purpose) ? p.purpose : "SALE",
    type: isPropertyType(p.type) ? p.type : "HOUSE",
    price: p.price,
    priceUnit: p.priceUnit === "MONTHLY" ? "MONTHLY" : "TOTAL",
    areaValue: p.areaValue,
    areaUnit: isAreaUnit(p.areaUnit) ? p.areaUnit : "MARLA",
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    city: p.city,
    location: p.location,
    description: (p.description as LocalizedString | null) ?? { en: "" },
    features: p.features,
    images: p.images,
    videoUrl: p.videoUrl ?? "",
    mapUrl: p.mapUrl ?? "",
    agentId: p.agentId ?? "",
    isFeatured: p.isFeatured,
    isActive: p.isActive,
  };

  return (
    <>
      <PageHeader
        title={initial.title.en || "Edit listing"}
        backHref="/admin/properties"
        description={`${inquiries} inquir${inquiries === 1 ? "y" : "ies"} received`}
        actions={
          <>
            <Link href="/admin/leads?formKey=property_inquiry">
              <Button variant="outline">
                <Inbox /> Inquiries
              </Button>
            </Link>
            <a href={`/properties/${p.slug}`} target="_blank" rel="noreferrer">
              <Button variant="ghost">
                <ExternalLink /> View
              </Button>
            </a>
          </>
        }
      />
      <PropertyForm id={p.id} initial={initial} urduEnabled={ctx.settings.languages.urduEnabled} agents={agents.map((a) => ({ id: a.id, name: a.name, role: (a.role as LocalizedString | null)?.en ?? "" }))} />
    </>
  );
}
