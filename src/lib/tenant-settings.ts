import { z } from "zod";
import { normalizePkPhone, safeExternalUrl, safeLinkHref } from "@/lib/utils";

/**
 * `Tenant.settings` — one JSON document, two schemas:
 *
 * - `tenantSettingsSchema` (READ / storage shape): lenient. Every field has a default, strings are
 *   plain strings. Used by `parseSettings()` (public site, admin, seed, super provisioning) and by the
 *   transactional store (`src/server/settings/store.ts`) so a legacy or slightly-off value never breaks
 *   rendering or a flag flip in another section.
 * - `tenantSettingsWriteSchema` (WRITE): strict, per section. Pakistani phone numbers are normalised
 *   to `+92…` and rejected when invalid, e-mails must be e-mails, links must be safe http(s) URLs,
 *   colours must be 6-digit hex, SEO copy is length-limited. Used by the tenant settings action;
 *   every message is EN + UR so the admin form can show it as-is.
 *
 * Client-safe (no server-only imports): the settings form imports types/constants from here.
 */

/* ---------- bilingual field messages ---------- */

const m = (en: string, ur: string) => `${en} · ${ur}`;

export const SETTINGS_MESSAGES = {
  fixFields: m("Please fix the highlighted fields.", "براہ کرم نشان زد خانے درست کریں۔"),
  phoneRequired: m("Phone number is required", "فون نمبر درج کرنا ضروری ہے"),
  phone: m("Enter a valid Pakistani number, e.g. 0300 1234567 or 021 34567890", "درست پاکستانی نمبر درج کریں، مثلاً 0300 1234567 یا 021 34567890"),
  email: m("Enter a valid email address", "درست ای میل ایڈریس درج کریں"),
  url: m("Enter a full link starting with https://", "مکمل لنک درج کریں جو https:// سے شروع ہو"),
  link: m("Enter a page path like /shop or a full https:// link", "صفحے کا راستہ (مثلاً /shop) یا مکمل https:// لنک درج کریں"),
  image: m("Upload an image or paste an https:// image link", "تصویر اپلوڈ کریں یا https:// تصویر کا لنک لگائیں"),
  hex: m("Use a 6-digit hex colour like #1A2B3C, or leave blank", "6 ہندسوں کا ہیکس رنگ استعمال کریں، مثلاً #1A2B3C، یا خالی چھوڑ دیں"),
  mapEmbed: m("Paste the Google Maps embed link (starts with https://www.google.com/maps/embed)", "گوگل میپس کا ایمبیڈ لنک لگائیں (https://www.google.com/maps/embed سے شروع ہوتا ہے)"),
  seoTitle: m("Keep the title under 70 characters", "عنوان 70 حروف سے کم رکھیں"),
  seoDescription: m("Keep the description under 170 characters", "تفصیل 170 حروف سے کم رکھیں"),
  gaId: m("Google IDs start with G- (e.g. G-XXXXXXXXXX)", "گوگل آئی ڈی G- سے شروع ہوتی ہے (مثلاً G-XXXXXXXXXX)"),
  pixelId: m("A Pixel ID is a number of 6–20 digits", "پکسل آئی ڈی 6 سے 20 ہندسوں کا نمبر ہوتی ہے"),
  orderPrefix: m("1–6 capital letters or digits", "1 سے 6 بڑے حروف یا ہندسے"),
  announcementText: m("Enter the announcement text or turn the bar off", "اعلان کا متن درج کریں یا بار بند کر دیں"),
  textLength: m("Keep it under 160 characters", "160 حروف سے کم رکھیں"),
  hours: m("Enter both an opening and a closing time", "کھلنے اور بند ہونے کا وقت دونوں درج کریں"),
  wholeNumber: m("Enter a whole number, 0 or more", "0 یا اس سے بڑا مکمل عدد درج کریں"),
} as const;

/* ---------- READ schema (lenient, defaults everywhere) ---------- */

export const openingHoursSchema = z.array(
  z.object({
    day: z.number().int().min(0).max(6),
    open: z.string().default("09:00"),
    close: z.string().default("21:00"),
    closed: z.boolean().default(false),
  }),
);
export type OpeningHours = z.infer<typeof openingHoursSchema>;

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  /**
   * White-label: hide the "Powered by <brand>" footer credit. Optional on read (undefined == false, see
   * `hidePoweredBy()` in templates/ui) so older documents and fixtures stay valid; the write schema
   * always stores an explicit boolean (default false).
   */
  hidePoweredBy: z.boolean().optional(),
});

const contactSchema = z.object({
  phone: z.string().default(""),
  phone2: z.string().optional(),
  whatsapp: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  mapEmbedUrl: z.string().optional(),
});

const socialSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});

const languagesSchema = z.object({
  urduEnabled: z.boolean().default(false),
  defaultLang: z.enum(["en", "ur"]).default("en"),
});

const commerceSchema = z.object({
  currency: z.literal("PKR").default("PKR"),
  codEnabled: z.boolean().default(true),
  minOrder: z.number().int().min(0).default(0),
  freeShippingAbove: z.number().int().min(0).optional(),
  defaultShippingFee: z.number().int().min(0).default(200),
  orderPrefix: z.string().max(6).default("ORD"),
  whatsappOrders: z.boolean().default(true),
  ageConfirmation: z.boolean().default(false),
  lowStockThreshold: z.number().int().min(0).default(5),
});

const restaurantSchema = z.object({
  acceptingOrders: z.boolean().default(true),
  delivery: z.boolean().default(true),
  pickup: z.boolean().default(true),
  dineIn: z.boolean().default(false),
  reservations: z.boolean().default(false),
  minDeliveryOrder: z.number().int().min(0).default(500),
  defaultDeliveryFee: z.number().int().min(0).default(100),
  prepTimeMins: z.number().int().min(0).default(30),
  soundAlerts: z.boolean().default(true),
});

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImageUrl: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
});

const notificationsSchema = z.object({
  emailTo: z.string().optional(),
  whatsappTo: z.string().optional(),
});

const announcementSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().default(""),
  textUr: z.string().optional(),
  link: z.string().optional(),
});

// zod 4: `.default(v)` returns `v` as-is (inner defaults are NOT applied), so every section default
// below is the complete object. TypeScript enforces this: the default must match the output type.
export const tenantSettingsSchema = z.object({
  branding: brandingSchema.default({}),
  contact: contactSchema.default({ phone: "", whatsapp: "", email: "", address: "", city: "" }),
  social: socialSchema.default({}),
  languages: languagesSchema.default({ urduEnabled: false, defaultLang: "en" }),
  commerce: commerceSchema.default({
    currency: "PKR",
    codEnabled: true,
    minOrder: 0,
    defaultShippingFee: 200,
    orderPrefix: "ORD",
    whatsappOrders: true,
    ageConfirmation: false,
    lowStockThreshold: 5,
  }),
  restaurant: restaurantSchema.default({
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
  seo: seoSchema.default({}),
  notifications: notificationsSchema.default({}),
  announcement: announcementSchema.default({ enabled: false, text: "" }),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type SettingsSection = keyof TenantSettings;

/** Object sections (everything except `hours`), used for per-field salvage on read. */
const SECTION_OBJECTS: Partial<Record<SettingsSection, z.ZodObject>> = {
  branding: brandingSchema,
  contact: contactSchema,
  social: socialSchema,
  languages: languagesSchema,
  commerce: commerceSchema,
  restaurant: restaurantSchema,
  seo: seoSchema,
  notifications: notificationsSchema,
  announcement: announcementSchema,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Lenient read: never throws. A valid document is returned as-is (with defaults filled). When the
 * stored blob is off, the fallback is per field, not per document: each section keeps the fields that
 * validate on their own and defaults the rest; a corrupt `hours` array keeps its valid entries.
 */
export function parseSettings(raw: unknown): TenantSettings {
  const whole = tenantSettingsSchema.safeParse(raw ?? {});
  if (whole.success) return whole.data;

  const src = isRecord(raw) ? raw : {};
  const salvaged: Record<string, unknown> = {};
  const shape = tenantSettingsSchema.shape as Record<string, z.ZodType>;
  for (const key of Object.keys(shape) as SettingsSection[]) {
    const value = src[key];
    if (value === undefined) continue; // default
    if (shape[key].safeParse(value).success) {
      salvaged[key] = value;
      continue;
    }
    if (key === "hours") {
      if (Array.isArray(value)) salvaged.hours = value.filter((h) => openingHoursSchema.element.safeParse(h).success);
      continue;
    }
    const inner = SECTION_OBJECTS[key];
    if (!inner || !isRecord(value)) continue; // default
    const kept: Record<string, unknown> = {};
    for (const [field, fieldSchema] of Object.entries(inner.shape as Record<string, z.ZodType>)) {
      if (field in value && fieldSchema.safeParse(value[field]).success) kept[field] = value[field];
    }
    if (shape[key].safeParse(kept).success) salvaged[key] = kept;
  }
  return tenantSettingsSchema.parse(salvaged);
}

export const DEFAULT_HOURS: OpeningHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "10:00",
  close: "22:00",
  closed: false,
}));

/* ---------- WRITE schema (strict, per section, bilingual messages) ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const GA_RE = /^(G|UA|AW|GT)-[A-Z0-9-]{4,}$/i;
const PIXEL_RE = /^\d{6,20}$/;
const ORDER_PREFIX_RE = /^[A-Z0-9]{1,6}$/;
const SITE_PATH_RE = /^\/(?!\/)\S*$/;

type Validator = (v: string) => string | null;

const validPkPhone: Validator = (v) => normalizePkPhone(v);
const validEmail: Validator = (v) => (v.length <= 120 && EMAIL_RE.test(v) ? v : null);
const validHex: Validator = (v) => (HEX_RE.test(v) ? v.toUpperCase() : null);
/** Absolute http(s) URL; a bare domain such as `facebook.com/page` gets `https://`. */
const validExternalUrl: Validator = (v) => {
  const r = safeLinkHref(v);
  return r && r.external && /^https?:/i.test(r.href) && r.href.length <= 1000 ? r.href : null;
};
/** Same-origin path (`/shop`, `#offers`) or absolute http(s) URL; bare words become paths. */
const validSiteLink: Validator = (v) => {
  const r = safeLinkHref(v);
  if (!r || r.href.length > 1000) return null;
  if (r.external && !/^https?:/i.test(r.href)) return null;
  return r.href;
};
/** Uploaded asset URL (R2 public URL) or same-origin path. */
const validImageUrl: Validator = (v) => (SITE_PATH_RE.test(v) && v.length <= 1000 ? v : safeExternalUrl(v));
/** Google Maps embed `src`: https on a google.* host with a `/maps/embed…` path (or `output=embed`). */
const validMapEmbedUrl: Validator = (v) => {
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!/^(www\.|maps\.)?google\.(com|com\.[a-z]{2}|co\.[a-z]{2}|[a-z]{2})$/.test(u.hostname)) return null;
  if (u.pathname !== "/maps" && !u.pathname.startsWith("/maps/")) return null;
  return u.pathname.startsWith("/maps/embed") || u.searchParams.get("output") === "embed" ? u.toString() : null;
};
const validGaId: Validator = (v) => (GA_RE.test(v) ? v.toUpperCase() : null);
const validPixelId: Validator = (v) => (PIXEL_RE.test(v) ? v : null);

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

function checked(validate: Validator, message: string) {
  return z.string().trim().transform((v, ctx) => {
    const out = validate(v);
    if (out === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return out;
  });
}
/** Required string field with a strict format (blank → `requiredMessage`). */
function required(validate: Validator, message: string, requiredMessage: string) {
  return z.string().trim().min(1, requiredMessage).pipe(checked(validate, message));
}
/** Stored as `""` when blank (fields whose read shape is `string` with `default("")`). */
function orBlank(validate: Validator, message: string) {
  return z.string().trim().transform((v, ctx) => {
    if (v === "") return "";
    const out = validate(v);
    if (out === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return out;
  });
}
/** Stored as `undefined` when blank (fields whose read shape is `string | undefined`). */
function optional(validate: Validator, message: string) {
  return z.preprocess(blankToUndefined, checked(validate, message).optional());
}
function optionalText(max: number, message: string) {
  return z.preprocess(blankToUndefined, z.string().trim().max(max, message).optional());
}
const wholeNumber = z.number(SETTINGS_MESSAGES.wholeNumber).int(SETTINGS_MESSAGES.wholeNumber).min(0, SETTINGS_MESSAGES.wholeNumber);

export const tenantSettingsWriteSchema = z.object({
  branding: brandingSchema.extend({
    logoUrl: optional(validImageUrl, SETTINGS_MESSAGES.image),
    faviconUrl: optional(validImageUrl, SETTINGS_MESSAGES.image),
    primaryColor: optional(validHex, SETTINGS_MESSAGES.hex),
    secondaryColor: optional(validHex, SETTINGS_MESSAGES.hex),
    accentColor: optional(validHex, SETTINGS_MESSAGES.hex),
    hidePoweredBy: z.boolean().default(false),
  }),
  contact: contactSchema.extend({
    phone: required(validPkPhone, SETTINGS_MESSAGES.phone, SETTINGS_MESSAGES.phoneRequired),
    phone2: optional(validPkPhone, SETTINGS_MESSAGES.phone),
    whatsapp: orBlank(validPkPhone, SETTINGS_MESSAGES.phone),
    email: orBlank(validEmail, SETTINGS_MESSAGES.email),
    address: z.string().trim().max(300),
    city: z.string().trim().max(80),
    mapEmbedUrl: optional(validMapEmbedUrl, SETTINGS_MESSAGES.mapEmbed),
  }),
  social: socialSchema.extend({
    facebook: optional(validExternalUrl, SETTINGS_MESSAGES.url),
    instagram: optional(validExternalUrl, SETTINGS_MESSAGES.url),
    tiktok: optional(validExternalUrl, SETTINGS_MESSAGES.url),
    youtube: optional(validExternalUrl, SETTINGS_MESSAGES.url),
    linkedin: optional(validExternalUrl, SETTINGS_MESSAGES.url),
    twitter: optional(validExternalUrl, SETTINGS_MESSAGES.url),
  }),
  languages: languagesSchema,
  commerce: commerceSchema.extend({
    minOrder: wholeNumber.default(0),
    freeShippingAbove: wholeNumber.optional(),
    defaultShippingFee: wholeNumber.default(200),
    orderPrefix: z.string().trim().toUpperCase().regex(ORDER_PREFIX_RE, SETTINGS_MESSAGES.orderPrefix).default("ORD"),
    lowStockThreshold: wholeNumber.default(5),
  }),
  restaurant: restaurantSchema.extend({
    minDeliveryOrder: wholeNumber.default(500),
    defaultDeliveryFee: wholeNumber.default(100),
    prepTimeMins: wholeNumber.default(30),
  }),
  hours: openingHoursSchema.superRefine((rows, ctx) => {
    rows.forEach((h, i) => {
      if (!h.closed && (!TIME_RE.test(h.open) || !TIME_RE.test(h.close))) ctx.addIssue({ code: "custom", message: SETTINGS_MESSAGES.hours, path: [i] });
    });
  }),
  seo: seoSchema.extend({
    title: optionalText(70, SETTINGS_MESSAGES.seoTitle),
    description: optionalText(170, SETTINGS_MESSAGES.seoDescription),
    ogImageUrl: optional(validImageUrl, SETTINGS_MESSAGES.image),
    googleAnalyticsId: optional(validGaId, SETTINGS_MESSAGES.gaId),
    facebookPixelId: optional(validPixelId, SETTINGS_MESSAGES.pixelId),
  }),
  notifications: notificationsSchema.extend({
    emailTo: optional(validEmail, SETTINGS_MESSAGES.email),
    whatsappTo: optional(validPkPhone, SETTINGS_MESSAGES.phone),
  }),
  announcement: announcementSchema
    .extend({
      text: z.string().trim().max(160, SETTINGS_MESSAGES.textLength).default(""),
      textUr: optionalText(160, SETTINGS_MESSAGES.textLength),
      link: optional(validSiteLink, SETTINGS_MESSAGES.link),
    })
    .superRefine((a, ctx) => {
      if (a.enabled && !a.text) ctx.addIssue({ code: "custom", message: SETTINGS_MESSAGES.announcementText, path: ["text"] });
    }),
});

export type TenantSettingsWrite = z.infer<typeof tenantSettingsWriteSchema>;

/**
 * Zod issues from a `tenantSettingsWriteSchema` section → `{ fieldKey: message }` as the settings
 * form expects: field names for object sections, `hours.<day>` for opening hours (the schema reports
 * the array index; `submitted` is the array that was validated, in the same order).
 */
export function settingsFieldErrors(section: SettingsSection, error: z.ZodError, submitted?: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    let key = issue.path.map(String).join(".");
    if (section === "hours") {
      const idx = Number(issue.path[0]);
      const row = Array.isArray(submitted) ? (submitted[idx] as { day?: unknown } | undefined) : undefined;
      key = `hours.${typeof row?.day === "number" ? row.day : Number.isInteger(idx) ? idx : "all"}`;
    }
    if (!key) key = section;
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
