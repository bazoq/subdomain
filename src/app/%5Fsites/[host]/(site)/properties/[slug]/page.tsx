import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { propertyJsonLd } from "@/modules/shared/jsonld";
import { Container } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { truncate } from "@/lib/utils";
import { getProperty } from "@/modules/realestate/queries";
import { PropertyDetail, propertyPrice, realestateStrings as rs, typeLabel } from "@/modules/realestate/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  requireModulePage(ctx, "realestate");
  const p = await getProperty(ctx.tenant.id, slug);
  if (!p) return {};
  const title = t(p.title as LocalizedString, ctx.lang);
  const desc = t(p.description as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim();
  return tenantPageMetadata(tc, ctx.lang, {
    title,
    description: desc ? truncate(desc, 160) : `${typeLabel(p.type, "en")} in ${p.location}, ${p.city} — ${propertyPrice(p, "en")}.`,
    path: `/properties/${p.slug}`,
    image: p.images[0] ?? null,
  });
}

export default async function PropertyPage({ params }: { params: Params }) {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  requireModulePage(ctx, "realestate");
  const p = await getProperty(ctx.tenant.id, slug);
  if (!p) notFound();
  const title = t(p.title as LocalizedString, ctx.lang);
  return (
    <Container className="py-10 sm:py-14">
      <JsonLd
        data={[
          propertyJsonLd(tc, p, ctx.lang),
          breadcrumbJsonLd(tc, [
            { name: t(ui.home, ctx.lang), path: "/" },
            { name: t(rs.properties, ctx.lang), path: "/properties" },
            { name: title, path: `/properties/${p.slug}` },
          ]),
        ]}
      />
      <PropertyDetail property={p} ctx={ctx} />
    </Container>
  );
}
