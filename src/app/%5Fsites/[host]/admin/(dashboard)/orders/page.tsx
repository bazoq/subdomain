import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORDER_STATUSES } from "@/modules/ecommerce/types";
import { orderLabel } from "@/modules/ecommerce/pricing";
import { cn, formatDate, formatPKR, normalizePkPhone } from "@/lib/utils";

type Search = { q?: string; status?: string; page?: string };
const TAKE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [ctx, sp] = await Promise.all([requireTenantAdmin(), searchParams]);
  const tid = ctx.tenant.id;
  const prefix = ctx.settings.commerce.orderPrefix;
  const q = sp.q?.trim() ?? "";
  const status = ORDER_STATUSES.includes(sp.status as (typeof ORDER_STATUSES)[number]) ? (sp.status as (typeof ORDER_STATUSES)[number]) : "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = { tenantId: tid };
  if (status) where.status = status;
  if (q) {
    const digits = q.replace(/\D/g, "");
    const asNumber = /^[A-Za-z]*-?\d+$/.test(q) && digits ? parseInt(digits, 10) : null;
    const phone = normalizePkPhone(q);
    where.OR = [
      ...(asNumber != null ? [{ number: asNumber }] : []),
      { customerName: { contains: q, mode: "insensitive" as const } },
      { customerPhone: { contains: phone ? phone.slice(-9) : digits || q } },
      { city: { contains: q, mode: "insensitive" as const } },
    ];
  }

  const [total, rows, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: TAKE, skip: (page - 1) * TAKE, include: { _count: { select: { items: true } } } }),
    db.order.groupBy({ by: ["status"], where: { tenantId: tid }, _count: { _all: true } }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<string, number>>;
  const allCount = counts.reduce((n, c) => n + c._count._all, 0);
  const pageCount = Math.max(1, Math.ceil(total / TAKE));
  const hrefFor = (p: number, s = status) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (s) u.set("status", s);
    if (p > 1) u.set("page", String(p));
    const str = u.toString();
    return str ? `/admin/orders?${str}` : "/admin/orders";
  };

  const tabs: { key: string; label: string; count: number }[] = [{ key: "", label: "All", count: allCount }, ...ORDER_STATUSES.map((s) => ({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase(), count: countBy[s] ?? 0 }))];

  return (
    <>
      <PageHeader title="Orders" description="Cash-on-delivery orders from your website." />
      <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tb) => (
          <Link
            key={tb.key}
            href={hrefFor(1, tb.key)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
              status === tb.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {tb.label} <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{tb.count}</span>
          </Link>
        ))}
      </div>
      <form method="get" className="mb-4 flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={q} placeholder={`Search by order number (${prefix}-12), phone or name`} className="pl-9" aria-label="Search orders" />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={<ShoppingBag />} title={q || status ? "No orders match" : "No orders yet"} description="Orders placed on your website will appear here. You will also get an email if notifications are set up." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>City</TH>
              <TH>Items</TH>
              <TH>Total</TH>
              <TH>Status</TH>
              <TH>Date</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((o) => (
              <TR key={o.id}>
                <TD>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                    {orderLabel(prefix, o.number)}
                  </Link>
                  {o.prescriptionId ? <span className="ml-2 rounded bg-sky-50 px-1.5 text-[10px] font-semibold text-sky-700">Rx</span> : null}
                </TD>
                <TD>
                  <p className="font-medium text-slate-900">{o.customerName}</p>
                  <p className="text-xs text-slate-500">{o.customerPhone}</p>
                </TD>
                <TD>{o.city}</TD>
                <TD>{o._count.items}</TD>
                <TD className="font-semibold">{formatPKR(o.total)}</TD>
                <TD>
                  <StatusBadge status={o.status} />
                </TD>
                <TD className="whitespace-nowrap text-slate-500">{formatDate(o.createdAt, true)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => hrefFor(p)} />
    </>
  );
}
