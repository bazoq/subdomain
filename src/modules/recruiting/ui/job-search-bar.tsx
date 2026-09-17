import { MapPin, Search } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";

/**
 * Hero search: keyword + location → GET /jobs?q=&location=.
 * No client JS required, so it can sit inside any template hero (server or client).
 */
export function JobSearchBar({
  ctx,
  className,
  locations,
  variant = "card",
}: {
  ctx: SiteContext;
  className?: string;
  /** optional list of suggested locations (rendered as a datalist) */
  locations?: string[];
  variant?: "card" | "plain";
}) {
  const lang = ctx.lang;
  const listId = "job-locations";
  return (
    <form
      method="get"
      action="/jobs"
      role="search"
      aria-label={t(rs.findJobs, lang)}
      className={cn("flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-stretch", variant === "card" && "t-card p-2 shadow-lg", className)}
    >
      <label className="relative flex-1">
        <span className="sr-only">{t(rs.keyword, lang)}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg rtl:left-auto rtl:right-3" aria-hidden="true" />
        <input name="q" placeholder={t(rs.keyword, lang)} className="t-input h-full pl-9 rtl:pl-3 rtl:pr-9" />
      </label>
      <label className="relative flex-1 sm:max-w-[240px]">
        <span className="sr-only">{t(rs.location, lang)}</span>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg rtl:left-auto rtl:right-3" aria-hidden="true" />
        <input name="location" list={locations?.length ? listId : undefined} placeholder={t(rs.location, lang)} className="t-input h-full pl-9 rtl:pl-3 rtl:pr-9" />
        {locations?.length ? (
          <datalist id={listId}>
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        ) : null}
      </label>
      <button type="submit" className="t-btn t-btn-primary">
        {t(rs.findJobs, lang)}
      </button>
    </form>
  );
}
