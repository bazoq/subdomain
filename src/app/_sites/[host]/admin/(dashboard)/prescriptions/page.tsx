import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileHeart, MessageCircle } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { updatePrescriptionStatus } from "@/modules/ecommerce/actions";
import { orderLabel } from "@/modules/ecommerce/pricing";
import { cn, formatDate, whatsappLink } from "@/lib/utils";

type Search = { status?: string; page?: string };
const TAKE = 25;
const STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;

/** Medical stores only. */
export default async function PrescriptionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [ctx, sp] = await Promise.all([requireTenantAdmin(), searchParams]);
  if (!ctx.category.modules.includes("medical")) notFound();
  const tid = ctx.tenant.id;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? sp.status! : "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.PrescriptionWhereInput = { tenantId: tid, ...(status ? { status } : {}) };

  const [total, rows, counts] = await Promise.all([
    db.prescription.count({ where }),
    db.prescription.findMany({ where, orderBy: { createdAt: "desc" }, take: TAKE, skip: (page - 1) * TAKE, include: { orders: { select: { id: true, number: true, status: true } } } }),
    db.prescription.groupBy({ by: ["status"], where: { tenantId: tid }, _count: { _all: true } }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<string, number>>;
  const pageCount = Math.max(1, Math.ceil(total / TAKE));
  const hrefFor = (p: number, s = status) => {
    const u = new URLSearchParams();
    if (s) u.set("status", s);
    if (p > 1) u.set("page", String(p));
    const str = u.toString();
    return str ? `/admin/prescriptions?${str}` : "/admin/prescriptions";
  };
  const prefix = ctx.settings.commerce.orderPrefix;

  return (
    <>
      <PageHeader title="Prescriptions" description="Uploaded by customers at checkout or via the Upload Prescription page. Verify before dispensing Rx medicines." />
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {[{ key: "", label: "All" }, ...STATUSES.map((s) => ({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))].map((tb) => (
          <Link
            key={tb.key}
            href={hrefFor(1, tb.key)}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm font-medium", status === tb.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800")}
          >
            {tb.label}
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{tb.key ? (countBy[tb.key] ?? 0) : counts.reduce((n, c) => n + c._count._all, 0)}</span>
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<FileHeart />} title="No prescriptions" description="Prescriptions uploaded by customers will appear here for verification." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>Notes</TH>
              <TH>Orders</TH>
              <TH>Uploaded</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>
                  <p className="font-medium text-slate-900">{r.customerName}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    {r.customerPhone}
                    <a href={whatsappLink(r.customerPhone)} target="_blank" rel="noreferrer" className="text-[#128C7E] hover:underline" aria-label="WhatsApp customer">
                      <MessageCircle className="size-3.5" />
                    </a>
                  </p>
                </TD>
                <TD className="max-w-xs">
                  <p className="line-clamp-2 text-slate-600">{r.notes || <span className="text-slate-400">—</span>}</p>
                </TD>
                <TD>
                  {r.orders.length ? (
                    <div className="flex flex-wrap gap-1">
                      {r.orders.map((o) => (
                        <Link key={o.id} href={`/admin/orders/${o.id}`} className="text-xs text-brand-600 hover:underline">
                          {orderLabel(prefix, o.number)}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Standalone</span>
                  )}
                </TD>
                <TD className="whitespace-nowrap text-slate-500">{formatDate(r.createdAt, true)}</TD>
                <TD>
                  <StatusBadge status={r.status} />
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <a href={`/api/media/${r.mediaId}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium hover:bg-slate-50">
                      <Download className="size-3.5" /> View
                    </a>
                    {r.status !== "VERIFIED" ? (
                      <ActionButton size="sm" variant="success" action={() => updatePrescriptionStatus(r.id, "VERIFIED")}>
                        Verify
                      </ActionButton>
                    ) : null}
                    {r.status !== "REJECTED" ? (
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Reject this prescription?" action={() => updatePrescriptionStatus(r.id, "REJECTED")}>
                        Reject
                      </ActionButton>
                    ) : (
                      <ActionButton size="sm" variant="ghost" action={() => updatePrescriptionStatus(r.id, "PENDING")}>
                        Reopen
                      </ActionButton>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => hrefFor(p)} />
    </>
  );
}
