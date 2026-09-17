import { notFound } from "next/navigation";
import { CreditCard, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { PlanFormButton } from "@/modules/gym/admin/plan-form";
import { deletePlan, togglePlan, type PlanInput } from "@/modules/gym/actions";
import { PLAN_PERIOD_LABELS, PLAN_PERIODS, type PlanPeriod } from "@/modules/gym/constants";
import { asLocalized, asLocalizedList } from "@/modules/shared/content-types";
import { formatPKR } from "@/lib/utils";

export default async function PlansAdminPage() {
  const ctx = await requireTenantAdmin();
  if (!ctx.category.modules.includes("gym")) notFound();
  const urdu = ctx.settings.languages.urduEnabled;
  const rows = await db.membershipPlan.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] });
  const add = <PlanFormButton urduEnabled={urdu} />;
  return (
    <>
      <PageHeader title="Membership plans" description="Pricing shown at /plans and in the plans section. Mark one plan as “most popular” to highlight it." actions={add} />
      {rows.length === 0 ? (
        <EmptyState icon={<CreditCard />} title="No plans yet" description="Add monthly, quarterly and yearly plans with what each one includes." action={add} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Plan</TH>
              <TH>Price</TH>
              <TH>Includes</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const period = (PLAN_PERIODS as readonly string[]).includes(r.period) ? (r.period as PlanPeriod) : "MONTH";
              const initial: PlanInput = { name: asLocalized(r.name), price: r.price, period, features: asLocalizedList(r.features), isPopular: r.isPopular, isActive: r.isActive, sortOrder: r.sortOrder };
              return (
                <TR key={r.id}>
                  <TD>
                    <p className="font-medium text-slate-900">{initial.name.en}</p>
                    <p className="text-xs text-slate-500">Order {r.sortOrder}</p>
                  </TD>
                  <TD>
                    <p className="font-semibold">{formatPKR(r.price)}</p>
                    <p className="text-xs text-slate-500">{PLAN_PERIOD_LABELS[period]}</p>
                  </TD>
                  <TD className="max-w-xs text-xs text-slate-600">{initial.features.length ? `${initial.features.length} item(s): ${initial.features.slice(0, 3).map((f) => f.en).join(", ")}${initial.features.length > 3 ? "…" : ""}` : <span className="text-slate-400">—</span>}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Visible" : "Hidden"}</Badge>
                      {r.isPopular ? <Badge tone="brand">Popular</Badge> : null}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <ActionButton size="sm" variant="ghost" action={() => togglePlan(r.id, "isPopular", !r.isPopular)}>
                        {r.isPopular ? "Unmark popular" : "Mark popular"}
                      </ActionButton>
                      <ActionButton size="sm" variant="ghost" action={() => togglePlan(r.id, "isActive", !r.isActive)}>
                        {r.isActive ? "Hide" : "Show"}
                      </ActionButton>
                      <PlanFormButton id={r.id} initial={initial} urduEnabled={urdu} variant="outline" />
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this plan?" action={() => deletePlan(r.id)}>
                        <Trash2 />
                      </ActionButton>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
