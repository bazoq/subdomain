import type { Lang } from "@/lib/i18n";
import { t, ui } from "@/lib/i18n";
import { StatusPage } from "@/components/site/status-page";

/** Public face of a SUSPENDED tenant: no template, no contact details, no admin link. */
export function SuspendedSite({ name, lang = "en" }: { name: string; lang?: Lang }) {
  return <StatusPage eyebrow={t(ui.unavailableEyebrow, lang)} title={name} text={`${t(ui.siteSuspendedTitle, lang)}. ${t(ui.siteSuspendedText, lang)}`} lang={lang} tone="warning" />;
}
