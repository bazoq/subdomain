import { ImageIcon } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { getFeaturedItems } from "../queries";
import { rs } from "../strings";
import { itemStartingPrice } from "../types";
import { TagBadges } from "./tag-badges";

/** Server component: horizontally scrolling strip of featured items / deals for home pages. */
export async function DealsStrip({ ctx, take = 8, title, className }: { ctx: SiteContext; take?: number; title?: string; className?: string }) {
  const items = await getFeaturedItems(ctx.tenant.id, take);
  if (!items.length) return null;
  const lang = ctx.lang;
  return (
    <section className={cn("py-10", className)}>
      <div className="t-container">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold">{title ?? t(rs.deals, lang)}</h2>
          <a href="/menu" className="text-sm font-medium text-t-primary underline-offset-4 hover:underline">
            {t(rs.seeFullMenu, lang)} →
          </a>
        </div>
      </div>
      <div className="t-container">
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          {items.map((item) => (
            <a key={item.id} href={`/menu#item-${item.slug}`} className="t-card group w-56 shrink-0 snap-start overflow-hidden sm:w-64">
              <div className="relative aspect-[4/3] overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={t(item.name, lang)} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-t-muted text-t-muted-fg">
                    <ImageIcon className="size-8 opacity-40" />
                  </div>
                )}
                <TagBadges tags={item.tags} lang={lang} className="absolute start-2 top-2" compact />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate font-medium">{t(item.name, lang)}</span>
                <span className="shrink-0 text-sm font-bold text-t-primary">{formatPKR(itemStartingPrice(item))}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
