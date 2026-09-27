import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle } from "lucide-react";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { serviceJsonLd } from "@/modules/shared/jsonld";
import { Container, Icon, Img, RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils";
import { getService, getServices } from "@/modules/shared/queries";
import { asLocalizedList } from "@/modules/shared/content-types";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { ServiceCard, servicePriceLabel } from "@/modules/shared/ui/services-block";
import { ContactForm } from "@/modules/leads/ui/contact-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const s = await getService(ctx.tenant.id, slug);
  if (!s) return {};
  const name = t(s.name as LocalizedString, ctx.lang);
  return tenantPageMetadata(tc, ctx.lang, {
    title: name,
    description: t(s.summary as LocalizedString, ctx.lang) || undefined,
    path: `/services/${s.slug}`,
    image: s.imageUrl,
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const s = await getService(ctx.tenant.id, slug);
  if (!s) notFound();
  const name = t(s.name as LocalizedString, ctx.lang);
  const summary = t(s.summary as LocalizedString, ctx.lang);
  const features = asLocalizedList(s.features);
  const price = ctx.category.key === "law" ? "" : servicePriceLabel(s, ctx.lang);
  const others = (await getServices(ctx.tenant.id, { take: 4 })).filter((x) => x.id !== s.id).slice(0, 3);
  const listLabel = ctx.category.key === "law" ? t(ui.practiceAreas, ctx.lang) : t(ui.services, ctx.lang);
  const wa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  const isLaw = ctx.category.key === "law";
  const isPrinting = ctx.category.key === "printing";
  const ctaHref = isLaw ? `/consultation?area=${encodeURIComponent(name)}` : isPrinting ? `/quote?service=${encodeURIComponent(s.id)}` : "#enquire";
  const ctaLabel = isLaw ? t(ui.bookConsultation, ctx.lang) : isPrinting ? t(ui.getQuote, ctx.lang) : t(ui.contactUs, ctx.lang);

  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd(tc, s, ctx.lang),
          breadcrumbJsonLd(tc, [
            { name: t(ui.home, ctx.lang), path: "/" },
            { name: listLabel, path: "/services" },
            { name, path: `/services/${s.slug}` },
          ]),
        ]}
      />
      <PageHero ctx={ctx} title={name} subtitle={summary} image={s.imageUrl ?? undefined} variant="gradient" breadcrumbs={[{ label: listLabel, href: "/services" }, { label: name }]} />
      <section className="py-14 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {s.imageUrl ? <Img src={s.imageUrl} alt={name} className="mb-8 aspect-[16/9] w-full rounded-[var(--t-radius)] object-cover" /> : null}
            <RichText value={s.description as LocalizedString} lang={ctx.lang} className="text-base leading-relaxed" />
            {features.length ? (
              <div className="mt-8">
                <h2 className="font-heading text-xl font-bold">{ctx.lang === "ur" ? "کیا شامل ہے" : "What's included"}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
                        <Check className="size-3.5" />
                      </span>
                      {t(f, ctx.lang)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <aside className="space-y-6">
            <div className="t-card p-6">
              <span className="flex size-12 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-6">
                <Icon name={s.icon ?? undefined} />
              </span>
              {price ? <p className="font-heading mt-4 text-2xl font-extrabold text-t-primary">{price}</p> : null}
              <Link href={ctaHref} className="t-btn t-btn-primary mt-5 w-full">
                {ctaLabel}
              </Link>
              {wa ? (
                <a href={whatsappLink(wa, `Hi ${ctx.tenant.name}, I am interested in ${name}.`)} target="_blank" rel="noreferrer" className="t-btn t-btn-outline mt-3 w-full text-t-fg">
                  <MessageCircle className="size-4" /> {t(ui.whatsapp, ctx.lang)}
                </a>
              ) : null}
            </div>
            {others.length ? (
              <div>
                <h3 className="font-heading mb-3 text-sm font-bold uppercase tracking-wide text-t-muted-fg">{ctx.lang === "ur" ? "دیگر خدمات" : `Other ${listLabel.toLowerCase()}`}</h3>
                <div className="t-card divide-y divide-t-border px-4">
                  {others.map((o) => (
                    <ServiceCard key={o.id} ctx={ctx} service={o} variant="list" showPrice={!isLaw} className="py-4" />
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </Container>
      </section>
      {!isLaw && !isPrinting ? (
        <section id="enquire" className="bg-t-muted py-14 sm:py-20">
          <Container className="max-w-3xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">{ctx.lang === "ur" ? `${name} کے بارے میں پوچھیں` : `Enquire about ${name}`}</h2>
            <div className="t-card mt-6 p-6 sm:p-8">
              <ContactForm lang={ctx.lang} formKey="contact" subjectOptions={[name]} />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
