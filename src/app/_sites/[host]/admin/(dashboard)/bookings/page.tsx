import Link from "next/link";
import { CalendarCheck, MessageCircle, Phone, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ActionButton } from "@/components/admin/action-button";
import { BookingStatusSelect } from "@/components/admin/travel/booking-status-select";
import { deleteBooking } from "@/modules/travel/actions";
import { BOOKING_STATUSES } from "@/modules/travel/constants";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q);
  const packageId = str(sp.package);
  const status = str(sp.status);
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const take = 25;

  const where: Prisma.BookingWhereInput = {
    tenantId: ctx.tenant.id,
    ...(packageId ? { packageId } : {}),
    ...(status && (BOOKING_STATUSES as readonly string[]).includes(status) ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/[^\d+]/g, "") || q } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total, packages] = await Promise.all([
    db.booking.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (page - 1) * take, include: { package: { select: { id: true, title: true, destination: true } } } }),
    db.booking.count({ where }),
    db.travelPackage.findMany({ where: { tenantId: ctx.tenant.id }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / take));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (packageId) u.set("package", packageId);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/bookings${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Booking requests" description={`${total} request${total === 1 ? "" : "s"} · call or WhatsApp the traveller, then update the status.`} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Input name="q" defaultValue={q} placeholder="Search name, phone or email…" />
        </div>
        <Select name="package" defaultValue={packageId} className="w-56">
          <option value="">All packages</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {(p.title as LocalizedString).en}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={<CalendarCheck />} title="No booking requests" description={q || packageId || status ? "Nothing matches these filters." : "Requests from your package pages will show up here."} />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Traveller</TH>
                <TH>Package</TH>
                <TH className="text-center">Pax</TH>
                <TH>Preferred date</TH>
                <TH>Received</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((b) => {
                const pkgTitle = b.package ? (b.package.title as LocalizedString).en : "Package removed";
                return (
                  <TR key={b.id}>
                    <TD>
                      <p className="font-medium text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.phone}
                        {b.email ? ` · ${b.email}` : ""}
                      </p>
                      {b.message ? <p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500">{b.message}</p> : null}
                    </TD>
                    <TD className="max-w-xs">
                      {b.package ? (
                        <Link href={`/admin/packages/${b.package.id}`} className="line-clamp-2 hover:underline">
                          {pkgTitle}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{pkgTitle}</span>
                      )}
                      {b.package ? <p className="text-xs text-slate-500">{b.package.destination}</p> : null}
                    </TD>
                    <TD className="text-center">{b.travellers}</TD>
                    <TD className="whitespace-nowrap">{b.date ? formatDate(b.date) : "Flexible"}</TD>
                    <TD className="whitespace-nowrap">{formatDate(b.createdAt, true)}</TD>
                    <TD>
                      <BookingStatusSelect id={b.id} status={b.status} />
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <a href={whatsappLink(b.phone, `Assalam o Alaikum ${b.name}, this is ${ctx.tenant.name} regarding your booking request for "${pkgTitle}".`)} target="_blank" rel="noreferrer" title="WhatsApp">
                          <Button size="sm" variant="ghost" className="text-emerald-700">
                            <MessageCircle />
                          </Button>
                        </a>
                        <a href={`tel:${b.phone}`} title="Call">
                          <Button size="sm" variant="ghost">
                            <Phone />
                          </Button>
                        </a>
                        <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this booking request?" action={() => deleteBooking(b.id)}>
                          <Trash2 />
                        </ActionButton>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </>
  );
}
