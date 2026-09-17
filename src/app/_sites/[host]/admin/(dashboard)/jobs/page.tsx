import Link from "next/link";
import { Briefcase, Plus, Star } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ActionButton } from "@/components/admin/action-button";
import { toggleJob } from "@/modules/recruiting/actions";
import { isJobExpired, jobPlace } from "@/modules/recruiting/helpers";
import { formatDate } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function JobsAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q);
  const status = str(sp.status); // "" | active | inactive | expired
  const featured = str(sp.featured) === "1";
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const take = 25;
  const today = new Date(new Date().toISOString().slice(0, 10));

  const where: Prisma.JobWhereInput = {
    tenantId: ctx.tenant.id,
    ...(status === "active" ? { isActive: true, OR: [{ deadline: null }, { deadline: { gte: today } }] } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(status === "expired" ? { deadline: { lt: today } } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { title: { path: ["en"], string_contains: q } },
                { slug: { contains: q.toLowerCase() } },
                { company: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
                { department: { contains: q, mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.job.findMany({ where, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], take, skip: (page - 1) * take, include: { _count: { select: { applications: true } } } }),
    db.job.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / take));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (featured) u.set("featured", "1");
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/jobs${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Vacancies shown on your job board. Candidates apply online and land in Applications."
        actions={
          <Link href="/admin/jobs/new">
            <Button>
              <Plus /> Post job
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Input name="q" defaultValue={q} placeholder="Search title, company, city…" />
        </div>
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">All statuses</option>
          <option value="active">Live</option>
          <option value="inactive">Hidden</option>
          <option value="expired">Expired</option>
        </Select>
        <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700">
          <input type="checkbox" name="featured" value="1" defaultChecked={featured} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Featured only
        </label>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={q || status || featured ? "No jobs match these filters" : "No jobs posted yet"}
          description="Post your first vacancy — it goes live on /jobs immediately."
          action={
            <Link href="/admin/jobs/new">
              <Button>
                <Plus /> Post job
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Job</TH>
                <TH>Location</TH>
                <TH>Type</TH>
                <TH>Deadline</TH>
                <TH className="text-center">Applications</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const expired = isJobExpired(r.deadline);
                return (
                  <TR key={r.id}>
                    <TD>
                      <Link href={`/admin/jobs/${r.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                        {r.isFeatured ? <Star className="mr-1 inline size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" /> : null}
                        {(r.title as LocalizedString).en}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {r.company || "Confidential"}
                        {r.department ? ` · ${r.department}` : ""}
                      </p>
                    </TD>
                    <TD>{jobPlace(r)}</TD>
                    <TD>{r.type}</TD>
                    <TD className={expired ? "text-red-600" : undefined}>{r.deadline ? formatDate(r.deadline) : "—"}</TD>
                    <TD className="text-center">
                      <Link href={`/admin/applications?job=${r.id}`} className="font-medium text-brand-600 hover:underline">
                        {r._count.applications}
                      </Link>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Live" : "Hidden"}</Badge>
                        {expired ? <Badge tone="danger">Expired</Badge> : null}
                      </div>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <ActionButton size="sm" variant="ghost" action={() => toggleJob(r.id, "isFeatured", !r.isFeatured)} title={r.isFeatured ? "Unfeature" : "Feature"}>
                          <Star className={r.isFeatured ? "fill-amber-400 text-amber-400" : ""} />
                        </ActionButton>
                        <ActionButton size="sm" variant="ghost" action={() => toggleJob(r.id, "isActive", !r.isActive)}>
                          {r.isActive ? "Hide" : "Publish"}
                        </ActionButton>
                        <Link href={`/admin/jobs/${r.id}`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </>
  );
}
