import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { getCategories, getProducts } from "@/modules/ecommerce/queries";
import { parseShopSearch, shopHref, type ShopSearch } from "@/modules/ecommerce/shop-params";
import { EcommerceProviders, CategoryChips, PageTitle, ProductGrid, ShopFilters, ShopPagination, sui } from "@/modules/ecommerce/ui";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.shop, ctx.lang)} · ${ctx.tenant.name}`, description: t(sui.shopSubtitle, ctx.lang) };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearch> }) {
  const [ctx, sp] = await Promise.all([getSiteContext(), searchParams]);
  const { q, sort, page } = parseShopSearch(sp);
  const [categories, result] = await Promise.all([getCategories(ctx.tenant.id), getProducts(ctx.tenant.id, { q, sort, page, take: 24 })]);

  return (
    <EcommerceProviders ctx={ctx}>
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
