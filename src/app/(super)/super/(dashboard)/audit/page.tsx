import Link from "next/link";
import { ScrollText } from "lucide-react";
import { requireSuperPage } from "@/server/super/access";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Audit log" };

const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuperPage(["SUPERADMIN"]);
  const sp = await searchParams;
  const tenant = sp.tenant?.trim() ?? "";
  const actorKind = sp.actorKind ?? "";
  const action = sp.action?.trim() ?? "";
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
  const where: Prisma.AuditLogWhereInput = {
    ...(tenant ? { OR: [{ tenantId: tenant }, { tenant: { slug: tenant } }, { tenant: { name: { contains: tenant, mode: "insensitive" } } }] } : {}),
    ...(actorKind === "SUPER" || actorKind === "TENANT" ? { actorKind } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(fromDate && !Number.isNaN(fromDate.getTime()) ? { createdAt: { gte: fromDate, ...(toDate && !Number.isNaN(toDate.getTime()) ? { lte: toDate } : {}) } } : toDate && !Number.isNaN(toDate.getTime()) ? { createdAt: { lte: toDate } } : {}),
  };
  const [rows, total, tenants] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE, include: { tenant: { select: { id: true, name: true, slug: true } } } }),
    db.auditLog.count({ where }),
    db.tenant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const params = { ...(tenant ? { tenant } : {}), ...(actorKind ? { actorKind } : {}), ...(action ? { action } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) };
  const hrefFor = (p: number) => `/super/audit?${new URLSearchParams({ ...params, page: String(p) })}`;

  return (
    <>
      <PageHeader title="Audit log" description={`${total} entr${total === 1 ? "y" : "ies"} across the platform and all tenant admins.`} />
      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_auto_1fr_auto_auto_auto]">
        <Select name="tenant" defaultValue={tenant}>
          <option value="">All websites (+ platform)</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select name="actorKind" defaultValue={actorKind} className="md:w-36">
          <option value="">Any actor</option>
          <option value="SUPER">Super admin</option>
          <option value="TENANT">Tenant admin</option>
        </Select>
        <Input name="action" defaultValue={action} placeholder="Action contains… e.g. product.delete" />
        <Input type="date" name="from" defaultValue={from} className="md:w-40" />
        <Input type="date" name="to" defaultValue={to} className="md:w-40" />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<ScrollText />} title="No audit entries" description="Mutations by super admins and tenant admins are recorded here." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>Website</TH>
              <TH>Details</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const meta = r.meta && typeof r.meta === "object" && !Array.isArray(r.meta) ? (r.meta as Record<string, unknown>) : {};
              const metaText = Object.entries(meta)
                .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                .join(" · ");
              return (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.createdAt, true)}</TD>
                  <TD>
                    <Badge tone={r.actorKind === "SUPER" ? "purple" : "info"}>{r.actorKind}</Badge>
                    <p className="mt-0.5 text-xs text-slate-700">{r.actorName}</p>
                    {r.ip ? <p className="text-[11px] text-slate-400">{r.ip}</p> : null}
                  </TD>
                  <TD className="font-mono text-xs">{r.action}</TD>
                  <TD className="text-xs">
                    {r.entity ?? "—"}
                    {r.entityId ? <p className="font-mono text-[11px] text-slate-400">{r.entityId}</p> : null}
                  </TD>
                  <TD className="text-xs">
                    {r.tenant ? (
                      <Link href={`/super/tenants/${r.tenant.id}`} className="text-brand-600 hover:underline">
                        {r.tenant.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">platform</span>
                    )}
                  </TD>
                  <TD className="max-w-xs">
                    <p className="line-clamp-2 text-xs text-slate-500" title={metaText}>
                      {metaText || "—"}
                    </p>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={hrefFor} />
    </>
  );
}
