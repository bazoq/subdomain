"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateReservationStatus } from "@/modules/restaurant/actions";
import { RESERVATION_TRANSITIONS, type ReservationStatusKey } from "@/modules/restaurant/types";

const pretty = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Status select limited to the transitions allowed from the current status; final statuses render as plain text. */
export function ReservationStatusSelect({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const allowed = RESERVATION_TRANSITIONS[status as ReservationStatusKey] ?? [];
  if (!allowed.length) return <span className="text-xs text-slate-400">Final</span>;
  return (
    <Select
      value={status}
      disabled={busy}
      className="h-8 w-40 text-xs"
      aria-label="Change reservation status"
      onChange={async (e) => {
        const next = e.target.value as ReservationStatusKey;
        if (next === status) return;
        if (next === "CANCELLED" && !window.confirm("Cancel this reservation?")) {
          e.target.value = status;
          return;
        }
        setBusy(true);
        const res = await updateReservationStatus(id, next);
        setBusy(false);
        if (res.ok) {
          toast.push("success", res.message ?? "Updated");
          router.refresh();
        } else toast.push("error", res.message);
      }}
    >
      <option value={status}>{pretty(status)} (current)</option>
      {allowed.map((s) => (
        <option key={s} value={s}>
          {s === "CANCELLED" ? "Cancel" : s === "SEATED" ? "Mark seated" : s === "CONFIRMED" ? "Confirm" : pretty(s)}
        </option>
      ))}
    </Select>
  );
}
