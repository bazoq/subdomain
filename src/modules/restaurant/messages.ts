/**
 * Localised (EN + UR) messages returned by the restaurant server actions.
 * Pure data: safe to import from "use server" modules and from client components.
 * Use `rm(key, lang, vars)`; `{name}`-style placeholders are substituted.
 */
import { ls, t, type Lang, type LocalizedString } from "@/lib/i18n";

export const restaurantMessages = {
  fixFields: ls("Please fix the highlighted fields.", "براہ کرم نشان زد خانے درست کریں۔"),
  tooManyAttempts: ls("Too many attempts from this connection. Please wait a few minutes or call us.", "اس کنکشن سے بہت زیادہ کوششیں۔ چند منٹ انتظار کریں یا ہمیں کال کریں۔"),
  tooManyRequests: ls("Too many requests. Please try again later.", "بہت زیادہ درخواستیں۔ بعد میں دوبارہ کوشش کریں۔"),
  orderingPaused: ls("We are not accepting online orders right now. Please call us.", "ہم اس وقت آن لائن آرڈر قبول نہیں کر رہے۔ براہ کرم کال کریں۔"),
  invalidPhone: ls("Enter a valid Pakistani mobile number, e.g. 0300-1234567", "درست پاکستانی موبائل نمبر درج کریں، مثلاً 0300-1234567"),
  invalidSchedule: ls("Invalid schedule time.", "شیڈول کا وقت درست نہیں۔"),
  scheduleTooSoon: ls("Scheduled time must be at least 15 minutes from now.", "شیڈول کا وقت اب سے کم از کم 15 منٹ بعد ہونا چاہیے۔"),
  scheduleTooFar: ls("Orders can be scheduled up to 7 days ahead.", "آرڈر زیادہ سے زیادہ 7 دن پہلے شیڈول کیا جا سکتا ہے۔"),
  scheduleClosed: ls("We are closed at the selected time. Please pick a time within our opening hours.", "منتخب وقت پر ہم بند ہیں۔ براہ کرم کھلنے کے اوقات میں کوئی وقت منتخب کریں۔"),
  closedNow: ls("We are closed right now. You can schedule your order for later.", "ہم اس وقت بند ہیں۔ آپ آرڈر بعد کے لیے شیڈول کر سکتے ہیں۔"),
  deliveryUnavailable: ls("Delivery is not available.", "ڈیلیوری دستیاب نہیں۔"),
  pickupUnavailable: ls("Pickup is not available.", "پک اپ دستیاب نہیں۔"),
  dineInUnavailable: ls("Dine-in ordering is not available.", "ڈائن ان آرڈرنگ دستیاب نہیں۔"),
  selectArea: ls("Please select your delivery area.", "براہ کرم اپنا ڈیلیوری ایریا منتخب کریں۔"),
  areaUnavailable: ls("The selected delivery area is not available.", "منتخب ڈیلیوری ایریا دستیاب نہیں۔"),
  addressRequired: ls("Please enter your complete delivery address.", "براہ کرم اپنا مکمل ڈیلیوری پتہ درج کریں۔"),
  tableRequired: ls("Please enter your table number.", "براہ کرم اپنا ٹیبل نمبر درج کریں۔"),
  required: ls("Required", "لازمی"),
  itemUnavailable: ls("One of the items in your order is no longer available. Please review your order.", "آپ کے آرڈر کی کوئی چیز اب دستیاب نہیں۔ براہ کرم اپنا آرڈر دیکھیں۔"),
  selectSize: ls("Please select a size for {name}.", "{name} کے لیے سائز منتخب کریں۔"),
  addonsUnavailable: ls("Some add-ons for {name} are no longer available. Please re-add the item.", "{name} کے کچھ ایڈ آنز اب دستیاب نہیں۔ براہ کرم آئٹم دوبارہ شامل کریں۔"),
  chooseAtLeast: ls('Please choose at least {n} option(s) for "{group}" on {name}.', '{name} پر "{group}" کے لیے کم از کم {n} آپشن منتخب کریں۔'),
  chooseAtMost: ls('You can choose at most {n} option(s) for "{group}" on {name}.', '{name} پر "{group}" کے لیے زیادہ سے زیادہ {n} آپشن منتخب کیے جا سکتے ہیں۔'),
  minDelivery: ls("Minimum order for delivery to {area} is {amount}.", "{area} تک ڈیلیوری کے لیے کم از کم آرڈر {amount} ہے۔"),
  couldNotPlace: ls("Could not place your order. Please try again or call us.", "آپ کا آرڈر نہیں دیا جا سکا۔ دوبارہ کوشش کریں یا ہمیں کال کریں۔"),
  orderReceived: ls("Order received!", "آرڈر موصول ہو گیا!"),
  duplicateInFlight: ls("Your order is already being placed. Please wait a moment.", "آپ کا آرڈر پہلے ہی دیا جا رہا ہے۔ ایک لمحہ انتظار کریں۔"),
  alreadySubmitted: ls("An order from this checkout was already placed. Look it up with your order number and phone.", "اس چیک آؤٹ سے آرڈر پہلے ہی دیا جا چکا ہے۔ اپنے آرڈر نمبر اور فون سے تلاش کریں۔"),
  notAvailable: ls("This feature is not available on this site.", "یہ سہولت اس ویب سائٹ پر دستیاب نہیں۔"),
  enterOrderNumber: ls("Enter a valid order number.", "درست آرڈر نمبر درج کریں۔"),
  enterPhoneUsed: ls("Enter the mobile number used for this order.", "اس آرڈر کے لیے استعمال شدہ موبائل نمبر درج کریں۔"),
  orderNotFound: ls("No order found with these details.", "ان تفصیلات سے کوئی آرڈر نہیں ملا۔"),
  invalidOrder: ls("Invalid order.", "آرڈر درست نہیں۔"),
  reservationsOff: ls("Table reservations are not available online. Please call us.", "ٹیبل ریزرویشن آن لائن دستیاب نہیں۔ براہ کرم کال کریں۔"),
  invalidDate: ls("Invalid date.", "تاریخ درست نہیں۔"),
  pastDate: ls("Please choose today or a future date.", "براہ کرم آج یا آنے والی تاریخ منتخب کریں۔"),
  pastTime: ls("That time has already passed. Please choose a later time.", "یہ وقت گزر چکا ہے۔ براہ کرم بعد کا وقت منتخب کریں۔"),
  tooSoon: ls("Please book at least 30 minutes ahead, or call us for an immediate table.", "براہ کرم کم از کم 30 منٹ پہلے بک کریں، یا فوری ٹیبل کے لیے کال کریں۔"),
  tooFarAhead: ls("Reservations can be made up to 60 days ahead.", "ریزرویشن زیادہ سے زیادہ 60 دن پہلے کی جا سکتی ہے۔"),
  closedOnDay: ls("We are closed on that day. Please choose another date.", "اس دن ہم بند ہیں۔ براہ کرم دوسری تاریخ منتخب کریں۔"),
  outsideHours: ls("We are closed at that time. Our hours that day are {open} – {close}.", "اس وقت ہم بند ہیں۔ اس دن ہمارے اوقات {open} – {close} ہیں۔"),
  reservationReceived: ls("Reservation request received. We will confirm by phone.", "ریزرویشن کی درخواست موصول ہو گئی۔ ہم فون پر تصدیق کریں گے۔"),
  thankYou: ls("Thank you!", "شکریہ!"),
  storeUnavailable: ls("Online ordering for this restaurant is currently unavailable.", "اس ریسٹورنٹ کے لیے آن لائن آرڈرنگ فی الحال دستیاب نہیں۔"),
} as const;

export type RestaurantMessageKey = keyof typeof restaurantMessages;

export function rm(key: RestaurantMessageKey, lang: Lang, vars: Record<string, string | number> = {}): string {
  return t(restaurantMessages[key] as LocalizedString, lang).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
