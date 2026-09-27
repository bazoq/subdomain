import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { loadTemplateComponents } from "@/templates/registry";

/**
 * Home page metadata: Settings › SEO (layout defaults) can be overridden by the template's "Home page SEO"
 * section; the share image falls back to the hero image so every site has an og:image.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  const seo = ctx.sections.seo?.data as { title?: string; description?: string } | undefined;
  const hero = ctx.sections.hero?.data as { image?: string; slides?: string[] } | undefined;
  return tenantPageMetadata(tc, ctx.lang, {
    title: seo?.title?.trim() || undefined,
    // The home title from the SEO section is a complete title (the admin writes it with the business name).
    absoluteTitle: true,
    description: seo?.description?.trim() || undefined,
    path: "/",
    image: hero?.image || hero?.slides?.[0] || null,
  });
}

export default async function HomePage() {
  const ctx = await getSiteContext();
  const { Home } = await loadTemplateComponents(ctx.template.id);
  return <Home ctx={ctx} />;
}
