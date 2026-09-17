import Link from "next/link";
import { History } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KitchenBoard } from "@/components/admin/restaurant/kitchen-board";
import { toFoodOrderDto } from "@/modules/restaurant/serialize";
import { ACTIVE_FOOD_STATUSES } from "@/modules/restaurant/types";

export default async function KitchenPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.foodOrder.findMany({
    where: { tenantId: ctx.tenant.id, status: { in: ACTIVE_FOOD_STATUSES } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 200,
  });
  const rest = ctx.settings.restaurant;
  return (
    <>
      <PageHeader
        title="Live orders"
        description="Incoming orders in real time. Accept, prepare and complete them from here."
        actions={
          <Link href="/admin/food-orders">
            <Button variant="outline">
              <History /> Order history
            </Button>
          </Link>
        }
      />
      <KitchenBoard initialOrders={rows.map(toFoodOrderDto)} prepTimeMins={rest.prepTimeMins} soundAlerts={rest.soundAlerts} acceptingOrders={rest.acceptingOrders} />
    </>
  );
}
