import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { ContactBlock } from "@/modules/shared/ui/contact-block";
import { FaqBlock } from "@/modules/shared/ui/faq-block";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  const c = ctx.settings.contact;
  return tenantPageMetadata(tc, ctx.lang, {
    title: t(ui.contactUs, ctx.lang),
    description: [c.phone, c.address, c.city].filter(Boolean).join(" · ") || `Contact ${ctx.tenant.name}.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const ctx = await getSiteContext();
  const title = t(ui.contactUs, ctx.lang);
  return (
    <>
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="gradient" />
      <ContactBlock ctx={ctx} layout="split" heading={{ ...(ctx.sections.contact?.data as { subtitle?: { en: string; ur?: string } } | undefined), eyebrow: undefined, title: undefined, showForm: true, showMap: true }} />
      <FaqBlock ctx={ctx} take={5} className="bg-t-muted" />
    </>
  );
}
