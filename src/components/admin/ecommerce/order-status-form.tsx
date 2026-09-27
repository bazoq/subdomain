"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateOrderStatus } from "@/modules/ecommerce/actions";
import { ORDER_TRANSITIONS, type OrderStatusValue } from "@/modules/ecommerce/types";

const pretty = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

/**
 * Status select (only the transitions allowed from the current status) + optional note → appends to the order timeline.
 * Keeping the current status and adding a note records the note without a transition.
 */
export function OrderStatusForm({ orderId, current }: { orderId: string; current: OrderStatusValue }) {
  const [status, setStatus] = React.useState<OrderStatusValue>(current);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const allowed = ORDER_TRANSITIONS[current] ?? [];
  const terminal = allowed.length === 0;

  async function submit() {
    if ((status === "CANCELLED" || status === "RETURNED") && current !== status && !window.confirm(`Mark this order as ${status.toLowerCase()}? Stock for its items will be restored and the order cannot be re-opened.`)) return;
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
      {terminal ? <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">This order is {pretty(current).toLowerCase()} and cannot be re-opened. You can still add a note to the timeline.</p> : null}
      <Field label="Status" help={terminal ? undefined : `Next: ${allowed.map((s) => pretty(s)).join(", ")}`}>
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatusValue)}>
          <option value={current}>{pretty(current)} (current)</option>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {pretty(s)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note (optional)" help="Visible to the customer on the tracking page, e.g. courier name and tracking number.">
        <Textarea className="min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
      <Button onClick={submit} loading={busy} className="w-full" disabled={status === current && !note.trim()}>
        {status === current ? "Add note" : `Mark as ${pretty(status).toLowerCase()}`}
      </Button>
    </div>
  );
}
