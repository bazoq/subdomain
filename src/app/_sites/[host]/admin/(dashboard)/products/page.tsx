import Link from "next/link";
import { AlertTriangle, Package, Plus, Search } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ProductFlagToggle } from "@/components/admin/ecommerce/product-row-actions";
import { asLocalized } from "@/modules/ecommerce/mappers";
import { cn, formatPKR, slugify } from "@/lib/utils";

type Search = { q?: string; category?: string; status?: string; page?: string };
const TAKE = 25;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [ctx, sp] = await Promise.all([requireTenantAdmin(), searchParams]);
  const tid = ctx.tenant.id;
  const threshold = ctx.settings.commerce.lowStockThreshold;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.ProductWhereInput = { tenantId: tid };
  if (q) {
    where.OR = [
      { name: { path: ["en"], string_contains: q } },
      { slug: { contains: slugify(q) } },
      { sku: { contains: q, mode: "insensitive" } },
      { genericName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sp.category) where.categoryId = sp.category;
  if (status === "active") where.isActive = true;
  else if (status === "inactive") where.isActive = false;
  else if (status === "featured") where.isFeatured = true;
  else if (status === "low") Object.assign(where, { trackStock: true, stock: { lte: threshold }, variants: { none: {} } });

  const [total, rows, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: TAKE,
      skip: (page - 1) * TAKE,
      include: { category: { select: { name: true } }, variants: { select: { stock: true, isActive: true } } },
    }),
    db.productCategory.findMany({ where: { tenantId: tid }, orderBy: [{ sortOrder: "asc" }], select: { id: true, name: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / TAKE));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (sp.category) u.set("category", sp.category);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"} · low-stock alert at ${threshold} units`}
        actions={
          <>
            <Link href="/admin/products/categories" className="text-sm text-slate-600 hover:underline">
              Categories
            </Link>
            <Link href="/admin/products/new">
              <Button>
                <Plus /> Add product
              </Button>
            </Link>
          </>
        }
      />

      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_180px_160px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={q} placeholder="Search name, slug, SKU…" className="pl-9" aria-label="Search products" />
        </div>
        <Select name="category" defaultValue={sp.category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {asLocalized(c.name).en}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">All products</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
          <option value="featured">Featured</option>
          <option value="low">Low stock</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={q || status || sp.category ? "No products match these filters" : "No products yet"}
          description="Add your first product with photos, price and stock to start selling online."
          action={
            <Link href="/admin/products/new">
              <Button>
                <Plus /> Add product
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Product</TH>
              <TH>Category</TH>
              <TH>Price</TH>
              <TH>Stock</TH>
              <TH>Active</TH>
              <TH>Featured</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((p) => {
              const hasVariants = p.variants.length > 0;
              const stock = hasVariants ? p.variants.filter((v) => v.isActive).reduce((n, v) => n + v.stock, 0) : p.stock;
              const low = p.trackStock && stock <= threshold;
              return (
                <TR key={p.id} className={cn(low && "bg-amber-50/60")}>
                  <TD>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <div className="size-11 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{asLocalized(p.name).en || "(untitled)"}</p>
                        <p className="truncate text-xs text-slate-500">
                          {p.sku ? `${p.sku} · ` : ""}
                          {p.slug}
                          {p.requiresPrescription ? " · Rx" : ""}
                        </p>
                      </div>
                    </Link>
                  </TD>
                  <TD className="text-slate-600">{p.category ? asLocalized(p.category.name).en : <span className="text-slate-400">—</span>}</TD>
                  <TD>
                    <p className="font-medium">{formatPKR(p.price)}</p>
                    {p.comparePrice ? <p className="text-xs text-slate-400 line-through">{formatPKR(p.comparePrice)}</p> : null}
                  </TD>
                  <TD>
                    {!p.trackStock ? (
                      <Badge>Not tracked</Badge>
                    ) : (
                      <span className={cn("inline-flex items-center gap-1 font-medium", stock <= 0 ? "text-red-600" : low ? "text-amber-700" : "text-slate-700")}>
                        {low ? <AlertTriangle className="size-3.5" /> : null}
                        {stock}
                        {hasVariants ? <span className="text-xs font-normal text-slate-400">({p.variants.length} variants)</span> : null}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <ProductFlagToggle id={p.id} flag="isActive" value={p.isActive} />
                  </TD>
                  <TD>
                    <ProductFlagToggle id={p.id} flag="isFeatured" value={p.isFeatured} />
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Link href={`/shop/${p.slug}`} target="_blank" className="text-xs text-slate-500 hover:underline">
                        View
                      </Link>
                      <Link href={`/admin/products/${p.id}`}>
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
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
    </>
  );
}
