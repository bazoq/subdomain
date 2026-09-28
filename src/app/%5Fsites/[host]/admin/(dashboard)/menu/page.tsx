import Link from "next/link";
import { Plus, Search, Star, UtensilsCrossed, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ActionButton } from "@/components/admin/action-button";
import { deleteMenuItem, toggleMenuItem } from "@/modules/restaurant/actions";
import { formatPKR } from "@/lib/utils";
import { t, type LocalizedString } from "@/lib/i18n";
import { parseSizes } from "@/modules/restaurant/types";

type Search = Promise<Record<string, string | string[] | undefined>>;
const PAGE = 25;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function MenuItemsPage({ searchParams }: { searchParams: Search }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const cat = str(sp.category);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const where: Prisma.MenuItemWhereInput = { tenantId: ctx.tenant.id };
  if (cat === "none") where.categoryId = null;
  else if (cat) where.categoryId = cat;
  if (q) where.OR = [{ slug: { contains: q.toLowerCase() } }, { name: { path: ["en"], string_contains: q } }, { name: { path: ["ur"], string_contains: q } }];

  const [rows, total, categories] = await Promise.all([
    db.menuItem.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: PAGE, skip: (page - 1) * PAGE, include: { category: { select: { name: true } } } }),
    db.menuItem.count({ where }),
    db.menuCategory.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (cat) u.set("category", cat);
    u.set("page", String(p));
    return `/admin/menu?${u.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Menu items"
        description={`${total} item${total === 1 ? "" : "s"} · manage categories and add-ons from the sub-menu`}
        actions={
          <Link href="/admin/menu/new">
            <Button>
              <Plus /> Add item
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Search by name or slug" />
        <Select name="category" defaultValue={cat}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.name as LocalizedString)}
            </option>
          ))}
          <option value="none">Uncategorised</option>
        </Select>
        <Button type="submit" variant="secondary">
          <Search /> Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed />}
          title="No menu items"
          description={q || cat ? "Try clearing the filters." : "Add your first item, e.g. Chicken Tikka Pizza with Small / Medium / Large / Family sizes."}
          action={
            <Link href="/admin/menu/new">
              <Button>
                <Plus /> Add item
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Item</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Available</TH>
                <TH>Featured</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const name = r.name as LocalizedString;
                const sizes = parseSizes(r.sizes);
                return (
                  <TR key={r.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        {r.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.imageUrl} alt="" className="size-12 rounded-lg object-cover" />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <UtensilsCrossed className="size-5" />
                          </div>
                        )}
                        <div>
                          <Link href={`/admin/menu/${r.id}`} className="font-medium text-slate-900 hover:underline">
                            {name.en}
                          </Link>
                          <p className="text-xs text-slate-500">
                            /{r.slug}
                            {r.tags.length ? ` · ${r.tags.join(", ")}` : ""}
                          </p>
                        </div>
                      </div>
                    </TD>
                    <TD>{r.category ? t(r.category.name as LocalizedString) : <span className="text-slate-400">—</span>}</TD>
                    <TD>
                      <span className="font-semibold">{formatPKR(r.price)}</span>
                      {sizes.length ? <span className="block text-xs text-slate-500">{sizes.map((s) => `${s.name} ${s.price}`).join(" · ")}</span> : null}
                    </TD>
                    <TD>
                      <ActionButton size="sm" variant="ghost" action={() => toggleMenuItem(r.id, "available", !r.isAvailable)}>
                        <Badge tone={r.isAvailable ? "success" : "danger"}>{r.isAvailable ? "Available" : "Sold out"}</Badge>
                      </ActionButton>
                    </TD>
                    <TD>
                      <ActionButton size="sm" variant="ghost" action={() => toggleMenuItem(r.id, "featured", !r.isFeatured)} title="Toggle featured">
                        <Star className={r.isFeatured ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                      </ActionButton>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/menu/${r.id}`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                        <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Delete "${name.en}"?`} action={() => deleteMenuItem(r.id)}>
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
