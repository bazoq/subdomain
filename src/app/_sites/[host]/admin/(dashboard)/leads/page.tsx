import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { LeadStatusSelect, LEAD_STATUSES } from "@/modules/leads/ui/lead-status-form";
import { humanize } from "@/modules/shared/content-types";
import { formatDate } from "@/lib/utils";

const PAGE = 25;
type SP = { q?: string; status?: string; formKey?: string; page?: string };

export default async function LeadsAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim();
  const where: Prisma.LeadWhereInput = {
    tenantId: ctx.tenant.id,
    ...(sp.status && (LEAD_STATUSES as readonly string[]).includes(sp.status) ? { status: sp.status as (typeof LEAD_STATUSES)[number] } : {}),
    ...(sp.formKey ? { formKey: sp.formKey } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }, { message: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total, formKeys] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
    db.lead.count({ where }),
    db.lead.groupBy({ by: ["formKey"], where: { tenantId: ctx.tenant.id }, _count: { _all: true }, orderBy: { formKey: "asc" } }),
  ]);
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (sp.status) u.set("status", sp.status);
    if (sp.formKey) u.set("formKey", sp.formKey);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Leads & messages" description="Contact forms, quote requests, consultations and other enquiries from your website." />
      <form className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_180px_180px_auto]" action="/admin/leads" method="get">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={q} placeholder="Search name, phone, email, message…" className="pl-9" />
        </div>
        <Select name="status" defaultValue={sp.status ?? ""}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Select name="formKey" defaultValue={sp.formKey ?? ""}>
          <option value="">All forms</option>
          {formKeys.map((f) => (
            <option key={f.formKey} value={f.formKey}>
              {humanize(f.formKey)} ({f._count._all})
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {q || sp.status || sp.formKey ? (
            <Link href="/admin/leads" className={buttonVariants({ variant: "ghost" })}>
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={<Inbox />} title={total === 0 && !q && !sp.status && !sp.formKey ? "No messages yet" : "Nothing matches"} description="New enquiries from your website's forms will appear here." />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>From</TH>
                <TH>Form</TH>
                <TH>Message</TH>
                <TH>Received</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((l) => (
                <TR key={l.id} className={l.status === "NEW" ? "bg-amber-50/40" : undefined}>
                  <TD>
                    <Link href={`/admin/leads/${l.id}`} className="font-medium text-slate-900 hover:underline">
                      {l.name}
                    </Link>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {l.phone}
                      {l.email ? ` · ${l.email}` : ""}
                    </p>
                  </TD>
                  <TD className="text-xs">{humanize(l.formKey)}</TD>
                  <TD className="max-w-md">
                    <Link href={`/admin/leads/${l.id}`} className="block">
                      {l.subject ? <p className="text-sm font-medium text-slate-800">{l.subject}</p> : null}
                      <p className="line-clamp-2 text-xs text-slate-500">{l.message || (l.fileIds.length ? `${l.fileIds.length} file(s) attached` : "—")}</p>
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-slate-500">{formatDate(l.createdAt, true)}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      <LeadStatusSelect id={l.id} status={l.status} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={qs} />
        </>
      )}
    </>
  );
}
