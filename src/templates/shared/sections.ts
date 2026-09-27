import { f } from "@/templates/fields";
import { defineSection } from "@/templates/types";
import { ls } from "@/lib/i18n";

/**
 * Reusable section definitions. Templates import these and override `defaults`
 * (and sometimes label/fields) with `withDefaults()` so every template ships
 * Pakistan-specific, category-specific starter content.
 */
export function withDefaults<S extends { defaults: unknown }>(def: S, defaults: Partial<S["defaults"]>): S {
  return { ...def, defaults: { ...(def.defaults as object), ...(defaults as object) } as S["defaults"] };
}

export const heroSection = defineSection({
  key: "hero",
  label: "Hero banner",
  description: "The first thing visitors see. Headline, sub-headline, buttons and background image.",
  canDisable: false,
  fields: [
    f.localized("eyebrow", "Small label above the title"),
    f.localized("title", "Headline"),
    f.localized("subtitle", "Sub-headline", { multiline: true }),
    f.link("primaryCta", "Primary button"),
    f.link("secondaryCta", "Secondary button"),
    f.image("image", "Main image"),
    f.images("slides", "Slider images (optional)", { max: 6 }),
    f.repeater("badges", "Trust badges", [f.text("text", "Text"), f.icon("icon", "Icon")], { max: 4 }),
  ],
  defaults: {
    eyebrow: ls("Welcome", "خوش آمدید"),
    title: ls("Your headline goes here", "آپ کی سرخی یہاں آئے گی"),
    subtitle: ls("A short, convincing sentence about what you offer and why customers in Pakistan love you.", "ایک مختصر، قائل کرنے والا جملہ کہ آپ کیا پیش کرتے ہیں اور پاکستان میں گاہک آپ کو کیوں پسند کرتے ہیں۔"),
    primaryCta: { label: ls("Get Started", "شروع کریں"), href: "/contact" },
    secondaryCta: { label: ls("Learn More", "مزید جانیں"), href: "#about" },
    image: "",
    slides: [],
    badges: [
      { text: "Cash on Delivery", icon: "BadgeCheck" },
      { text: "Nationwide Delivery", icon: "Truck" },
    ],
  },
});

export const aboutSection = defineSection({
  key: "about",
  label: "About us",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.richtext("body", "Text"),
    f.image("image", "Image"),
    f.repeater("highlights", "Highlights", [f.localized("text", "Text"), f.icon("icon", "Icon")], { max: 6 }),
    f.link("cta", "Button"),
  ],
  defaults: {
    eyebrow: ls("About us", "ہمارے بارے میں"),
    title: ls("A trusted name since day one", "پہلے دن سے ایک قابلِ اعتماد نام"),
    body: ls("Tell your story: when you started, what you stand for, and why customers keep coming back.", "اپنی کہانی بتائیں: آپ نے کب شروع کیا، آپ کے اصول کیا ہیں، اور گاہک بار بار کیوں آتے ہیں۔"),
    image: "",
    highlights: [
      { text: ls("Quality you can trust", "معیار جس پر آپ بھروسہ کر سکیں"), icon: "ShieldCheck" },
      { text: ls("Friendly customer support", "خوش اخلاق کسٹمر سپورٹ"), icon: "Headset" },
      { text: ls("Fair, transparent pricing", "مناسب، شفاف قیمتیں"), icon: "BadgePercent" },
    ],
    cta: { label: ls("Contact Us", "رابطہ کریں"), href: "/contact" },
  },
});

export const featuresSection = defineSection({
  key: "features",
  label: "Why choose us",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.localized("subtitle", "Subtitle", { multiline: true }),
    f.repeater("items", "Features", [f.icon("icon", "Icon"), f.localized("title", "Title"), f.localized("text", "Text", { multiline: true })], { max: 8 }),
  ],
  defaults: {
    eyebrow: ls("Why us", "ہم کیوں"),
    title: ls("Why customers choose us", "گاہک ہمیں کیوں چنتے ہیں"),
    subtitle: ls(""),
    items: [
      { icon: "Truck", title: ls("Fast delivery", "تیز ڈیلیوری"), text: ls("Delivered to your doorstep across Pakistan.", "پاکستان بھر میں آپ کے دروازے تک ڈیلیوری۔") },
      { icon: "BadgeCheck", title: ls("Guaranteed quality", "معیار کی ضمانت"), text: ls("Every item is checked before it ships.", "ہر آئٹم بھیجنے سے پہلے چیک کیا جاتا ہے۔") },
      { icon: "Banknote", title: ls("Cash on delivery", "کیش آن ڈیلیوری"), text: ls("Pay when your order arrives. No card needed.", "آرڈر ملنے پر ادائیگی کریں۔ کارڈ کی ضرورت نہیں۔") },
      { icon: "Headset", title: ls("WhatsApp support", "واٹس ایپ سپورٹ"), text: ls("Talk to a real person, 7 days a week.", "ہفتے کے 7 دن حقیقی نمائندے سے بات کریں۔") },
    ],
  },
});

export const statsSection = defineSection({
  key: "stats",
  label: "Numbers / stats",
  fields: [f.repeater("items", "Stats", [f.text("value", "Value (e.g. 10,000+)"), f.localized("label", "Label")], { max: 6 })],
  defaults: {
    items: [
      { value: "10,000+", label: ls("Happy customers", "خوش گاہک") },
      { value: "500+", label: ls("Products", "مصنوعات") },
      { value: "120+", label: ls("Cities served", "شہر") },
      { value: "4.9", label: ls("Average rating", "ریٹنگ") },
    ],
  },
});

export const testimonialsSection = defineSection({
  key: "testimonials",
  label: "Testimonials",
  description: "Reviews are managed under Content > Testimonials. This controls the heading.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: ls("Reviews", "جائزے"), title: ls("What our customers say", "ہمارے گاہک کیا کہتے ہیں"), subtitle: ls("") },
});

export const faqSection = defineSection({
  key: "faq",
  label: "FAQ",
  description: "Questions are managed under Content > FAQ. This controls the heading.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: ls("FAQ", "سوالات"), title: ls("Frequently asked questions", "عام سوالات"), subtitle: ls("") },
});

export const gallerySection = defineSection({
  key: "gallery",
  label: "Gallery",
  description: "Images are managed under Content > Gallery. This controls the heading and album.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.text("album", "Album name (default: general)")],
  defaults: { eyebrow: ls("Gallery", "گیلری"), title: ls("A look inside", "ایک جھلک"), album: "general" },
});

export const ctaSection = defineSection({
  key: "cta",
  label: "Call to action banner",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.link("cta", "Button"), f.image("image", "Background image")],
  defaults: {
    title: ls("Ready to get started?", "شروع کرنے کے لیے تیار ہیں؟"),
    text: ls("Call or WhatsApp us today. We reply within minutes during working hours.", "آج ہی کال یا واٹس ایپ کریں۔ کام کے اوقات میں ہم منٹوں میں جواب دیتے ہیں۔"),
    cta: { label: ls("WhatsApp Us", "واٹس ایپ کریں"), href: "whatsapp" },
    image: "",
  },
});

export const contactSection = defineSection({
  key: "contact",
  label: "Contact section",
  description: "Phone, address and map are pulled from Settings > Contact. This controls the heading and form.",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.localized("subtitle", "Subtitle", { multiline: true }),
    f.boolean("showForm", "Show contact form"),
    f.boolean("showMap", "Show map"),
  ],
  defaults: { eyebrow: ls("Contact", "رابطہ"), title: ls("Get in touch", "رابطہ کریں"), subtitle: ls("We'd love to hear from you.", "ہمیں آپ سے سن کر خوشی ہوگی۔"), showForm: true, showMap: true },
});

export const teamSection = defineSection({
  key: "team",
  label: "Team",
  description: "Members are managed under Content > Team. This controls the heading.",
  fields: [f.localized("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: ls("Team", "ٹیم"), title: ls("Meet the team", "ہماری ٹیم سے ملیں"), subtitle: ls("") },
});

export const hoursSection = defineSection({
  key: "hours",
  label: "Opening hours",
  description: "Times come from Settings > Opening hours.",
  fields: [f.localized("title", "Title"), f.localized("note", "Note")],
  defaults: { title: ls("Opening hours", "اوقات کار"), note: ls("Closed on public holidays.", "عام تعطیلات پر بند۔") },
});

export const processSection = defineSection({
  key: "process",
  label: "How it works",
  fields: [
    f.localized("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.repeater("steps", "Steps", [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.icon("icon", "Icon")], { max: 6 }),
  ],
  defaults: {
    eyebrow: ls("How it works", "طریقہ کار"),
    title: ls("Simple, in three steps", "آسان، تین مراحل میں"),
    steps: [
      { title: ls("Choose", "منتخب کریں"), text: ls("Browse and pick what you need.", "دیکھیں اور جو چاہیں منتخب کریں۔"), icon: "Search" },
      { title: ls("Order", "آرڈر کریں"), text: ls("Checkout with cash on delivery.", "کیش آن ڈیلیوری کے ساتھ چیک آؤٹ کریں۔"), icon: "ShoppingBag" },
      { title: ls("Receive", "وصول کریں"), text: ls("Delivered to your door in 2-4 days.", "2 سے 4 دن میں آپ کے دروازے تک۔"), icon: "PackageCheck" },
    ],
  },
});

export const promoSection = defineSection({
  key: "promo",
  label: "Promo / offer strip",
  fields: [f.localized("text", "Text"), f.text("code", "Coupon code"), f.link("cta", "Button"), f.color("bg", "Background colour")],
  defaults: { text: ls("Flat 10% off your first order", "پہلے آرڈر پر 10% رعایت"), code: "WELCOME10", cta: { label: ls("Shop Now", "ابھی خریدیں"), href: "/shop" }, bg: "" },
});

export const brandsSection = defineSection({
  key: "brands",
  label: "Brands / partners strip",
  fields: [f.localized("title", "Title"), f.repeater("logos", "Logos", [f.text("name", "Name"), f.image("image", "Logo")], { max: 12 })],
  defaults: { title: ls("Trusted by leading brands", "معروف برانڈز کا اعتماد"), logos: [] },
});

export const footerSection = defineSection({
  key: "footer",
  label: "Footer",
  canDisable: false,
  fields: [
    f.localized("about", "Short description", { multiline: true }),
    f.repeater("columns", "Link columns", [f.localized("title", "Column title"), f.repeater("links", "Links", [f.localized("label", "Label"), f.text("href", "URL")], { max: 8 })], { max: 3 }),
    f.text("bottomNote", "Bottom note"),
  ],
  defaults: {
    about: ls("Proudly serving customers across Pakistan.", "پاکستان بھر میں گاہکوں کی خدمت پر فخر۔"),
    columns: [
      { title: ls("Quick links", "فوری لنکس"), links: [{ label: ls("Home", "ہوم"), href: "/" }, { label: ls("About", "ہمارے بارے میں"), href: "#about" }, { label: ls("Contact", "رابطہ"), href: "/contact" }] },
    ],
    bottomNote: "",
  },
});

export const seoSection = defineSection({
  key: "seo",
  label: "Home page SEO",
  fields: [f.text("title", "Meta title", { maxLength: 70 }), f.text("description", "Meta description", { maxLength: 170 })],
  defaults: { title: "", description: "" },
});
