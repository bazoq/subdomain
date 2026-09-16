import { MessageSquareQuote, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TestimonialFormButton } from "@/components/admin/testimonial-form";
import { ActionButton } from "@/components/admin/action-button";
import { deleteTestimonial, toggleTestimonial } from "@/modules/shared/testimonials-actions";
import type { LocalizedString } from "@/lib/i18n";

export default async function TestimonialsPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.testimonial.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const urdu = ctx.settings.languages.urduEnabled;

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Customer reviews shown in the testimonials section of your website."
        actions={<TestimonialFormButton urduEnabled={urdu} />}
      />
      {rows.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote />} title="No testimonials yet" description="Add a few genuine customer reviews to build trust." action={<TestimonialFormButton urduEnabled={urdu} />} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>Review</TH>
              <TH>Rating</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const text = r.text as LocalizedString;
              return (
                <TR key={r.id}>
                  <TD>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.role}</p>
                  </TD>
                  <TD className="max-w-md">
                    <p className="line-clamp-2 text-slate-600">{text.en}</p>
                  </TD>
                  <TD className="text-amber-500">{"★".repeat(r.rating)}</TD>
                  <TD>
                    <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Visible" : "Hidden"}</Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <ActionButton size="sm" variant="ghost" action={() => toggleTestimonial(r.id, !r.isActive)}>
                        {r.isActive ? "Hide" : "Show"}
                      </ActionButton>
                      <TestimonialFormButton
                        id={r.id}
                        urduEnabled={urdu}
                        variant="outline"
                        initial={{ name: r.name, role: r.role ?? "", text, rating: r.rating, imageUrl: r.imageUrl ?? "", isActive: r.isActive }}
                      />
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this testimonial?" action={() => deleteTestimonial(r.id)}>
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
