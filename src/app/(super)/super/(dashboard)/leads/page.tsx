import { Inbox } from "lucide-react";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { LeadStatusSelect, LeadDeleteButton } from "@/components/admin/super/lead-actions";
import { getCategory } from "@/lib/categories";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Leads" };

const PAGE = 25;
const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"] as const;
/** `SuperLead.source` is a client token such as `home`, `pricing`, `template:901`, `templates/bakery`, `guide:gym`. */
const SOURCE_RE = /^[w:/.-]{1,80}$/;

/** Short badge text: `template:901` → `#901`, `contact:starter` → `contact · starter`, others as-is. */
function sourceLabel(source: string): string {
  const m = /^template:(.+)$/.exec(source);
  if (m) return `#${m[1]}`;
  return source.replace(":", " · ");
}

export default async function SuperLeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuper();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const source = SOURCE_RE.test(sp.source ?? "") ? (sp.source as string) : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where: Prisma.SuperLeadWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" } }, { business: { contains: q, mode: "insensitive" } }] } : {}),
    ...(STATUSES.includes(status as (typeof STATUSES)[number]) ? { status: status as (typeof STATUSES)[number] } : {}),
    ...(source ? { source } : {}),
  };
  const [rows, total, sources] = await Promise.all([
    db.superLead.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
    db.superLead.count({ where }),
    db.superLead.findMany({ where: { source: { not: null } }, select: { source: true }, distinct: ["source"], orderBy: { source: "asc" }, take: 200 }),
  ]);
  const sourceOptions = sources.map((s) => s.source).filter((s): s is string => Boolean(s));
  if (source && !sourceOptions.includes(source)) sourceOptions.unshift(source);
  const hrefFor = (p: number) => `/super/leads?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(source ? { source } : {}), page: String(p) })}`;

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
        <Select name="source" defaultValue={source} className="w-44" aria-label="Source">
          <option value="">Any source</option>
          {sourceOptions.map((s) => (
            <option key={s} value={s}>
              {sourceLabel(s)}
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
              <TH>Source</TH>
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
                  {l.source ? (
                    <Badge tone={l.source.startsWith("template:") ? "brand" : "default"} title={l.source}>
                      {sourceLabel(l.source)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
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
