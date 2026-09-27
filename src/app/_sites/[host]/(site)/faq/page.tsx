import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { t, ui } from "@/lib/i18n";
import { getFaqs } from "@/modules/shared/queries";
import { faqPageJsonLd } from "@/modules/shared/jsonld";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { FaqBlock } from "@/modules/shared/ui/faq-block";
import { CtaBlock } from "@/modules/shared/ui/section-blocks";
import { Container } from "@/templates/ui";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.faq, ctx.lang), description: `Frequently asked questions about ${ctx.tenant.name}.`, path: "/faq" });
}

export default async function FaqPage() {
  const ctx = await getSiteContext();
  const faqs = await getFaqs(ctx.tenant.id); // same cached call FaqBlock makes
  const title = ctx.lang === "ur" ? "اکثر پوچھے گئے سوالات" : "Frequently asked questions";
  const faqLd = faqPageJsonLd(faqs, ctx.lang);
  return (
    <>
      {faqLd ? <JsonLd data={faqLd} /> : null}
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: t(ui.faq, ctx.lang) }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <FaqBlock ctx={ctx} bare />
        </Container>
      </section>
      <CtaBlock ctx={ctx} />
    </>
  );
}
