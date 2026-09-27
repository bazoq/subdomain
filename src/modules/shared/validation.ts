import { z } from "zod";
import type { LocalizedString } from "@/lib/i18n";
import { normalizePkPhone } from "@/lib/utils";

/**
 * Shared validation primitives for public forms and admin editors.
 * Client-safe (no server-only imports) so zod schemas can be shared with forms.
 */

/* ───────────────────────── phone / email ───────────────────────── */

/**
 * Normalise a visitor phone number. Pakistani numbers become `+92XXXXXXXXXX`;
 * other international numbers are kept as digits (with a leading +) when they
 * contain 7..15 digits. Returns null when the value cannot be a phone number.
 */
export function normalizeContactPhone(raw: string): string | null {
  const pk = normalizePkPhone(raw);
  if (pk) return pk;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  const hasPlus = /^\s*(\+|00)/.test(raw);
  return hasPlus ? `+${digits.replace(/^00/, "")}` : digits;
}

/** Strict Pakistani mobile/landline (used where the caller must be reachable locally). */
export function isPkPhone(raw: string): boolean {
  return normalizePkPhone(raw) !== null;
}

/** Visitor phone field: 7..20 chars and at least 7 digits. Normalisation happens in the action. */
export const zPhone = z
  .string()
  .trim()
  .min(7, "Please enter a valid mobile number")
  .max(20, "Please enter a valid mobile number")
  .refine((v) => normalizeContactPhone(v) !== null, "Please enter a valid mobile number (03XX-XXXXXXX)");

export const zEmailOptional = z.string().trim().email("Invalid email").max(120).optional().or(z.literal(""));

/* ───────────────────────── URLs ───────────────────────── */

const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** True for absolute `http(s)://` URLs only (rejects javascript:, data:, protocol-relative). */
export function isHttpUrl(v: string | null | undefined): v is string {
  return !!v && HTTP_URL.test(v.trim());
}

/** `https://…` or `http://…` (no javascript:/data: schemes). Empty string allowed. */
export const zHttpUrlOrEmpty = z.union([z.literal(""), z.string().trim().max(1000).regex(HTTP_URL, "Enter a full URL starting with https://")]);

/**
 * Google Maps *embed* URL suitable for an iframe `src`, or null.
 * Accepts only https on google.com / maps.google.com (incl. country TLDs such as google.com.pk)
 * with an embed path (`/maps/embed…`) or `output=embed`. Everything else (share links, other hosts,
 * javascript:) renders as a plain "open in maps" link instead.
 */
export function googleMapsEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!/^(www\.|maps\.)?google\.(com|com\.[a-z]{2}|co\.[a-z]{2}|[a-z]{2})$/.test(u.hostname)) return null;
  const isMapsPath = u.pathname === "/maps" || u.pathname.startsWith("/maps/");
  if (!isMapsPath) return null;
  const embed = u.pathname.startsWith("/maps/embed") || u.searchParams.get("output") === "embed";
  return embed ? u.toString() : null;
}

/** Image sources may be absolute http(s) URLs or site-relative paths. Empty allowed. */
export function isSafeImageUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return true;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  return HTTP_URL.test(s);
}
export const zImageUrlOrEmpty = z.string().trim().max(1000).refine(isSafeImageUrl, "Image must be an https:// URL").optional().or(z.literal(""));
export const zImageUrlList = (max: number) => z.array(z.string().trim().max(1000).refine(isSafeImageUrl, "Image must be an https:// URL")).max(max).default([]);

/* ───────────────────────── rich text ───────────────────────── */

const SAFE_LINK = /^\s*(https?:|mailto:|tel:|\/(?!\/)|#)/i;

/**
 * Neutralise markdown links whose target is not http(s)/mailto/tel/relative
 * (e.g. `[x](javascript:alert(1))` -> `x`). Also strips raw `<script`/`<iframe` tags
 * defensively; the renderer never emits HTML from text, but stored data may be reused.
 */
export function sanitizeRichText(s: string): string {
  if (!s) return s;
  return s
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text: string, url: string) => (SAFE_LINK.test(url) ? m : text))
    .replace(/<\s*\/?\s*(script|iframe|object|embed|style)\b[^>]*>/gi, "");
}

export function sanitizeLocalized(v: LocalizedString | undefined | null): LocalizedString {
  if (!v) return { en: "" };
  const out: LocalizedString = { en: sanitizeRichText(v.en ?? "") };
  if (v.ur && v.ur.trim()) out.ur = sanitizeRichText(v.ur);
  return out;
}

/* ───────────────────────── misc ───────────────────────── */

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date (Asia/Karachi) as `YYYY-MM-DD`. */
export function todayPk(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a JSON string of extra form fields into a flat string record (bounded). */
export function parseExtraFields(raw: string | undefined, opts: { maxKeys?: number; maxValue?: number } = {}): Record<string, string> {
  const maxKeys = opts.maxKeys ?? 40;
  const maxValue = opts.maxValue ?? 1000;
  const out: Record<string, string> = {};
  if (!raw) return out;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return out;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return out;
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (Object.keys(out).length >= maxKeys) break;
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(k)) continue;
    if (v == null || v === "") continue;
    const s = typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : null;
    if (s == null) continue;
    out[k] = s.trim().slice(0, maxValue);
  }
  return out;
}
