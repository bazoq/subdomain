import type { SiteContext } from "@/templates/types";
import { t, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import { QuoteFormClient } from "@/modules/printing/ui/quote-form-client";

/** Server wrapper: loads the service list for the select and renders the client quote form. */
export async function QuoteForm({ ctx, defaultServiceId, className }: { ctx: SiteContext; defaultServiceId?: string; className?: string }) {
  const services = await getServices(ctx.tenant.id, { take: 100 });
  return <QuoteFormClient lang={ctx.lang} services={services.map((s) => ({ id: s.id, label: t(s.name as LocalizedString, ctx.lang) }))} defaultServiceId={defaultServiceId} className={className} />;
}
