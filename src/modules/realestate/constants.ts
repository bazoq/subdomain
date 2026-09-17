/** Shared constants for the real-estate module (safe for client and server). */

export const PURPOSES = ["SALE", "RENT"] as const;
export type Purpose = (typeof PURPOSES)[number];
export const PURPOSE_LABELS: Record<Purpose, { en: string; ur: string }> = {
  SALE: { en: "For Sale", ur: "برائے فروخت" },
  RENT: { en: "For Rent", ur: "برائے کرایہ" },
};

export const PROPERTY_TYPES = ["HOUSE", "FLAT", "PLOT", "COMMERCIAL", "FARMHOUSE"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const PROPERTY_TYPE_LABELS: Record<PropertyType, { en: string; ur: string }> = {
  HOUSE: { en: "House", ur: "مکان" },
  FLAT: { en: "Flat / Apartment", ur: "فلیٹ" },
  PLOT: { en: "Plot", ur: "پلاٹ" },
  COMMERCIAL: { en: "Commercial", ur: "کمرشل" },
  FARMHOUSE: { en: "Farmhouse", ur: "فارم ہاؤس" },
};

export const AREA_UNITS = ["MARLA", "KANAL", "SQFT", "SQYD"] as const;
export type AreaUnit = (typeof AREA_UNITS)[number];
export const AREA_UNIT_LABELS: Record<AreaUnit, { en: string; ur: string }> = {
  MARLA: { en: "Marla", ur: "مرلہ" },
  KANAL: { en: "Kanal", ur: "کنال" },
  SQFT: { en: "Sq. Ft.", ur: "مربع فٹ" },
  SQYD: { en: "Sq. Yd.", ur: "مربع گز" },
};

export const PRICE_UNITS = ["TOTAL", "MONTHLY"] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

/** Common Pakistani property features (chips in admin + checklist on detail page). */
export const COMMON_FEATURES = [
  "Corner plot",
  "Park facing",
  "Main boulevard",
  "Gas",
  "Electricity",
  "Sui gas connection",
  "Boring",
  "Water supply",
  "Servant quarter",
  "Basement",
  "Lift",
  "Parking",
  "Generator",
  "Solar panels",
  "Lawn",
  "Drawing room",
  "Dining room",
  "Study room",
  "Store room",
  "Powder room",
  "Terrace",
  "Roof top",
  "Security guard",
  "Gated community",
  "Possession available",
  "Furnished",
  "Semi-furnished",
];

export const PK_CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Gujranwala", "Sialkot", "Hyderabad", "Quetta", "Bahawalpur"];

/** Price-range steps for the search bar (PKR). */
export const SALE_PRICE_STEPS = [2_500_000, 5_000_000, 10_000_000, 20_000_000, 30_000_000, 50_000_000, 100_000_000, 250_000_000];
export const RENT_PRICE_STEPS = [25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 300_000, 500_000];

export const PROPERTIES_PAGE_SIZE = 12;
export const PROPERTY_IMAGES_FOLDER = "properties";
