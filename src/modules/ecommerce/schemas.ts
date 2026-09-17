/**
 * zod schemas + input types for the ecommerce server actions.
 * Kept out of actions.ts because a "use server" module may only export async functions.
 */
import { z } from "zod";
import { localizedString } from "@/lib/i18n";
import { ORDER_STATUSES } from "./types";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const money = z.coerce.number().int().min(0).max(100_000_000);
const optionalMoney = z.union([money, z.null(), z.literal(""), z.undefined()]).transform((v) => (v === "" || v === undefined || v === null ? null : v));

const keyValue = z.object({ key: z.string().trim().max(60), value: z.string().trim().max(500) });

export const variantInputSchema = z.object({
  id: z.string().max(60).optional(),
  name: z.string().trim().min(1, "Variant name is required").max(120),
  options: z.record(z.string().max(40), z.string().max(80)),
  price: optionalMoney,
  sku: optionalText(80),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  imageUrl: optionalText(1000),
  isActive: z.boolean().default(true),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

export const productInputSchema = z.object({
  name: localizedString.refine((v) => v.en.trim().length > 0, { message: "Product name is required", path: ["en"] }),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  categoryId: z.union([z.string().max(60), z.null(), z.literal("")]).transform((v) => v || null),
  shortDesc: localizedString.default({ en: "" }),
  description: localizedString.default({ en: "" }),
  price: money,
  comparePrice: optionalMoney,
  costPrice: optionalMoney,
  sku: optionalText(80),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  trackStock: z.boolean().default(true),
  images: z.array(z.string().max(1000)).max(12).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  attributes: z.array(keyValue).max(30).default([]),
  specs: z.array(keyValue).max(60).default([]),
  variants: z.array(variantInputSchema).max(100).default([]),
  requiresPrescription: z.boolean().default(false),
  genericName: optionalText(120),
  manufacturer: optionalText(120),
  dosageForm: optionalText(60),
  strength: optionalText(60),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});
export type ProductInput = z.input<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: localizedString.refine((v) => v.en.trim().length > 0, { message: "Name is required", path: ["en"] }),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  parentId: z.union([z.string().max(60), z.null(), z.literal("")]).transform((v) => v || null),
  imageUrl: optionalText(1000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.input<typeof categoryInputSchema>;

export const couponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dash and underscore only")
    .transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1, "Enter a value"),
  minOrder: z.coerce.number().int().min(0).default(0),
  maxUses: z.union([z.coerce.number().int().min(1), z.null(), z.literal("")]).transform((v) => (v === "" || v === null ? null : v)),
  expiresAt: optionalText(30),
  isActive: z.boolean().default(true),
});
export type CouponInput = z.input<typeof couponInputSchema>;

export const shippingZoneInputSchema = z.object({
  name: z.string().trim().min(1, "Zone name is required").max(80),
  cities: z.array(z.string().trim().min(1).max(60)).max(200).default([]),
  fee: money,
  freeAbove: optionalMoney,
  etaDays: optionalText(20),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export type ShippingZoneInput = z.input<typeof shippingZoneInputSchema>;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const checkoutLineSchema = z.object({
  productId: z.string().min(1).max(60),
  variantId: z.union([z.string().max(60), z.null(), z.undefined()]).transform((v) => v || null),
  qty: z.coerce.number().int().min(1).max(99),
});

export const checkoutInputSchema = z.object({
  items: z.array(checkoutLineSchema).min(1, "Your cart is empty").max(50),
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  email: z.string().trim().email("Invalid email address").max(120).optional().or(z.literal("")),
  address: z.string().trim().min(8, "Please enter your complete address").max(500),
  city: z.string().trim().min(2, "Please select your city").max(60),
  notes: optionalText(1000),
  couponCode: optionalText(40),
  giftMessage: optionalText(300),
  ageConfirmed: z.boolean().optional(),
  prescriptionMediaId: optionalText(60),
  website: z.string().max(0).optional(), // honeypot
});
export type CheckoutInput = z.input<typeof checkoutInputSchema>;

export const prescriptionInputSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  notes: optionalText(1000),
  mediaId: z.string().min(1, "Please upload your prescription").max(60),
  website: z.string().max(0).optional(),
});
export type PrescriptionInput = z.input<typeof prescriptionInputSchema>;

export const prescriptionStatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED"]);
