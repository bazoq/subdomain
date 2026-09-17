import Link from "next/link";
import { Trash2, Truck } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState, Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { ShippingZoneFormButton } from "@/components/admin/ecommerce/shipping-zone-form";
import { deleteShippingZone } from "@/modules/ecommerce/actions";
import { formatPKR } from "@/lib/utils";

export default async function ShippingPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.shippingZone.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const commerce = ctx.settings.commerce;

  return (
    <>
      <PageHeader title="Shipping zones" description="Set delivery charges per city. Cities not covered by a zone use the default fee." actions={<ShippingZoneFormButton />} />
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            Default fee: <strong>{formatPKR(commerce.defaultShippingFee)}</strong>
          </span>
          <span>
            Free shipping above: <strong>{commerce.freeShippingAbove ? formatPKR(commerce.freeShippingAbove) : "—"}</strong>
          </span>
          <span>
            Minimum order: <strong>{commerce.minOrder ? formatPKR(commerce.minOrder) : "—"}</strong>
          </span>
          <Link href="/admin/settings" className="text-brand-600 hover:underline">
            Change in Settings
          </Link>
        </CardContent>
      </Card>
      {rows.length === 0 ? (
        <EmptyState icon={<Truck />} title="No shipping zones" description="Add zones such as “Lahore — Rs 150, free above Rs 3,000” and “Rest of Pakistan — Rs 250”." action={<ShippingZoneFormButton />} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Zone</TH>
              <TH>Cities</TH>
              <TH>Fee</TH>
              <TH>Free above</TH>
              <TH>ETA</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((z) => (
              <TR key={z.id}>
                <TD className="font-medium text-slate-900">
                  {z.name}
                  <span className="ml-2 text-xs text-slate-400">#{z.sortOrder}</span>
                </TD>
                <TD className="max-w-md">
                  {z.cities.length ? <p className="line-clamp-2 text-slate-600">{z.cities.join(", ")}</p> : <span className="text-slate-400">Matched by name only</span>}
                </TD>
                <TD className="font-semibold">{formatPKR(z.fee)}</TD>
                <TD>{z.freeAbove != null ? formatPKR(z.freeAbove) : <span className="text-slate-400">—</span>}</TD>
                <TD>{z.etaDays ? `${z.etaDays} days` : <span className="text-slate-400">—</span>}</TD>
                <TD>
                  <Badge tone={z.isActive ? "success" : "default"}>{z.isActive ? "Active" : "Inactive"}</Badge>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <ShippingZoneFormButton
                      id={z.id}
                      variant="outline"
                      initial={{ name: z.name, cities: z.cities.join(", "), fee: z.fee, freeAbove: z.freeAbove, etaDays: z.etaDays ?? "", sortOrder: z.sortOrder, isActive: z.isActive }}
                    />
                    <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Delete zone "${z.name}"?`} action={() => deleteShippingZone(z.id)}>
                      <Trash2 />
                    </ActionButton>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
