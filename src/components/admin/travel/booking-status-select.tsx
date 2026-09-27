"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateBookingStatus } from "@/modules/travel/actions";
import { BOOKING_STATUSES, canTransitionBooking, isBookingStatus, type BookingStatusKey } from "@/modules/travel/constants";
import { cn } from "@/lib/utils";

const tone: Record<BookingStatusKey, string> = {
  NEW: "border-amber-300 bg-amber-50 text-amber-800",
  CONTACTED: "border-sky-300 bg-sky-50 text-sky-800",
  CONFIRMED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-red-300 bg-red-50 text-red-700",
};

/**
 * Inline status dropdown for the bookings table; saves on change.
 * Options that are not a legal transition from the current status are disabled
 * (the server enforces the same state machine).
 */
export function BookingStatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = React.useState(status);
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const current: BookingStatusKey | null = isBookingStatus(value) ? value : null;
  const cls = current ? tone[current] : "";
  return (
    <Select
      value={value}
      disabled={busy}
      aria-label="Booking status"
      className={cn("h-8 w-36 py-0 text-xs font-medium", cls)}
      onChange={async (e) => {
        const next = e.target.value;
        const prev = value;
        if (!isBookingStatus(next) || (current && !canTransitionBooking(current, next))) return;
        setValue(next);
        setBusy(true);
        const res = await updateBookingStatus(id, next);
        setBusy(false);
        if (res.ok) {
          toast.push("success", res.message ?? "Updated");
          router.refresh();
        } else {
          setValue(prev);
          toast.push("error", res.message);
        }
      }}
    >
      {BOOKING_STATUSES.map((s) => (
        <option key={s} value={s} disabled={current ? !canTransitionBooking(current, s) : false}>
          {s}
        </option>
      ))}
    </Select>
  );
}
