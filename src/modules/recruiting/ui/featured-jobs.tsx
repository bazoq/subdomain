import Link from "next/link";
import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFeaturedJobs } from "../queries";
import { rs } from "../strings";
import { JobCard } from "./job-card";

/** Server section for home pages: featured/latest open jobs. Renders nothing when there are no jobs. */
export async function FeaturedJobs({
  ctx,
  take = 6,
  eyebrow,
  title,
  subtitle,
  className,
  bare,
}: {
  ctx: SiteContext;
  take?: number;
  eyebrow?: string;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  className?: string;
  /** render only the grid (no section wrapper / heading) */
  bare?: boolean;
}) {
  const jobs = await getFeaturedJobs(ctx.tenant.id, take);
  if (jobs.length === 0) return null;
  const grid = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} ctx={ctx} />
      ))}
    </div>
  );
  if (bare) return grid;
  return (
    <section className={cn("py-14 sm:py-20", className)} id="jobs">
      <Container>
        <SectionHeading eyebrow={eyebrow ?? t(rs.jobs, ctx.lang)} title={title ?? rs.featuredJobs} subtitle={subtitle} lang={ctx.lang} />
        {grid}
        <div className="mt-8 text-center">
          <Link href="/jobs" className="t-btn t-btn-outline">
            {t(rs.browseAll, ctx.lang)}
          </Link>
        </div>
      </Container>
    </section>
  );
}
