import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFeaturedItems } from "../queries";
import { rs } from "../strings";
import { toRestaurantCtx } from "../types";
import { MenuItemCard, type MenuLayout } from "./menu-item-card";

/** Server component: grid of featured menu items linking to /menu#item-<slug>. Renders nothing when there are none. */
export async function FeaturedItems({
  ctx,
  take = 6,
  title,
  layout = "cards",
  className,
}: {
  ctx: SiteContext;
  take?: number;
  title?: string;
  layout?: MenuLayout;
  className?: string;
}) {
  const items = await getFeaturedItems(ctx.tenant.id, take);
  if (!items.length) return null;
  const rc = toRestaurantCtx(ctx);
  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="t-container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title ?? t(rs.popular, ctx.lang)}</h2>
          <a href="/menu" className="t-btn t-btn-outline hidden text-sm sm:inline-flex">
            {t(rs.seeFullMenu, ctx.lang)}
          </a>
        </div>
        <div className={layout === "cards" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 md:grid-cols-2"}>
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} ctx={rc} layout={layout} />
          ))}
        </div>
        <a href="/menu" className="t-btn t-btn-outline mt-6 flex w-full text-sm sm:hidden">
          {t(rs.seeFullMenu, ctx.lang)}
        </a>
      </div>
    </section>
  );
}
