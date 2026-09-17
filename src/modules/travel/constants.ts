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
