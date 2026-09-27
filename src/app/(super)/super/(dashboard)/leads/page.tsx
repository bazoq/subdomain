import { Inbox } from "lucide-react";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { LeadStatusSelect, LeadDeleteButton } from "@/components/admin/super/lead-actions";
import { getCategory } from "@/lib/categories";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Leads" };

const PAGE = 25;
const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"] as const;

export default async function SuperLeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuper();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where: Prisma.SuperLeadWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" } }, { business: { contains: q, mode: "insensitive" } }] } : {}),
    ...(STATUSES.includes(status as (typeof STATUSES)[number]) ? { status: status as (typeof STATUSES)[number] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.superLead.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
    db.superLead.count({ where }),
  ]);
  const hrefFor = (p: number) => `/super/leads?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Leads" description="Business owners who asked for a website through the platform site." />
      <form method="get" className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Input name="q" defaultValue={q} placeholder="Search name, phone, email, business" className="w-72" />
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<Inbox />} title="No leads" description="Leads from the platform contact form will show up here." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Contact</TH>
              <TH>Business</TH>
              <TH>Message</TH>
              <TH>Status</TH>
              <TH>Received</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((l) => (
              <TR key={l.id}>
                <TD>
                  <p className="font-medium text-slate-900">{l.name}</p>
                  <p className="text-xs text-slate-500">
                    <a href={whatsappLink(l.phone)} target="_blank" rel="noreferrer" className="hover:underline">
                      {l.phone}
                    </a>
                    {l.email ? ` · ${l.email}` : ""}
                  </p>
                </TD>
                <TD>
                  <p>{l.business ?? "—"}</p>
                  <p className="text-xs text-slate-500">{l.category ? (getCategory(l.category)?.name ?? l.category) : ""}</p>
                </TD>
                <TD className="max-w-sm">
                  <p className="line-clamp-2 text-slate-600" title={l.message ?? ""}>
                    {l.message ?? "—"}
                  </p>
                </TD>
                <TD>
                  <LeadStatusSelect id={l.id} status={l.status} />
                </TD>
                <TD className="text-xs text-slate-500">{formatDate(l.createdAt, true)}</TD>
                <TD>
                  <div className="flex justify-end">
                    <LeadDeleteButton id={l.id} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={hrefFor} />
    </>
  );
}
