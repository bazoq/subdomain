import { z } from "zod";
import { localizedString } from "@/lib/i18n";
import { zHttpUrlOrEmpty, zImageUrlList } from "@/modules/shared/validation";
import { AREA_UNITS, PRICE_UNITS, PROPERTY_TYPES, PURPOSES } from "./constants";

const requiredLocalized = localizedString.refine((v) => v.en.trim().length > 0, { message: "Title is required", path: ["en"] });
/** http(s) only — `.url()` alone would accept javascript: and data: schemes. */
const urlOrEmpty = zHttpUrlOrEmpty;

/** Admin property editor payload (JSON server action). */
export const propertySchema = z.object({
  title: requiredLocalized,
  slug: z.string().trim().max(80).default(""),
  purpose: z.enum(PURPOSES).default("SALE"),
  type: z.enum(PROPERTY_TYPES).default("HOUSE"),
  price: z.number().int().min(1, "Price is required").max(100_000_000_000),
  priceUnit: z.enum(PRICE_UNITS).default("TOTAL"),
  areaValue: z.number().min(0).max(1_000_000).nullable().default(null),
  areaUnit: z.enum(AREA_UNITS).default("MARLA"),
  bedrooms: z.number().int().min(0).max(50).nullable().default(null),
  bathrooms: z.number().int().min(0).max(50).nullable().default(null),
  city: z.string().trim().min(2, "City is required").max(60),
  location: z.string().trim().min(2, "Location is required").max(160),
  description: localizedString.default({ en: "" }),
  features: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
  images: zImageUrlList(20),
  videoUrl: urlOrEmpty.default(""),
  mapUrl: urlOrEmpty.default(""),
  agentId: z.string().trim().max(40).default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type PropertyFormValue = z.output<typeof propertySchema>;

export const emptyProperty: PropertyFormValue = {
  title: { en: "" },
  slug: "",
  purpose: "SALE",
  type: "HOUSE",
  price: 0,
  priceUnit: "TOTAL",
  areaValue: null,
  areaUnit: "MARLA",
  bedrooms: null,
  bathrooms: null,
  city: "",
  location: "",
  description: { en: "" },
  features: [],
  images: [],
  videoUrl: "",
  mapUrl: "",
  agentId: "",
  isFeatured: false,
  isActive: true,
};
