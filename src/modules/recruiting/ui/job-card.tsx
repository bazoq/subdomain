import Link from "next/link";
import { Banknote, Briefcase, CalendarClock, MapPin, Users } from "lucide-react";
import type { Job } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";
import { isJobExpired, isNewJob, jobPlace, jobSalary } from "../helpers";
import { rs } from "../strings";

export function JobCard({ job, ctx, className, compact }: { job: Job; ctx: SiteContext; className?: string; compact?: boolean }) {
  const lang = ctx.lang;
  const title = t(job.title as LocalizedString, lang);
  const salary = jobSalary(job);
  const expired = isJobExpired(job.deadline);
  const fresh = isNewJob(job.createdAt);
  const href = `/jobs/${job.slug}`;

  return (
    <article className={cn("t-card group relative flex flex-col gap-3 p-5 transition hover:shadow-lg", className)}>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
        {job.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-t-accent-fg">{t(ui.featured, lang)}</span> : null}
        {fresh && !expired ? <span className="rounded-full bg-t-primary px-2 py-0.5 text-t-primary-fg">{t(ui.new, lang)}</span> : null}
        <span className="rounded-full bg-t-muted px-2 py-0.5 text-t-muted-fg">{job.type}</span>
        {job.country && job.country !== "Pakistan" ? <span className="rounded-full bg-t-muted px-2 py-0.5 text-t-muted-fg">{job.country}</span> : null}
      </div>
      <div>
        <h3 className="font-heading text-lg font-bold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 hover:text-t-primary">
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-t-muted-fg">
          {job.company ? <span className="font-medium text-t-fg">{job.company}</span> : null}
          {job.company ? " · " : null}
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {jobPlace(job)}
          </span>
        </p>
      </div>
      {!compact ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <Meta icon={<Banknote className="size-4" />} label={t(rs.salary, lang)} value={salary ?? t(rs.salaryNegotiable, lang)} />
          {job.experience ? <Meta icon={<Briefcase className="size-4" />} label={t(rs.experience, lang)} value={job.experience} /> : null}
          {job.vacancies > 1 ? <Meta icon={<Users className="size-4" />} label={t(rs.vacancies, lang)} value={String(job.vacancies)} /> : null}
          {job.deadline ? (
            <Meta
              icon={<CalendarClock className="size-4" />}
              label={expired ? t(rs.closed, lang) : t(rs.deadline, lang)}
              value={expired ? "" : formatDate(job.deadline)}
              muted={expired}
            />
          ) : null}
        </dl>
      ) : null}
      <div className="mt-auto flex items-center justify-between pt-2 text-sm">
        <span className="text-xs text-t-muted-fg">
          {t(rs.posted, lang)} {formatDate(job.createdAt)}
        </span>
        <span className="font-semibold text-t-primary group-hover:underline">{expired ? t(ui.viewDetails, lang) : t(rs.applyNow, lang)} →</span>
      </div>
    </article>
  );
}

function Meta({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex items-start gap-1.5", muted && "text-red-600")}>
      <span className="mt-0.5 shrink-0 text-t-muted-fg" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-t-muted-fg">{label}</dt>
        {value ? <dd className="truncate font-medium">{value}</dd> : null}
      </div>
    </div>
  );
}
