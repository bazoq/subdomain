import { PackageSearch } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LangCtx, ProductDTO } from "../types";
import { ProductCard, type ProductCardLayout } from "./product-card";
import { sui } from "./strings";

/** Responsive product grid (or stacked list) with an empty state. */
export function ProductGrid({
  products,
  ctx,
  layout = "grid",
  showQuickAdd = false,
  columns = 4,
  emptyText,
  className,
}: {
  products: ProductDTO[];
  ctx: LangCtx;
  layout?: ProductCardLayout;
  showQuickAdd?: boolean;
  /** desktop column count for grid/minimal layouts */
  columns?: 2 | 3 | 4 | 5;
  emptyText?: string;
  className?: string;
}) {
  if (!products.length) {
    return (
      <div className={cn("t-card flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
        <PackageSearch className="mb-3 size-10 text-t-muted-fg" />
        <p className="font-medium">{emptyText ?? t(sui.noProducts, ctx.lang)}</p>
      </div>
    );
  }
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-3 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5" }[columns];
  return (
    <div className={cn(layout === "list" ? "flex flex-col gap-3" : cn("grid grid-cols-2 gap-3 sm:gap-5", cols), className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} ctx={ctx} layout={layout} showQuickAdd={showQuickAdd} />
      ))}
    </div>
  );
}
