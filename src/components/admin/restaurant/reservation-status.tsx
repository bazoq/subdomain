"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateReservationStatus } from "@/modules/restaurant/actions";
import { RESERVATION_STATUSES } from "@/modules/restaurant/types";

export function ReservationStatusSelect({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <Select
      value={status}
      disabled={busy}
      className="h-8 w-36 text-xs"
      onChange={async (e) => {
        setBusy(true);
        const res = await updateReservationStatus(id, e.target.value);
        setBusy(false);
        if (res.ok) {
          toast.push("success", res.message ?? "Updated");
          router.refresh();
        } else toast.push("error", res.message);
      }}
    >
      {RESERVATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
