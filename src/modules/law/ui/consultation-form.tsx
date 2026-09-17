import type { SiteContext } from "@/templates/types";
import { t, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import { ConsultationFormClient } from "@/modules/law/ui/consultation-form-client";

/** Server wrapper: loads practice areas (Service names) and renders the client form. */
export async function ConsultationForm({ ctx, practiceAreas, defaultPracticeArea, className, compact }: { ctx: SiteContext; practiceAreas?: string[]; defaultPracticeArea?: string; className?: string; compact?: boolean }) {
  const areas = practiceAreas ?? (await getServices(ctx.tenant.id)).map((s) => t(s.name as LocalizedString, ctx.lang));
  return <ConsultationFormClient lang={ctx.lang} practiceAreas={areas} defaultPracticeArea={defaultPracticeArea} className={className} compact={compact} />;
}
