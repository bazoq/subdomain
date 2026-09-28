import Link from "next/link";
import { Search, Users } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatPKR, normalizePkPhone } from "@/lib/utils";

type Search = { q?: string; page?: string };
const TAKE = 25;

/** Customers across both shop orders (Order) and food orders (FoodOrder). */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [ctx, sp] = await Promise.all([requireTenantAdmin(), searchParams]);
  const tid = ctx.tenant.id;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.CustomerWhereInput = { tenantId: tid };
  if (q) {
    const phone = normalizePkPhone(q);
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: phone ? phone.slice(-9) : digits || q } },
      { email: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  const [total, rows] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: TAKE, skip: (page - 1) * TAKE, include: { _count: { select: { orders: true, foodOrders: true } } } }),
  ]);
  const ids = rows.map((r) => r.id);
  const [shopTotals, foodTotals] = ids.length
    ? await Promise.all([
        db.order.groupBy({ by: ["customerId"], where: { tenantId: tid, customerId: { in: ids }, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true }, _max: { createdAt: true } }),
        db.foodOrder.groupBy({ by: ["customerId"], where: { tenantId: tid, customerId: { in: ids }, status: { not: "CANCELLED" } }, _sum: { total: true }, _max: { createdAt: true } }),
      ])
    : [[], []];
  const spent = new Map<string, number>();
  const last = new Map<string, Date>();
  for (const g of [...shopTotals, ...foodTotals]) {
    if (!g.customerId) continue;
    spent.set(g.customerId, (spent.get(g.customerId) ?? 0) + (g._sum.total ?? 0));
    const d = g._max.createdAt;
    if (d && (!last.has(g.customerId) || (last.get(g.customerId) as Date) < d)) last.set(g.customerId, d);
  }
  const pageCount = Math.max(1, Math.ceil(total / TAKE));
  const hrefFor = (p: number) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`;

  return (
    <>
      <PageHeader title="Customers" description={`${total} customer${total === 1 ? "" : "s"} who have ordered from your website.`} />
      <form method="get" className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={q} placeholder="Search by name, phone, email or city" className="pl-9" aria-label="Search customers" />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<Users />} title={q ? "No customers match" : "No customers yet"} description="Customers are created automatically when an order is placed." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>City</TH>
              <TH>Orders</TH>
              <TH>Total spent</TH>
              <TH>Last order</TH>
              <TH>Since</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-slate-900 hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {c.phone}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                </TD>
                <TD>{c.city ?? <span className="text-slate-400">—</span>}</TD>
                <TD>{c._count.orders + c._count.foodOrders}</TD>
                <TD className="font-semibold">{formatPKR(spent.get(c.id) ?? 0)}</TD>
                <TD className="text-slate-500">{last.has(c.id) ? formatDate(last.get(c.id) as Date) : "—"}</TD>
                <TD className="text-slate-500">{formatDate(c.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
    </>
  );
}
