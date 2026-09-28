import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { Container } from "@/templates/ui";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { TrialForm } from "@/modules/gym/ui/trial-form";
import { BmiCalculator } from "@/modules/gym/ui/bmi-calculator";
import { ContactInfo } from "@/modules/shared/ui/contact-info";
import { HoursTable } from "@/modules/shared/ui/hours-table";
import { TestimonialsBlock } from "@/modules/shared/ui/testimonials-block";

type Props = { searchParams: Promise<{ plan?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: ctx.lang === "ur" ? "مفت ٹرائل" : "Join / free trial", description: `Book a free trial session at ${ctx.tenant.name}.`, path: "/join" });
}

export default async function JoinPage({ searchParams }: Props) {
  const ctx = await getSiteContext();
  if (!ctx.category.modules.includes("gym")) notFound();
  const { plan } = await searchParams;
  const ur = ctx.lang === "ur";
  return (
    <>
      <PageHero ctx={ctx} title={ur ? "مفت ٹرائل بک کریں" : "Book a free trial"} subtitle={ur ? "فارم بھریں – ہماری ٹیم واٹس ایپ پر رابطہ کرے گی۔" : "Fill in the form and our team will confirm your session on WhatsApp."} breadcrumbs={[{ label: ur ? "شامل ہوں" : "Join" }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-5">
          <div className="t-card p-6 sm:p-8 lg:col-span-3">
            <TrialForm ctx={ctx} defaultPlanId={plan} />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <BmiCalculator lang={ctx.lang} ctaHref="#top" />
            <div className="t-card p-6">
              <ContactInfo ctx={ctx} />
              {ctx.settings.hours.length ? <HoursTable ctx={ctx} compact className="mt-6" title={ur ? "اوقات" : "Gym hours"} /> : null}
            </div>
          </div>
        </Container>
      </section>
      <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" take={8} />
    </>
  );
}
