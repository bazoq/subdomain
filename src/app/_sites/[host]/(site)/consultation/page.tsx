import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSiteContext } from "@/server/site";
import { Container } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { ConsultationForm } from "@/modules/law/ui/consultation-form";
import { ContactInfo } from "@/modules/shared/ui/contact-info";
import { HoursTable } from "@/modules/shared/ui/hours-table";
import { WhyChooseUs } from "@/modules/law/ui/why-choose-us";

type Props = { searchParams: Promise<{ area?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.bookConsultation, ctx.lang)} · ${ctx.tenant.name}`, description: `Request a legal consultation with ${ctx.tenant.name}.` };
}

export default async function ConsultationPage({ searchParams }: Props) {
  const ctx = await getSiteContext();
  if (!ctx.category.modules.includes("law")) notFound();
  const { area } = await searchParams;
  const ur = ctx.lang === "ur";
  return (
    <>
      <PageHero ctx={ctx} title={t(ui.bookConsultation, ctx.lang)} subtitle={ur ? "اپنے معاملے کی تفصیل بتائیں – ہماری ٹیم ۲۴ گھنٹوں میں رابطہ کرے گی۔" : "Tell us about your matter – a member of our team will call you within 24 hours."} breadcrumbs={[{ label: t(ui.bookConsultation, ctx.lang) }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-5">
          <div className="t-card p-6 sm:p-8 lg:col-span-3">
            <ConsultationForm ctx={ctx} defaultPracticeArea={area} />
            <p className="mt-5 flex items-start gap-2 text-xs text-t-muted-fg">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-t-primary" />
              {ur ? "آپ کی معلومات مکمل طور پر خفیہ رکھی جائیں گی۔ فارم بھیجنے سے وکیل-موکل تعلق قائم نہیں ہوتا۔" : "Everything you share is strictly confidential. Submitting this form does not create an attorney–client relationship."}
            </p>
          </div>
          <div className="space-y-6 lg:col-span-2">
            <div className="t-card p-6">
              <h3 className="font-heading mb-4 text-lg font-bold">{ur ? "دفتر" : "Our office"}</h3>
              <ContactInfo ctx={ctx} />
              {ctx.settings.hours.length ? <HoursTable ctx={ctx} compact className="mt-6" title={ur ? "اوقات کار" : "Office hours"} /> : null}
            </div>
          </div>
        </Container>
      </section>
      <WhyChooseUs ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />
    </>
  );
}
