import { z } from "zod";
import { localizedString } from "@/lib/i18n";
import { zEmailOptional, zImageUrlList, zPhone } from "@/modules/shared/validation";
import { BOOKING_STATUSES, PACKAGE_KINDS } from "./constants";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const requiredLocalized = localizedString.refine((v) => v.en.trim().length > 0, { message: "Title is required", path: ["en"] });

export const itineraryItemSchema = z.object({
  day: z.number().int().min(0).max(365).default(0),
  title: localizedString.default({ en: "" }),
  description: localizedString.default({ en: "" }),
});
export type ItineraryItem = z.output<typeof itineraryItemSchema>;

/** Admin package editor payload (JSON server action). */
export const packageSchema = z.object({
  title: requiredLocalized,
  slug: z.string().trim().max(80).default(""),
  destination: z.string().trim().min(2, "Destination is required").max(120),
  kind: z.enum(PACKAGE_KINDS).default("TOUR"),
  days: z.number().int().min(1, "At least 1 day").max(365).default(1),
  nights: z.number().int().min(0).max(365).default(0),
  price: z.number().int().min(0).max(100_000_000).default(0),
  priceNote: z.string().trim().max(120).default(""),
  images: zImageUrlList(12),
  summary: localizedString.default({ en: "" }),
  itinerary: z.array(itineraryItemSchema).max(60).default([]),
  inclusions: z.array(localizedString).max(40).default([]),
  exclusions: z.array(localizedString).max(40).default([]),
  departures: z.array(z.string().regex(isoDate, "Invalid date")).max(40).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine((v) => v.nights <= v.days, { message: "Nights cannot exceed days", path: ["nights"] });
export type PackageFormValue = z.output<typeof packageSchema>;

export const emptyPackage: PackageFormValue = {
  title: { en: "" },
  slug: "",
  destination: "",
  kind: "TOUR",
  days: 1,
  nights: 0,
  price: 0,
  priceNote: "per person, double sharing",
  images: [],
  summary: { en: "" },
  itinerary: [],
  inclusions: [],
  exclusions: [],
  departures: [],
  isFeatured: false,
  isActive: true,
};

/** Public booking request payload. */
export const bookingSchema = z.object({
  packageId: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: zPhone,
  email: zEmailOptional,
  travellers: z.number().int().min(1, "At least 1 traveller").max(200),
  date: z.union([z.literal(""), z.string().regex(isoDate, "Invalid date")]).default(""),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(200).optional(), // honeypot (must be empty)
});
export type BookingInput = z.input<typeof bookingSchema>;

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);
