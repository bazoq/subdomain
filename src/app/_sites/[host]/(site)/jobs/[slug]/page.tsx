import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { jobPostingJsonLd } from "@/modules/shared/jsonld";
import { Container } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { truncate } from "@/lib/utils";
import { getJob } from "@/modules/recruiting/queries";
import { JobDetail, jobPlace, recruitingStrings as rs } from "@/modules/recruiting/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  requireModulePage(ctx, "recruiting");
  const job = await getJob(ctx.tenant.id, slug);
  if (!job) return {};
  const title = t(job.title as LocalizedString, ctx.lang);
  const desc = t(job.description as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim();
  return tenantPageMetadata(tc, ctx.lang, {
    title,
    description: desc ? truncate(desc, 160) : `${title}${job.company ? ` at ${job.company}` : ""} — ${jobPlace(job)}. Apply online.`,
    path: `/jobs/${job.slug}`,
  });
}

export default async function JobPage({ params }: { params: Params }) {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  requireModulePage(ctx, "recruiting");
  const job = await getJob(ctx.tenant.id, slug);
  if (!job) notFound();
  const title = t(job.title as LocalizedString, ctx.lang);
  return (
    <Container className="py-10 sm:py-14">
      <JsonLd
        data={[
          jobPostingJsonLd(tc, job, ctx.lang),
          breadcrumbJsonLd(tc, [
            { name: t(ui.home, ctx.lang), path: "/" },
            { name: t(rs.jobs, ctx.lang), path: "/jobs" },
            { name: title, path: `/jobs/${job.slug}` },
          ]),
        ]}
      />
      <JobDetail job={job} ctx={ctx} />
    </Container>
  );
}
