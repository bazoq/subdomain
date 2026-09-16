import { z } from "zod";

/** Every user-facing text field is stored as { en, ur? }. */
export const localizedString = z.object({
  en: z.string(),
  ur: z.string().optional(),
});
export type LocalizedString = z.infer<typeof localizedString>;

export type Lang = "en" | "ur";
export const LANGS: Lang[] = ["en", "ur"];

export function ls(en: string, ur?: string): LocalizedString {
  return ur ? { en, ur } : { en };
}

/** Resolve a localized string for a language, falling back to English. */
export function t(value: LocalizedString | string | null | undefined, lang: Lang = "en"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (lang === "ur" && value.ur && value.ur.trim()) return value.ur;
  return value.en ?? "";
}

export function dirFor(lang: Lang): "ltr" | "rtl" {
  return lang === "ur" ? "rtl" : "ltr";
}

/** Common UI strings for storefront chrome (cart, checkout, forms). */
export const ui = {
  addToCart: ls("Add to Cart", "کارٹ میں شامل کریں"),
  buyNow: ls("Buy Now", "ابھی خریدیں"),
  cart: ls("Cart", "کارٹ"),
  checkout: ls("Checkout", "چیک آؤٹ"),
  placeOrder: ls("Place Order", "آرڈر کریں"),
  cashOnDelivery: ls("Cash on Delivery", "کیش آن ڈیلیوری"),
  subtotal: ls("Subtotal", "ذیلی کل"),
  shipping: ls("Shipping", "ترسیل"),
  deliveryFee: ls("Delivery Fee", "ڈیلیوری فیس"),
  discount: ls("Discount", "رعایت"),
  total: ls("Total", "کل"),
  quantity: ls("Quantity", "تعداد"),
  remove: ls("Remove", "ہٹائیں"),
  emptyCart: ls("Your cart is empty", "آپ کا کارٹ خالی ہے"),
  continueShopping: ls("Continue Shopping", "خریداری جاری رکھیں"),
  name: ls("Full Name", "پورا نام"),
  phone: ls("Mobile Number", "موبائل نمبر"),
  email: ls("Email (optional)", "ای میل (اختیاری)"),
  address: ls("Complete Address", "مکمل پتہ"),
  city: ls("City", "شہر"),
  notes: ls("Order Notes (optional)", "آرڈر نوٹس (اختیاری)"),
  message: ls("Message", "پیغام"),
  send: ls("Send", "بھیجیں"),
  submit: ls("Submit", "جمع کریں"),
  search: ls("Search", "تلاش"),
  all: ls("All", "تمام"),
  outOfStock: ls("Out of Stock", "اسٹاک ختم"),
  inStock: ls("In Stock", "دستیاب"),
  viewDetails: ls("View Details", "تفصیلات دیکھیں"),
  readMore: ls("Read More", "مزید پڑھیں"),
  contactUs: ls("Contact Us", "رابطہ کریں"),
  whatsapp: ls("WhatsApp", "واٹس ایپ"),
  callNow: ls("Call Now", "ابھی کال کریں"),
  orderPlaced: ls("Order placed successfully!", "آرڈر کامیابی سے دے دیا گیا!"),
  orderNumber: ls("Order Number", "آرڈر نمبر"),
  trackOrder: ls("Track Order", "آرڈر ٹریک کریں"),
  applyCoupon: ls("Apply", "لگائیں"),
  couponCode: ls("Coupon Code", "کوپن کوڈ"),
  delivery: ls("Delivery", "ڈیلیوری"),
  pickup: ls("Pickup", "پک اپ"),
  dineIn: ls("Dine-in", "ڈائن ان"),
  menu: ls("Menu", "مینیو"),
  orderNow: ls("Order Now", "ابھی آرڈر کریں"),
  applyNow: ls("Apply Now", "ابھی درخواست دیں"),
  bookNow: ls("Book Now", "ابھی بک کریں"),
  home: ls("Home", "ہوم"),
  about: ls("About", "ہمارے بارے میں"),
  services: ls("Services", "خدمات"),
  shop: ls("Shop", "شاپ"),
  gallery: ls("Gallery", "گیلری"),
  contact: ls("Contact", "رابطہ"),
  blog: ls("Blog", "بلاگ"),
  faq: ls("FAQ", "سوالات"),
  team: ls("Our Team", "ہماری ٹیم"),
  testimonials: ls("Testimonials", "تاثرات"),
  poweredBy: ls("Powered by", "تیار کردہ"),
  allRightsReserved: ls("All rights reserved.", "جملہ حقوق محفوظ ہیں۔"),
  jobs: ls("Jobs", "نوکریاں"),
  packages: ls("Packages", "پیکجز"),
  properties: ls("Properties", "پراپرٹیز"),
  plans: ls("Membership Plans", "ممبرشپ پلانز"),
  classes: ls("Classes", "کلاسز"),
  trainers: ls("Trainers", "ٹرینرز"),
  practiceAreas: ls("Practice Areas", "شعبہ جات"),
  attorneys: ls("Our Attorneys", "ہمارے وکلاء"),
  getQuote: ls("Get a Quote", "قیمت معلوم کریں"),
  bookConsultation: ls("Book Consultation", "مشاورت بک کریں"),
  uploadPrescription: ls("Upload Prescription", "نسخہ اپ لوڈ کریں"),
  prescriptionRequired: ls("Prescription required", "نسخہ درکار ہے"),
  featured: ls("Featured", "نمایاں"),
  new: ls("New", "نیا"),
  sale: ls("Sale", "سیل"),
  bestseller: ls("Bestseller", "بیسٹ سیلر"),
  reviews: ls("Reviews", "جائزے"),
  openNow: ls("Open Now", "ابھی کھلا ہے"),
  closedNow: ls("Closed", "بند ہے"),
  loading: ls("Loading...", "لوڈ ہو رہا ہے..."),
  somethingWrong: ls("Something went wrong. Please try again.", "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔"),
  thankYou: ls("Thank you! We will contact you shortly.", "شکریہ! ہم جلد آپ سے رابطہ کریں گے۔"),
} as const;

export type UiKey = keyof typeof ui;
