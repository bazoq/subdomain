import type { TravelPackage } from "@/generated/prisma/client";
import { type Lang, type LocalizedString, t } from "@/lib/i18n";
import { PACKAGE_KIND_LABELS, PACKAGE_KINDS, type PackageKind } from "./constants";
import type { ItineraryItem } from "./schema";

function isLocalized(v: unknown): v is LocalizedString {
  return !!v && typeof v === "object" && typeof (v as { en?: unknown }).en === "string";
}

export function isPackageKind(v: string): v is PackageKind {
  return (PACKAGE_KINDS as readonly string[]).includes(v);
}

export function kindLabel(kind: string, lang: Lang): string {
  return isPackageKind(kind) ? t(PACKAGE_KIND_LABELS[kind], lang) : kind;
}

/** Safely read the itinerary JSON column. */
export function parseItinerary(raw: unknown): ItineraryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x, i): ItineraryItem | null => {
      if (!x || typeof x !== "object") return null;
      const o = x as { day?: unknown; title?: unknown; description?: unknown };
      return {
        day: typeof o.day === "number" && o.day > 0 ? o.day : i + 1,
        title: isLocalized(o.title) ? o.title : { en: typeof o.title === "string" ? o.title : "" },
        description: isLocalized(o.description) ? o.description : { en: typeof o.description === "string" ? o.description : "" },
      };
    })
    .filter((x): x is ItineraryItem => x !== null);
}

/** Safely read a LocalizedString[] JSON column (inclusions / exclusions). Also accepts plain strings. */
export function parseLocalizedList(raw: unknown): LocalizedString[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x): LocalizedString | null => (isLocalized(x) ? x : typeof x === "string" && x.trim() ? { en: x } : null))
    .filter((x): x is LocalizedString => x !== null);
}

/** Safely read the departures JSON column: ISO dates, sorted, future-only when `futureOnly`. */
export function parseDepartures(raw: unknown, futureOnly = false): string[] {
  if (!Array.isArray(raw)) return [];
  const today = new Date().toISOString().slice(0, 10);
  return raw
    .filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x))
    .filter((d) => !futureOnly || d >= today)
    .sort();
}

/** "7 Days / 6 Nights" */
export function durationText(pkg: Pick<TravelPackage, "days" | "nights">, lang: Lang): string {
  if (lang === "ur") return `${pkg.days} دن / ${pkg.nights} راتیں`;
  return `${pkg.days} Day${pkg.days === 1 ? "" : "s"} / ${pkg.nights} Night${pkg.nights === 1 ? "" : "s"}`;
}

/** Build a /packages URL from filter values, omitting empties. */
export function packagesHref(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (k === "page" && Number(v) <= 1)) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `/packages?${s}` : "/packages";
}
