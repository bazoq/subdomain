import { MapPinned, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { DeliveryZoneDialogButton } from "@/components/admin/restaurant/delivery-zone-dialog";
import { deleteDeliveryZone } from "@/modules/restaurant/actions";
import { formatPKR } from "@/lib/utils";

export default async function DeliveryZonesPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.deliveryZone.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const defMin = ctx.settings.restaurant.minDeliveryOrder;
  return (
    <>
      <PageHeader
        title="Delivery zones"
        description={`Areas you deliver to with fee, minimum order and ETA. Default minimum order: ${formatPKR(defMin)} (Settings).`}
        actions={<DeliveryZoneDialogButton />}
      />
      {rows.length === 0 ? (
        <EmptyState icon={<MapPinned />} title="No delivery zones" description="Add areas like DHA, Gulberg, Johar Town, Bahria Town with their delivery fee." action={<DeliveryZoneDialogButton />} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Area</TH>
              <TH>Fee</TH>
              <TH>Min order</TH>
              <TH>ETA</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((z) => (
              <TR key={z.id}>
                <TD className="font-medium text-slate-900">{z.name}</TD>
                <TD>{z.fee ? formatPKR(z.fee) : "Free"}</TD>
                <TD>{z.minOrder ? formatPKR(z.minOrder) : <span className="text-slate-500">Default ({formatPKR(defMin)})</span>}</TD>
                <TD>{z.etaMins ? `${z.etaMins} min` : "—"}</TD>
                <TD>
                  <Badge tone={z.isActive ? "success" : "default"}>{z.isActive ? "Active" : "Inactive"}</Badge>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <DeliveryZoneDialogButton id={z.id} variant="outline" initial={{ name: z.name, fee: z.fee, minOrder: z.minOrder, etaMins: z.etaMins, isActive: z.isActive, sortOrder: z.sortOrder }} />
                    <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Delete zone "${z.name}"?`} action={() => deleteDeliveryZone(z.id)}>
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
