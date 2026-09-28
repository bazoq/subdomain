import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { Container } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { ServiceCard } from "@/modules/shared/ui/services-block";
import { CtaBlock } from "@/modules/shared/ui/section-blocks";
import { FaqBlock } from "@/modules/shared/ui/faq-block";

function pageTitle(ctx: Awaited<ReturnType<typeof getSiteContext>>) {
  const k = ctx.category.key;
  if (k === "law") return t(ui.practiceAreas, ctx.lang);
  if (k === "printing") return ctx.lang === "ur" ? "پرنٹنگ خدمات" : "Printing services";
  if (k === "travel") return ctx.lang === "ur" ? "ویزا اور دیگر خدمات" : "Visa & other services";
  return t(ui.services, ctx.lang);
}

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, {
    title: pageTitle(ctx),
    description: `${pageTitle(ctx)} offered by ${ctx.tenant.name}${ctx.settings.contact.city ? ` in ${ctx.settings.contact.city}` : ""}.`,
    path: "/services",
  });
}

export default async function ServicesPage() {
  const ctx = await getSiteContext();
  const rows = await getServices(ctx.tenant.id, { take: 100 });
  const title = pageTitle(ctx);
  const isPrinting = ctx.category.key === "printing";
  const variant = isPrinting ? "image" : ctx.category.key === "law" ? "icon" : rows.some((r) => r.imageUrl) ? "image" : "icon";
  return (
    <>
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container>
          {rows.length === 0 ? (
            <p className="t-card px-6 py-16 text-center text-t-muted-fg">{ctx.lang === "ur" ? "ابھی کوئی سروس شامل نہیں کی گئی۔" : "No services have been added yet."}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((s) => (
                <ServiceCard key={s.id} ctx={ctx} service={s} variant={variant} showFeatures showPrice={ctx.category.key !== "law"} />
              ))}
            </div>
          )}
        </Container>
      </section>
      <FaqBlock ctx={ctx} take={6} />
      <CtaBlock ctx={ctx} />
    </>
  );
}
