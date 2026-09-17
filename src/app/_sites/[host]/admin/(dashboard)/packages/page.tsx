import Link from "next/link";
import { Plane, Plus, Star } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ActionButton } from "@/components/admin/action-button";
import { togglePackage } from "@/modules/travel/actions";
import { PACKAGE_KINDS, PACKAGE_KIND_LABELS } from "@/modules/travel/constants";
import { kindLabel, parseDepartures } from "@/modules/travel/helpers";
import { formatDate, formatPKR } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function PackagesAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q);
  const kind = str(sp.kind);
  const status = str(sp.status);
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const take = 25;

  const where: Prisma.TravelPackageWhereInput = {
    tenantId: ctx.tenant.id,
    ...(kind && (PACKAGE_KINDS as readonly string[]).includes(kind) ? { kind } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
    ...(q ? { OR: [{ title: { path: ["en"], string_contains: q } }, { slug: { contains: q.toLowerCase() } }, { destination: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.travelPackage.findMany({ where, orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }], take, skip: (page - 1) * take, include: { _count: { select: { bookings: true } } } }),
    db.travelPackage.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / take));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (kind) u.set("kind", kind);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/packages${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Packages"
        description="Umrah, Hajj, tours and visa packages shown on your website."
        actions={
          <Link href="/admin/packages/new">
            <Button>
              <Plus /> New package
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Input name="q" defaultValue={q} placeholder="Search title or destination…" />
        </div>
        <Select name="kind" defaultValue={kind} className="w-40">
          <option value="">All types</option>
          {PACKAGE_KINDS.map((k) => (
            <option key={k} value={k}>
              {PACKAGE_KIND_LABELS[k].en}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="w-36">
          <option value="">All</option>
          <option value="active">Live</option>
          <option value="inactive">Hidden</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Plane />}
          title={q || kind || status ? "No packages match these filters" : "No packages yet"}
          description="Create your first package — Umrah, northern areas, Dubai, anything you sell."
          action={
            <Link href="/admin/packages/new">
              <Button>
                <Plus /> New package
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Package</TH>
                <TH>Type</TH>
                <TH>Duration</TH>
                <TH>Price</TH>
                <TH>Next departure</TH>
                <TH className="text-center">Bookings</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const next = parseDepartures(r.departures, true)[0];
                return (
                  <TR key={r.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        {r.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.images[0]} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="size-10 shrink-0 rounded-md bg-slate-100" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/packages/${r.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                            {r.isFeatured ? <Star className="mr-1 inline size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" /> : null}
                            {(r.title as LocalizedString).en}
                          </Link>
                          <p className="truncate text-xs text-slate-500">{r.destination}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>{kindLabel(r.kind, "en")}</TD>
                    <TD className="whitespace-nowrap">
                      {r.days}D / {r.nights}N
                    </TD>
                    <TD className="whitespace-nowrap font-medium">{formatPKR(r.price)}</TD>
                    <TD className="whitespace-nowrap">{next ? formatDate(next) : "—"}</TD>
                    <TD className="text-center">
                      <Link href={`/admin/bookings?package=${r.id}`} className="font-medium text-brand-600 hover:underline">
                        {r._count.bookings}
                      </Link>
                    </TD>
                    <TD>
                      <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Live" : "Hidden"}</Badge>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <ActionButton size="sm" variant="ghost" action={() => togglePackage(r.id, "isFeatured", !r.isFeatured)} title={r.isFeatured ? "Unfeature" : "Feature"}>
                          <Star className={r.isFeatured ? "fill-amber-400 text-amber-400" : ""} />
                        </ActionButton>
                        <ActionButton size="sm" variant="ghost" action={() => togglePackage(r.id, "isActive", !r.isActive)}>
                          {r.isActive ? "Hide" : "Publish"}
                        </ActionButton>
                        <Link href={`/admin/packages/${r.id}`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
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
