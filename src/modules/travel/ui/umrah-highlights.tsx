import Link from "next/link";
import { BedDouble, BusFront, FileCheck2, Plane, ShieldCheck, UsersRound } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFeaturedPackages } from "../queries";
import { ts } from "../strings";
import { PackageCard } from "./package-card";

const HIGHLIGHTS = [
  { icon: FileCheck2, title: { en: "Umrah visa processing", ur: "عمرہ ویزا پروسیسنگ" }, text: { en: "Nusuk-registered, visa issued within days.", ur: "نسک رجسٹرڈ، چند دنوں میں ویزا۔" } },
  { icon: Plane, title: { en: "Direct flights", ur: "براہ راست پروازیں" }, text: { en: "PIA, Saudia, Airblue from Lahore, Karachi & Islamabad.", ur: "لاہور، کراچی اور اسلام آباد سے PIA، سعودیہ، ایئر بلیو۔" } },
  { icon: BedDouble, title: { en: "Hotels near Haram", ur: "حرم کے قریب ہوٹل" }, text: { en: "3★ to 5★ options within walking distance of Masjid al-Haram.", ur: "مسجد الحرام سے پیدل فاصلے پر 3★ سے 5★ ہوٹل۔" } },
  { icon: BusFront, title: { en: "Transport & ziyarat", ur: "ٹرانسپورٹ اور زیارات" }, text: { en: "Airport transfers, Makkah–Madinah travel and guided ziyarat.", ur: "ایئرپورٹ ٹرانسفر، مکہ–مدینہ سفر اور رہنمائی کے ساتھ زیارات۔" } },
  { icon: UsersRound, title: { en: "Family & group packages", ur: "فیملی اور گروپ پیکجز" }, text: { en: "Sharing options for families, elders and groups.", ur: "فیملی، بزرگوں اور گروپس کے لیے شیئرنگ آپشنز۔" } },
  { icon: ShieldCheck, title: { en: "Licensed & trusted", ur: "لائسنس یافتہ اور قابل اعتماد" }, text: { en: "Ministry of Religious Affairs enrolled agency.", ur: "وزارت مذہبی امور میں رجسٹرڈ ایجنسی۔" } },
];

/** Umrah-focused section: six trust highlights + up to 3 featured Umrah packages. */
export async function UmrahHighlights({
  ctx,
  title,
  subtitle,
  className,
  showPackages = true,
}: {
  ctx: SiteContext;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  className?: string;
  showPackages?: boolean;
}) {
  const lang = ctx.lang;
  const items = showPackages ? await getFeaturedPackages(ctx.tenant.id, 3, "UMRAH") : [];
  return (
    <section className={cn("py-14 sm:py-20", className)} id="umrah">
      <Container>
        <SectionHeading eyebrow="Umrah" title={title ?? ts.umrahTitle} subtitle={subtitle ?? ts.umrahSubtitle} lang={lang} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h, i) => (
            <li key={i} className="t-card flex gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary">
                <h.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading font-semibold">{t(h.title, lang)}</p>
                <p className="mt-1 text-sm text-t-muted-fg">{t(h.text, lang)}</p>
              </div>
            </li>
          ))}
        </ul>
        {items.length ? (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} ctx={ctx} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/packages?kind=UMRAH" className="t-btn t-btn-primary">
                {t(ts.viewAll, lang)}
              </Link>
            </div>
          </>
        ) : null}
      </Container>
    </section>
  );
}
