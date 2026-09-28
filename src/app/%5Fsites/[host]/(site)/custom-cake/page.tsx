import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui, type Lang } from "@/lib/i18n";
import type { SiteContext } from "@/templates/types";
import { rs } from "@/modules/restaurant/strings";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { CustomCakeForm } from "@/modules/restaurant/ui/custom-cake-form";

const intro = (lang: Lang) =>
  lang === "ur"
    ? "اپنے موقع کے لیے کیک ڈیزائن کروائیں۔ تفصیلات بھیجیں، ہم قیمت اور دستیابی کی تصدیق کے لیے رابطہ کریں گے۔ کم از کم 24 گھنٹے پہلے آرڈر کریں۔"
    : "Tell us about your occasion and we will call you to confirm the design, price and pickup time. Please order at least 24 hours in advance.";

/** Bakeries only. `bakery` is a business category, not a module, so the gate is the restaurant module plus the category key. */
function requireBakery(ctx: SiteContext): void {
  requireModulePage(ctx, "restaurant");
  if (ctx.category.key !== "bakery") notFound();
}

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(rs.customCake, ctx.lang), description: intro(ctx.lang), path: "/custom-cake" });
}

export default async function CustomCakePage() {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireBakery(ctx);
  const lang = ctx.lang;
  return (
    <div className="t-container py-8 sm:py-12">
      <JsonLd data={breadcrumbJsonLd(tc, [{ name: t(ui.home, lang), path: "/" }, { name: t(rs.customCake, lang), path: "/custom-cake" }])} />
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t(rs.customCake, lang)}</h1>
        <p className="mt-2 text-t-muted-fg">{intro(lang)}</p>
        <CustomCakeForm ctx={toRestaurantCtx(ctx)} className="mt-8" />
      </div>
    </div>
  );
}
