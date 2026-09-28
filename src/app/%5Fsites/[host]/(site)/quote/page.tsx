import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { Container } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { QuoteForm } from "@/modules/printing/ui/quote-form";
import { PriceEstimator } from "@/modules/printing/ui/price-estimator";
import { HowItWorks } from "@/modules/printing/ui/how-it-works";
import { ContactInfo } from "@/modules/shared/ui/contact-info";

type Props = { searchParams: Promise<{ service?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.getQuote, ctx.lang), description: `Request a printing quote from ${ctx.tenant.name}. Upload your design and get a price on WhatsApp.`, path: "/quote" });
}

export default async function QuotePage({ searchParams }: Props) {
  const ctx = await getSiteContext();
  if (!ctx.category.modules.includes("printing")) notFound();
  const { service } = await searchParams;
  const ur = ctx.lang === "ur";
  return (
    <>
      <PageHero ctx={ctx} title={t(ui.getQuote, ctx.lang)} subtitle={ur ? "اپنی ضرورت بتائیں اور ڈیزائن اپ لوڈ کریں – قیمت چند گھنٹوں میں۔" : "Tell us what you need and upload your artwork – we reply with a price within hours."} breadcrumbs={[{ label: t(ui.getQuote, ctx.lang) }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-5">
          <div className="t-card p-6 sm:p-8 lg:col-span-3">
            <QuoteForm ctx={ctx} defaultServiceId={service} />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <PriceEstimator ctx={ctx} />
            <div className="t-card p-6">
              <h3 className="font-heading mb-4 text-lg font-bold">{ur ? "یا براہ راست رابطہ کریں" : "Or talk to us directly"}</h3>
              <ContactInfo ctx={ctx} />
            </div>
          </div>
        </Container>
      </section>
      <HowItWorks ctx={ctx} className="bg-t-muted" />
    </>
  );
}
