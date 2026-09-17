import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext } from "@/server/site";
import { Container } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { truncate } from "@/lib/utils";
import { getJob } from "@/modules/recruiting/queries";
import { JobDetail, jobPlace } from "@/modules/recruiting/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const job = await getJob(ctx.tenant.id, slug);
  if (!job) return { title: ctx.tenant.name };
  const title = t(job.title as LocalizedString, ctx.lang);
  const desc = t(job.description as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim();
  return {
    title: `${title} · ${ctx.tenant.name}`,
    description: desc ? truncate(desc, 160) : `${title}${job.company ? ` at ${job.company}` : ""} — ${jobPlace(job)}. Apply online.`,
  };
}

export default async function JobPage({ params }: { params: Params }) {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const job = await getJob(ctx.tenant.id, slug);
  if (!job) notFound();
  return (
    <Container className="py-10 sm:py-14">
      <JobDetail job={job} ctx={ctx} />
    </Container>
  );
}
