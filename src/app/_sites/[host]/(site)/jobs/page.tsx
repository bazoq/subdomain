import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { Container } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { getJobs } from "@/modules/recruiting/queries";
import { JobFilters, JobList, CategoriesStrip, recruitingStrings as rs } from "@/modules/recruiting/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 120) ?? "";
}

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return {
    title: `${t(rs.jobs, ctx.lang)} · ${ctx.tenant.name}`,
    description: `Current job openings in Pakistan and overseas from ${ctx.tenant.name}. Apply online with your CV.`,
  };
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const ctx = await getSiteContext();
  const filters = { q: str(sp.q), location: str(sp.location), type: str(sp.type), country: str(sp.country), department: str(sp.department) };
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const result = await getJobs(ctx.tenant.id, { ...filters, page });

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <span className="t-eyebrow">{ctx.tenant.name}</span>
        <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(rs.latestJobs, ctx.lang)}</h1>
      </header>
      <CategoriesStrip ctx={ctx} className="mb-6" showTitle={false} />
      <JobFilters ctx={ctx} facets={result.facets} current={filters} className="mb-8" />
      <JobList result={result} ctx={ctx} params={filters} />
    </Container>
  );
}
