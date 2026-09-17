import { Clock, PauseCircle } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { isOpenNow } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";

/** Server-safe "Open now / Closed" pill with an "orders paused" notice. Renders nothing when hours are not configured and orders are accepted. */
export function OpenBadge({ ctx, className, showHours = true }: { ctx: SiteContext; className?: string; showHours?: boolean }) {
  const lang = ctx.lang;
  const open = isOpenNow(ctx.settings.hours);
  const paused = !ctx.settings.restaurant.acceptingOrders;
  const today = ctx.settings.hours.find((h) => h.day === new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })).getDay());
  if (open === null && !paused) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {open !== null ? (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", open ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700")}>
          <span className={cn("size-2 rounded-full", open ? "bg-emerald-500" : "bg-red-500")} />
          {open ? t(ui.openNow, lang) : t(ui.closedNow, lang)}
          {showHours && today && !today.closed ? (
            <span className="font-normal opacity-80">
              · {today.open}–{today.close}
            </span>
          ) : null}
        </span>
      ) : null}
      {paused ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          <PauseCircle className="size-3.5" />
          {t(rs.ordersPaused, lang)}
        </span>
      ) : null}
      {!paused && open === false ? (
        <span className="inline-flex items-center gap-1 text-xs text-t-muted-fg">
          <Clock className="size-3.5" />
          {t(rs.closedNotice, lang)}
        </span>
      ) : null}
    </div>
  );
}
