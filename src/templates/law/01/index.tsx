/**
 * REFERENCE TEMPLATE — law-01 "Lex Chambers" (#1301)
 * Classic navy & gold chambers. Serif headings, square corners, gold hairlines.
 *
 * Every template exports `components: { Layout, Home }` and renders the tenant's
 * sections in the order/visibility chosen in the admin (renderOrdered).
 */
import * as React from "react";
import { ArrowRight, Scale, Lock, Phone } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { practiceAreasSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink } from "@/templates/ui";
import { t } from "@/lib/i18n";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData } from "@/modules/shared/ui/section-types";
import { WhatsAppFloat } from "@/templates/ui";

/* ---------- Layout: header + footer chrome ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="dark" />
      {/* gold hairline signature */}
      <div className="h-0.5 w-full bg-t-accent" />
      <SiteHeader ctx={ctx} variant="light" cta={{ label: { en: "Book a consultation", ur: "مشاورت بک کریں" }, href: "/consultation" }} />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero (template-specific design) ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <Container className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 border-b-2 border-t-accent pb-1 text-xs font-bold uppercase tracking-[0.25em] text-t-primary">
              <Scale className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-6">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-t-fg">
                  <span className="flex size-8 items-center justify-center bg-t-primary/10 text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <div className="absolute -left-4 -top-4 h-full w-full border-2 border-t-accent" aria-hidden="true" />
          <Img src={h.image} alt="" className="relative aspect-[4/5] w-full object-cover" fallback={<Scale className="size-16 opacity-30" />} />
          <div className="absolute -bottom-6 -right-6 hidden bg-t-dark px-6 py-4 text-t-dark-fg shadow-xl md:block">
            <p className="text-xs uppercase tracking-widest text-t-accent">Call the chambers</p>
            <a href={`tel:${ctx.settings.contact.phone}`} className="mt-1 flex items-center gap-2 font-heading text-xl font-bold">
              <Phone className="size-4" /> {ctx.settings.contact.phone || "+92 300 0000000"}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Home: sections in tenant order ---------- */
function Home({ ctx }: TemplatePageProps) {
  const practice = sectionData<HeadingData>(ctx, practiceAreasSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        practiceAreas: () =>
          practice ? <ServicesBlock ctx={ctx} variant="icon" columns={3} heading={practice} id="practice-areas" className="border-t border-t-border" /> : null,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="bg-t-dark text-t-dark-fg" />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} showSpecialties />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" className="bg-t-muted" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Civil", "Criminal", "Family", "Property", "Corporate", "Other"]} />,
      })}
      <section className="border-t border-t-border bg-t-bg py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-t-muted-fg sm:flex-row">
          <span className="flex items-center gap-2">
            <Lock className="size-4" /> {ctx.lang === "ur" ? "تمام مشاورت مکمل طور پر خفیہ رکھی جاتی ہے۔" : "All consultations are strictly confidential."}
          </span>
          <SmartLink href="/consultation" ctx={ctx} className="font-semibold text-t-primary hover:underline">
            {ctx.lang === "ur" ? "ابھی مشاورت بک کریں" : "Book a consultation"} →
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
