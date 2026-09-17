"use client";

/** Order detail: advance / cancel with optional note. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateFoodOrderStatus } from "@/modules/restaurant/actions";
import { STATUS_TRANSITIONS, type FoodOrderStatusKey, type OrderType } from "@/modules/restaurant/types";

export function OrderStatusControls({ id, status, type }: { id: string; status: FoodOrderStatusKey; type: OrderType }) {
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const options = STATUS_TRANSITIONS[status].filter((s) => s !== "OUT_FOR_DELIVERY" || type === "DELIVERY");
  if (!options.length) return <p className="text-sm text-slate-500">This order is {status.toLowerCase()}. No further changes.</p>;

  async function go(s: FoodOrderStatusKey) {
    if (s === "CANCELLED" && !window.confirm("Cancel this order?")) return;
    setBusy(s);
    const res = await updateFoodOrderStatus(id, s, note || undefined);
    setBusy(null);
    if (res.ok) {
      toast.push("success", res.message ?? "Updated");
      setNote("");
      router.refresh();
    } else toast.push("error", res.message);
  }

  return (
    <div className="space-y-3">
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for timeline (optional), e.g. rider: Ali 0300-1234567" maxLength={300} />
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <Button key={s} size="sm" variant={s === "CANCELLED" ? "danger" : s === "COMPLETED" ? "success" : "default"} loading={busy === s} disabled={!!busy} onClick={() => go(s)}>
            {s === "CANCELLED" ? "Cancel order" : `Mark ${s.replace(/_/g, " ").toLowerCase()}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
