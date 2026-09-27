import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui, type Lang } from "@/lib/i18n";
import { getMenu } from "@/modules/restaurant/queries";
import { menuJsonLd, restaurantMenuLinkJsonLd } from "@/modules/restaurant/seo";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { OpenBadge } from "@/modules/restaurant/ui/open-badge";
import { MenuBrowser } from "@/modules/restaurant/ui/menu-browser";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";

const describe = (name: string, lang: Lang) => (lang === "ur" ? `${name} کا مکمل مینیو دیکھیں اور آن لائن آرڈر کریں۔` : `Browse the full ${name} menu and order online for delivery or pickup.`);

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.menu, ctx.lang), description: describe(ctx.tenant.name, ctx.lang), path: "/menu" });
}

export default async function MenuPage() {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireModulePage(ctx, "restaurant");
  const categories = await getMenu(ctx.tenant.id);
  const rc = toRestaurantCtx(ctx);
  const defaultType = ctx.settings.restaurant.delivery ? "DELIVERY" : ctx.settings.restaurant.pickup ? "PICKUP" : "DINE_IN";
  const crumbs = breadcrumbJsonLd(tc, [{ name: t(ui.home, ctx.lang), path: "/" }, { name: t(ui.menu, ctx.lang), path: "/menu" }]);
  // Restaurant → hasMenu → Menu → MenuSection → MenuItem (PKR offers); only when there is something to list.
  const jsonLd = categories.some((c) => c.items.length > 0) ? [crumbs, restaurantMenuLinkJsonLd(tc), menuJsonLd(tc, categories, ctx.lang)] : [crumbs];

  return (
    <OrderProvider host={ctx.host} defaultOrderType={defaultType}>
      <JsonLd data={jsonLd} />
      <div className="t-container py-8 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t(ui.menu, ctx.lang)}</h1>
            <p className="mt-1 text-t-muted-fg">{ctx.lang === "ur" ? "اپنی پسندیدہ ڈشز منتخب کریں اور آرڈر کریں۔" : "Pick your favourites and order in a few taps."}</p>
          </div>
          <OpenBadge ctx={ctx} />
        </div>
        {categories.length === 0 ? (
          <p className="py-20 text-center text-t-muted-fg">{ctx.lang === "ur" ? "مینیو جلد آ رہا ہے۔" : "Our menu is coming soon."}</p>
        ) : (
          <MenuBrowser ctx={rc} categories={categories} layout="cards" columns={3} />
        )}
      </div>
      <CartBar ctx={rc} />
      <CartDrawer ctx={rc} />
    </OrderProvider>
  );
}
