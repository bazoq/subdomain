import Link from "next/link";
import { FileUser, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { requireModulePage } from "@/modules/shared/module-gate";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ActionButton } from "@/components/admin/action-button";
import { deleteApplication } from "@/modules/recruiting/actions";
import { APPLICATION_STATUSES } from "@/modules/recruiting/constants";
import { formatDate } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireTenantAdmin();
  requireModulePage(ctx, "recruiting");
  const sp = await searchParams;
  const q = str(sp.q);
  const jobId = str(sp.job);
  const status = str(sp.status);
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const take = 25;

  const where: Prisma.ApplicationWhereInput = {
    tenantId: ctx.tenant.id,
    ...(jobId ? { jobId } : {}),
    ...(status && (APPLICATION_STATUSES as readonly string[]).includes(status) ? { status: status as (typeof APPLICATION_STATUSES)[number] } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/[^\d+]/g, "") || q } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total, jobs] = await Promise.all([
    db.application.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (page - 1) * take, include: { job: { select: { id: true, title: true, slug: true } } } }),
    db.application.count({ where }),
    db.job.findMany({ where: { tenantId: ctx.tenant.id }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / take));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (jobId) u.set("job", jobId);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/applications${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Applications" description={`${total} candidate${total === 1 ? "" : "s"} · CVs are private and only downloadable by logged-in staff.`} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Input name="q" defaultValue={q} placeholder="Search name, phone or email…" />
        </div>
        <Select name="job" defaultValue={jobId} className="w-56">
          <option value="">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {(j.title as LocalizedString).en}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={<FileUser />} title="No applications" description={q || jobId || status ? "Nothing matches these filters." : "Applications submitted from your job pages will show up here."} />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Candidate</TH>
                <TH>Job</TH>
                <TH>Experience</TH>
                <TH>Received</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link href={`/admin/applications/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {a.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {a.phone}
                      {a.city ? ` · ${a.city}` : ""}
                    </p>
                  </TD>
                  <TD className="max-w-xs">
                    {a.job ? (
                      <Link href={`/admin/jobs/${a.job.id}`} className="line-clamp-2 hover:underline">
                        {(a.job.title as LocalizedString).en}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Job removed</span>
                    )}
                  </TD>
                  <TD>{a.experience ?? "—"}</TD>
                  <TD className="whitespace-nowrap">{formatDate(a.createdAt, true)}</TD>
                  <TD>
                    <StatusBadge status={a.status} />
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {a.cvMediaId ? (
                        <a href={`/api/media/${a.cvMediaId}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            CV
                          </Button>
                        </a>
                      ) : null}
                      <Link href={`/admin/applications/${a.id}`}>
                        <Button size="sm" variant="ghost">
                          Open
                        </Button>
                      </Link>
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this application?" action={() => deleteApplication(a.id)}>
                        <Trash2 />
                      </ActionButton>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </>
  );
}
