import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ---------- locale-aware formatting (Pakistan) ---------- */

export const PK_TIME_ZONE = "Asia/Karachi";

/** BCP-47 locale for Intl APIs. Urdu keeps Latin digits (`nu-latn`), the convention on Pakistani sites. */
export function localeFor(lang: "en" | "ur" = "en"): string {
  return lang === "ur" ? "ur-PK-u-nu-latn" : "en-PK";
}

const numberFormats = new Map<string, Intl.NumberFormat>();
function numberFormat(lang: "en" | "ur") {
  const key = localeFor(lang);
  let nf = numberFormats.get(key);
  if (!nf) {
    nf = new Intl.NumberFormat(key, { maximumFractionDigits: 0 });
    numberFormats.set(key, nf);
  }
  return nf;
}

/** Group digits for the language: 12500 -> "12,500". */
export function formatNumber(n: number, lang: "en" | "ur" = "en"): string {
  if (!Number.isFinite(n)) return "0";
  return numberFormat(lang).format(n);
}

/**
 * Format an integer rupee amount: 12500 -> "Rs 12,500" (Urdu: "12,500 روپے").
 * `compact` uses lakh/crore: 250000 -> "Rs 2.5 Lac".
 */
export function formatPKR(amount: number, opts: { compact?: boolean; lang?: "en" | "ur" } = {}): string {
  const lang = opts.lang ?? "en";
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const wrap = (s: string) => (lang === "ur" ? `${sign}${s} روپے` : `${sign}Rs ${s}`);
  if (opts.compact) {
    const unit = (div: number, en: string, ur: string) => {
      const v = abs / div;
      const num = (abs % div === 0 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, ""));
      return wrap(`${num} ${lang === "ur" ? ur : en}`);
    };
    if (abs >= 10_000_000) return unit(10_000_000, "Crore", "کروڑ");
    if (abs >= 100_000) return unit(100_000, "Lac", "لاکھ");
  }
  return wrap(formatNumber(abs, lang));
}

/**
 * Format a date in Pakistan time. Always pins the time zone so the server (UTC on Vercel) and the
 * browser render the same string (no hydration mismatch). Invalid dates render as "".
 */
export function formatDate(d: Date | string | number | null | undefined, withTime = false, lang: "en" | "ur" = "en"): string {
  if (d == null || d === "") return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(lang), {
    timeZone: PK_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/** Current weekday (0 = Sunday) and minutes since midnight in Pakistan time. */
export function karachiNow(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PK_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { day: dayIdx < 0 ? now.getDay() : dayIdx, minutes: hour * 60 + (Number.isNaN(minute) ? 0 : minute) };
}

/* ---------- phone / WhatsApp ---------- */

/** Normalise Pakistani phone numbers to +92XXXXXXXXXX. Returns null if invalid. */
export function normalizePkPhone(raw: string): string | null {
  let n = (raw ?? "").replace(/[^\d+]/g, "");
  if (n.startsWith("+92")) n = n.slice(3);
  else if (n.startsWith("0092")) n = n.slice(4);
  else if (n.startsWith("92") && n.length === 12) n = n.slice(2);
  else if (n.startsWith("0")) n = n.slice(1);
  if (!/^3\d{9}$/.test(n) && !/^[2-9]\d{8,9}$/.test(n)) return null;
  return `+92${n}`;
}

/** Human display: +923001234567 -> "0300 1234567". Non-PK numbers are returned as given. */
export function formatPkPhone(raw: string): string {
  const n = normalizePkPhone(raw);
  if (!n) return raw;
  const local = `0${n.slice(3)}`;
  return local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4)}` : local;
}

export function whatsappLink(number: string, text?: string) {
  const digits = (normalizePkPhone(number) ?? number).replace(/[^\d]/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/* ---------- URL safety (tenant-supplied values) ---------- */

const CONTROL_OR_SPACE_RE = /[\u0000-\u001f\u007f\s]/;
const DOMAIN_LIKE_RE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#]|$)/i;

/** Absolute http(s) URL parseable by `new URL`, or null. Use for external links, OG images, JSON-LD, sameAs. */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v || CONTROL_OR_SPACE_RE.test(v)) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Validate a link href from the database. Allowed: same-origin paths (`/…`, `#…`, `?…`),
 * http(s), mailto:, tel:, sms:, whatsapp:. Bare domains get `https://`; bare words become paths.
 * Returns null for anything else (javascript:, data:, vbscript:, protocol-relative `//`, …).
 */
export function safeLinkHref(raw: string | null | undefined): { href: string; external: boolean } | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v || CONTROL_OR_SPACE_RE.test(v)) return null;
  if (v.startsWith("//")) return null;
  if (v.startsWith("/") || v.startsWith("#") || v.startsWith("?")) return { href: v, external: false };
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(v)?.[1]?.toLowerCase();
  if (scheme) {
    if (scheme === "http" || scheme === "https") {
      const u = safeExternalUrl(v);
      return u ? { href: u, external: true } : null;
    }
    if (scheme === "mailto" || scheme === "tel" || scheme === "sms" || scheme === "whatsapp") return { href: v, external: true };
    return null;
  }
  if (DOMAIN_LIKE_RE.test(v)) {
    const u = safeExternalUrl(`https://${v}`);
    return u ? { href: u, external: true } : null;
  }
  return { href: `/${v.replace(/^\.\/+/, "")}`, external: false };
}

/** Image src that is safe to render: http(s), same-origin path, blob: (previews) or data:image/*. */
export function safeImageSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v || CONTROL_OR_SPACE_RE.test(v)) return null;
  if (v.startsWith("//")) return null;
  if (v.startsWith("/")) return v;
  if (/^blob:/i.test(v)) return v;
  if (/^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml);base64,/i.test(v)) return v;
  return safeExternalUrl(v);
}

/* ---------- misc ---------- */

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, Math.max(0, n - 1))}...` : s;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function safeJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  return raw as T;
}

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
