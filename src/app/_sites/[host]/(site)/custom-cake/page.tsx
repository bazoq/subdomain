import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext } from "@/server/site";
import { t } from "@/lib/i18n";
import { rs } from "@/modules/restaurant/strings";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { CustomCakeForm } from "@/modules/restaurant/ui/custom-cake-form";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(rs.customCake, ctx.lang)} · ${ctx.tenant.name}` };
}

export default async function CustomCakePage() {
  const ctx = await getSiteContext();
  if (ctx.category.key !== "bakery") notFound();
  const lang = ctx.lang;
  return (
    <div className="t-container py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t(rs.customCake, lang)}</h1>
        <p className="mt-2 text-t-muted-fg">
          {lang === "ur"
            ? "اپنے موقع کے لیے کیک ڈیزائن کروائیں۔ تفصیلات بھیجیں، ہم قیمت اور دستیابی کی تصدیق کے لیے رابطہ کریں گے۔ کم از کم 24 گھنٹے پہلے آرڈر کریں۔"
            : "Tell us about your occasion and we will call you to confirm the design, price and pickup time. Please order at least 24 hours in advance."}
        </p>
        <CustomCakeForm ctx={toRestaurantCtx(ctx)} className="mt-8" />
      </div>
    </div>
  );
}
