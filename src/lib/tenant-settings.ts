import { z } from "zod";

export const openingHoursSchema = z.array(
  z.object({
    day: z.number().int().min(0).max(6),
    open: z.string().default("09:00"),
    close: z.string().default("21:00"),
    closed: z.boolean().default(false),
  }),
);
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const tenantSettingsSchema = z.object({
  branding: z
    .object({
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
    })
    .default({}),
  contact: z
    .object({
      phone: z.string().default(""),
      phone2: z.string().optional(),
      whatsapp: z.string().default(""),
      email: z.string().default(""),
      address: z.string().default(""),
      city: z.string().default(""),
      mapEmbedUrl: z.string().optional(),
    })
    .default({ phone: "", whatsapp: "", email: "", address: "", city: "" }),
  social: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
    })
    .default({}),
  languages: z
    .object({
      urduEnabled: z.boolean().default(false),
      defaultLang: z.enum(["en", "ur"]).default("en"),
    })
    .default({ urduEnabled: false, defaultLang: "en" }),
  commerce: z
    .object({
      currency: z.literal("PKR").default("PKR"),
      codEnabled: z.boolean().default(true),
      minOrder: z.number().int().min(0).default(0),
      freeShippingAbove: z.number().int().min(0).optional(),
      defaultShippingFee: z.number().int().min(0).default(200),
      orderPrefix: z.string().max(6).default("ORD"),
      whatsappOrders: z.boolean().default(true),
      ageConfirmation: z.boolean().default(false),
      lowStockThreshold: z.number().int().min(0).default(5),
    })
    .default({
      currency: "PKR",
      codEnabled: true,
      minOrder: 0,
      defaultShippingFee: 200,
      orderPrefix: "ORD",
      whatsappOrders: true,
      ageConfirmation: false,
      lowStockThreshold: 5,
    }),
  restaurant: z
    .object({
      acceptingOrders: z.boolean().default(true),
      delivery: z.boolean().default(true),
      pickup: z.boolean().default(true),
      dineIn: z.boolean().default(false),
      reservations: z.boolean().default(false),
      minDeliveryOrder: z.number().int().min(0).default(500),
      defaultDeliveryFee: z.number().int().min(0).default(100),
      prepTimeMins: z.number().int().min(0).default(30),
      soundAlerts: z.boolean().default(true),
    })
    .default({
      acceptingOrders: true,
      delivery: true,
      pickup: true,
      dineIn: false,
      reservations: false,
      minDeliveryOrder: 500,
      defaultDeliveryFee: 100,
      prepTimeMins: 30,
      soundAlerts: true,
    }),
  hours: openingHoursSchema.default([]),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImageUrl: z.string().optional(),
      googleAnalyticsId: z.string().optional(),
      facebookPixelId: z.string().optional(),
    })
    .default({}),
  notifications: z
    .object({
      emailTo: z.string().optional(),
      whatsappTo: z.string().optional(),
    })
    .default({}),
  announcement: z
    .object({
      enabled: z.boolean().default(false),
      text: z.string().default(""),
      textUr: z.string().optional(),
      link: z.string().optional(),
    })
    .default({ enabled: false, text: "" }),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

export function parseSettings(raw: unknown): TenantSettings {
  const r = tenantSettingsSchema.safeParse(raw ?? {});
  if (r.success) return r.data;
  return tenantSettingsSchema.parse({});
}

export const DEFAULT_HOURS: OpeningHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "10:00",
  close: "22:00",
  closed: false,
}));
