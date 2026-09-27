/** Shared constants for the travel module (safe for client and server). */

export const PACKAGE_KINDS = ["TOUR", "UMRAH", "HAJJ", "HONEYMOON", "CORPORATE", "VISA"] as const;
export type PackageKind = (typeof PACKAGE_KINDS)[number];

export const PACKAGE_KIND_LABELS: Record<PackageKind, { en: string; ur: string }> = {
  TOUR: { en: "Tours", ur: "ٹور" },
  UMRAH: { en: "Umrah", ur: "عمرہ" },
  HAJJ: { en: "Hajj", ur: "حج" },
  HONEYMOON: { en: "Honeymoon", ur: "ہنی مون" },
  CORPORATE: { en: "Corporate", ur: "کارپوریٹ" },
  VISA: { en: "Visa services", ur: "ویزا خدمات" },
};

export const BOOKING_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatusKey = (typeof BOOKING_STATUSES)[number];

/**
 * Booking status state machine:
 *  NEW -> CONTACTED | CONFIRMED | CANCELLED
 *  CONTACTED -> CONFIRMED | CANCELLED | NEW (undo)
 *  CONFIRMED -> CANCELLED | CONTACTED (undo)
 *  CANCELLED -> NEW | CONTACTED (reopen)
 */
const BOOKING_TRANSITIONS: Record<BookingStatusKey, readonly BookingStatusKey[]> = {
  NEW: ["CONTACTED", "CONFIRMED", "CANCELLED"],
  CONTACTED: ["CONFIRMED", "CANCELLED", "NEW"],
  CONFIRMED: ["CANCELLED", "CONTACTED"],
  CANCELLED: ["NEW", "CONTACTED"],
};

export function isBookingStatus(v: string): v is BookingStatusKey {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

export function canTransitionBooking(from: BookingStatusKey, to: BookingStatusKey): boolean {
  return from === to || BOOKING_TRANSITIONS[from].includes(to);
}

export function allowedBookingTransitions(from: BookingStatusKey): readonly BookingStatusKey[] {
  return BOOKING_TRANSITIONS[from];
}

/** Same phone requesting the same package within this window is treated as a duplicate (idempotent). */
export const BOOKING_DUPLICATE_HOURS = 24;

/** Bookings may be requested at most this many days ahead. */
export const BOOKING_MAX_DAYS_AHEAD = 730;

/** Popular destinations for Pakistani travellers (datalist suggestions in admin). */
export const POPULAR_DESTINATIONS = [
  "Makkah & Madinah",
  "Hunza",
  "Skardu",
  "Swat & Kalam",
  "Naran & Kaghan",
  "Murree",
  "Neelum Valley",
  "Dubai",
  "Istanbul",
  "Baku",
  "Malaysia",
  "Thailand",
  "Maldives",
];

export const PACKAGES_PAGE_SIZE = 12;
export const PACKAGE_IMAGES_FOLDER = "packages";
