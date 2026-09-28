import { ChevronDown, ChevronUp, CircleHelp, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { FaqFormButton } from "@/components/admin/shared/faq-form";
import { deleteFaq, moveFaq, toggleFaq } from "@/modules/shared/faq-actions";
import { asLocalized } from "@/modules/shared/content-types";

export default async function FaqAdminPage() {
  const ctx = await requireTenantAdmin();
  const urdu = ctx.settings.languages.urduEnabled;
  const rows = await db.faqItem.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const add = <FaqFormButton urduEnabled={urdu} />;
  return (
    <>
      <PageHeader title="FAQ" description="Common questions shown in the FAQ section and at /faq. Use the arrows to reorder." actions={add} />
      {rows.length === 0 ? (
        <EmptyState icon={<CircleHelp />} title="No questions yet" description="Answer the questions customers ask you most on WhatsApp – delivery, pricing, timings." action={add} />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {rows.map((r, i) => {
            const q = asLocalized(r.question);
            const a = asLocalized(r.answer);
            return (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex flex-col pt-0.5">
                  <ActionButton size="icon" variant="ghost" className="h-6 w-6 text-slate-400" disabled={i === 0} action={() => moveFaq(r.id, -1)} title="Move up">
                    <ChevronUp />
                  </ActionButton>
                  <ActionButton size="icon" variant="ghost" className="h-6 w-6 text-slate-400" disabled={i === rows.length - 1} action={() => moveFaq(r.id, 1)} title="Move down">
                    <ChevronDown />
                  </ActionButton>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{q.en}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{a.en}</p>
                </div>
                <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Visible" : "Hidden"}</Badge>
                <div className="flex shrink-0 gap-1.5">
                  <ActionButton size="sm" variant="ghost" action={() => toggleFaq(r.id, !r.isActive)}>
                    {r.isActive ? "Hide" : "Show"}
                  </ActionButton>
                  <FaqFormButton id={r.id} initial={{ question: q, answer: a, isActive: r.isActive }} urduEnabled={urdu} variant="outline" />
                  <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this question?" action={() => deleteFaq(r.id)}>
                    <Trash2 />
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
