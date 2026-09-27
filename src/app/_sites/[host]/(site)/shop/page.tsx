import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui } from "@/lib/i18n";
import { getCategories, getProducts } from "@/modules/ecommerce/queries";
import { parseShopSearch, shopHref, type ShopSearch } from "@/modules/ecommerce/shop-params";
import { EcommerceProviders, CategoryChips, PageTitle, ProductGrid, ShopFilters, ShopPagination, sui } from "@/modules/ecommerce/ui";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  // search/sort/page are query params; the canonical is the bare /shop URL
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.shop, ctx.lang), description: t(sui.shopSubtitle, ctx.lang), path: "/shop" });
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearch> }) {
  const [ctx, tc, sp] = await Promise.all([getSiteContext(), requireTenant(), searchParams]);
  requireModulePage(ctx, "ecommerce");
  const { q, sort, page } = parseShopSearch(sp);
  const [categories, result] = await Promise.all([getCategories(ctx.tenant.id), getProducts(ctx.tenant.id, { q, sort, page, take: 24 })]);

  return (
    <EcommerceProviders ctx={ctx}>
      <JsonLd data={breadcrumbJsonLd(tc, [{ name: t(ui.home, ctx.lang), path: "/" }, { name: t(ui.shop, ctx.lang), path: "/shop" }])} />
      <PageTitle title={t(sui.shopTitle, ctx.lang)} subtitle={t(sui.shopSubtitle, ctx.lang)} crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.shop, ctx.lang) }]} />
      <div className="t-container space-y-6 py-8 sm:py-10">
        <CategoryChips categories={categories} ctx={ctx} />
        <ShopFilters ctx={ctx} categories={categories} current={{ q, sort, category: null }} total={result.total} />
        <ProductGrid products={result.items} ctx={ctx} showQuickAdd />
        <ShopPagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => shopHref("/shop", { q, sort, page: p })} ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}
