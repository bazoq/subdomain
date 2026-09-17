import Link from "next/link";
import { Building2, Plus, Star } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ActionButton } from "@/components/admin/action-button";
import { toggleProperty } from "@/modules/realestate/actions";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, PURPOSES } from "@/modules/realestate/constants";
import { areaText, propertyPrice, typeLabel } from "@/modules/realestate/helpers";
import { formatDate } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function PropertiesAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q);
  const purpose = str(sp.purpose);
  const type = str(sp.type);
  const status = str(sp.status);
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const take = 25;

  const where: Prisma.PropertyWhereInput = {
    tenantId: ctx.tenant.id,
    ...(purpose && (PURPOSES as readonly string[]).includes(purpose) ? { purpose } : {}),
    ...(type && (PROPERTY_TYPES as readonly string[]).includes(type) ? { type } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : status === "featured" ? { isFeatured: true } : {}),
    ...(q ? { OR: [{ title: { path: ["en"], string_contains: q } }, { slug: { contains: q.toLowerCase() } }, { location: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.property.findMany({ where, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], take, skip: (page - 1) * take }),
    db.property.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / take));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (purpose) u.set("purpose", purpose);
    if (type) u.set("type", type);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/properties${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Properties"
        description="Listings for sale and rent shown on your website. Inquiries arrive under Leads & messages."
        actions={
          <Link href="/admin/properties/new">
            <Button>
              <Plus /> Add listing
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Input name="q" defaultValue={q} placeholder="Search title, society or city…" />
        </div>
        <Select name="purpose" defaultValue={purpose} className="w-32">
          <option value="">Sale & rent</option>
          <option value="SALE">For sale</option>
          <option value="RENT">For rent</option>
        </Select>
        <Select name="type" defaultValue={type} className="w-40">
          <option value="">All types</option>
          {PROPERTY_TYPES.map((x) => (
            <option key={x} value={x}>
              {PROPERTY_TYPE_LABELS[x].en}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="w-36">
          <option value="">All</option>
          <option value="active">Live</option>
          <option value="inactive">Hidden</option>
          <option value="featured">Featured</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title={q || purpose || type || status ? "No listings match these filters" : "No listings yet"}
          description="Add your first property — it goes live on /properties as soon as you save."
          action={
            <Link href="/admin/properties/new">
              <Button>
                <Plus /> Add listing
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Property</TH>
                <TH>Purpose</TH>
                <TH>Type</TH>
                <TH>Price</TH>
                <TH>Area / rooms</TH>
                <TH>Listed</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
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
                        <Link href={`/admin/properties/${r.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                          {r.isFeatured ? <Star className="mr-1 inline size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" /> : null}
                          {(r.title as LocalizedString).en}
                        </Link>
                        <p className="truncate text-xs text-slate-500">
                          {r.location}, {r.city}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={r.purpose === "RENT" ? "info" : "brand"}>{r.purpose}</Badge>
                  </TD>
                  <TD>{typeLabel(r.type, "en")}</TD>
                  <TD className="whitespace-nowrap font-medium">{propertyPrice(r, "en")}</TD>
                  <TD className="whitespace-nowrap text-slate-600">
                    {[areaText(r, "en"), r.bedrooms != null ? `${r.bedrooms} bed` : null, r.bathrooms != null ? `${r.bathrooms} bath` : null].filter(Boolean).join(" · ") || "—"}
                  </TD>
                  <TD className="whitespace-nowrap">{formatDate(r.createdAt)}</TD>
                  <TD>
                    <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Live" : "Hidden"}</Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <ActionButton size="sm" variant="ghost" action={() => toggleProperty(r.id, "isFeatured", !r.isFeatured)} title={r.isFeatured ? "Unfeature" : "Feature"}>
                        <Star className={r.isFeatured ? "fill-amber-400 text-amber-400" : ""} />
                      </ActionButton>
                      <ActionButton size="sm" variant="ghost" action={() => toggleProperty(r.id, "isActive", !r.isActive)}>
                        {r.isActive ? "Hide" : "Publish"}
                      </ActionButton>
                      <Link href={`/admin/properties/${r.id}`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                    </div>
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
