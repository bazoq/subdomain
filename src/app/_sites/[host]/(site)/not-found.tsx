import Link from "next/link";
import type { Route } from "next";
import { getCurrentTenant } from "@/server/tenant";
import { currentLang } from "@/server/site";
import { getTemplateMeta } from "@/templates/registry";
import { t, ui, type Lang } from "@/lib/i18n";
import { safeLinkHref } from "@/lib/utils";

/**
 * Branded 404 for public pages: renders inside the template layout (header/footer present), so it is a
 * `<section>`, not a `<main>`. Reached via `notFound()` from a page or the `[...rest]` catch-all.
 * No database access beyond the cached tenant lookup, so it cannot fail.
 */
export default async function SiteNotFound() {
  const tc = await getCurrentTenant().catch(() => null);
  const lang: Lang = tc?.settings.languages.urduEnabled ? await currentLang() : "en";
  const nav = tc ? (getTemplateMeta(tc.tenant.templateId)?.nav ?? []) : [];
  const popular = nav
    .map((item) => ({ label: t(item.label, lang), link: safeLinkHref(item.href) }))
    .filter((x): x is { label: string; link: { href: string; external: false } } => Boolean(x.label && x.link && !x.link.external && x.link.href !== "/"))
    .slice(0, 5);

  return (
    <section className="t-container py-20 text-center sm:py-28">
      <p className="t-eyebrow">404</p>
      <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t(ui.pageNotFound, lang)}</h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-t-muted-fg">{t(ui.pageNotFoundText, lang)}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="t-btn t-btn-primary">
          {t(ui.backHome, lang)}
        </Link>
        <Link href="/contact" className="t-btn t-btn-outline text-t-fg">
          {t(ui.contactUs, lang)}
        </Link>
      </div>
      {popular.length ? (
        <nav aria-label={t(ui.popularPages, lang)} className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-t-muted-fg rtl:tracking-normal">{t(ui.popularPages, lang)}</h2>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {popular.map((p) => (
              <li key={p.link.href}>
                <Link href={p.link.href as Route} className="font-medium text-t-primary underline-offset-4 hover:underline">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
