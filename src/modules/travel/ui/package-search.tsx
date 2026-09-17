import { MapPin, Search } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PACKAGE_KINDS } from "../constants";
import { kindLabel } from "../helpers";
import { ts } from "../strings";

/**
 * Hero search: destination + kind → GET /packages?destination=&kind=. No client JS needed.
 * `destinations` (from getDestinations) renders a datalist of suggestions.
 */
export function PackageSearch({ ctx, destinations, className, variant = "card" }: { ctx: SiteContext; destinations?: string[]; className?: string; variant?: "card" | "plain" }) {
  const lang = ctx.lang;
  const listId = "pkg-destinations";
  return (
    <form
      method="get"
      action="/packages"
      role="search"
      aria-label={t(ts.searchPackages, lang)}
      className={cn("flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-stretch", variant === "card" && "t-card p-2 shadow-lg", className)}
    >
      <label className="relative flex-1">
        <span className="sr-only">{t(ts.destination, lang)}</span>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg rtl:left-auto rtl:right-3" aria-hidden="true" />
        <input name="destination" list={destinations?.length ? listId : undefined} placeholder={t(ts.anyDestination, lang)} className="t-input h-full pl-9 rtl:pl-3 rtl:pr-9" />
        {destinations?.length ? (
          <datalist id={listId}>
            {destinations.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        ) : null}
      </label>
      <label className="flex-1 sm:max-w-[200px]">
        <span className="sr-only">{t(ts.packageType, lang)}</span>
        <select name="kind" defaultValue="" className="t-input h-full">
          <option value="">{t(ts.anyType, lang)}</option>
          {PACKAGE_KINDS.map((k) => (
            <option key={k} value={k}>
              {kindLabel(k, lang)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="t-btn t-btn-primary">
        <Search className="size-4" aria-hidden="true" />
        {t(ts.searchPackages, lang)}
      </button>
    </form>
  );
}
