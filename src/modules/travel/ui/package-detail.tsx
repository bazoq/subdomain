import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, MapPin, Moon, Sun, X } from "lucide-react";
import type { TravelPackage } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatPKR, whatsappLink } from "@/lib/utils";
import { kindLabel, parseDepartures, parseItinerary, parseLocalizedList } from "../helpers";
import { ts } from "../strings";
import { PackageGallery } from "./gallery";
import { ItineraryAccordion } from "./itinerary-accordion";
import { BookingForm } from "./booking-form";

export function PackageDetail({ pkg, ctx, className }: { pkg: TravelPackage; ctx: SiteContext; className?: string }) {
  const lang = ctx.lang;
  const title = t(pkg.title as LocalizedString, lang);
  const summary = pkg.summary as LocalizedString;
  const itinerary = parseItinerary(pkg.itinerary);
  const inclusions = parseLocalizedList(pkg.inclusions);
  const exclusions = parseLocalizedList(pkg.exclusions);
  const departures = parseDepartures(pkg.departures, true);
  const wa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  const url = `https://${ctx.host}/packages/${pkg.slug}`;

  return (
    <div className={cn("grid gap-8 lg:grid-cols-[1fr_360px]", className)}>
      <div className="min-w-0">
        <Link href="/packages" className="inline-flex items-center gap-1 text-sm text-t-muted-fg hover:text-t-primary">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t(ts.backToPackages, lang)}
        </Link>
        <header className="mt-4 mb-6">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-t-primary px-2 py-0.5 text-t-primary-fg">{kindLabel(pkg.kind, lang)}</span>
            {pkg.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-t-accent-fg">{t(ui.featured, lang)}</span> : null}
          </div>
          <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-t-muted-fg">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {pkg.destination}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sun className="size-4" aria-hidden="true" />
              {pkg.days} {t(ts.days, lang)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Moon className="size-4" aria-hidden="true" />
              {pkg.nights} {t(ts.nights, lang)}
            </span>
          </p>
        </header>

        <PackageGallery images={pkg.images} alt={title} />

        {t(summary, lang) ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(ts.overview, lang)}</h2>
            <RichText value={summary} lang={lang} className="mt-3" />
          </section>
        ) : null}

        {itinerary.length ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(ts.itinerary, lang)}</h2>
            <ItineraryAccordion items={itinerary} lang={lang} className="mt-3" />
          </section>
        ) : null}

        {inclusions.length || exclusions.length ? (
          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            {inclusions.length ? (
              <div>
                <h2 className="font-heading text-xl font-bold">{t(ts.inclusions, lang)}</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {inclusions.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{t(x, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {exclusions.length ? (
              <div>
                <h2 className="font-heading text-xl font-bold">{t(ts.exclusions, lang)}</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {exclusions.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                      <span>{t(x, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="font-heading text-xl font-bold">{t(ts.departures, lang)}</h2>
          {departures.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {departures.map((d) => (
                <li key={d} className="inline-flex items-center gap-1.5 rounded-full border border-t-border bg-t-card px-3 py-1.5 text-sm">
                  <CalendarDays className="size-3.5 text-t-primary" aria-hidden="true" />
                  {new Date(d).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-t-muted-fg">{t(ts.noDepartures, lang)}</p>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div id="book" className="t-card scroll-mt-24 p-5 shadow-lg">
          <p className="text-[11px] uppercase tracking-wide text-t-muted-fg">{t(ts.from, lang)}</p>
          <p className="font-heading text-3xl font-bold text-t-primary">{formatPKR(pkg.price)}</p>
          <p className="text-xs text-t-muted-fg">{pkg.priceNote || t(ts.perPerson, lang)}</p>
          <h2 className="font-heading mt-5 text-lg font-bold">{t(ts.bookThis, lang)}</h2>
          <BookingForm packageId={pkg.id} ctx={ctx} departures={departures} className="mt-3" />
          {wa ? (
            <a href={whatsappLink(wa, `Assalam o Alaikum, I am interested in "${title}" (${url})`)} target="_blank" rel="noreferrer" className="t-btn t-btn-outline mt-3 w-full text-sm">
              {t(ts.askWhatsApp, lang)}
            </a>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
