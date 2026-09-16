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
    f.text("eyebrow", "Small label above the title"),
    f.localized("title", "Headline"),
    f.localized("subtitle", "Sub-headline", { multiline: true }),
    f.link("primaryCta", "Primary button"),
    f.link("secondaryCta", "Secondary button"),
    f.image("image", "Main image"),
    f.images("slides", "Slider images (optional)", { max: 6 }),
    f.repeater("badges", "Trust badges", [f.text("text", "Text"), f.icon("icon", "Icon")], { max: 4 }),
  ],
  defaults: {
    eyebrow: "Welcome",
    title: ls("Your headline goes here"),
    subtitle: ls("A short, convincing sentence about what you offer and why customers in Pakistan love you."),
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
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.richtext("body", "Text"),
    f.image("image", "Image"),
    f.repeater("highlights", "Highlights", [f.localized("text", "Text"), f.icon("icon", "Icon")], { max: 6 }),
    f.link("cta", "Button"),
  ],
  defaults: {
    eyebrow: "About us",
    title: ls("A trusted name since day one"),
    body: ls("Tell your story: when you started, what you stand for, and why customers keep coming back."),
    image: "",
    highlights: [
      { text: ls("Quality you can trust"), icon: "ShieldCheck" },
      { text: ls("Friendly customer support"), icon: "Headset" },
      { text: ls("Fair, transparent pricing"), icon: "BadgePercent" },
    ],
    cta: { label: ls("Contact Us"), href: "/contact" },
  },
});

export const featuresSection = defineSection({
  key: "features",
  label: "Why choose us",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.localized("subtitle", "Subtitle", { multiline: true }),
    f.repeater("items", "Features", [f.icon("icon", "Icon"), f.localized("title", "Title"), f.localized("text", "Text", { multiline: true })], { max: 8 }),
  ],
  defaults: {
    eyebrow: "Why us",
    title: ls("Why customers choose us"),
    subtitle: ls(""),
    items: [
      { icon: "Truck", title: ls("Fast delivery"), text: ls("Delivered to your doorstep across Pakistan.") },
      { icon: "BadgeCheck", title: ls("Guaranteed quality"), text: ls("Every item is checked before it ships.") },
      { icon: "Banknote", title: ls("Cash on delivery"), text: ls("Pay when your order arrives. No card needed.") },
      { icon: "Headset", title: ls("WhatsApp support"), text: ls("Talk to a real person, 7 days a week.") },
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
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: "Reviews", title: ls("What our customers say"), subtitle: ls("") },
});

export const faqSection = defineSection({
  key: "faq",
  label: "FAQ",
  description: "Questions are managed under Content > FAQ. This controls the heading.",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: "FAQ", title: ls("Frequently asked questions"), subtitle: ls("") },
});

export const gallerySection = defineSection({
  key: "gallery",
  label: "Gallery",
  description: "Images are managed under Content > Gallery. This controls the heading and album.",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.text("album", "Album name (default: general)")],
  defaults: { eyebrow: "Gallery", title: ls("A look inside"), album: "general" },
});

export const ctaSection = defineSection({
  key: "cta",
  label: "Call to action banner",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.link("cta", "Button"), f.image("image", "Background image")],
  defaults: {
    title: ls("Ready to get started?"),
    text: ls("Call or WhatsApp us today. We reply within minutes during working hours."),
    cta: { label: ls("WhatsApp Us", "واٹس ایپ کریں"), href: "whatsapp" },
    image: "",
  },
});

export const contactSection = defineSection({
  key: "contact",
  label: "Contact section",
  description: "Phone, address and map are pulled from Settings > Contact. This controls the heading and form.",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.localized("subtitle", "Subtitle", { multiline: true }),
    f.boolean("showForm", "Show contact form"),
    f.boolean("showMap", "Show map"),
  ],
  defaults: { eyebrow: "Contact", title: ls("Get in touch"), subtitle: ls("We'd love to hear from you."), showForm: true, showMap: true },
});

export const teamSection = defineSection({
  key: "team",
  label: "Team",
  description: "Members are managed under Content > Team. This controls the heading.",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: "Team", title: ls("Meet the team"), subtitle: ls("") },
});

export const hoursSection = defineSection({
  key: "hours",
  label: "Opening hours",
  description: "Times come from Settings > Opening hours.",
  fields: [f.localized("title", "Title"), f.localized("note", "Note")],
  defaults: { title: ls("Opening hours", "اوقات کار"), note: ls("Closed on public holidays.") },
});

export const processSection = defineSection({
  key: "process",
  label: "How it works",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.repeater("steps", "Steps", [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.icon("icon", "Icon")], { max: 6 }),
  ],
  defaults: {
    eyebrow: "How it works",
    title: ls("Simple, in three steps"),
    steps: [
      { title: ls("Choose"), text: ls("Browse and pick what you need."), icon: "Search" },
      { title: ls("Order"), text: ls("Checkout with cash on delivery."), icon: "ShoppingBag" },
      { title: ls("Receive"), text: ls("Delivered to your door in 2-4 days."), icon: "PackageCheck" },
    ],
  },
});

export const promoSection = defineSection({
  key: "promo",
  label: "Promo / offer strip",
  fields: [f.localized("text", "Text"), f.text("code", "Coupon code"), f.link("cta", "Button"), f.color("bg", "Background colour")],
  defaults: { text: ls("Flat 10% off your first order"), code: "WELCOME10", cta: { label: ls("Shop Now"), href: "/shop" }, bg: "" },
});

export const brandsSection = defineSection({
  key: "brands",
  label: "Brands / partners strip",
  fields: [f.localized("title", "Title"), f.repeater("logos", "Logos", [f.text("name", "Name"), f.image("image", "Logo")], { max: 12 })],
  defaults: { title: ls("Trusted by leading brands"), logos: [] },
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
    about: ls("Proudly serving customers across Pakistan."),
    columns: [
      { title: ls("Quick links"), links: [{ label: ls("Home"), href: "/" }, { label: ls("About"), href: "#about" }, { label: ls("Contact"), href: "/contact" }] },
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
