import { currentLang, getSiteContext, requireTenant } from "@/server/site";
import { getTenantSession } from "@/server/auth/session";
import { localBusinessJsonLd, webSiteJsonLd } from "@/server/site-seo";
import { loadTemplateComponents } from "@/templates/registry";
import { SkipLink } from "@/templates/ui";
import { SuspendedSite } from "@/components/site/suspended";
import { ComingSoon } from "@/components/site/coming-soon";
import { PreviewBanner } from "@/components/site/preview-banner";
import { JsonLd } from "@/components/site/json-ld";
import { log, errorFields } from "@/lib/log";

/**
 * Public site shell for a tenant host.
 *  - SUSPENDED → neutral "temporarily unavailable" page (no template, no contact details).
 *  - DRAFT     → "coming soon" for visitors; signed-in tenant staff see the real site with a preview banner.
 *  - otherwise → the template's Layout, preceded by the skip link and the business JSON-LD.
 * Both status pages are also `noindex` via the root layout metadata (see `tenantMetadata`).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const tc = await requireTenant();
  const lang = tc.settings.languages.urduEnabled ? await currentLang() : "en";

  if (tc.tenant.status === "SUSPENDED") return <SuspendedSite name={tc.tenant.name} lang={lang} />;

  let preview = false;
  if (tc.tenant.status === "DRAFT") {
    const staff = await getTenantSession(tc.tenant.id).catch((err: unknown) => {
      log.warn("draft preview: session lookup failed", { tenantId: tc.tenant.id, ...errorFields(err) });
      return null;
    });
    if (!staff) return <ComingSoon name={tc.tenant.name} lang={lang} phone={tc.settings.contact.phone} whatsapp={tc.settings.contact.whatsapp} />;
    preview = true;
  }

  const ctx = await getSiteContext();
  const { Layout } = await loadTemplateComponents(ctx.template.id);
  const heroImage = (ctx.sections.hero?.data as { image?: string } | undefined)?.image;

  return (
    <>
      <SkipLink lang={ctx.lang} />
      {preview ? <PreviewBanner lang={ctx.lang} /> : null}
      <JsonLd data={[localBusinessJsonLd(tc, { lang: ctx.lang, image: heroImage }), webSiteJsonLd(tc)]} />
      <Layout ctx={ctx}>{children}</Layout>
    </>
  );
}
