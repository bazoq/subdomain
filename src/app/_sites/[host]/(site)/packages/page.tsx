import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { Container } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { getDestinations, getPackages } from "@/modules/travel/queries";
import { PackageGrid, PackageSearch, PackageTabs, travelStrings as ts } from "@/modules/travel/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 120) ?? "";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireModulePage(ctx, "travel");
  return tenantPageMetadata(tc, ctx.lang, {
    title: t(ts.packages, ctx.lang),
    description: `Umrah, Hajj, northern-areas tours and international holiday packages from ${ctx.tenant.name}. Book online or on WhatsApp.`,
    path: "/packages",
  });
}

export default async function PackagesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const ctx = await getSiteContext();
  requireModulePage(ctx, "travel");
  const filters = { kind: str(sp.kind).toUpperCase(), destination: str(sp.destination), q: str(sp.q) };
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const [result, destinations] = await Promise.all([getPackages(ctx.tenant.id, { ...filters, page }), getDestinations(ctx.tenant.id)]);

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <span className="t-eyebrow">{ctx.tenant.name}</span>
        <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(ts.ourPackages, ctx.lang)}</h1>
      </header>
      <PackageSearch ctx={ctx} destinations={destinations.map((d) => d.destination)} className="mb-6 max-w-none" />
      <PackageTabs ctx={ctx} current={filters.kind} counts={result.kinds} params={{ destination: filters.destination, q: filters.q }} className="mb-8" />
      <PackageGrid result={result} ctx={ctx} params={filters} />
    </Container>
  );
}
