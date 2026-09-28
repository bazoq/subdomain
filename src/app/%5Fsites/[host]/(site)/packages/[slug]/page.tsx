import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { packageJsonLd } from "@/modules/shared/jsonld";
import { Container } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { formatPKR, truncate } from "@/lib/utils";
import { getPackage } from "@/modules/travel/queries";
import { PackageDetail, durationText, travelStrings as ts } from "@/modules/travel/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  requireModulePage(ctx, "travel");
  const pkg = await getPackage(ctx.tenant.id, slug);
  if (!pkg) return {};
  const title = t(pkg.title as LocalizedString, ctx.lang);
  const summary = t(pkg.summary as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim();
  return tenantPageMetadata(tc, ctx.lang, {
    title,
    description: summary ? truncate(summary, 160) : `${title} — ${pkg.destination}, ${durationText(pkg, "en")} from ${formatPKR(pkg.price)}.`,
    path: `/packages/${pkg.slug}`,
    image: pkg.images[0] ?? null,
  });
}

export default async function PackagePage({ params }: { params: Params }) {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  requireModulePage(ctx, "travel");
  const pkg = await getPackage(ctx.tenant.id, slug);
  if (!pkg) notFound();
  const title = t(pkg.title as LocalizedString, ctx.lang);
  return (
    <Container className="py-10 sm:py-14">
      <JsonLd
        data={[
          packageJsonLd(tc, pkg, ctx.lang),
          breadcrumbJsonLd(tc, [
            { name: t(ui.home, ctx.lang), path: "/" },
            { name: t(ts.packages, ctx.lang), path: "/packages" },
            { name: title, path: `/packages/${pkg.slug}` },
          ]),
        ]}
      />
      <PackageDetail pkg={pkg} ctx={ctx} />
    </Container>
  );
}
