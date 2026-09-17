import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { availableStock } from "../pricing";
import type { LangCtx, ProductDTO, VariantDTO } from "../types";
import { fmt, sui } from "./strings";

/** In stock / low stock / out of stock pill. */
export function StockBadge({
  product,
  variant,
  ctx,
  lowThreshold = 5,
  className,
}: {
  product: Pick<ProductDTO, "trackStock" | "stock" | "variants">;
  variant?: Pick<VariantDTO, "stock"> | null;
  ctx: LangCtx;
  lowThreshold?: number;
  className?: string;
}) {
  const avail = availableStock(product, variant);
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold";
  if (avail <= 0) return <span className={cn(base, "bg-red-50 text-red-700", className)}>{t(ui.outOfStock, ctx.lang)}</span>;
  if (Number.isFinite(avail) && avail <= lowThreshold) return <span className={cn(base, "bg-amber-50 text-amber-800", className)}>{fmt(t(sui.lowStock, ctx.lang), { n: avail })}</span>;
  return <span className={cn(base, "bg-emerald-50 text-emerald-700", className)}>{t(ui.inStock, ctx.lang)}</span>;
}
