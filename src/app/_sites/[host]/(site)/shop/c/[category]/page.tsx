import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui } from "@/lib/i18n";
import { getCategories, getCategoryBySlug, getProducts } from "@/modules/ecommerce/queries";
import { parseShopSearch, shopHref, type ShopSearch } from "@/modules/ecommerce/shop-params";
import { EcommerceProviders, CategoryChips, PageTitle, ProductGrid, ShopFilters, ShopPagination, sui } from "@/modules/ecommerce/ui";

type Params = { category: string };
type Search = ShopSearch;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const [ctx, tc, { category }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const cat = await getCategoryBySlug(ctx.tenant.id, category);
  if (!cat) return {};
  return tenantPageMetadata(tc, ctx.lang, {
    title: `${t(cat.name, ctx.lang)} · ${t(ui.shop, ctx.lang)}`,
    description: t(sui.shopSubtitle, ctx.lang),
    // search/sort/page are query params; the canonical is the bare category URL
    path: `/shop/c/${cat.slug}`,
    image: cat.imageUrl,
  });
}

export default async function ShopCategoryPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const [ctx, tc, { category }, sp] = await Promise.all([getSiteContext(), requireTenant(), params, searchParams]);
  requireModulePage(ctx, "ecommerce");
  const cat = await getCategoryBySlug(ctx.tenant.id, category);
  if (!cat) notFound();
  const { q, sort, page } = parseShopSearch(sp);
  const [categories, result] = await Promise.all([getCategories(ctx.tenant.id), getProducts(ctx.tenant.id, { categorySlug: cat.slug, q, sort, page, take: 24 })]);
  const base = `/shop/c/${cat.slug}`;

  return (
    <EcommerceProviders ctx={ctx}>
      <JsonLd data={breadcrumbJsonLd(tc, [{ name: t(ui.home, ctx.lang), path: "/" }, { name: t(ui.shop, ctx.lang), path: "/shop" }, { name: t(cat.name, ctx.lang), path: base }])} />
      <PageTitle
        title={t(cat.name, ctx.lang)}
        crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.shop, ctx.lang), href: "/shop" }, { label: t(cat.name, ctx.lang) }]}
      />
      <div className="t-container space-y-6 py-8 sm:py-10">
        <CategoryChips categories={categories} active={cat.slug} ctx={ctx} />
        <ShopFilters ctx={ctx} categories={categories} current={{ q, sort, category: cat.slug }} total={result.total} />
        <ProductGrid products={result.items} ctx={ctx} showQuickAdd />
        <ShopPagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => shopHref(base, { q, sort, page: p })} ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}
