import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, ExternalLink } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageForm } from "@/components/admin/travel/package-form";
import type { PackageFormValue } from "@/modules/travel/schema";
import { isPackageKind, parseDepartures, parseItinerary, parseLocalizedList } from "@/modules/travel/helpers";
import type { LocalizedString } from "@/lib/i18n";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const pkg = await db.travelPackage.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { _count: { select: { bookings: true } } } });
  if (!pkg) notFound();

  const initial: PackageFormValue = {
    title: pkg.title as LocalizedString,
    slug: pkg.slug,
    destination: pkg.destination,
    kind: isPackageKind(pkg.kind) ? pkg.kind : "TOUR",
    days: pkg.days,
    nights: pkg.nights,
    price: pkg.price,
    priceNote: pkg.priceNote ?? "",
    images: pkg.images,
    summary: (pkg.summary as LocalizedString | null) ?? { en: "" },
    itinerary: parseItinerary(pkg.itinerary),
    inclusions: parseLocalizedList(pkg.inclusions),
    exclusions: parseLocalizedList(pkg.exclusions),
    departures: parseDepartures(pkg.departures),
    isFeatured: pkg.isFeatured,
    isActive: pkg.isActive,
  };

  return (
    <>
      <PageHeader
        title={initial.title.en || "Edit package"}
        backHref="/admin/packages"
        description={`${pkg._count.bookings} booking request${pkg._count.bookings === 1 ? "" : "s"}`}
        actions={
          <>
            <Link href={`/admin/bookings?package=${pkg.id}`}>
              <Button variant="outline">
                <CalendarCheck /> Bookings
              </Button>
            </Link>
            <a href={`/packages/${pkg.slug}`} target="_blank" rel="noreferrer">
              <Button variant="ghost">
                <ExternalLink /> View
              </Button>
            </a>
          </>
        }
      />
      <PackageForm id={pkg.id} initial={initial} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
