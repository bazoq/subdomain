import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { FaqBlock } from "@/modules/shared/ui/faq-block";
import { CtaBlock } from "@/modules/shared/ui/section-blocks";
import { Container } from "@/templates/ui";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.faq, ctx.lang)} · ${ctx.tenant.name}`, description: `Frequently asked questions about ${ctx.tenant.name}.` };
}

export default async function FaqPage() {
  const ctx = await getSiteContext();
  const title = ctx.lang === "ur" ? "اکثر پوچھے گئے سوالات" : "Frequently asked questions";
  return (
    <>
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
