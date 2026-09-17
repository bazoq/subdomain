import type { Property } from "@/generated/prisma/client";
import { type Lang, t } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import {
  AREA_UNIT_LABELS,
  AREA_UNITS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  PURPOSE_LABELS,
  PURPOSES,
  SORT_OPTIONS,
  type AreaUnit,
  type PropertyType,
  type Purpose,
  type SortKey,
} from "./constants";
import { rs } from "./strings";

export const isPurpose = (v: string): v is Purpose => (PURPOSES as readonly string[]).includes(v);
export const isPropertyType = (v: string): v is PropertyType => (PROPERTY_TYPES as readonly string[]).includes(v);
export const isAreaUnit = (v: string): v is AreaUnit => (AREA_UNITS as readonly string[]).includes(v);
export const isSortKey = (v: string): v is SortKey => (SORT_OPTIONS as readonly string[]).includes(v);

export function purposeLabel(v: string, lang: Lang): string {
  return isPurpose(v) ? t(PURPOSE_LABELS[v], lang) : v;
}
export function typeLabel(v: string, lang: Lang): string {
  return isPropertyType(v) ? t(PROPERTY_TYPE_LABELS[v], lang) : v;
}
export function areaUnitLabel(v: string, lang: Lang): string {
  return isAreaUnit(v) ? t(AREA_UNIT_LABELS[v], lang) : v;
}

export function isMonthly(p: Pick<Property, "purpose" | "priceUnit">): boolean {
  return p.priceUnit === "MONTHLY" || p.purpose === "RENT";
}

/** "Rs 2.5 Crore" or "Rs 85,000/month". */
export function propertyPrice(p: Pick<Property, "price" | "purpose" | "priceUnit">, lang: Lang): string {
  const base = formatPKR(p.price, { compact: true });
  return isMonthly(p) ? `${base}${t(rs.perMonth, lang)}` : base;
}

/** "10 Marla", "1 Kanal", "1,250 Sq. Ft." — null when no area set. */
export function areaText(p: Pick<Property, "areaValue" | "areaUnit">, lang: Lang): string | null {
  if (p.areaValue == null || p.areaValue <= 0) return null;
  const n = Number.isInteger(p.areaValue) ? p.areaValue.toLocaleString("en-PK") : p.areaValue.toLocaleString("en-PK", { maximumFractionDigits: 2 });
  return `${n} ${areaUnitLabel(p.areaUnit, lang)}`;
}

/** Google Maps embed URL if `mapUrl` is embeddable, otherwise null (render as a link instead). */
export function mapEmbedUrl(mapUrl: string | null | undefined): string | null {
  if (!mapUrl) return null;
  if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(mapUrl) || /output=embed/.test(mapUrl)) return mapUrl;
  return null;
}

/** YouTube embed URL for watch / youtu.be / shorts links, otherwise null. */
export function videoEmbedUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  const m = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(videoUrl);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function propertiesHref(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (k === "page" && Number(v) <= 1)) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `/properties?${s}` : "/properties";
}
