/**
 * bakery-01 "Sugar & Flour" (#1201)
 * Pastel patisserie: soft pink header with script logo, cake photo in a circular frame,
 * custom-cake pastel card with occasion icons, round-image menu cards, scalloped section edges.
 */
import * as React from "react";
import { ArrowRight, Baby, Briefcase, Cake, Gift, Heart, MapPin, Moon, PartyPopper, Plus, Sparkles, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { customCakeSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { getDeliveryZones, getFeaturedItems } from "@/modules/restaurant/queries";
import { itemStartingPrice, toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { TagBadges } from "@/modules/restaurant/ui/tag-badges";

/* ---------- signature: scalloped edge (CSS radial gradient, theme tokens only) ---------- */
function Scallop({ token, flip, className }: { token: "bg" | "muted" | "accent" | "card"; flip?: boolean; className?: string }) {
  const color = `var(--t-${token})`;
  return (
    <div
      aria-hidden="true"
      className={cn("h-4 w-full", flip && "rotate-180", className)}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0, ${color} 11px, transparent 12px)`,
        backgroundSize: "28px 16px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

const OCCASIONS = [
  { icon: Cake, en: "Birthday", ur: "سالگرہ" },
  { icon: Heart, en: "Wedding", ur: "شادی" },
  { icon: Sparkles, en: "Anniversary", ur: "سالگرہِ شادی" },
  { icon: Baby, en: "Baby shower", ur: "بے بی شاور" },
  { icon: Moon, en: "Eid", ur: "عید" },
  { icon: Briefcase, en: "Corporate", ur: "کارپوریٹ" },
];

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: { en: "Order cake", ur: "کیک آرڈر کریں" }, href: "/custom-cake" }}
          rightSlot={<CartCountLink host={ctx.host} label={t(rs.yourOrder, ctx.lang)} className="rounded-full border border-t-border bg-t-card px-3 py-2 text-sm font-semibold text-t-primary" />}
          className="border-b-0 bg-t-accent/40 backdrop-blur [&_.t-btn-primary]:rounded-full [&_a>span.font-heading]:font-normal [&_a>span.font-heading]:text-t-primary [&_nav_a]:rounded-full"
        />
        <main id="main" className="flex-1">{children}</main>
        <Scallop token="muted" />
        <SiteFooter ctx={ctx} variant="light" className="border-t-0" />
        <CartBar ctx={rc} className="pb-20 sm:pb-6" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: circular cake frame + script eyebrow ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -start-24 top-10 size-72 rounded-full bg-t-accent/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -end-24 bottom-0 size-80 rounded-full bg-t-muted blur-3xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up order-2 text-center lg:order-1 lg:text-start">
          {h.eyebrow ? <span className="font-heading text-2xl text-t-primary">{h.eyebrow}</span> : null}
          <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-t-muted-fg lg:mx-0">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-full bg-t-accent px-6 text-t-accent-fg hover:brightness-95" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full border border-t-border bg-t-card px-3 py-1.5 text-sm font-medium text-t-fg">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative aspect-square w-72 sm:w-96 lg:w-[28rem]">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-t-primary/40" aria-hidden="true" />
            <div className="absolute inset-4 overflow-hidden rounded-full bg-t-accent shadow-xl ring-8 ring-t-card">
              <Img src={h.image} alt="" className="h-full w-full object-cover" fallback={<Cake className="size-16 text-t-primary/50" />} />
            </div>
            <span className="absolute -bottom-1 end-4 flex size-20 items-center justify-center rounded-full bg-t-primary text-t-primary-fg shadow-lg [&_svg]:size-8">
              <Cake />
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Custom cake: pastel card with occasion icons ---------- */
function CustomCake({ ctx }: TemplatePageProps) {
  const d = section(ctx, customCakeSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="custom-cake" className="bg-t-muted">
      <Scallop token="bg" />
      <Container className="py-14 sm:py-20">
        <div className="grid items-center gap-10 rounded-[2.5rem] bg-t-card p-6 shadow-sm sm:p-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="font-heading text-xl text-t-primary">{t(rs.customCake, lang)}</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(d.title, lang)}</h2>
            <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
            <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {OCCASIONS.map((o) => (
                <li key={o.en} className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-t-muted px-2 py-3 text-center text-xs font-semibold text-t-fg">
                  <span className="flex size-10 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                    <o.icon className="size-5" />
                  </span>
                  {lang === "ur" ? o.ur : o.en}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute inset-0 rotate-6 rounded-[2.5rem] bg-t-accent" aria-hidden="true" />
            <Img src={d.image} alt="" className="relative h-full w-full rounded-[2.5rem] object-cover shadow-md" fallback={<PartyPopper className="size-14 text-t-primary/40" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Featured menu: round-image cards ---------- */
async function FeaturedMenu({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredMenuSection);
  if (!d) return null;
  const items = await getFeaturedItems(ctx.tenant.id, d.count || 6);
  if (!items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="menu" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} className="[&_.t-eyebrow]:font-heading [&_.t-eyebrow]:text-lg [&_.t-eyebrow]:normal-case [&_.t-eyebrow]:tracking-normal [&_.t-eyebrow]:text-t-primary" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const name = t(item.name, lang);
            return (
              <li key={item.id} className="group flex flex-col items-center rounded-[2rem] border border-t-border bg-t-card p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <a href={`/menu#item-${item.slug}`} className="relative size-40 overflow-hidden rounded-full bg-t-muted ring-4 ring-t-accent">
                  <Img src={item.imageUrl ?? ""} alt={name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" fallback={<Cake className="size-10 text-t-primary/40" />} />
                </a>
                <TagBadges tags={item.tags} lang={lang} className="mt-4 justify-center" />
                <h3 className="mt-3 text-lg font-bold">{name}</h3>
                {t(item.description, lang) ? <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{t(item.description, lang)}</p> : null}
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-semibold text-t-primary">
                    {item.sizes.length > 1 ? <span className="me-1 text-xs font-normal text-t-muted-fg">{t(rs.from, lang)}</span> : null}
                    {formatPKR(itemStartingPrice(item))}
                  </span>
                  <a href={`/menu#item-${item.slug}`} className="t-btn t-btn-primary h-9 rounded-full px-3 text-sm" aria-label={`${t(rs.add, lang)} ${name}`}>
                    <Plus className="size-4" /> {t(rs.add, lang)}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline rounded-full px-6 text-t-fg" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: pastel pills ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  return (
    <section id="delivery" className="bg-t-bg py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <span className="font-heading text-xl text-t-primary">{t(rs.deliveringTo, lang)}</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(d.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
        </div>
        {zones.length ? (
          <ul className="flex flex-wrap gap-3">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-3 rounded-full border border-t-border bg-t-card py-2 pe-4 ps-2 text-sm shadow-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                  <MapPin className="size-4" />
                </span>
                <span className="font-semibold">{z.name}</span>
                <span className="text-t-muted-fg">{z.fee ? formatPKR(z.fee) : t({ en: "Free", ur: "مفت" }, lang)}</span>
                {z.etaMins ? (
                  <span className="inline-flex items-center gap-1 text-xs text-t-muted-fg">
                    <Timer className="size-3" /> {z.etaMins} {t(rs.mins, lang)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-t-border p-8 text-center text-sm text-t-muted-fg">
            <MapPin className="mx-auto mb-2 size-6 opacity-50" /> {ctx.settings.contact.city || ctx.settings.contact.address}
          </div>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: pastel card ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  return (
    <section id="hours" className="bg-t-muted">
      <Scallop token="bg" />
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-xl rounded-[2.5rem] bg-t-card p-6 shadow-sm sm:p-10">
          <HoursTable ctx={ctx} title={t(d.title, ctx.lang)} className="[&_h3]:font-heading [&_h3]:text-2xl [&_h3]:font-normal [&_h3]:text-t-primary" />
        </div>
      </Container>
      <Scallop token="bg" flip />
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
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => (
          <div className="bg-t-muted">
            <Scallop token="bg" />
            <ProcessBlock ctx={ctx} variant="steps" className="[&_.t-eyebrow]:font-heading [&_.t-eyebrow]:text-lg [&_.t-eyebrow]:normal-case [&_.t-eyebrow]:tracking-normal [&_.t-eyebrow]:text-t-primary [&_ol_span:first-child]:bg-t-accent [&_ol_span:first-child]:text-t-accent-fg" />
            <Scallop token="bg" flip />
          </div>
        ),
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_img]:rounded-[3rem] [&_.t-eyebrow]:font-heading [&_.t-eyebrow]:text-lg [&_.t-eyebrow]:normal-case [&_.t-eyebrow]:tracking-normal [&_.t-eyebrow]:text-t-primary" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className="[&_button]:rounded-[2rem] [&_.t-eyebrow]:font-heading [&_.t-eyebrow]:text-lg [&_.t-eyebrow]:normal-case [&_.t-eyebrow]:tracking-normal [&_.t-eyebrow]:text-t-primary" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-bg [&_.t-eyebrow]:font-heading [&_.t-eyebrow]:text-lg [&_.t-eyebrow]:normal-case [&_.t-eyebrow]:tracking-normal [&_.t-eyebrow]:text-t-primary" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="[&_.t-eyebrow]:font-heading [&_.t-eyebrow]:text-lg [&_.t-eyebrow]:normal-case [&_.t-eyebrow]:tracking-normal [&_.t-eyebrow]:text-t-primary" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="[&_.t-btn]:rounded-full [&>div>div]:rounded-[2.5rem]" />,
      })}
      <section className="py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-t-muted-fg sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <Gift className="size-4 text-t-primary" /> {t(rs.customCake, ctx.lang)}
          </span>
          <SmartLink href="/custom-cake" ctx={ctx} className="font-semibold text-t-primary hover:underline">
            {ctx.lang === "ur" ? "کیک آرڈر کریں" : "Order cake"} <ArrowRight className="inline size-4 rtl:rotate-180" />
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
