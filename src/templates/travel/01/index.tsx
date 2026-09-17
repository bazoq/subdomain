/**
 * travel-01 "Horizon Travels" (#801)
 * Classic sky-blue agency. White header with blue top bar (IATA, phone), photo hero
 * with PackageSearch card, destinations as image tiles with "from Rs" notes, Umrah block
 * with Kaaba image. Friendly grid, blue/orange, rounded cards.
 */
import * as React from "react";
import { ArrowRight, Check, MapPin, Phone, Mail, Plane } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedPackages, PackageSearch } from "@/modules/travel/ui";
import { getDestinations } from "@/modules/travel/queries";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const c = ctx.settings.contact;
  const hero = section(ctx, heroSection);
  const wa = c.whatsapp || c.phone;
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      {/* blue top bar: trust badges + phone */}
      <div className="bg-t-primary text-t-primary-fg">
        <Container className="flex h-9 items-center justify-between gap-4 text-xs">
          <ul className="flex items-center gap-4">
            {hero?.badges?.slice(0, 2).map((b, i) => (
              <li key={i} className="hidden items-center gap-1.5 font-semibold sm:flex">
                <Icon name={b.icon} className="size-3.5" /> {b.text}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            {c.phone ? (
              <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 font-semibold hover:underline">
                <Phone className="size-3.5" /> {c.phone}
              </a>
            ) : null}
            {c.email ? (
              <a href={`mailto:${c.email}`} className="hidden items-center gap-1.5 hover:underline md:flex">
                <Mail className="size-3.5" /> {c.email}
              </a>
            ) : null}
          </div>
        </Container>
      </div>
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={{ label: ui.getQuote, href: "/contact" }}
        rightSlot={
          wa ? (
            <a
              href={whatsappLink(wa)}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-t-border px-3 py-2 text-sm font-semibold text-t-fg transition hover:border-t-primary hover:text-t-primary sm:inline-flex"
            >
              <span className="size-2 rounded-full bg-[#25D366]" aria-hidden="true" /> {t(ui.whatsapp, ctx.lang)}
            </a>
          ) : null
        }
      />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: photo + search card ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const dests = (await getDestinations(ctx.tenant.id)).map((d) => d.destination);
  return (
    <section className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Plane className="size-20 opacity-20" />} />
      <div className="absolute inset-0 bg-gradient-to-r from-t-dark/90 via-t-dark/60 to-t-dark/20 rtl:bg-gradient-to-l" aria-hidden="true" />
      <Container className="relative py-20 lg:py-28">
        <div className="max-w-2xl t-fade-up">
          {h.eyebrow ? <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-widest text-t-accent-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-dark-fg/85">{t(h.subtitle, lang)}</p>
        </div>
        <div className="mt-8 text-t-fg">
          <PackageSearch ctx={ctx} destinations={dests} variant="card" className="rounded-[var(--t-radius)]" />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-dark-fg" />
        </div>
        {h.badges?.length ? (
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {h.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm font-medium text-t-dark-fg/90">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/15 [&_svg]:size-3.5">
                  <Icon name={b.icon} />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: destination image tiles ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i} className={i === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""}>
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group relative block h-full min-h-56 overflow-hidden rounded-[var(--t-radius)] bg-t-dark shadow-md">
                <Img src={it.image} alt={t(it.name, ctx.lang)} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<MapPin className="size-10 opacity-30" />} />
                <div className="absolute inset-0 bg-gradient-to-t from-t-dark/85 via-t-dark/20 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-5 text-t-dark-fg">
                  <span className="font-heading text-xl font-bold">{t(it.name, ctx.lang)}</span>
                  {it.note ? <span className="shrink-0 rounded-full bg-t-accent px-2.5 py-1 text-xs font-bold text-t-accent-fg">{it.note}</span> : null}
                </div>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: Umrah block with Kaaba image ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative">
          <Img src={u.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-xl" fallback={<Icon name="Moon" className="size-14 opacity-30" />} />
          <div className="absolute -bottom-4 -end-2 rounded-[var(--t-radius)] bg-t-accent px-4 py-2 text-sm font-bold text-t-accent-fg shadow-lg sm:-end-6">{lang === "ur" ? "عمرہ · حج" : "Umrah · Hajj"}</div>
        </div>
        <div>
          <span className="t-eyebrow">{lang === "ur" ? "عمرہ" : "Umrah"}</span>
          <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(u.title, lang)}</h2>
          <p className="mt-4 text-lg text-t-muted-fg">{t(u.text, lang)}</p>
          {u.points?.length ? (
            <ul className="mt-6 space-y-3">
              {u.points.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
                    <Check className="size-3.5" />
                  </span>
                  <span className="font-medium">{t(p.text, lang)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredPackages: () => (fp ? <FeaturedPackages ctx={ctx} take={fp.count || 6} eyebrow={fp.eyebrow} title={fp.title} /> : null),
        destinations: () => <Destinations ctx={ctx} />,
        umrah: () => <Umrah ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="bg-t-muted" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Umrah", "Tour", "Visa", "Tickets", "Other"]} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
