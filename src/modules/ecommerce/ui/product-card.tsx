import Link from "next/link";
import { FileHeart, Sparkles } from "lucide-react";
import { Img } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isInStock, minPrice, salePercent } from "../pricing";
import type { LangCtx, ProductDTO } from "../types";
import { PriceTag } from "./price-tag";
import { QuickAddButton } from "./quick-add";
import { sui } from "./strings";

export type ProductCardLayout = "grid" | "list" | "minimal";

/**
 * Server-safe product card. `showQuickAdd` renders a client button for simple products
 * (products with variants link to the detail page instead).
 */
export function ProductCard({ product, ctx, layout = "grid", showQuickAdd = false, className }: { product: ProductDTO; ctx: LangCtx; layout?: ProductCardLayout; showQuickAdd?: boolean; className?: string }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const pct = salePercent(product.price, product.comparePrice);
  const from = hasVariants && lowest < product.price ? t(sui.from, lang) : undefined;

  const badges = (
    <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1 rtl:left-auto rtl:right-2">
      {pct ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-[11px] font-bold uppercase text-t-accent-fg">-{pct}%</span> : null}
      {product.isFeatured ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-t-primary px-2 py-0.5 text-[11px] font-semibold text-t-primary-fg">
          <Sparkles className="size-3" /> {t(ui.featured, lang)}
        </span>
      ) : null}
      {product.requiresPrescription ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white">
          <FileHeart className="size-3" /> Rx
        </span>
      ) : null}
    </div>
  );

  const soldOut = !inStock ? (
    <div className="absolute inset-0 flex items-center justify-center bg-t-bg/60">
      <span className="rounded-full bg-t-dark px-3 py-1 text-xs font-semibold uppercase tracking-wide text-t-dark-fg">{t(ui.outOfStock, lang)}</span>
    </div>
  ) : null;

  if (layout === "list") {
    return (
      <article className={cn("t-card group flex gap-4 p-3 transition hover:shadow-md", className)}>
        <Link href={href} className="relative block w-28 shrink-0 overflow-hidden rounded-[var(--t-radius)] bg-t-muted sm:w-36" aria-label={name}>
          <Img src={product.images[0]} alt={name} className="aspect-square h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          {badges}
          {soldOut}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          {product.category ? <span className="text-xs text-t-muted-fg">{t(product.category.name, lang)}</span> : null}
          <h3 className="font-heading line-clamp-2 text-base font-semibold leading-snug">
            <Link href={href} className="hover:text-t-primary">
              {name}
            </Link>
          </h3>
          {t(product.shortDesc, lang) ? <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{t(product.shortDesc, lang)}</p> : null}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
            <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={from} />
            {showQuickAdd && inStock && !hasVariants ? (
              <QuickAddButton product={product} lang={lang} />
            ) : (
              <Link href={href} className="t-btn t-btn-outline px-3 py-2 text-sm">
                {t(ui.viewDetails, lang)}
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  }

  if (layout === "minimal") {
    return (
      <article className={cn("group", className)}>
        <Link href={href} className="relative block overflow-hidden rounded-[var(--t-radius)] bg-t-muted" aria-label={name}>
          <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
          {badges}
          {soldOut}
        </Link>
        <h3 className="mt-2 line-clamp-1 text-sm font-medium">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={from} size="sm" showPercent={false} />
      </article>
    );
  }

  return (
    <article className={cn("t-card group flex flex-col overflow-hidden transition hover:shadow-md", className)}>
      <Link href={href} className="relative block overflow-hidden bg-t-muted" aria-label={name}>
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
        {product.images[1] ? (
          <Img src={product.images[1]} alt="" className="absolute inset-0 aspect-square w-full object-cover opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden="true" />
        ) : null}
        {badges}
        {soldOut}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category ? <span className="text-xs text-t-muted-fg">{t(product.category.name, lang)}</span> : null}
        <h3 className="font-heading line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={from} />
          {showQuickAdd ? (
            inStock && !hasVariants ? (
              <QuickAddButton product={product} lang={lang} className="hidden sm:inline-flex" />
            ) : inStock ? (
              <Link href={href} className="t-btn t-btn-outline hidden px-3 py-2 text-sm sm:inline-flex">
                {t(ui.viewDetails, lang)}
              </Link>
            ) : null
          ) : null}
        </div>
      </div>
    </article>
  );
}
