import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { Container } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { getProperties } from "@/modules/realestate/queries";
import { PropertyGrid, PropertySearch, realestateStrings as rs } from "@/modules/realestate/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 120) ?? "";
const num = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireModulePage(ctx, "realestate");
  return tenantPageMetadata(tc, ctx.lang, {
    title: t(rs.properties, ctx.lang),
    description: `Houses, flats, plots and commercial property for sale and rent — browse verified listings from ${ctx.tenant.name}.`,
    path: "/properties",
  });
}

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const ctx = await getSiteContext();
  requireModulePage(ctx, "realestate");
  const current = {
    purpose: str(sp.purpose).toUpperCase(),
    type: str(sp.type).toUpperCase(),
    city: str(sp.city),
    minPrice: str(sp.minPrice),
    maxPrice: str(sp.maxPrice),
    bedrooms: str(sp.bedrooms),
    q: str(sp.q),
    sort: str(sp.sort),
  };
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const result = await getProperties(ctx.tenant.id, {
    ...current,
    minPrice: num(current.minPrice),
    maxPrice: num(current.maxPrice),
    bedrooms: num(current.bedrooms),
    page,
  });

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-6 max-w-2xl">
        <span className="t-eyebrow">{ctx.tenant.name}</span>
        <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(rs.allListings, ctx.lang)}</h1>
      </header>
      <PropertySearch ctx={ctx} cities={result.facets.cities} current={current} className="mb-8" />
      <PropertyGrid result={result} ctx={ctx} params={current} />
    </Container>
  );
}
