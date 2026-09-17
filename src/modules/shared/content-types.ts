import type { LocalizedString } from "@/lib/i18n";

/**
 * Safe readers for loosely-typed Json columns (Service.features, TeamMember.socials,
 * SitePage.seo, TenantPost.content …). Never throw; always return a usable shape.
 */

export function asLocalized(raw: unknown): LocalizedString {
  if (typeof raw === "string") return { en: raw };
  if (raw && typeof raw === "object") {
    const o = raw as { en?: unknown; ur?: unknown };
    return { en: typeof o.en === "string" ? o.en : "", ...(typeof o.ur === "string" && o.ur ? { ur: o.ur } : {}) };
  }
  return { en: "" };
}

export function asLocalizedList(raw: unknown): LocalizedString[] {
  if (!Array.isArray(raw)) return [];
  const out: LocalizedString[] = [];
  for (const x of raw) {
    if (typeof x === "string") {
      if (x.trim()) out.push({ en: x });
    } else if (x && typeof x === "object" && typeof (x as { en?: unknown }).en === "string") {
      out.push(asLocalized(x));
    }
  }
  return out;
}

export type PriceTier = { qty: number; price: number };

/** Service.features may hold quantity price tiers `[{ qty, price }]` for printing shops. */
export function asPriceTiers(raw: unknown): PriceTier[] {
  if (!Array.isArray(raw)) return [];
  const tiers: PriceTier[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const { qty, price } = x as { qty?: unknown; price?: unknown };
    const q = Number(qty);
    const p = Number(price);
    if (Number.isFinite(q) && Number.isFinite(p) && q > 0 && p >= 0) tiers.push({ qty: Math.round(q), price: Math.round(p) });
  }
  return tiers.sort((a, b) => a.qty - b.qty);
}

export type SocialLinksValue = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
};

const SOCIAL_KEYS: (keyof SocialLinksValue)[] = ["facebook", "instagram", "tiktok", "youtube", "linkedin", "twitter"];

export function asSocials(raw: unknown): SocialLinksValue {
  const out: SocialLinksValue = {};
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const k of SOCIAL_KEYS) if (typeof o[k] === "string" && o[k]) out[k] = o[k] as string;
  return out;
}

export type PageSeo = { title?: string; description?: string };

export function asSeo(raw: unknown): PageSeo {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as { title?: unknown; description?: unknown };
  return {
    ...(typeof o.title === "string" ? { title: o.title } : {}),
    ...(typeof o.description === "string" ? { description: o.description } : {}),
  };
}

export function asStringRecord(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v == null || v === "") continue;
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

/** Human label for a form/data key: "preferredDate" -> "Preferred date". */
export function humanize(key: string): string {
  const s = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
