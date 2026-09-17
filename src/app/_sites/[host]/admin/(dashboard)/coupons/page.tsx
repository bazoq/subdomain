import { TicketPercent, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { CouponFormButton } from "@/components/admin/ecommerce/coupon-form";
import { deleteCoupon } from "@/modules/ecommerce/actions";
import { formatDate, formatPKR } from "@/lib/utils";

export default async function CouponsPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.coupon.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: { createdAt: "desc" } });
  const now = Date.now();

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can apply at checkout." actions={<CouponFormButton />} />
      {rows.length === 0 ? (
        <EmptyState icon={<TicketPercent />} title="No coupons yet" description="Create codes like EID10 (10% off) or FREESHIP500 to run promotions." action={<CouponFormButton />} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Code</TH>
              <TH>Discount</TH>
              <TH>Min. order</TH>
              <TH>Used</TH>
              <TH>Expires</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((c) => {
              const expired = !!c.expiresAt && c.expiresAt.getTime() < now;
              const exhausted = c.maxUses != null && c.usedCount >= c.maxUses;
              const tone = !c.isActive ? "default" : expired || exhausted ? "danger" : "success";
              const label = !c.isActive ? "Inactive" : expired ? "Expired" : exhausted ? "Used up" : "Active";
              return (
                <TR key={c.id}>
                  <TD>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm font-semibold">{c.code}</span>
                  </TD>
                  <TD className="font-medium">{c.type === "PERCENT" ? `${c.value}% off` : `${formatPKR(c.value)} off`}</TD>
                  <TD>{c.minOrder ? formatPKR(c.minOrder) : <span className="text-slate-400">—</span>}</TD>
                  <TD>
                    {c.usedCount}
                    {c.maxUses != null ? <span className="text-slate-400"> / {c.maxUses}</span> : null}
                  </TD>
                  <TD className="text-slate-500">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</TD>
                  <TD>
                    <Badge tone={tone}>{label}</Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <CouponFormButton
                        id={c.id}
                        variant="outline"
                        initial={{
                          code: c.code,
                          type: c.type === "FIXED" ? "FIXED" : "PERCENT",
                          value: c.value,
                          minOrder: c.minOrder,
                          maxUses: c.maxUses,
                          expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : "",
                          isActive: c.isActive,
                        }}
                      />
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Delete coupon ${c.code}?`} action={() => deleteCoupon(c.id)}>
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
