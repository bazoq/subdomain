import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { Container, RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { getPage } from "@/modules/shared/queries";
import { asSeo } from "@/modules/shared/content-types";
import { PageHero } from "@/modules/shared/ui/page-hero";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const p = await getPage(ctx.tenant.id, slug);
  if (!p) return {};
  const seo = asSeo(p.seo);
  // An admin-written SEO title is complete (they add the business name themselves); otherwise the layout appends it.
  return tenantPageMetadata(tc, ctx.lang, {
    title: seo.title?.trim() || t(p.title as LocalizedString, ctx.lang),
    absoluteTitle: Boolean(seo.title?.trim()),
    description: seo.description?.trim() || t(p.content as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim().slice(0, 200) || undefined,
    path: `/p/${p.slug}`,
  });
}

export default async function SitePagePage({ params }: Props) {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const p = await getPage(ctx.tenant.id, slug);
  if (!p) notFound();
  const title = t(p.title as LocalizedString, ctx.lang);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(tc, [{ name: t(ui.home, ctx.lang), path: "/" }, { name: title, path: `/p/${p.slug}` }])} />
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="simple" />
      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <RichText value={p.content as LocalizedString} lang={ctx.lang} className="text-base leading-relaxed sm:text-lg" />
        </Container>
      </section>
    </>
  );
}
