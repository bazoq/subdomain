"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateOrderStatus } from "@/modules/ecommerce/actions";
import { ORDER_STATUSES } from "@/modules/ecommerce/types";

/** Status select + optional note → appends to the order timeline. */
export function OrderStatusForm({ orderId, current }: { orderId: string; current: string }) {
  const [status, setStatus] = React.useState(current);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  async function submit() {
    if ((status === "CANCELLED" || status === "RETURNED") && current !== status && !window.confirm(`Mark this order as ${status.toLowerCase()}? Stock for its items will be restored.`)) return;
    setBusy(true);
    const res = await updateOrderStatus(orderId, status, note);
    setBusy(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Updated");
      setNote("");
      router.refresh();
    } else toast.push("error", res.message);
  }

  return (
    <div className="space-y-3">
      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note (optional)" help="Visible to the customer on the tracking page, e.g. courier name and tracking number.">
        <Textarea className="min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
      <Button onClick={submit} loading={busy} className="w-full" disabled={status === current && !note.trim()}>
        Update status
      </Button>
    </div>
  );
}
