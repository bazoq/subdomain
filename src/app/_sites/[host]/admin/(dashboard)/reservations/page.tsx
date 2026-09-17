import { CalendarCheck, Search } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ReservationStatusSelect } from "@/components/admin/restaurant/reservation-status";
import { formatDate, normalizePkPhone, whatsappLink } from "@/lib/utils";
import { RESERVATION_STATUSES } from "@/modules/restaurant/types";

type Search = Promise<Record<string, string | string[] | undefined>>;
const PAGE = 25;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ReservationsPage({ searchParams }: { searchParams: Search }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const status = str(sp.status);
  const date = str(sp.date);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const where: Prisma.ReservationWhereInput = { tenantId: ctx.tenant.id };
  if (status && (RESERVATION_STATUSES as readonly string[]).includes(status)) where.status = status;
  if (date) where.date = { gte: new Date(`${date}T00:00:00+05:00`), lte: new Date(`${date}T23:59:59+05:00`) };
  else if (!q && !status) {
    // upcoming by default (from yesterday, to be safe across time zones)
    const since = new Date();
    since.setDate(since.getDate() - 1);
    where.date = { gte: since };
  }
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: normalizePkPhone(q) ?? (q.replace(/\D/g, "").slice(-7) || q) } }];

  const [rows, total] = await Promise.all([
    db.reservation.findMany({ where, orderBy: [{ date: "asc" }, { time: "asc" }], take: PAGE, skip: (page - 1) * PAGE }),
    db.reservation.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (date) u.set("date", date);
    u.set("page", String(p));
    return `/admin/reservations?${u.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Reservations"
        description={ctx.settings.restaurant.reservations ? "Table reservation requests from your website (upcoming shown by default)." : "Online reservations are disabled in Settings; existing requests are listed here."}
      />
      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Search name or phone" />
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {RESERVATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input name="date" type="date" defaultValue={date} aria-label="Date" />
        <Button type="submit" variant="secondary">
          <Search /> Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<CalendarCheck />} title="No reservations" description={q || status || date ? "Try clearing the filters." : "New table requests will appear here."} />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Guest</TH>
                <TH>Party</TH>
                <TH>Notes</TH>
                <TH>Status</TH>
                <TH>Received</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <p className="font-medium text-slate-900">{formatDate(r.date)}</p>
                    <p className="text-xs text-slate-500">{r.time}</p>
                  </TD>
                  <TD>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs">
                      <a href={`tel:${r.phone}`} className="text-brand-600 hover:underline">
                        {r.phone}
                      </a>
                      {" · "}
                      <a href={whatsappLink(r.phone, `Hi ${r.name}, this is ${ctx.tenant.name} regarding your table reservation on ${formatDate(r.date)} at ${r.time}.`)} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                        WhatsApp
                      </a>
                    </p>
                  </TD>
                  <TD>{r.guests} guests</TD>
                  <TD className="max-w-xs">
                    <p className="line-clamp-2 text-xs text-slate-600">{r.notes}</p>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ReservationStatusSelect id={r.id} status={r.status} />
                    </div>
                  </TD>
                  <TD className="text-xs text-slate-500">{formatDate(r.createdAt, true)}</TD>
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
