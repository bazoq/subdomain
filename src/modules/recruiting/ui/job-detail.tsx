import Link from "next/link";
import { ArrowLeft, Banknote, Briefcase, Building2, CalendarClock, Globe, MapPin, Share2, Users } from "lucide-react";
import type { Job } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatDate, whatsappLink } from "@/lib/utils";
import { isJobExpired, jobPlace, jobSalary } from "../helpers";
import { rs } from "../strings";
import { ApplyForm } from "./apply-form";

export function JobDetail({ job, ctx, className }: { job: Job; ctx: SiteContext; className?: string }) {
  const lang = ctx.lang;
  const title = t(job.title as LocalizedString, lang);
  const description = job.description as LocalizedString;
  const requirements = job.requirements as LocalizedString;
  const expired = isJobExpired(job.deadline);
  const salary = jobSalary(job);
  const url = `https://${ctx.host}/jobs/${job.slug}`;
  const shareText = `${title}${job.company ? ` at ${job.company}` : ""} — ${jobPlace(job)}\n${url}`;
  const waNumber = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;

  return (
    <div className={cn("grid gap-8 lg:grid-cols-[1fr_340px]", className)}>
      <div className="min-w-0">
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-t-muted-fg hover:text-t-primary">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t(rs.backToJobs, lang)}
        </Link>
        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
            {job.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-t-accent-fg">{t(ui.featured, lang)}</span> : null}
            <span className="rounded-full bg-t-muted px-2 py-0.5 text-t-muted-fg">{job.type}</span>
            {expired ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">{t(rs.closed, lang)}</span> : null}
          </div>
          <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-t-muted-fg">
            {job.company ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" aria-hidden="true" />
                {job.company}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {jobPlace(job)}
            </span>
            <span className="text-sm">
              {t(rs.posted, lang)} {formatDate(job.createdAt)}
            </span>
          </p>
        </header>

        {t(description, lang) ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(rs.description, lang)}</h2>
            <RichText value={description} lang={lang} className="mt-3" />
          </section>
        ) : null}
        {t(requirements, lang) ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(rs.requirements, lang)}</h2>
            <RichText value={requirements} lang={lang} className="mt-3" />
          </section>
        ) : null}

        <section id="apply" className="t-card mt-10 scroll-mt-24 p-5 sm:p-8">
          <h2 className="font-heading text-2xl font-bold">{t(rs.applyForJob, lang)}</h2>
          {expired ? (
            <p className="mt-3 rounded-[var(--t-radius)] bg-red-50 px-4 py-3 text-sm text-red-700">{t(rs.closed, lang)}</p>
          ) : (
            <ApplyForm jobId={job.id} ctx={ctx} className="mt-5" />
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="t-card p-5">
          <dl className="space-y-3 text-sm">
            <Fact icon={<Banknote className="size-4" />} label={t(rs.salary, lang)} value={salary ?? t(rs.salaryNegotiable, lang)} />
            <Fact icon={<Briefcase className="size-4" />} label={t(rs.experience, lang)} value={job.experience || "—"} />
            <Fact icon={<Users className="size-4" />} label={t(rs.vacancies, lang)} value={String(job.vacancies)} />
            <Fact icon={<Globe className="size-4" />} label={t(rs.country, lang)} value={job.country} />
            {job.department ? <Fact icon={<Building2 className="size-4" />} label={t(rs.department, lang)} value={job.department} /> : null}
            <Fact
              icon={<CalendarClock className="size-4" />}
              label={t(rs.deadline, lang)}
              value={job.deadline ? formatDate(job.deadline) : "—"}
              tone={expired ? "danger" : undefined}
            />
          </dl>
          {!expired ? (
            <a href="#apply" className="t-btn t-btn-primary mt-5 w-full">
              {t(rs.applyNow, lang)}
            </a>
          ) : null}
        </div>
        <div className="t-card flex flex-col gap-2 p-5">
          <a href={whatsappLink("", shareText)} target="_blank" rel="noreferrer" className="t-btn t-btn-outline w-full text-sm">
            <Share2 className="size-4" aria-hidden="true" />
            {t(rs.shareWhatsApp, lang)}
          </a>
          {waNumber ? (
            <a href={whatsappLink(waNumber, `Assalam o Alaikum, I want to ask about the job "${title}" (${url})`)} target="_blank" rel="noreferrer" className="t-btn t-btn-ghost w-full text-sm">
              {t(rs.askWhatsApp, lang)}
            </a>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Fact({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "danger" }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-t-primary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-t-muted-fg">{label}</dt>
        <dd className={cn("font-medium", tone === "danger" && "text-red-600")}>{value}</dd>
      </div>
    </div>
  );
}
