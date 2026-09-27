/**
 * bakery-05 "Morning Bun" (#1205)
 * Cozy cafe-bakery: cream and sage with DM Serif headings, pickup-first ordering, featured
 * bakes shown as coffee-pairing cards and a hanging cafe-sign block for hours and location.
 */
import { ArrowRight, Coffee, Croissant, MapPin, Plus, ShoppingBag, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { customCakeSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat, isOpenNow } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { getDeliveryZones, getFeaturedItems } from "@/modules/restaurant/queries";
import { itemStartingPrice, toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { TagBadges } from "@/modules/restaurant/ui/tag-badges";

/** Decorative pairing suggestions shown on the menu cards (cycled by position). */
const PAIRS_WITH: LocalizedString = { en: "Pairs with", ur: "ساتھ بہترین" };
const PAIRINGS: LocalizedString[] = [
  { en: "Flat white", ur: "فلیٹ وائٹ" },
  { en: "Cappuccino", ur: "کیپوچینو" },
  { en: "Karak chai", ur: "کڑک چائے" },
  { en: "Cold brew", ur: "کولڈ برو" },
];

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: { en: "Order for pickup", ur: "پک اپ آرڈر کریں" }, href: "/menu" }}
          rightSlot={<CartCountLink host={ctx.host} className="px-2 py-2 text-sm font-medium text-t-primary" />}
          className="border-b border-t-border bg-t-bg/90 [&_a>span.font-heading]:font-normal [&_a>span.font-heading]:tracking-wide [&_nav_a]:text-t-primary"
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="light" />
        <CartBar ctx={rc} className="pb-20 sm:pb-6" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: calm serif headline + cozy cafe photo ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const prep = ctx.settings.restaurant.prepTimeMins;
  return (
    <section className="bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_1.05fr] lg:py-24">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? <span className="text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">{t(h.eyebrow, lang)}</span> : null}
          <h1 className="font-heading mt-5 text-4xl font-normal leading-[1.15] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-6 py-3" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="inline-flex items-center gap-1 text-sm font-semibold text-t-primary underline-offset-4 hover:underline" />
          </div>
          <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-t-muted-fg">
            {ctx.settings.restaurant.pickup ? (
              <li className="inline-flex items-center gap-2">
                <ShoppingBag className="size-4 text-t-primary" /> {t(ui.pickup, lang)}
              </li>
            ) : null}
            {prep ? (
              <li className="inline-flex items-center gap-2">
                <Timer className="size-4 text-t-primary" /> {t(rs.eta, lang)}: {prep} {t(rs.mins, lang)}
              </li>
            ) : null}
            {h.badges?.map((b, i) => (
              <li key={i} className="inline-flex items-center gap-2">
                <span className="text-t-primary [&_svg]:size-4">
                  <Icon name={b.icon} />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <span className="absolute -top-5 end-6 hidden size-24 rounded-full bg-t-accent/50 lg:block" aria-hidden="true" />
          <Img
            src={h.image}
            loading="eager"
            fetchPriority="high"
            alt=""
            className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-sm"
            fallback={<Coffee className="size-14 text-t-primary/40" />}
          />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: featured bakes as coffee-pairing cards ---------- */
async function PairingMenu({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredMenuSection);
  if (!d) return null;
  const items = await getFeaturedItems(ctx.tenant.id, d.count || 6);
  if (!items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="menu" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} className="[&_h2]:font-normal" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const name = t(item.name, lang);
            const desc = t(item.description, lang);
            return (
              <li key={item.id} className="flex flex-col overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card transition hover:shadow-md">
                <a href={`/menu#item-${item.slug}`} className="block aspect-[4/3] w-full overflow-hidden bg-t-muted">
                  <Img src={item.imageUrl ?? ""} alt={name} className="h-full w-full object-cover" fallback={<Croissant className="size-10 text-t-primary/40" />} />
                </a>
                <div className="flex flex-1 flex-col p-5">
                  <TagBadges tags={item.tags} lang={lang} className="mb-2" />
                  <h3 className="font-heading text-xl font-normal">{name}</h3>
                  {desc ? <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{desc}</p> : null}
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-t-accent/30 px-3 py-1.5 text-xs font-semibold text-t-fg">
                    <Coffee className="size-3.5 text-t-primary" />
                    {t(PAIRS_WITH, lang)} · {t(PAIRINGS[i % PAIRINGS.length], lang)}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-t-border pt-4">
                    <span className="font-semibold text-t-primary">
                      {item.sizes.length > 1 ? <span className="me-1 text-xs font-normal text-t-muted-fg">{t(rs.from, lang)}</span> : null}
                      {formatPKR(itemStartingPrice(item))}
                    </span>
                    <a href={`/menu#item-${item.slug}`} className="t-btn t-btn-primary h-9 px-3 text-sm" aria-label={`${t(rs.add, lang)} ${name}`}>
                      <Plus className="size-4" /> {t(rs.add, lang)}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline px-6 text-t-primary" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Custom cake: quiet sage card ---------- */
function CustomCake({ ctx }: TemplatePageProps) {
  const d = section(ctx, customCakeSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="custom-cake" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 rounded-[2rem] border border-t-border bg-t-card p-6 sm:p-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">{t(rs.customCake, lang)}</span>
            <h2 className="font-heading mt-3 text-3xl font-normal sm:text-4xl">{t(d.title, lang)}</h2>
            <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-square w-full rounded-[2rem] object-cover" fallback={<Croissant className="size-12 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: quiet list, pickup-first ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  return (
    <section id="delivery" className="bg-t-bg py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">{t(rs.deliveringTo, lang)}</span>
          <h2 className="font-heading mt-3 text-3xl font-normal sm:text-4xl">{t(d.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
          {ctx.settings.restaurant.pickup ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-t-accent/30 px-4 py-2 text-sm font-semibold">
              <ShoppingBag className="size-4 text-t-primary" /> {t(ui.pickup, lang)}
            </p>
          ) : null}
        </div>
        {zones.length ? (
          <ul className="divide-y divide-t-border border-y border-t-border">
            {zones.map((z) => (
              <li key={z.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4">
                <span className="font-heading text-lg font-normal">{z.name}</span>
                <span className="ms-auto text-sm text-t-muted-fg">{z.fee ? formatPKR(z.fee) : t({ en: "Free", ur: "مفت" }, lang)}</span>
                {z.etaMins ? (
                  <span className="inline-flex items-center gap-1 text-sm text-t-muted-fg">
                    <Timer className="size-3.5" /> {z.etaMins} {t(rs.mins, lang)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="inline-flex items-center gap-2 rounded-[var(--t-radius)] border border-dashed border-t-border p-6 text-sm text-t-muted-fg">
            <MapPin className="size-4 shrink-0 text-t-primary" /> {ctx.settings.contact.address || ctx.settings.contact.city}
          </p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Signature: hours + location as a hanging cafe sign ---------- */
function CafeSign({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  const lang = ctx.lang;
  const open = isOpenNow(ctx.settings.hours);
  return (
    <section id="hours" className="bg-t-muted py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="flex justify-center gap-24" aria-hidden="true">
            <span className="size-3 rounded-full bg-t-primary" />
            <span className="size-3 rounded-full bg-t-primary" />
          </div>
          <div className="flex justify-center gap-24" aria-hidden="true">
            <span className="h-8 w-px bg-t-primary/50" />
            <span className="h-8 w-px bg-t-primary/50" />
          </div>
          <div className="rounded-[2rem] border-2 border-t-primary/40 bg-t-card p-7 text-center shadow-sm sm:p-10">
            <span className="font-heading block text-3xl font-normal text-t-primary sm:text-4xl">
              {open === null ? t(d.title, lang) : open ? t(ui.openNow, lang) : t(ui.closedNow, lang)}
            </span>
            <span className="mx-auto mt-4 block h-px w-16 bg-t-primary/40" aria-hidden="true" />
            <HoursTable ctx={ctx} showStatus={false} className="mt-6 text-start" />
            {ctx.settings.contact.address ? (
              <p className="mt-7 flex items-start justify-center gap-2 text-sm text-t-muted-fg">
                <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" /> {ctx.settings.contact.address}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        customCake: () => <CustomCake ctx={ctx} />,
        featuredMenu: () => <PairingMenu ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-bg [&_h2]:font-normal" />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className="bg-t-muted [&_h2]:font-normal [&_img]:rounded-[2rem]" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} className="bg-t-bg [&_h2]:font-normal [&_button]:rounded-[1.5rem]" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <CafeSign ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={2} className="bg-t-bg [&_h2]:font-normal" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted [&_h2]:font-normal" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="bg-t-bg" />,
      })}
      <section className="border-t border-t-border bg-t-bg py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-t-muted-fg sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <Coffee className="size-4 text-t-primary" /> {ctx.settings.contact.city || ctx.settings.contact.address}
          </span>
          <SmartLink href="/menu" ctx={ctx} className="font-semibold text-t-primary hover:underline">
            {t(rs.seeFullMenu, ctx.lang)} <ArrowRight className="inline size-4 rtl:rotate-180" />
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
