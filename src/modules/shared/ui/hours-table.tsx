import { Clock } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { dayName, isOpenNow } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function to12h(hhmm: string, lang: "en" | "ur") {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? (lang === "ur" ? "شام" : "PM") : lang === "ur" ? "صبح" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

function todayIndex() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })).getDay();
}

/** Opening hours from Settings > Opening hours; highlights today and shows open/closed. */
export function HoursTable({
  ctx,
  className,
  showStatus = true,
  light,
  compact,
  title,
}: {
  ctx: SiteContext;
  className?: string;
  showStatus?: boolean;
  light?: boolean;
  compact?: boolean;
  title?: string;
}) {
  const hours = [...ctx.settings.hours].sort((a, b) => a.day - b.day);
  if (!hours.length) return null;
  const today = todayIndex();
  const open = isOpenNow(hours);
  const note = ctx.sections.hours?.enabled ? (ctx.sections.hours.data as { note?: { en: string; ur?: string } }).note : undefined;
  return (
    <div className={cn(className)}>
      {(title || showStatus) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h3 className={cn("font-heading flex items-center gap-2 text-lg font-bold", light && "text-t-dark-fg")}>
              <Clock className="size-5" /> {title}
            </h3>
          ) : (
            <span />
          )}
          {showStatus && open !== null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                open ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600",
              )}
            >
              <span className={cn("size-1.5 rounded-full", open ? "bg-emerald-500" : "bg-red-500")} />
              {open ? t(ui.openNow, ctx.lang) : t(ui.closedNow, ctx.lang)}
            </span>
          ) : null}
        </div>
      )}
      <table className={cn("w-full text-sm", compact ? "text-xs" : "")}>
        <tbody>
          {hours.map((h) => {
            const isToday = h.day === today;
            return (
              <tr
                key={h.day}
                className={cn(
                  "border-b last:border-0",
                  light ? "border-white/10" : "border-t-border",
                  isToday && (light ? "font-semibold text-t-dark-fg" : "font-semibold text-t-primary"),
                )}
              >
                <td className={cn("py-2", compact ? "py-1.5" : "")}>
                  {dayName(h.day, ctx.lang)}
                  {isToday ? <span className="ms-2 rounded-full bg-t-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{ctx.lang === "ur" ? "آج" : "Today"}</span> : null}
                </td>
                <td className={cn("py-2 text-end", compact ? "py-1.5" : "", light ? "text-t-dark-fg/80" : "text-t-muted-fg")} dir="ltr">
                  {h.closed ? (ctx.lang === "ur" ? "بند" : "Closed") : `${to12h(h.open, ctx.lang)} – ${to12h(h.close, ctx.lang)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {note && t(note, ctx.lang) ? <p className={cn("mt-3 text-xs", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{t(note, ctx.lang)}</p> : null}
    </div>
  );
}
