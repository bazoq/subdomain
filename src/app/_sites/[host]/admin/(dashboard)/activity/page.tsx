import { ScrollText } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const PAGE = 50;

function tone(action: string) {
  if (action.endsWith(".delete")) return "danger" as const;
  if (action.endsWith(".create") || action.endsWith(".publish")) return "success" as const;
  if (action.includes("password") || action.startsWith("user.")) return "purple" as const;
  return "info" as const;
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; entity?: string; q?: string }> }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim();
  const where: Prisma.AuditLogWhereInput = {
    tenantId: ctx.tenant.id,
    ...(sp.entity ? { entity: sp.entity } : {}),
    ...(q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { actorName: { contains: q, mode: "insensitive" } }, { entityId: { contains: q } }] } : {}),
  };
  const [rows, total, entities] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["entity"], where: { tenantId: ctx.tenant.id, entity: { not: null } }, orderBy: { entity: "asc" } }),
  ]);
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (sp.entity) u.set("entity", sp.entity);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/activity${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when. Kept for your records." />
      <form className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm" action="/admin/activity" method="get">
        <Input name="q" defaultValue={q} placeholder="Search action or person…" className="max-w-xs" />
        <Select name="entity" defaultValue={sp.entity ?? ""} className="max-w-[200px]">
          <option value="">All types</option>
          {entities.map((e) => (
            <option key={e.entity ?? ""} value={e.entity ?? ""}>
              {e.entity}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<ScrollText />} title="No activity yet" description="Changes made in this admin will be listed here." />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Who</TH>
                <TH>Action</TH>
                <TH>Item</TH>
                <TH>Details</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const meta = r.meta && typeof r.meta === "object" && !Array.isArray(r.meta) ? (r.meta as Record<string, unknown>) : {};
                const details = Object.entries(meta)
                  .filter(([, v]) => v != null && v !== "")
                  .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                  .join(" · ");
                return (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.createdAt, true)}</TD>
                    <TD>
                      <p className="text-sm font-medium text-slate-900">{r.actorName}</p>
                      <p className="text-xs text-slate-400">{r.actorKind === "SUPER" ? "Platform admin" : r.ip ?? ""}</p>
                    </TD>
                    <TD>
                      <Badge tone={tone(r.action)}>{r.action}</Badge>
                    </TD>
                    <TD className="text-xs text-slate-600">
                      {r.entity ?? "—"}
                      {r.entityId ? <span className="block font-mono text-[10px] text-slate-400">{r.entityId}</span> : null}
                    </TD>
                    <TD className="max-w-xs truncate text-xs text-slate-500" title={details}>
                      {details || "—"}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={href} />
        </>
      )}
    </>
  );
}
