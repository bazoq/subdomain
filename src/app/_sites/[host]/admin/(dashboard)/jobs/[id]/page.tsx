import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileUser } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { requireModulePage } from "@/modules/shared/module-gate";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/admin/recruiting/job-form";
import type { JobFormValue } from "@/modules/recruiting/schema";
import type { LocalizedString } from "@/lib/i18n";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  requireModulePage(ctx, "recruiting");
  const job = await db.job.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { _count: { select: { applications: true } } } });
  if (!job) notFound();

  const initial: JobFormValue = {
    title: job.title as LocalizedString,
    slug: job.slug,
    company: job.company ?? "",
    department: job.department ?? "",
    location: job.location,
    country: job.country,
    type: job.type,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryText: job.salaryText ?? "",
    experience: job.experience ?? "",
    description: (job.description as LocalizedString | null) ?? { en: "" },
    requirements: (job.requirements as LocalizedString | null) ?? { en: "" },
    vacancies: job.vacancies,
    deadline: job.deadline ? job.deadline.toISOString().slice(0, 10) : "",
    isFeatured: job.isFeatured,
    isActive: job.isActive,
  };

  return (
    <>
      <PageHeader
        title={initial.title.en || "Edit job"}
        backHref="/admin/jobs"
        description={`${job._count.applications} application${job._count.applications === 1 ? "" : "s"} received`}
        actions={
          <>
            <Link href={`/admin/applications?job=${job.id}`}>
              <Button variant="outline">
                <FileUser /> Applications
              </Button>
            </Link>
            <a href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer">
              <Button variant="ghost">
                <ExternalLink /> View
              </Button>
            </a>
          </>
        }
      />
      <JobForm id={job.id} initial={initial} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
