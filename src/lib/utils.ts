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

/** Format an integer rupee amount: 12500 -> "Rs 12,500" */
export function formatPKR(amount: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (amount >= 10_000_000) return `Rs ${(amount / 10_000_000).toFixed(amount % 10_000_000 === 0 ? 0 : 2)} Crore`;
    if (amount >= 100_000) return `Rs ${(amount / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 2)} Lac`;
  }
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

export function formatDate(d: Date | string, withTime = false) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Normalise Pakistani phone numbers to +92XXXXXXXXXX. Returns null if invalid. */
export function normalizePkPhone(raw: string): string | null {
  let n = raw.replace(/[^\d+]/g, "");
  if (n.startsWith("+92")) n = n.slice(3);
  else if (n.startsWith("0092")) n = n.slice(4);
  else if (n.startsWith("92") && n.length === 12) n = n.slice(2);
  else if (n.startsWith("0")) n = n.slice(1);
  if (!/^3\d{9}$/.test(n) && !/^[2-9]\d{8,9}$/.test(n)) return null;
  return `+92${n}`;
}

export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/[^\d]/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}...` : s;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function safeJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  return raw as T;
}

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
