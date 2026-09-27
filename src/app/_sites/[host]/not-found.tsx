import Link from "next/link";
import { getCurrentTenant } from "@/server/tenant";
import { currentLang } from "@/server/site";
import { t, ui, type Lang } from "@/lib/i18n";
import { StatusPage } from "@/components/site/status-page";

/**
 * Not-found boundary directly under the tenant root layout. Public pages have their own branded
 * `(site)/not-found.tsx`; this one serves `notFound()` thrown by the `(site)` layout itself (e.g. the
 * tenant's template id is unknown) and by admin routes without a closer boundary. Body-level only —
 * the root layout owns `<html>`/`<body>`.
 */
export default async function TenantNotFound() {
  const tc = await getCurrentTenant().catch(() => null);
  const lang: Lang = tc?.settings.languages.urduEnabled ? await currentLang() : "en";
  return (
    <StatusPage eyebrow="404" title={t(ui.pageNotFound, lang)} text={t(ui.pageNotFoundText, lang)} lang={lang}>
      <Link href="/" className="t-btn t-btn-primary">
        {t(ui.backHome, lang)}
      </Link>
    </StatusPage>
  );
}
