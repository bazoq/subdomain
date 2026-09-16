import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  dark: "bg-slate-800 text-white ring-slate-700",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "default", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}
      {...props}
    />
  );
}

/** Map common status strings to a tone. */
export function statusTone(status: string): BadgeTone {
  const s = status.toUpperCase();
  if (["ACTIVE", "DELIVERED", "COMPLETED", "HIRED", "CONFIRMED", "VERIFIED", "PUBLISHED"].includes(s)) return "success";
  if (["PENDING", "NEW", "RECEIVED", "DRAFT"].includes(s)) return "warning";
  if (["CANCELLED", "REJECTED", "SUSPENDED", "RETURNED", "SPAM"].includes(s)) return "danger";
  if (["PROCESSING", "PREPARING", "SHIPPED", "OUT_FOR_DELIVERY", "ACCEPTED", "READY", "IN_PROGRESS", "CONTACTED", "INTERVIEW", "SHORTLISTED", "OFFERED", "SEATED"].includes(s))
    return "info";
  return "default";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replace(/_/g, " ")}</Badge>;
}
