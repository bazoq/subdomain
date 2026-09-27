/**
 * Localised (EN + UR) messages returned by the ecommerce server actions.
 * Pure data: safe to import from "use server" modules and from client components.
 * Use `m(key, lang, vars)`; `{name}`-style placeholders are substituted.
 */
import { ls, t, type Lang, type LocalizedString } from "@/lib/i18n";

export const checkoutMessages = {
  fixFields: ls("Please fix the highlighted fields.", "براہ کرم نشان زد خانے درست کریں۔"),
  unableToPlace: ls("Unable to place order.", "آرڈر نہیں دیا جا سکا۔"),
  tooManyAttempts: ls("Too many attempts. Please wait a few minutes and try again.", "بہت زیادہ کوششیں۔ چند منٹ انتظار کر کے دوبارہ کوشش کریں۔"),
  orderingPaused: ls("Online ordering is currently paused. Please contact us on WhatsApp to order.", "آن لائن آرڈرنگ فی الحال معطل ہے۔ آرڈر کے لیے واٹس ایپ پر رابطہ کریں۔"),
  invalidPhone: ls("Enter a valid Pakistani mobile number, e.g. 0300-1234567", "درست پاکستانی موبائل نمبر درج کریں، مثلاً 0300-1234567"),
  ageRequired: ls("You must confirm you are 18 or older.", "آپ کو تصدیق کرنی ہوگی کہ آپ کی عمر 18 سال یا زیادہ ہے۔"),
  itemUnavailable: ls("One of the items in your cart is no longer available. Please review your cart.", "آپ کے کارٹ کی کوئی چیز اب دستیاب نہیں۔ براہ کرم اپنا کارٹ دیکھیں۔"),
  optionUnavailable: ls('The selected option for "{name}" is no longer available.', '"{name}" کا منتخب آپشن اب دستیاب نہیں۔'),
  chooseOption: ls('Please choose an option for "{name}".', '"{name}" کے لیے آپشن منتخب کریں۔'),
  onlyLeft: ls('Only {n} left in stock for "{name}".', '"{name}" کا اسٹاک صرف {n} باقی ہے۔'),
  outOfStock: ls('"{name}" is out of stock.', '"{name}" اسٹاک میں نہیں ہے۔'),
  justSoldOut: ls('"{name}" just went out of stock. Please update your cart.', '"{name}" ابھی ابھی ختم ہو گیا۔ براہ کرم اپنا کارٹ اپ ڈیٹ کریں۔'),
  minOrder: ls("Minimum order amount is {amount}.", "کم از کم آرڈر {amount} ہے۔"),
  rxRequired: ls("A prescription is required for one or more items.", "ایک یا زیادہ اشیاء کے لیے نسخہ درکار ہے۔"),
  rxInvalid: ls("The uploaded prescription could not be verified. Please upload it again.", "اپ لوڈ کیا گیا نسخہ تصدیق نہیں ہو سکا۔ دوبارہ اپ لوڈ کریں۔"),
  couponInvalid: ls("This coupon code is not valid.", "یہ کوپن کوڈ درست نہیں۔"),
  couponExpired: ls("This coupon has expired.", "اس کوپن کی مدت ختم ہو گئی ہے۔"),
  couponUsedUp: ls("This coupon has reached its usage limit.", "یہ کوپن اپنی حد تک استعمال ہو چکا ہے۔"),
  couponMin: ls("This coupon requires a minimum order of {amount}.", "اس کوپن کے لیے کم از کم {amount} کا آرڈر درکار ہے۔"),
  couponNoEffect: ls("This coupon does not apply to your order.", "یہ کوپن آپ کے آرڈر پر لاگو نہیں ہوتا۔"),
  enterCoupon: ls("Enter a coupon code.", "کوپن کوڈ درج کریں۔"),
  couponApplied: ls("Coupon {code} applied.", "کوپن {code} لگ گیا۔"),
  duplicateInFlight: ls("Your order is already being placed. Please wait a moment.", "آپ کا آرڈر پہلے ہی دیا جا رہا ہے۔ ایک لمحہ انتظار کریں۔"),
  enterOrderNumber: ls("Enter a valid order number.", "درست آرڈر نمبر درج کریں۔"),
  enterPhoneUsed: ls("Enter the mobile number used at checkout.", "چیک آؤٹ پر استعمال شدہ موبائل نمبر درج کریں۔"),
  orderNotFound: ls("No order found with these details.", "ان تفصیلات سے کوئی آرڈر نہیں ملا۔"),
  tooManyRequests: ls("Too many attempts. Please try again later.", "بہت زیادہ کوششیں۔ بعد میں دوبارہ کوشش کریں۔"),
  notAvailable: ls("This feature is not available on this store.", "یہ سہولت اس اسٹور پر دستیاب نہیں۔"),
} as const;

export type CheckoutMessageKey = keyof typeof checkoutMessages;

export function m(key: CheckoutMessageKey, lang: Lang, vars: Record<string, string | number> = {}): string {
  return fill(t(checkoutMessages[key] as LocalizedString, lang), vars);
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
