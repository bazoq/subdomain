import { f } from "@/templates/fields";
import { defineSection, type SectionDefinition, type NavItem } from "@/templates/types";
import { ls, type LocalizedString } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import type { CategoryKey } from "@/lib/categories";
import {
  aboutSection,
  brandsSection,
  contactSection,
  ctaSection,
  faqSection,
  featuresSection,
  footerSection,
  gallerySection,
  heroSection,
  hoursSection,
  processSection,
  promoSection,
  seoSection,
  statsSection,
  teamSection,
  testimonialsSection,
  withDefaults,
} from "@/templates/shared/sections";

/**
 * Category "section packs": the ordered list of sections (with Pakistan-specific default
 * copy) that every template of a category ships. Templates may reorder, drop or override
 * defaults through `buildMeta()` in src/templates/catalog/index.ts.
 */

/** "5 days from Rs 45,000" / "5 دن، 45,000 روپے سے" — rupee amounts always go through formatPKR. */
function fromPrice(en: string, ur: string, amount: number): LocalizedString {
  return ls(`${en} from ${formatPKR(amount)}`, `${ur}، ${formatPKR(amount, { lang: "ur" })} سے`);
}

/* ---------- category-specific sections ---------- */

export const featuredProductsSection = defineSection({
  key: "featuredProducts",
  label: "Featured products",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.select("mode", "Which products", [
      { value: "featured", label: "Featured products" },
      { value: "newest", label: "Newest products" },
    ]),
    f.number("count", "How many", { min: 4, max: 16 }),
    f.link("cta", "Button"),
  ],
  defaults: { eyebrow: ls("Shop", "شاپ"), title: ls("Featured products", "نمایاں مصنوعات"), mode: "featured", count: 8, cta: { label: ls("View all products", "تمام مصنوعات"), href: "/shop" } },
});

export const collectionsSection = defineSection({
  key: "collections",
  label: "Collections / categories showcase",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.repeater("items", "Collections", [f.localized("title", "Title"), f.localized("subtitle", "Subtitle"), f.image("image", "Image"), f.text("href", "Link (e.g. /shop/c/cookware)")], { max: 8 }),
  ],
  defaults: {
    eyebrow: ls("Browse", "دیکھیں"),
    title: ls("Shop by category", "زمرہ کے لحاظ سے خریداری"),
    items: [
      { title: ls("New arrivals", "نئی آمد"), subtitle: ls("Just landed", "ابھی آئے"), image: "", href: "/shop?sort=newest" },
      { title: ls("Best sellers", "بیسٹ سیلرز"), subtitle: ls("Customer favourites", "گاہکوں کے پسندیدہ"), image: "", href: "/shop?sort=featured" },
      { title: ls("Sale", "سیل"), subtitle: ls("Up to 40% off", "40% تک رعایت"), image: "", href: "/shop?tags=sale" },
    ],
  },
});

export const bannerSection = defineSection({
  key: "banner",
  label: "Promotional banner (image + text)",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.localized("text", "Text", { multiline: true }),
    f.image("image", "Image"),
    f.link("cta", "Button"),
    f.select("align", "Image position", [
      { value: "right", label: "Image right" },
      { value: "left", label: "Image left" },
    ]),
  ],
  defaults: {
    eyebrow: ls("Limited time", "محدود وقت"),
    title: ls("Eid collection is here", "عید کلیکشن آ گیا"),
    text: ls("Fresh styles for the season, delivered anywhere in Pakistan with cash on delivery.", "موسم کے تازہ اسٹائل، پاکستان میں کہیں بھی کیش آن ڈیلیوری۔"),
    image: "",
    cta: { label: ls("Shop the collection", "کلیکشن خریدیں"), href: "/shop" },
    align: "right",
  },
});

export const prescriptionCtaSection = defineSection({
  key: "prescriptionCta",
  label: "Upload prescription banner",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.link("cta", "Button"), f.repeater("points", "Bullet points", [f.localized("text", "Text")], { max: 4 })],
  defaults: {
    title: ls("Have a prescription?", "نسخہ ہے؟"),
    text: ls("Upload a photo of your doctor's prescription and our licensed pharmacist will prepare your order for home delivery.", "اپنے ڈاکٹر کے نسخے کی تصویر اپ لوڈ کریں، ہمارا لائسنس یافتہ فارماسسٹ آپ کا آرڈر ہوم ڈیلیوری کے لیے تیار کرے گا۔"),
    cta: { label: ls("Upload prescription", "نسخہ اپ لوڈ کریں"), href: "/upload-prescription" },
    points: [{ text: ls("Licensed pharmacist verification", "لائسنس یافتہ فارماسسٹ کی تصدیق") }, { text: ls("Genuine medicines only", "صرف اصلی ادویات") }, { text: ls("Discreet, same-day delivery in city", "شہر میں رازداری کے ساتھ اسی دن ڈیلیوری") }],
  },
});

export const craftSection = defineSection({
  key: "craft",
  label: "Craftsmanship story",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.richtext("body", "Text"),
    f.images("images", "Images", { max: 4 }),
    f.repeater("steps", "Process steps", [f.localized("title", "Title"), f.localized("text", "Text")], { max: 5 }),
  ],
  defaults: {
    eyebrow: ls("Handcrafted", "ہاتھ سے بنا"),
    title: ls("Forged the traditional way", "روایتی طریقے سے ڈھالے گئے"),
    body: ls("Each blade is hand-forged, heat-treated and polished by master craftsmen using techniques passed down for generations.", "ہر بلیڈ ماہر کاریگر ہاتھ سے ڈھالتے، گرم کر کے سخت کرتے اور پالش کرتے ہیں — نسل در نسل چلی آئی تکنیک سے۔"),
    images: [],
    steps: [
      { title: ls("Forging", "ڈھلائی"), text: ls("High-carbon or Damascus steel shaped by hand.", "ہائی کاربن یا دمشقی اسٹیل، ہاتھ سے ڈھالا ہوا۔") },
      { title: ls("Heat treatment", "ہیٹ ٹریٹمنٹ"), text: ls("Hardened and tempered for a lasting edge.", "دیرپا دھار کے لیے سخت اور ٹیمپرڈ۔") },
      { title: ls("Handle & finish", "ہینڈل اور فنشنگ"), text: ls("Rosewood, bone or brass fittings, hand-polished.", "شیشم، ہڈی یا پیتل کی فٹنگ، ہاتھ سے پالش۔") },
    ],
  },
});

export const featuredMenuSection = defineSection({
  key: "featuredMenu",
  label: "Featured menu items",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: ls("Menu", "مینیو"), title: ls("Customer favourites", "پسندیدہ آئٹمز"), count: 6, cta: { label: ls("View full menu", "مکمل مینیو"), href: "/menu" } },
});

export const dealsSection = defineSection({
  key: "deals",
  label: "Deals & combos",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.repeater("items", "Deals", [f.localized("title", "Title"), f.localized("description", "Description"), f.number("price", "Price (Rs)"), f.text("badge", "Badge (e.g. Save Rs 300)"), f.image("image", "Image")], { max: 6 }),
  ],
  defaults: {
    eyebrow: ls("Deals", "ڈیلز"),
    title: ls("Today's deals", "آج کی ڈیلز"),
    items: [
      { title: ls("Family Feast", "فیملی فیسٹ"), description: ls("2 Large pizzas + 1.5L drink + garlic bread", "2 لارج پیزا + 1.5 لٹر ڈرنک + گارلک بریڈ"), price: 2999, badge: "Save Rs 600", image: "" },
      { title: ls("Student Deal", "اسٹوڈنٹ ڈیل"), description: ls("1 Medium pizza + 2 regular drinks", "1 میڈیم پیزا + 2 ریگولر ڈرنکس"), price: 1299, badge: "Most popular", image: "" },
      { title: ls("Midnight Deal", "مڈ نائٹ ڈیل"), description: ls("1 Large pizza + fries, 11pm-2am", "1 لارج پیزا + فرائز، رات 11 سے 2 بجے"), price: 1599, badge: "Late night", image: "" },
    ],
  },
});

export const deliveryAreasSection = defineSection({
  key: "deliveryAreas",
  label: "Delivery areas",
  description: "Fees and minimums come from Delivery zones. This controls the heading and text.",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true })],
  defaults: { title: ls("We deliver to", "ہم یہاں ڈیلیور کرتے ہیں"), text: ls("Free delivery on orders above Rs 2,000 within our main zones. Average delivery time 30-45 minutes.", "ہمارے مرکزی زونز میں 2,000 روپے سے زائد آرڈر پر مفت ڈیلیوری۔ اوسط وقت 30 سے 45 منٹ۔") },
});

export const customCakeSection = defineSection({
  key: "customCake",
  label: "Custom cake orders",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.image("image", "Image"), f.link("cta", "Button")],
  defaults: {
    title: ls("Custom cakes for every celebration", "ہر تقریب کے لیے کسٹم کیک"),
    text: ls("Birthdays, weddings, anniversaries or baby showers, tell us your idea and we will bake it. Order at least 48 hours in advance.", "سالگرہ، شادی، اینیورسری یا بے بی شاور — اپنا آئیڈیا بتائیں، ہم بیک کر دیں گے۔ کم از کم 48 گھنٹے پہلے آرڈر کریں۔"),
    image: "",
    cta: { label: ls("Order a custom cake", "کسٹم کیک آرڈر کریں"), href: "/custom-cake" },
  },
});

export const featuredJobsSection = defineSection({
  key: "featuredJobs",
  label: "Latest jobs",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: ls("Jobs", "نوکریاں"), title: ls("Latest openings", "تازہ ترین آسامیاں"), count: 6, cta: { label: ls("Browse all jobs", "تمام نوکریاں"), href: "/jobs" } },
});

export const industriesSection = defineSection({
  key: "industries",
  label: "Industries / sectors",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.repeater("items", "Industries", [f.icon("icon", "Icon"), f.localized("title", "Title"), f.text("href", "Link")], { max: 12 })],
  defaults: {
    eyebrow: ls("Sectors", "شعبے"),
    title: ls("Industries we recruit for", "جن شعبوں کے لیے ہم بھرتی کرتے ہیں"),
    items: [
      { icon: "HardHat", title: ls("Construction", "کنسٹرکشن"), href: "/jobs?q=construction" },
      { icon: "Stethoscope", title: ls("Healthcare", "ہیلتھ کیئر"), href: "/jobs?q=nurse" },
      { icon: "Utensils", title: ls("Hospitality", "ہاسپیٹیلیٹی"), href: "/jobs?q=hotel" },
      { icon: "Truck", title: ls("Drivers & logistics", "ڈرائیورز اور لاجسٹکس"), href: "/jobs?q=driver" },
      { icon: "Cpu", title: ls("IT & engineering", "آئی ٹی اور انجینئرنگ"), href: "/jobs?q=engineer" },
      { icon: "ShieldCheck", title: ls("Security", "سیکیورٹی"), href: "/jobs?q=security" },
    ],
  },
});

export const employersCtaSection = defineSection({
  key: "employersCta",
  label: "For employers",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.link("cta", "Button"), f.image("image", "Image")],
  defaults: {
    title: ls("Hiring? We find you the right people, fast.", "بھرتی کرنی ہے؟ ہم آپ کو صحیح لوگ جلد فراہم کرتے ہیں۔"),
    text: ls("Pre-screened candidates, medical and document processing, and full visa support for Gulf and local employers.", "پہلے سے جانچے گئے امیدوار، میڈیکل اور دستاویزات کی پروسیسنگ، اور خلیجی و مقامی آجروں کے لیے مکمل ویزا سپورٹ۔"),
    cta: { label: ls("Request staff", "عملہ درکار ہے"), href: "/employers" },
    image: "",
  },
});

export const featuredPackagesSection = defineSection({
  key: "featuredPackages",
  label: "Featured packages",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: ls("Packages", "پیکجز"), title: ls("Popular packages", "مقبول پیکجز"), count: 6, cta: { label: ls("View all packages", "تمام پیکجز"), href: "/packages" } },
});

export const destinationsSection = defineSection({
  key: "destinations",
  label: "Destinations",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.repeater("items", "Destinations", [f.localized("name", "Name"), f.image("image", "Image"), f.text("href", "Link"), f.localized("note", "Note (e.g. from Rs 45,000)")], { max: 8 })],
  defaults: {
    eyebrow: ls("Explore", "دریافت کریں"),
    title: ls("Top destinations", "مقبول مقامات"),
    items: [
      { name: ls("Makkah & Madinah", "مکہ اور مدینہ"), image: "", href: "/packages?kind=UMRAH", note: fromPrice("Umrah", "عمرہ", 185_000) },
      { name: ls("Hunza & Skardu", "ہنزہ اور سکردو"), image: "", href: "/packages?destination=Hunza", note: fromPrice("5 days", "5 دن", 45_000) },
      { name: ls("Dubai", "دبئی"), image: "", href: "/packages?destination=Dubai", note: fromPrice("4 nights", "4 راتیں", 120_000) },
      { name: ls("Turkey", "ترکی"), image: "", href: "/packages?destination=Istanbul", note: fromPrice("7 nights", "7 راتیں", 250_000) },
    ],
  },
});

export const umrahSection = defineSection({
  key: "umrah",
  label: "Umrah / Hajj highlight",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.image("image", "Image"), f.link("cta", "Button"), f.repeater("points", "Highlights", [f.localized("text", "Text")], { max: 5 })],
  defaults: {
    title: ls("Umrah packages with complete peace of mind", "عمرہ پیکجز"),
    text: ls("Hotels near Haram, direct flights, Ziyarat tours and 24/7 support in Saudi Arabia. Group and family departures every week.", "حرم کے قریب ہوٹل، براہ راست پروازیں، زیارات اور سعودی عرب میں 24/7 سپورٹ۔ ہر ہفتے گروپ اور فیملی روانگیاں۔"),
    image: "",
    cta: { label: ls("See Umrah packages", "عمرہ پیکجز دیکھیں"), href: "/packages?kind=UMRAH" },
    points: [{ text: ls("Ministry-approved agency", "وزارت سے منظور شدہ ایجنسی") }, { text: ls("Hotels within walking distance of Haram", "حرم سے پیدل فاصلے پر ہوٹل") }, { text: ls("Visa, flights and transport included", "ویزا، پروازیں اور ٹرانسپورٹ شامل") }],
  },
});

export const featuredPropertiesSection = defineSection({
  key: "featuredProperties",
  label: "Featured properties",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: ls("Listings", "لسٹنگز"), title: ls("Featured properties", "نمایاں پراپرٹیز"), count: 6, cta: { label: ls("View all properties", "تمام پراپرٹیز"), href: "/properties" } },
});

export const areasSection = defineSection({
  key: "areas",
  label: "Popular areas",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.repeater("items", "Areas", [f.text("name", "Area"), f.image("image", "Image"), f.text("href", "Link"), f.localized("note", "Note")], { max: 8 })],
  defaults: {
    eyebrow: ls("Areas", "علاقے"),
    title: ls("Browse by area", "علاقے کے لحاظ سے دیکھیں"),
    items: [
      { name: "DHA Lahore", image: "", href: "/properties?city=Lahore&q=DHA", note: ls("Plots, houses, commercial", "پلاٹ، گھر، کمرشل") },
      { name: "Bahria Town", image: "", href: "/properties?q=Bahria", note: ls("Ready houses & plots", "تیار گھر اور پلاٹ") },
      { name: "Gulberg", image: "", href: "/properties?q=Gulberg", note: ls("Apartments & offices", "اپارٹمنٹ اور دفاتر") },
      { name: "Johar Town", image: "", href: "/properties?q=Johar", note: ls("Family homes", "فیملی گھر") },
    ],
  },
});

export const plansSection = defineSection({
  key: "plans",
  label: "Membership plans heading",
  description: "Plans are managed under Membership plans. This controls the heading.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: ls("Pricing", "قیمتیں"), title: ls("Membership plans", "ممبرشپ پلانز"), subtitle: ls("No hidden fees. Cancel anytime.", "کوئی پوشیدہ فیس نہیں۔ کبھی بھی منسوخ کریں۔") },
});

export const classesSection = defineSection({
  key: "classes",
  label: "Class timetable heading",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: ls("Schedule", "شیڈول"), title: ls("Weekly classes", "ہفتہ وار کلاسز"), subtitle: ls("Separate ladies timings available.", "خواتین کے علیحدہ اوقات دستیاب۔") },
});

export const practiceAreasSection = defineSection({
  key: "practiceAreas",
  label: "Practice areas heading",
  description: "Areas are managed under Practice areas. This controls the heading.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: ls("Expertise", "مہارت"), title: ls("Practice areas", "شعبہ جات"), subtitle: ls("Civil, criminal, family and corporate matters across Pakistan.", "پاکستان بھر میں دیوانی، فوجداری، خاندانی اور کارپوریٹ معاملات۔") },
});

export const servicesSection = defineSection({
  key: "services",
  label: "Services heading",
  description: "Services are managed under Services. This controls the heading.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle"), f.number("count", "How many to show", { min: 3, max: 12 })],
  defaults: { eyebrow: ls("Services", "خدمات"), title: ls("What we offer", "ہماری خدمات"), subtitle: ls(""), count: 6 },
});

export const portfolioSection = defineSection({
  key: "portfolio",
  label: "Portfolio / work samples",
  description: "Images come from Gallery (album: portfolio).",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.text("album", "Album")],
  defaults: { eyebrow: ls("Our work", "ہمارا کام"), title: ls("Recent work", "حالیہ کام"), album: "portfolio" },
});

export const transformationsSection = defineSection({
  key: "transformations",
  label: "Transformations gallery",
  description: "Images come from Gallery (album: transformations).",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.text("album", "Album")],
  defaults: { eyebrow: ls("Results", "نتائج"), title: ls("Real transformations", "حقیقی تبدیلیاں"), album: "transformations" },
});

/* ---------- packs ---------- */

type Pack = { sections: SectionDefinition[]; nav: NavItem[] };

const nav = (items: [string, string, string?][]): NavItem[] => items.map(([en, href, ur]) => ({ label: ls(en, ur), href }));

const shopNav = nav([["Home", "/", "ہوم"], ["Shop", "/shop", "شاپ"], ["About", "/#about", "ہمارے بارے میں"], ["Contact", "/contact", "رابطہ"]]);

export function ecommercePack(category: CategoryKey): Pack {
  const heroByCat: Record<string, Partial<typeof heroSection.defaults>> = {
    kitchen: { eyebrow: ls("Kitchen essentials", "کچن کی ضروریات"), title: ls("Everything your kitchen needs", "آپ کے کچن کی ہر ضرورت"), subtitle: ls("Cookware, crockery, appliances and tools from trusted brands. Cash on delivery across Pakistan.", "معتبر برانڈز کے کک ویئر، کراکری، اپلائنسز اور ٹولز۔ پاکستان بھر میں کیش آن ڈیلیوری۔"), primaryCta: { label: ls("Shop now", "ابھی خریدیں"), href: "/shop" } },
    clothing: { eyebrow: ls("New season", "نیا سیزن"), title: ls("Wear what you love", "پہنیں جو آپ کو پسند ہے"), subtitle: ls("Lawn, pret and unstitched collections designed in Pakistan. Free exchanges, cash on delivery.", "پاکستان میں ڈیزائن کیے گئے لان، پریٹ اور ان اسٹچڈ کلیکشن۔ مفت تبدیلی، کیش آن ڈیلیوری۔"), primaryCta: { label: ls("Shop collection", "کلیکشن خریدیں"), href: "/shop" } },
    shoes: { eyebrow: ls("Step in style", "اسٹائل سے قدم بڑھائیں"), title: ls("Shoes made for Pakistani roads", "پاکستانی سڑکوں کے لیے بنے جوتے"), subtitle: ls("Comfort-first footwear for men, women and kids. Easy size exchange, cash on delivery.", "مردوں، خواتین اور بچوں کے لیے آرام دہ جوتے۔ آسان سائز تبدیلی، کیش آن ڈیلیوری۔"), primaryCta: { label: ls("Shop shoes", "جوتے خریدیں"), href: "/shop" } },
    gifts: { eyebrow: ls("Make it special", "اسے خاص بنائیں"), title: ls("Gifts that say it for you", "تحائف جو آپ کے جذبات بیان کریں"), subtitle: ls("Curated gift boxes, flowers and personalised keepsakes delivered the same day in the city.", "منتخب گفٹ باکس، پھول اور پرسنلائزڈ تحائف — شہر میں اسی دن ڈیلیوری۔"), primaryCta: { label: ls("Find a gift", "تحفہ تلاش کریں"), href: "/shop" } },
    blades: { eyebrow: ls("Hand-forged in Wazirabad", "وزیرآباد میں ہاتھ سے ڈھالے گئے"), title: ls("Blades with a soul", "روح رکھنے والے بلیڈ"), subtitle: ls("Damascus and high-carbon knives, swords and collectibles crafted by master smiths. Worldwide shipping available.", "ماہر کاریگروں کے بنائے دمشقی اور ہائی کاربن چھریاں، تلواریں اور نوادرات۔ دنیا بھر میں شپنگ دستیاب۔"), primaryCta: { label: ls("Explore the collection", "کلیکشن دیکھیں"), href: "/shop" } },
    sports: { eyebrow: ls("Play harder", "کھیل میں آگے"), title: ls("Gear up for every game", "ہر کھیل کے لیے تیار ہو جائیں"), subtitle: ls("Cricket, football, fitness and sportswear from Sialkot's finest makers and global brands.", "سیالکوٹ کے بہترین کاریگروں اور عالمی برانڈز کا کرکٹ، فٹبال، فٹنس اور اسپورٹس ویئر۔"), primaryCta: { label: ls("Shop gear", "سامان خریدیں"), href: "/shop" } },
    electronics: { eyebrow: ls("Official warranty", "آفیشل وارنٹی"), title: ls("Latest tech, honest prices", "جدید ٹیکنالوجی، مناسب قیمتیں"), subtitle: ls("Mobiles, laptops and home appliances with official warranty and cash on delivery nationwide.", "موبائل، لیپ ٹاپ اور گھریلو اپلائنسز، آفیشل وارنٹی اور ملک بھر میں کیش آن ڈیلیوری کے ساتھ۔"), primaryCta: { label: ls("Shop electronics", "الیکٹرانکس خریدیں"), href: "/shop" } },
    medical: { eyebrow: ls("Licensed pharmacy", "لائسنس یافتہ فارمیسی"), title: ls("Medicines delivered to your door", "ادویات آپ کے دروازے تک"), subtitle: ls("Genuine medicines, baby care and wellness products with pharmacist support. Upload your prescription in seconds.", "اصلی ادویات، بے بی کیئر اور صحت کی مصنوعات، فارماسسٹ کی معاونت کے ساتھ۔ اپنا نسخہ سیکنڈوں میں اپ لوڈ کریں۔"), primaryCta: { label: ls("Shop now", "ابھی خریدیں"), href: "/shop" }, secondaryCta: { label: ls("Upload prescription", "نسخہ اپ لوڈ کریں"), href: "/upload-prescription" } },
  };
  const sections: SectionDefinition[] = [
    withDefaults(heroSection, heroByCat[category] ?? {}),
    promoSection,
    collectionsSection,
    featuredProductsSection,
    ...(category === "medical" ? [prescriptionCtaSection] : []),
    ...(category === "blades" ? [craftSection] : []),
    bannerSection,
    featuresSection,
    aboutSection,
    ...(category === "electronics" || category === "sports" ? [brandsSection] : []),
    ...(category === "clothing" || category === "shoes" || category === "gifts" ? [withDefaults(gallerySection, { eyebrow: ls("Lookbook", "لُک بُک"), title: ls("As seen on our customers", "ہمارے گاہکوں کی پسند"), album: "lookbook" })] : []),
    statsSection,
    testimonialsSection,
    faqSection,
    ctaSection,
    footerSection,
    seoSection,
  ];
  return { sections, nav: shopNav };
}

export function restaurantPack(category: "pizza" | "bakery"): Pack {
  const hero =
    category === "pizza"
      ? { eyebrow: ls("Hot & fresh", "گرم اور تازہ"), title: ls("Pizza the way you love it", "پیزا ویسا جیسا آپ کو پسند ہے"), subtitle: ls("Hand-tossed dough, premium cheese and fresh toppings. Order online for delivery or pickup in 30 minutes.", "ہاتھ سے بنا آٹا، پریمیم چیز اور تازہ ٹاپنگز۔ 30 منٹ میں ڈیلیوری یا پک اپ کے لیے آن لائن آرڈر کریں۔"), primaryCta: { label: ls("Order now", "ابھی آرڈر کریں"), href: "/menu" }, secondaryCta: { label: ls("View deals", "ڈیلز دیکھیں"), href: "#deals" }, badges: [{ text: "30-min delivery", icon: "Timer" }, { text: "Cash on delivery", icon: "Banknote" }] }
      : { eyebrow: ls("Baked fresh daily", "روزانہ تازہ بیک"), title: ls("Cakes, breads and sweet moments", "کیک، بریڈ اور میٹھے لمحات"), subtitle: ls("Freshly baked every morning. Order cakes for birthdays and weddings, or pick up your daily bread.", "ہر صبح تازہ بیک۔ سالگرہ اور شادی کے کیک آرڈر کریں یا روزانہ کی بریڈ لے جائیں۔"), primaryCta: { label: ls("Order online", "آن لائن آرڈر کریں"), href: "/menu" }, secondaryCta: { label: ls("Custom cakes", "کسٹم کیک"), href: "/custom-cake" }, badges: [{ text: "Same-day delivery", icon: "Timer" }, { text: "Halal certified", icon: "BadgeCheck" }] };
  const sections: SectionDefinition[] = [
    withDefaults(heroSection, hero),
    ...(category === "pizza" ? [dealsSection] : [customCakeSection]),
    featuredMenuSection,
    withDefaults(processSection, {
      eyebrow: ls("How to order", "آرڈر کا طریقہ"),
      title: ls("Order in three taps", "تین ٹیپ میں آرڈر"),
      steps: [
        { title: ls("Pick your items", "اپنے آئٹمز چنیں"), text: ls("Browse the menu and customise sizes and toppings.", "مینیو دیکھیں اور سائز اور ٹاپنگز اپنی پسند سے چنیں۔"), icon: "UtensilsCrossed" },
        { title: ls("Choose delivery or pickup", "ڈیلیوری یا پک اپ چنیں"), text: ls("Enter your area for delivery fee and time.", "ڈیلیوری فیس اور وقت کے لیے اپنا علاقہ درج کریں۔"), icon: "MapPin" },
        { title: ls("Pay on delivery", "ڈیلیوری پر ادائیگی"), text: ls("Cash on delivery. Track your order live.", "کیش آن ڈیلیوری۔ اپنا آرڈر لائیو ٹریک کریں۔"), icon: "Banknote" },
      ],
    }),
    withDefaults(aboutSection, { eyebrow: ls("Our story", "ہماری کہانی"), title: category === "pizza" ? ls("Made with love since day one", "پہلے دن سے محبت کے ساتھ تیار") : ls("A family bakery you can trust", "ایک خاندانی بیکری جس پر آپ بھروسہ کر سکیں") }),
    withDefaults(gallerySection, { eyebrow: ls("Gallery", "گیلری"), title: ls("Fresh from the oven", "اوون سے تازہ") }),
    deliveryAreasSection,
    hoursSection,
    testimonialsSection,
    faqSection,
    withDefaults(ctaSection, { title: ls("Hungry? Order now.", "بھوک لگی ہے؟ ابھی آرڈر کریں۔"), text: ls("Order online or WhatsApp us your order. Delivery in 30-45 minutes.", "آن لائن آرڈر کریں یا واٹس ایپ پر بھیجیں۔ 30 سے 45 منٹ میں ڈیلیوری۔"), cta: { label: ls("Order now", "ابھی آرڈر کریں"), href: "/menu" } }),
    footerSection,
    seoSection,
  ];
  return {
    sections,
    nav: nav([["Home", "/", "ہوم"], ["Menu", "/menu", "مینیو"], ["About", "/#about", "ہمارے بارے میں"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function recruitingPack(): Pack {
  return {
    sections: [
      withDefaults(heroSection, { eyebrow: ls("Overseas & local placement", "بیرونِ ملک اور مقامی تعیناتی"), title: ls("Your next job starts here", "آپ کی اگلی نوکری یہاں سے شروع"), subtitle: ls("Verified vacancies in Saudi Arabia, UAE, Qatar and across Pakistan. Free registration, transparent processing.", "سعودی عرب، یو اے ای، قطر اور پاکستان بھر میں تصدیق شدہ آسامیاں۔ مفت رجسٹریشن، شفاف پروسیسنگ۔"), primaryCta: { label: ls("Browse jobs", "نوکریاں دیکھیں"), href: "/jobs" }, secondaryCta: { label: ls("Submit your CV", "اپنا سی وی جمع کریں"), href: "/jobs" }, badges: [{ text: "Govt. licensed (OEP)", icon: "BadgeCheck" }, { text: "10,000+ placed", icon: "Users" }] }),
      withDefaults(statsSection, { items: [{ value: "10,000+", label: ls("Candidates placed", "امیدوار تعینات") }, { value: "250+", label: ls("Employer partners", "آجر پارٹنرز") }, { value: "12", label: ls("Countries", "ممالک") }, { value: "15 yrs", label: ls("Experience", "تجربہ") }] }),
      featuredJobsSection,
      industriesSection,
      withDefaults(servicesSection, { title: ls("Our services", "ہماری خدمات"), subtitle: ls("Recruitment, visa processing, medical, documentation and pre-departure training.", "بھرتی، ویزا پروسیسنگ، میڈیکل، دستاویزات اور روانگی سے پہلے تربیت۔") }),
      withDefaults(processSection, { eyebrow: ls("Process", "طریقہ کار"), title: ls("How placement works", "تعیناتی کیسے ہوتی ہے"), steps: [{ title: ls("Apply", "درخواست دیں"), text: ls("Submit your CV against a vacancy.", "کسی آسامی کے لیے اپنا سی وی جمع کریں۔"), icon: "FileUser" }, { title: ls("Interview", "انٹرویو"), text: ls("Shortlisted candidates meet the employer.", "شارٹ لسٹ امیدوار آجر سے ملتے ہیں۔"), icon: "Handshake" }, { title: ls("Visa & medical", "ویزا اور میڈیکل"), text: ls("We handle documentation and processing.", "دستاویزات اور پروسیسنگ ہم سنبھالتے ہیں۔"), icon: "Stamp" }, { title: ls("Fly", "روانگی"), text: ls("Pre-departure briefing and ticketing.", "روانگی سے پہلے بریفنگ اور ٹکٹنگ۔"), icon: "Plane" }] }),
      employersCtaSection,
      withDefaults(aboutSection, { title: ls("A licensed agency you can trust", "لائسنس یافتہ ایجنسی جس پر آپ بھروسہ کر سکیں") }),
      teamSection,
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Ready to work abroad?", "بیرونِ ملک کام کے لیے تیار ہیں؟"), text: ls("WhatsApp us your CV and target country. We reply the same day.", "اپنا سی وی اور مطلوبہ ملک واٹس ایپ کریں۔ ہم اسی دن جواب دیتے ہیں۔"), cta: { label: ls("WhatsApp us", "واٹس ایپ کریں"), href: "whatsapp" } }),
      contactSection,
      footerSection,
      seoSection,
    ],
    nav: nav([["Home", "/"], ["Jobs", "/jobs", "نوکریاں"], ["Services", "/services", "خدمات"], ["Employers", "/employers"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function travelPack(): Pack {
  return {
    sections: [
      withDefaults(heroSection, { eyebrow: ls("Travel made simple", "سفر ہوا آسان"), title: ls("Umrah, tours and tickets, all in one place", "عمرہ، ٹور اور ٹکٹ، سب ایک جگہ"), subtitle: ls("Trusted by thousands of Pakistani families. Umrah packages, northern-areas tours, visas and flight tickets at honest prices.", "ہزاروں پاکستانی خاندانوں کا اعتماد۔ عمرہ پیکجز، شمالی علاقوں کے ٹور، ویزا اور فلائٹ ٹکٹ مناسب قیمتوں پر۔"), primaryCta: { label: ls("Explore packages", "پیکجز دیکھیں"), href: "/packages" }, secondaryCta: { label: ls("Get a quote", "کوٹ حاصل کریں"), href: "/contact" }, badges: [{ text: "IATA accredited", icon: "BadgeCheck" }, { text: "24/7 support", icon: "Headset" }] }),
      featuredPackagesSection,
      destinationsSection,
      umrahSection,
      withDefaults(servicesSection, { title: ls("Travel services", "سفری خدمات"), subtitle: ls("Visa consultancy, air ticketing, hotel booking and travel insurance.", "ویزا مشاورت، ایئر ٹکٹنگ، ہوٹل بکنگ اور ٹریول انشورنس۔") }),
      withDefaults(featuresSection, { eyebrow: ls("Why us", "ہم کیوں"), title: ls("Why travellers choose us", "مسافر ہمیں کیوں چنتے ہیں"), items: [{ icon: "BadgeCheck", title: ls("Licensed & insured", "لائسنس یافتہ اور انشورڈ"), text: ls("Registered agency with full documentation.", "مکمل دستاویزات کے ساتھ رجسٹرڈ ایجنسی۔") }, { icon: "Wallet", title: ls("Best price guarantee", "بہترین قیمت کی ضمانت"), text: ls("Transparent pricing, no hidden charges.", "شفاف قیمتیں، کوئی پوشیدہ چارجز نہیں۔") }, { icon: "Headset", title: ls("24/7 assistance", "24/7 معاونت"), text: ls("Support before, during and after your trip.", "سفر سے پہلے، دوران اور بعد میں سپورٹ۔") }, { icon: "Users", title: ls("Group departures", "گروپ روانگیاں"), text: ls("Family and group packages every week.", "ہر ہفتے فیملی اور گروپ پیکجز۔") }] }),
      withDefaults(processSection, { title: ls("Book in three steps", "تین مراحل میں بکنگ"), steps: [{ title: ls("Choose a package", "پیکج منتخب کریں"), text: ls("Or tell us your dates and budget.", "یا اپنی تاریخیں اور بجٹ بتائیں۔"), icon: "Map" }, { title: ls("Confirm details", "تفصیلات کی تصدیق"), text: ls("We share the itinerary and final quote.", "ہم سفری پروگرام اور حتمی کوٹ بھیجتے ہیں۔"), icon: "ClipboardCheck" }, { title: ls("Travel", "سفر"), text: ls("Documents, tickets and support delivered.", "دستاویزات، ٹکٹ اور سپورٹ فراہم۔"), icon: "Plane" }] }),
      withDefaults(statsSection, { items: [{ value: "25,000+", label: ls("Happy travellers", "خوش مسافر") }, { value: "1,200+", label: ls("Umrah groups", "عمرہ گروپس") }, { value: "40+", label: ls("Destinations", "مقامات") }, { value: "4.9", label: ls("Google rating", "گوگل ریٹنگ") }] }),
      withDefaults(aboutSection, { title: ls("Your journey, our responsibility", "آپ کا سفر، ہماری ذمہ داری") }),
      withDefaults(gallerySection, { title: ls("Moments from our tours", "ہمارے ٹورز کے لمحات") }),
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Planning a trip?", "سفر کی منصوبہ بندی کر رہے ہیں؟"), text: ls("Tell us where and when. We will send a custom quote within an hour.", "بتائیں کہاں اور کب۔ ہم ایک گھنٹے میں کسٹم کوٹ بھیجیں گے۔"), cta: { label: ls("WhatsApp us", "واٹس ایپ کریں"), href: "whatsapp" } }),
      contactSection,
      footerSection,
      seoSection,
    ],
    nav: nav([["Home", "/"], ["Packages", "/packages", "پیکجز"], ["Services", "/services", "خدمات"], ["Gallery", "/gallery", "گیلری"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function realestatePack(): Pack {
  return {
    sections: [
      withDefaults(heroSection, { eyebrow: ls("Buy · Sell · Rent", "خرید · فروخت · کرایہ"), title: ls("Find your next home or investment", "اپنا اگلا گھر یا سرمایہ کاری تلاش کریں"), subtitle: ls("Verified plots, houses, apartments and commercial properties in DHA, Bahria Town and across the city.", "ڈی ایچ اے، بحریہ ٹاؤن اور پورے شہر میں تصدیق شدہ پلاٹ، گھر، اپارٹمنٹ اور کمرشل پراپرٹیز۔"), primaryCta: { label: ls("Browse properties", "پراپرٹیز دیکھیں"), href: "/properties" }, secondaryCta: { label: ls("List your property", "اپنی پراپرٹی لسٹ کریں"), href: "/contact" }, badges: [{ text: "Verified listings", icon: "BadgeCheck" }, { text: "Registered agency", icon: "Building2" }] }),
      featuredPropertiesSection,
      areasSection,
      withDefaults(servicesSection, { title: ls("Our services", "ہماری خدمات"), subtitle: ls("Buying, selling, renting, property management and investment advice.", "خرید، فروخت، کرایہ، پراپرٹی مینجمنٹ اور سرمایہ کاری کا مشورہ۔") }),
      withDefaults(featuresSection, { title: ls("Why work with us", "ہمارے ساتھ کیوں کام کریں"), items: [{ icon: "ShieldCheck", title: ls("Verified documents", "تصدیق شدہ دستاویزات"), text: ls("Every listing checked for clean title.", "ہر لسٹنگ کی صاف ملکیت کی جانچ۔") }, { icon: "Scale", title: ls("Fair valuations", "منصفانہ تخمینہ"), text: ls("Honest market pricing, no inflated rates.", "ایمانداری سے مارکیٹ قیمت، کوئی بڑھا چڑھا ریٹ نہیں۔") }, { icon: "Handshake", title: ls("End-to-end support", "شروع سے آخر تک سپورٹ"), text: ls("From site visit to transfer.", "سائٹ وزٹ سے ٹرانسفر تک۔") }, { icon: "TrendingUp", title: ls("Investment advice", "سرمایہ کاری کا مشورہ"), text: ls("Data-backed guidance on growing areas.", "ترقی کرتے علاقوں پر ڈیٹا پر مبنی رہنمائی۔") }] }),
      withDefaults(statsSection, { items: [{ value: "1,500+", label: ls("Properties sold", "پراپرٹیز فروخت") }, { value: "20 yrs", label: ls("In business", "کاروبار میں") }, { value: "300+", label: ls("Active listings", "فعال لسٹنگز") }, { value: "98%", label: ls("Client satisfaction", "کلائنٹ اطمینان") }] }),
      withDefaults(processSection, { title: ls("How it works", "یہ کیسے کام کرتا ہے"), steps: [{ title: ls("Tell us your need", "اپنی ضرورت بتائیں"), text: ls("Budget, area and property type.", "بجٹ، علاقہ اور پراپرٹی کی قسم۔"), icon: "MessageSquare" }, { title: ls("Visit shortlisted options", "منتخب پراپرٹیز دیکھیں"), text: ls("We arrange viewings at your convenience.", "آپ کی سہولت کے مطابق وزٹ کا انتظام۔"), icon: "Car" }, { title: ls("Close with confidence", "اعتماد سے ڈیل مکمل کریں"), text: ls("Documentation and transfer handled by us.", "دستاویزات اور ٹرانسفر ہم سنبھالتے ہیں۔"), icon: "FileCheck" }] }),
      withDefaults(aboutSection, { title: ls("Trusted property advisors", "قابلِ اعتماد پراپرٹی مشیر") }),
      withDefaults(teamSection, { eyebrow: ls("Agents", "ایجنٹس"), title: ls("Meet our agents", "ہمارے ایجنٹس سے ملیں") }),
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Want to sell or rent out?", "فروخت یا کرائے پر دینا چاہتے ہیں؟"), text: ls("Get a free valuation and a marketing plan within 24 hours.", "24 گھنٹوں میں مفت تخمینہ اور مارکیٹنگ پلان حاصل کریں۔"), cta: { label: ls("Get free valuation", "مفت تخمینہ حاصل کریں"), href: "/contact" } }),
      contactSection,
      footerSection,
      seoSection,
    ],
    nav: nav([["Home", "/"], ["Properties", "/properties", "پراپرٹیز"], ["Services", "/services", "خدمات"], ["Agents", "/team"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function gymPack(): Pack {
  return {
    sections: [
      withDefaults(heroSection, { eyebrow: ls("No excuses", "کوئی بہانہ نہیں"), title: ls("Stronger every day", "ہر دن مزید مضبوط"), subtitle: ls("Modern equipment, certified trainers, separate ladies timings and flexible plans. Your first session is free.", "جدید مشینیں، سرٹیفائیڈ ٹرینرز، خواتین کے علیحدہ اوقات اور لچکدار پلانز۔ پہلا سیشن مفت۔"), primaryCta: { label: ls("Book a free trial", "مفت ٹرائل بک کریں"), href: "/join" }, secondaryCta: { label: ls("See plans", "پلانز دیکھیں"), href: "/plans" }, badges: [{ text: "Certified trainers", icon: "BadgeCheck" }, { text: "Ladies timings", icon: "Clock" }] }),
      withDefaults(statsSection, { items: [{ value: "2,000+", label: ls("Members", "ممبرز") }, { value: "15", label: ls("Certified trainers", "سرٹیفائیڈ ٹرینرز") }, { value: "40+", label: ls("Weekly classes", "ہفتہ وار کلاسز") }, { value: "12,000 sq ft", label: ls("Facility", "سہولت") }] }),
      withDefaults(featuresSection, { eyebrow: ls("Facilities", "سہولیات"), title: ls("Everything under one roof", "سب کچھ ایک چھت کے نیچے"), items: [{ icon: "Dumbbell", title: ls("Strength zone", "اسٹرینتھ زون"), text: ls("Free weights, racks and machines.", "فری ویٹس، ریکس اور مشینیں۔") }, { icon: "HeartPulse", title: ls("Cardio floor", "کارڈیو فلور"), text: ls("Treadmills, bikes, rowers.", "ٹریڈملز، بائیکس، روورز۔") }, { icon: "Users", title: ls("Group classes", "گروپ کلاسز"), text: ls("HIIT, yoga, Zumba, boxing.", "HIIT، یوگا، زومبا، باکسنگ۔") }, { icon: "Apple", title: ls("Nutrition plans", "نیوٹریشن پلانز"), text: ls("Diet guidance with every plan.", "ہر پلان کے ساتھ ڈائیٹ رہنمائی۔") }] }),
      plansSection,
      classesSection,
      withDefaults(teamSection, { eyebrow: ls("Trainers", "ٹرینرز"), title: ls("Meet the trainers", "ٹرینرز سے ملیں") }),
      transformationsSection,
      withDefaults(aboutSection, { title: ls("More than a gym, a community", "صرف جم نہیں، ایک کمیونٹی") }),
      hoursSection,
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Start your first week free", "پہلا ہفتہ مفت شروع کریں"), text: ls("No commitment. Walk in or book online.", "کوئی پابندی نہیں۔ خود آئیں یا آن لائن بک کریں۔"), cta: { label: ls("Book free trial", "مفت ٹرائل بک کریں"), href: "/join" } }),
      contactSection,
      footerSection,
      seoSection,
    ],
    nav: nav([["Home", "/"], ["Plans", "/plans", "پلانز"], ["Classes", "/classes", "کلاسز"], ["Trainers", "/team", "ٹرینرز"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function lawPack(): Pack {
  return {
    sections: [
      withDefaults(heroSection, { eyebrow: ls("Advocates & legal consultants", "وکلاء اور قانونی مشیر"), title: ls("Clear counsel. Strong representation.", "واضح مشورہ۔ مضبوط پیروی۔"), subtitle: ls("Experienced advocates for civil, criminal, family, property and corporate matters in the High Court and district courts.", "ہائی کورٹ اور ضلعی عدالتوں میں دیوانی، فوجداری، خاندانی، جائیداد اور کارپوریٹ معاملات کے تجربہ کار وکلاء۔"), primaryCta: { label: ls("Book a consultation", "مشاورت بک کریں"), href: "/consultation" }, secondaryCta: { label: ls("Our practice areas", "ہمارے شعبہ جات"), href: "/services" }, badges: [{ text: "High Court advocates", icon: "Scale" }, { text: "Confidential", icon: "Lock" }] }),
      practiceAreasSection,
      withDefaults(aboutSection, { eyebrow: ls("The firm", "فرم"), title: ls("Integrity, diligence and results", "دیانت، محنت اور نتائج") }),
      withDefaults(statsSection, { items: [{ value: "1,200+", label: ls("Cases handled", "مقدمات نمٹائے") }, { value: "25 yrs", label: ls("Combined experience", "مجموعی تجربہ") }, { value: "94%", label: ls("Success rate", "کامیابی کی شرح") }, { value: "6", label: ls("Advocates", "وکلاء") }] }),
      withDefaults(teamSection, { eyebrow: ls("Attorneys", "وکلاء"), title: ls("Our attorneys", "ہمارے وکلاء") }),
      withDefaults(processSection, { title: ls("How we work", "ہم کیسے کام کرتے ہیں"), steps: [{ title: ls("Consultation", "مشاورت"), text: ls("We listen and assess your matter.", "ہم آپ کا معاملہ سنتے اور جانچتے ہیں۔"), icon: "MessageSquare" }, { title: ls("Strategy", "حکمتِ عملی"), text: ls("A clear plan with transparent fees.", "واضح منصوبہ اور شفاف فیس۔"), icon: "ClipboardList" }, { title: ls("Representation", "پیروی"), text: ls("Diligent advocacy until resolution.", "فیصلے تک محنت سے پیروی۔"), icon: "Gavel" }] }),
      withDefaults(featuresSection, { title: ls("Why clients trust us", "کلائنٹس ہم پر کیوں بھروسہ کرتے ہیں"), items: [{ icon: "Lock", title: ls("Strict confidentiality", "مکمل رازداری"), text: ls("Your matter stays private.", "آپ کا معاملہ خفیہ رہتا ہے۔") }, { icon: "Receipt", title: ls("Transparent fees", "شفاف فیس"), text: ls("Written fee agreements, no surprises.", "تحریری فیس معاہدہ، کوئی سرپرائز نہیں۔") }, { icon: "Clock", title: ls("Responsive", "فوری جواب"), text: ls("Updates at every hearing.", "ہر سماعت پر اپ ڈیٹ۔") }, { icon: "Languages", title: ls("Urdu & English", "اردو اور انگریزی"), text: ls("Documents explained in your language.", "دستاویزات آپ کی زبان میں سمجھائی جاتی ہیں۔") }] }),
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Need legal advice today?", "آج قانونی مشورہ درکار ہے؟"), text: ls("Book a consultation online or call our office.", "آن لائن مشاورت بک کریں یا ہمارے دفتر کال کریں۔"), cta: { label: ls("Book consultation", "مشاورت بک کریں"), href: "/consultation" } }),
      contactSection,
      footerSection,
      seoSection,
    ],
    nav: nav([["Home", "/"], ["Practice areas", "/services", "شعبہ جات"], ["Attorneys", "/team", "وکلاء"], ["Consultation", "/consultation", "مشاورت"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function printingPack(): Pack {
  return {
    sections: [
      withDefaults(heroSection, { eyebrow: ls("Digital & offset printing", "ڈیجیٹل اور آفسیٹ پرنٹنگ"), title: ls("Print anything. Beautifully.", "کچھ بھی پرنٹ کریں۔ خوبصورتی سے۔"), subtitle: ls("Business cards, flyers, banners, packaging and wedding cards with fast turnaround and delivery across Pakistan. Upload your design and get a quote in minutes.", "بزنس کارڈز، فلائرز، بینرز، پیکیجنگ اور شادی کارڈز — تیز تیاری اور پاکستان بھر میں ڈیلیوری۔ اپنا ڈیزائن اپ لوڈ کریں اور منٹوں میں کوٹ حاصل کریں۔"), primaryCta: { label: ls("Get a quote", "کوٹ حاصل کریں"), href: "/quote" }, secondaryCta: { label: ls("See services", "خدمات دیکھیں"), href: "/services" }, badges: [{ text: "24-hr turnaround", icon: "Timer" }, { text: "Free design check", icon: "BadgeCheck" }] }),
      withDefaults(servicesSection, { title: ls("Printing services", "پرنٹنگ خدمات"), subtitle: ls("Transparent prices, premium papers and finishes.", "شفاف قیمتیں، پریمیم کاغذ اور فنشنگ۔"), count: 8 }),
      withDefaults(processSection, { eyebrow: ls("How it works", "طریقہ کار"), title: ls("From file to finished print", "فائل سے تیار پرنٹ تک"), steps: [{ title: ls("Upload your design", "اپنا ڈیزائن اپ لوڈ کریں"), text: ls("PDF, AI or PSD. Or let us design it.", "PDF، AI یا PSD۔ یا ہم سے ڈیزائن کروائیں۔"), icon: "Upload" }, { title: ls("Approve the quote", "کوٹ منظور کریں"), text: ls("Price and proof within an hour.", "ایک گھنٹے میں قیمت اور پروف۔"), icon: "ClipboardCheck" }, { title: ls("We print & deliver", "ہم پرنٹ اور ڈیلیور کرتے ہیں"), text: ls("Pickup in store or courier nationwide.", "اسٹور سے پک اپ یا ملک بھر میں کورئیر۔"), icon: "Truck" }] }),
      portfolioSection,
      withDefaults(featuresSection, { title: ls("Why print with us", "ہم سے پرنٹ کیوں کروائیں"), items: [{ icon: "Sparkles", title: ls("Premium finishes", "پریمیم فنشنگ"), text: ls("Matte, gloss, spot UV, foil, emboss.", "میٹ، گلوس، اسپاٹ یو وی، فوائل، ایمبوس۔") }, { icon: "Timer", title: ls("Fast turnaround", "تیز تیاری"), text: ls("Most jobs ready in 24-48 hours.", "زیادہ تر کام 24 سے 48 گھنٹوں میں تیار۔") }, { icon: "Wallet", title: ls("Bulk pricing", "بلک قیمتیں"), text: ls("Better rates on higher quantities.", "زیادہ مقدار پر بہتر ریٹ۔") }, { icon: "PenTool", title: ls("In-house design", "اپنا ڈیزائن اسٹوڈیو"), text: ls("Free design check on every order.", "ہر آرڈر پر مفت ڈیزائن چیک۔") }] }),
      withDefaults(statsSection, { items: [{ value: "5,000+", label: ls("Clients", "کلائنٹس") }, { value: "1M+", label: ls("Cards printed", "کارڈز پرنٹ کیے") }, { value: "24 hr", label: ls("Turnaround", "تیاری کا وقت") }, { value: "15 yrs", label: ls("Experience", "تجربہ") }] }),
      withDefaults(aboutSection, { title: ls("Your neighbourhood print partner", "آپ کے محلے کا پرنٹ پارٹنر") }),
      brandsSection,
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Have a file ready?", "فائل تیار ہے؟"), text: ls("Upload it now and get a quote within the hour.", "ابھی اپ لوڈ کریں اور ایک گھنٹے میں کوٹ حاصل کریں۔"), cta: { label: ls("Get a quote", "کوٹ حاصل کریں"), href: "/quote" } }),
      contactSection,
      footerSection,
      seoSection,
    ],
    nav: nav([["Home", "/"], ["Services", "/services", "خدمات"], ["Portfolio", "/gallery", "کام"], ["Get a quote", "/quote", "قیمت"], ["Contact", "/contact", "رابطہ"]]),
  };
}

export function packFor(category: CategoryKey): Pack {
  switch (category) {
    case "pizza":
    case "bakery":
      return restaurantPack(category);
    case "recruiting":
      return recruitingPack();
    case "travel":
      return travelPack();
    case "realestate":
      return realestatePack();
    case "gym":
      return gymPack();
    case "law":
      return lawPack();
    case "printing":
      return printingPack();
    default:
      return ecommercePack(category);
  }
}
