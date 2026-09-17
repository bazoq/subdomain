"use client";

/** Status stepper that polls getFoodOrderStatus every 15s while the order is active. */
import * as React from "react";
import { Check, XCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFoodOrderStatus } from "../actions";
import { rs } from "../strings";
import { ACTIVE_FOOD_STATUSES, statusLabel, type FoodOrderStatusKey, type OrderType, type RestaurantCtx, type TimelineEntry } from "../types";

export function OrderTracker({
  ctx,
  number,
  phoneKey,
  type,
  initialStatus,
  initialTimeline,
  estimatedMins,
  createdAt,
  className,
}: {
  ctx: RestaurantCtx;
  number: number;
  /** last 4 digits of the customer phone (the `p` query param) */
  phoneKey: string;
  type: OrderType;
  initialStatus: FoodOrderStatusKey;
  initialTimeline: TimelineEntry[];
  estimatedMins: number | null;
  createdAt: string;
  className?: string;
}) {
  const lang = ctx.lang;
  const [status, setStatus] = React.useState(initialStatus);
  const [timeline, setTimeline] = React.useState(initialTimeline);
  const active = (ACTIVE_FOOD_STATUSES as string[]).includes(status);

  React.useEffect(() => {
    if (!active) return;
    let stopped = false;
    const tick = async () => {
      const res = await getFoodOrderStatus(number, phoneKey).catch(() => null);
      if (stopped || !res || !res.ok || !res.data) return;
      setStatus(res.data.status);
      setTimeline(res.data.timeline);
    };
    const id = window.setInterval(tick, 15_000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [active, number, phoneKey]);

  const steps: FoodOrderStatusKey[] = type === "DELIVERY" ? ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"] : ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED"];
  const idx = steps.indexOf(status);
  const cancelled = status === "CANCELLED";
  const etaAt = estimatedMins ? new Date(new Date(createdAt).getTime() + estimatedMins * 60_000) : null;

  return (
    <div className={cn("t-card p-5", className)} dir={ctx.dir}>
      {cancelled ? (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="size-5" />
          <span className="font-semibold">{t(rs.orderCancelled, lang)}</span>
        </div>
      ) : (
        <>
          <ol className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => {
              const done = i < idx || status === "COMPLETED";
              const current = i === idx && status !== "COMPLETED";
              return (
                <li key={s} className="flex flex-col items-center text-center">
                  <div className="relative flex w-full items-center justify-center">
                    {i > 0 ? <span className={cn("absolute end-1/2 h-0.5 w-full", i <= idx ? "bg-t-primary" : "bg-t-border")} /> : null}
                    <span
                      className={cn(
                        "relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                        done ? "border-t-primary bg-t-primary text-t-primary-fg" : current ? "border-t-primary bg-t-card text-t-primary ring-4 ring-t-primary/20" : "border-t-border bg-t-card text-t-muted-fg",
                      )}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                  </div>
                  <span className={cn("mt-2 text-[11px] leading-tight sm:text-xs", current || done ? "font-semibold" : "text-t-muted-fg")}>{statusLabel(s, lang)}</span>
                </li>
              );
            })}
          </ol>
          {active ? (
            <p className="mt-4 text-center text-sm text-t-muted-fg">
              {t(rs.trackingIntro, lang)}
              {etaAt ? (
                <>
                  {" "}
                  {t(rs.estimated, lang)}: ~{estimatedMins} {t(rs.mins, lang)} ({etaAt.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })})
                </>
              ) : null}
            </p>
          ) : null}
        </>
      )}

      {timeline.length ? (
        <ul className="mt-5 space-y-1.5 border-t border-t-border pt-4 text-xs text-t-muted-fg">
          {timeline.map((e, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {statusLabel(e.status, lang)}
                {e.note ? <span className="italic"> — {e.note}</span> : null}
              </span>
              <span className="shrink-0 tabular-nums">{new Date(e.at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
