import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SiteContext } from "@/templates/types";
import { getFeaturedProducts } from "../queries";
import { ProductGrid } from "./product-grid";
import type { ProductCardLayout } from "./product-card";
import { sui } from "./strings";

/**
 * Server component for template home pages: featured products section with a "view all" link.
 * Renders nothing when the tenant has no featured products. Quick-add buttons require a CartProvider
 * (templates should wrap their layout with <EcommerceProviders ctx={ctx}>).
 */
export async function FeaturedProducts({
  ctx,
  take = 8,
  title,
  subtitle,
  eyebrow,
  layout = "grid",
  showQuickAdd = true,
  columns = 4,
  className,
}: {
  ctx: SiteContext;
  take?: number;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  eyebrow?: LocalizedString | string;
  layout?: ProductCardLayout;
  showQuickAdd?: boolean;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const products = await getFeaturedProducts(ctx.tenant.id, take);
  if (!products.length) return null;
  return (
    <section className={cn("py-14 sm:py-20", className)}>
      <div className="t-container">
        <SectionHeading eyebrow={eyebrow} title={title ?? sui.featuredTitle} subtitle={subtitle} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} layout={layout} showQuickAdd={showQuickAdd} columns={columns} />
        <div className="mt-8 text-center">
          <Link href="/shop" className="t-btn t-btn-outline">
            {t(sui.viewAll, ctx.lang)} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
