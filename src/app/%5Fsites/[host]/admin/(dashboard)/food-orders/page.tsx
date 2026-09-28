import Link from "next/link";
import { ChefHat, Search } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatPKR, normalizePkPhone } from "@/lib/utils";
import { FOOD_ORDER_STATUSES } from "@/modules/restaurant/types";

type Search = Promise<Record<string, string | string[] | undefined>>;
const PAGE = 25;

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function FoodOrdersPage({ searchParams }: { searchParams: Search }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const status = str(sp.status);
  const from = str(sp.from);
  const to = str(sp.to);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const where: Prisma.FoodOrderWhereInput = { tenantId: ctx.tenant.id };
  if (status && (FOOD_ORDER_STATUSES as readonly string[]).includes(status)) where.status = status as (typeof FOOD_ORDER_STATUSES)[number];
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00+05:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59+05:00`);
  }
  if (q) {
    const n = Number(q.replace(/^#/, ""));
    const phone = normalizePkPhone(q);
    where.OR = [
      ...(Number.isInteger(n) && n > 0 ? [{ number: n }] : []),
      { customerPhone: { contains: phone ?? (q.replace(/\D/g, "").slice(-7) || q) } },
      { customerName: { contains: q, mode: "insensitive" as const } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.foodOrder.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE, include: { _count: { select: { items: true } } } }),
    db.foodOrder.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (from) u.set("from", from);
    if (to) u.set("to", to);
    u.set("page", String(p));
    return `/admin/food-orders?${u.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Order history"
        description={`${total} order${total === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/kitchen">
            <Button variant="outline">
              <ChefHat /> Live board
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Order # or phone or name" />
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {FOOD_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Input name="from" type="date" defaultValue={from} aria-label="From date" />
        <Input name="to" type="date" defaultValue={to} aria-label="To date" />
        <Button type="submit" variant="secondary">
          <Search /> Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<ChefHat />} title="No orders found" description={q || status || from || to ? "Try clearing the filters." : "Orders placed on your website will appear here."} />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH>Type</TH>
                <TH>Items</TH>
                <TH>Total</TH>
                <TH>Status</TH>
                <TH>Placed</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link href={`/admin/food-orders/${o.id}`} className="font-semibold text-brand-600 hover:underline">
                      #{o.number}
                    </Link>
                  </TD>
                  <TD>
                    <p className="font-medium text-slate-900">{o.customerName}</p>
                    <p className="text-xs text-slate-500">{o.customerPhone}</p>
                  </TD>
                  <TD>
                    {o.type.replace("_", " ")}
                    {o.area ? <span className="block text-xs text-slate-500">{o.area}</span> : null}
                  </TD>
                  <TD>{o._count.items}</TD>
                  <TD className="font-semibold">{formatPKR(o.total)}</TD>
                  <TD>
                    <StatusBadge status={o.status} />
                  </TD>
                  <TD className="text-xs text-slate-500">
                    {formatDate(o.createdAt, true)}
                    {o.scheduledFor ? <span className="block text-sky-700">Sched. {formatDate(o.scheduledFor, true)}</span> : null}
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
