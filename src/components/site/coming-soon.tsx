import { Phone } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { t, ui } from "@/lib/i18n";
import { formatPkPhone, normalizePkPhone, whatsappLink } from "@/lib/utils";
import { StatusPage } from "@/components/site/status-page";

/**
 * Public face of a DRAFT tenant (visitors without a tenant-admin session). Shows the business name and,
 * when configured, a phone / WhatsApp way to reach the business — nothing from the unfinished template.
 */
export function ComingSoon({ name, lang = "en", phone, whatsapp }: { name: string; lang?: Lang; phone?: string; whatsapp?: string }) {
  const tel = normalizePkPhone(phone ?? "");
  const wa = normalizePkPhone(whatsapp ?? "") ?? tel;
  return (
    <StatusPage eyebrow={t(ui.comingSoonTitle, lang)} title={name} text={t(ui.comingSoonText, lang)} lang={lang}>
      {tel ? (
        <a href={`tel:${tel}`} className="t-btn t-btn-outline text-t-fg" dir="ltr">
          <Phone className="size-4" aria-hidden="true" focusable="false" />
          {formatPkPhone(tel)}
        </a>
      ) : null}
      {wa ? (
        <a href={whatsappLink(wa)} target="_blank" rel="noopener noreferrer" className="t-btn t-btn-primary">
          {t(ui.whatsapp, lang)}
        </a>
      ) : null}
    </StatusPage>
  );
}
