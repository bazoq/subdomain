import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { PlansGrid } from "@/modules/gym/ui/plans-grid";
import { FaqBlock } from "@/modules/shared/ui/faq-block";
import { CtaBlock, FeaturesBlock } from "@/modules/shared/ui/section-blocks";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.plans, ctx.lang), description: `Membership plans and pricing at ${ctx.tenant.name}.`, path: "/plans" });
}

export default async function PlansPage() {
  const ctx = await getSiteContext();
  if (!ctx.category.modules.includes("gym")) notFound();
  const title = t(ui.plans, ctx.lang);
  return (
    <>
      <PageHero ctx={ctx} title={title} subtitle={ctx.lang === "ur" ? "کوئی چھپی ہوئی فیس نہیں۔ کسی بھی وقت اپ گریڈ کریں۔" : "No hidden charges. Upgrade or pause any time."} breadcrumbs={[{ label: title }]} variant="gradient" align="center" />
      <PlansGrid ctx={ctx} heading={{ eyebrow: undefined, title: undefined }} className="pt-10" />
      <FeaturesBlock ctx={ctx} variant="grid" className="bg-t-muted" />
      <FaqBlock ctx={ctx} take={6} />
      <CtaBlock ctx={ctx} />
    </>
  );
}
