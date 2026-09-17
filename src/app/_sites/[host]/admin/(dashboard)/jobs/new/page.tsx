import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { JobForm } from "@/components/admin/recruiting/job-form";

export default async function NewJobPage() {
  const ctx = await requireTenantAdmin();
  return (
    <>
      <PageHeader title="Post a job" backHref="/admin/jobs" description="Fill in the vacancy details. It appears on /jobs as soon as you save with 'Live' on." />
      <JobForm urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
