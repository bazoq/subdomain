import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui, type Lang } from "@/lib/i18n";
import { dayName } from "@/templates/ui";
import { rs } from "@/modules/restaurant/strings";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { ReservationForm } from "@/modules/restaurant/ui/reservation-form";
import { OpenBadge } from "@/modules/restaurant/ui/open-badge";

const intro = (lang: Lang) => (lang === "ur" ? "اپنی تفصیلات بھیجیں، ہم فون پر تصدیق کریں گے۔" : "Send us your details and we will confirm your table by phone.");

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(rs.reserveTable, ctx.lang), description: intro(ctx.lang), path: "/reserve" });
}

export default async function ReservePage() {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireModulePage(ctx, "restaurant");
  if (!ctx.settings.restaurant.reservations) notFound();
  const lang = ctx.lang;
  const hours = ctx.settings.hours;
  return (
    <div className="t-container py-8 sm:py-12">
      <JsonLd data={breadcrumbJsonLd(tc, [{ name: t(ui.home, lang), path: "/" }, { name: t(rs.reserveTable, lang), path: "/reserve" }])} />
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t(rs.reserveTable, lang)}</h1>
          <p className="mt-2 text-t-muted-fg">{intro(lang)}</p>
          <OpenBadge ctx={ctx} className="mt-3" />
          <ReservationForm ctx={toRestaurantCtx(ctx)} className="mt-8" />
        </div>
        <aside className="lg:col-span-2">
          <div className="t-card p-5">
            <h2 className="font-heading text-lg font-bold">{ctx.tenant.name}</h2>
            {ctx.settings.contact.address ? <p className="mt-1 text-sm text-t-muted-fg">{ctx.settings.contact.address}</p> : null}
            {ctx.settings.contact.phone ? (
              <a href={`tel:${ctx.settings.contact.phone}`} className="mt-2 block text-sm font-medium text-t-primary">
                {ctx.settings.contact.phone}
              </a>
            ) : null}
            {hours.length ? (
              <ul className="mt-4 space-y-1 text-sm">
                {hours.map((h) => (
                  <li key={h.day} className="flex justify-between">
                    <span>{dayName(h.day, lang)}</span>
                    <span className="text-t-muted-fg">{h.closed ? (lang === "ur" ? "بند" : "Closed") : `${h.open} – ${h.close}`}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
