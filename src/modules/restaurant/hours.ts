/**
 * Opening-hours helpers for a specific moment, all evaluated in Pakistan time (Asia/Karachi, UTC+5, no DST).
 * Pure functions — no server imports — so they can be shared by actions and client previews.
 *
 * `isOpenNow` (templates/ui) answers "open right now?"; these answer "open at <that time>?" for scheduled orders
 * and table reservations, including overnight windows (e.g. 18:00 – 02:00 belongs to the day it *starts*).
 */
import type { OpeningHours } from "@/lib/tenant-settings";

export const PK_OFFSET = "+05:00";

export interface PkParts {
  /** 0 = Sunday … 6 = Saturday, in Pakistan time */
  day: number;
  /** minutes since local midnight */
  minutes: number;
  /** YYYY-MM-DD in Pakistan time */
  ymd: string;
}

/** Break a Date into Pakistan-local day-of-week / minutes / calendar date. */
export function pkParts(date: Date): PkParts {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour12: false, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value])) as Record<string, string>;
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const hour = Number(parts.hour) % 24; // "24" appears for midnight in some engines
  return { day: dayIndex < 0 ? date.getDay() : dayIndex, minutes: hour * 60 + Number(parts.minute), ymd: `${parts.year}-${parts.month}-${parts.day}` };
}

export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

type DayHours = OpeningHours[number];

function windowOf(h: DayHours | undefined): { open: number; close: number; overnight: boolean } | null {
  if (!h || h.closed) return null;
  const open = toMinutes(h.open);
  const close = toMinutes(h.close);
  if (open == null || close == null) return null;
  // "00:00 – 00:00" / open == close: treat as open all day
  if (open === close) return { open: 0, close: 24 * 60, overnight: false };
  return { open, close, overnight: close < open };
}

/**
 * Is the venue open at `date`? `null` when no hours are configured (caller decides the default).
 * A time after midnight is also accepted when the *previous* day's window runs overnight past it.
 */
export function isOpenAt(hours: OpeningHours, date: Date): boolean | null {
  if (!hours.length) return null;
  const { day, minutes } = pkParts(date);
  const today = windowOf(hours.find((h) => h.day === day));
  if (today) {
    if (today.overnight ? minutes >= today.open : minutes >= today.open && minutes < today.close) return true;
  }
  const prev = windowOf(hours.find((h) => h.day === (day + 6) % 7));
  if (prev?.overnight && minutes < prev.close) return true;
  return false;
}

/** The configured hours for the Pakistan-local weekday of `date` (undefined when not configured). */
export function hoursForDate(hours: OpeningHours, date: Date): DayHours | undefined {
  return hours.find((h) => h.day === pkParts(date).day);
}

/** `YYYY-MM-DD` + `HH:MM` interpreted in Pakistan time → Date; null when malformed. */
export function pkDateTime(ymd: string, hhmm: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || toMinutes(hhmm) == null) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${PK_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}
