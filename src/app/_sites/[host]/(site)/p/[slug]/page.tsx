import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext } from "@/server/site";
import { Container, RichText } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { getPage } from "@/modules/shared/queries";
import { asSeo } from "@/modules/shared/content-types";
import { PageHero } from "@/modules/shared/ui/page-hero";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const p = await getPage(ctx.tenant.id, slug);
  if (!p) return {};
  const seo = asSeo(p.seo);
  return { title: seo.title || `${t(p.title as LocalizedString, ctx.lang)} · ${ctx.tenant.name}`, description: seo.description || undefined };
}

export default async function SitePagePage({ params }: Props) {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const p = await getPage(ctx.tenant.id, slug);
  if (!p) notFound();
  const title = t(p.title as LocalizedString, ctx.lang);
  return (
    <>
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="simple" />
      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <RichText value={p.content as LocalizedString} lang={ctx.lang} className="text-base leading-relaxed sm:text-lg" />
        </Container>
      </section>
    </>
  );
}
