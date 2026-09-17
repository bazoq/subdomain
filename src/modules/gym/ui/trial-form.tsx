import type { SiteContext } from "@/templates/types";
import { t, type LocalizedString } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import { getPlans } from "@/modules/gym/queries";
import { periodLabel } from "@/modules/gym/ui/plans-grid";
import { TrialFormClient } from "@/modules/gym/ui/trial-form-client";

/** Server wrapper: loads plans for the select and renders the client trial form. */
export async function TrialForm({ ctx, defaultPlanId, className, compact }: { ctx: SiteContext; defaultPlanId?: string; className?: string; compact?: boolean }) {
  const plans = await getPlans(ctx.tenant.id);
  return (
    <TrialFormClient
      lang={ctx.lang}
      plans={plans.map((p) => ({ id: p.id, label: `${t(p.name as LocalizedString, ctx.lang)} – ${formatPKR(p.price)} ${periodLabel(p.period, ctx.lang)}` }))}
      defaultPlanId={defaultPlanId}
      className={className}
      compact={compact}
    />
  );
}
