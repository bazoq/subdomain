import { f } from "@/templates/fields";
import { defineSection, type SectionDefinition, type NavItem } from "@/templates/types";
import { ls } from "@/lib/i18n";
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

/* ---------- category-specific sections ---------- */

export const featuredProductsSection = defineSection({
  key: "featuredProducts",
  label: "Featured products",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.select("mode", "Which products", [
      { value: "featured", label: "Featured products" },
      { value: "newest", label: "Newest products" },
    ]),
    f.number("count", "How many", { min: 4, max: 16 }),
    f.link("cta", "Button"),
  ],
  defaults: { eyebrow: "Shop", title: ls("Featured products", "نمایاں مصنوعات"), mode: "featured", count: 8, cta: { label: ls("View all products", "تمام مصنوعات"), href: "/shop" } },
});

export const collectionsSection = defineSection({
  key: "collections",
  label: "Collections / categories showcase",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.repeater("items", "Collections", [f.localized("title", "Title"), f.localized("subtitle", "Subtitle"), f.image("image", "Image"), f.text("href", "Link (e.g. /shop/c/cookware)")], { max: 8 }),
  ],
  defaults: {
    eyebrow: "Browse",
    title: ls("Shop by category", "زمرہ کے لحاظ سے خریداری"),
    items: [
      { title: ls("New arrivals"), subtitle: ls("Just landed"), image: "", href: "/shop?sort=newest" },
      { title: ls("Best sellers"), subtitle: ls("Customer favourites"), image: "", href: "/shop?sort=featured" },
      { title: ls("Sale"), subtitle: ls("Up to 40% off"), image: "", href: "/shop?tags=sale" },
    ],
  },
});

export const bannerSection = defineSection({
  key: "banner",
  label: "Promotional banner (image + text)",
  fields: [
    f.text("eyebrow", "Small label"),
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
    eyebrow: "Limited time",
    title: ls("Eid collection is here"),
    text: ls("Fresh styles for the season, delivered anywhere in Pakistan with cash on delivery."),
    image: "",
    cta: { label: ls("Shop the collection"), href: "/shop" },
    align: "right",
  },
});

export const prescriptionCtaSection = defineSection({
  key: "prescriptionCta",
  label: "Upload prescription banner",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.link("cta", "Button"), f.repeater("points", "Bullet points", [f.localized("text", "Text")], { max: 4 })],
  defaults: {
    title: ls("Have a prescription?", "نسخہ ہے؟"),
    text: ls("Upload a photo of your doctor's prescription and our licensed pharmacist will prepare your order for home delivery."),
    cta: { label: ls("Upload prescription", "نسخہ اپ لوڈ کریں"), href: "/upload-prescription" },
    points: [{ text: ls("Licensed pharmacist verification") }, { text: ls("Genuine medicines only") }, { text: ls("Discreet, same-day delivery in city") }],
  },
});

export const craftSection = defineSection({
  key: "craft",
  label: "Craftsmanship story",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.richtext("body", "Text"),
    f.images("images", "Images", { max: 4 }),
    f.repeater("steps", "Process steps", [f.localized("title", "Title"), f.localized("text", "Text")], { max: 5 }),
  ],
  defaults: {
    eyebrow: "Handcrafted",
    title: ls("Forged the traditional way"),
    body: ls("Each blade is hand-forged, heat-treated and polished by master craftsmen using techniques passed down for generations."),
    images: [],
    steps: [
      { title: ls("Forging"), text: ls("High-carbon or Damascus steel shaped by hand.") },
      { title: ls("Heat treatment"), text: ls("Hardened and tempered for a lasting edge.") },
      { title: ls("Handle & finish"), text: ls("Rosewood, bone or brass fittings, hand-polished.") },
    ],
  },
});

export const featuredMenuSection = defineSection({
  key: "featuredMenu",
  label: "Featured menu items",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: "Menu", title: ls("Customer favourites", "پسندیدہ آئٹمز"), count: 6, cta: { label: ls("View full menu", "مکمل مینیو"), href: "/menu" } },
});

export const dealsSection = defineSection({
  key: "deals",
  label: "Deals & combos",
  fields: [
    f.text("eyebrow", "Small label"),
    f.localized("title", "Title"),
    f.repeater("items", "Deals", [f.localized("title", "Title"), f.localized("description", "Description"), f.number("price", "Price (Rs)"), f.text("badge", "Badge (e.g. Save Rs 300)"), f.image("image", "Image")], { max: 6 }),
  ],
  defaults: {
    eyebrow: "Deals",
    title: ls("Today's deals", "آج کی ڈیلز"),
    items: [
      { title: ls("Family Feast"), description: ls("2 Large pizzas + 1.5L drink + garlic bread"), price: 2999, badge: "Save Rs 600", image: "" },
      { title: ls("Student Deal"), description: ls("1 Medium pizza + 2 regular drinks"), price: 1299, badge: "Most popular", image: "" },
      { title: ls("Midnight Deal"), description: ls("1 Large pizza + fries, 11pm-2am"), price: 1599, badge: "Late night", image: "" },
    ],
  },
});

export const deliveryAreasSection = defineSection({
  key: "deliveryAreas",
  label: "Delivery areas",
  description: "Fees and minimums come from Delivery zones. This controls the heading and text.",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true })],
  defaults: { title: ls("We deliver to", "ہم یہاں ڈیلیور کرتے ہیں"), text: ls("Free delivery on orders above Rs 2,000 within our main zones. Average delivery time 30-45 minutes.") },
});

export const customCakeSection = defineSection({
  key: "customCake",
  label: "Custom cake orders",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.image("image", "Image"), f.link("cta", "Button")],
  defaults: {
    title: ls("Custom cakes for every celebration"),
    text: ls("Birthdays, weddings, anniversaries or baby showers, tell us your idea and we will bake it. Order at least 48 hours in advance."),
    image: "",
    cta: { label: ls("Order a custom cake"), href: "/custom-cake" },
  },
});

export const featuredJobsSection = defineSection({
  key: "featuredJobs",
  label: "Latest jobs",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: "Jobs", title: ls("Latest openings", "تازہ ترین آسامیاں"), count: 6, cta: { label: ls("Browse all jobs", "تمام نوکریاں"), href: "/jobs" } },
});

export const industriesSection = defineSection({
  key: "industries",
  label: "Industries / sectors",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.repeater("items", "Industries", [f.icon("icon", "Icon"), f.localized("title", "Title"), f.text("href", "Link")], { max: 12 })],
  defaults: {
    eyebrow: "Sectors",
    title: ls("Industries we recruit for"),
    items: [
      { icon: "HardHat", title: ls("Construction"), href: "/jobs?q=construction" },
      { icon: "Stethoscope", title: ls("Healthcare"), href: "/jobs?q=nurse" },
      { icon: "Utensils", title: ls("Hospitality"), href: "/jobs?q=hotel" },
      { icon: "Truck", title: ls("Drivers & logistics"), href: "/jobs?q=driver" },
      { icon: "Cpu", title: ls("IT & engineering"), href: "/jobs?q=engineer" },
      { icon: "ShieldCheck", title: ls("Security"), href: "/jobs?q=security" },
    ],
  },
});

export const employersCtaSection = defineSection({
  key: "employersCta",
  label: "For employers",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.link("cta", "Button"), f.image("image", "Image")],
  defaults: {
    title: ls("Hiring? We find you the right people, fast."),
    text: ls("Pre-screened candidates, medical and document processing, and full visa support for Gulf and local employers."),
    cta: { label: ls("Request staff"), href: "/employers" },
    image: "",
  },
});

export const featuredPackagesSection = defineSection({
  key: "featuredPackages",
  label: "Featured packages",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: "Packages", title: ls("Popular packages", "مقبول پیکجز"), count: 6, cta: { label: ls("View all packages", "تمام پیکجز"), href: "/packages" } },
});

export const destinationsSection = defineSection({
  key: "destinations",
  label: "Destinations",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.repeater("items", "Destinations", [f.localized("name", "Name"), f.image("image", "Image"), f.text("href", "Link"), f.text("note", "Note (e.g. from Rs 45,000)")], { max: 8 })],
  defaults: {
    eyebrow: "Explore",
    title: ls("Top destinations"),
    items: [
      { name: ls("Makkah & Madinah"), image: "", href: "/packages?kind=UMRAH", note: "Umrah from Rs 185,000" },
      { name: ls("Hunza & Skardu"), image: "", href: "/packages?destination=Hunza", note: "5 days from Rs 45,000" },
      { name: ls("Dubai"), image: "", href: "/packages?destination=Dubai", note: "4 nights from Rs 120,000" },
      { name: ls("Turkey"), image: "", href: "/packages?destination=Istanbul", note: "7 nights from Rs 250,000" },
    ],
  },
});

export const umrahSection = defineSection({
  key: "umrah",
  label: "Umrah / Hajj highlight",
  fields: [f.localized("title", "Title"), f.localized("text", "Text", { multiline: true }), f.image("image", "Image"), f.link("cta", "Button"), f.repeater("points", "Highlights", [f.localized("text", "Text")], { max: 5 })],
  defaults: {
    title: ls("Umrah packages with complete peace of mind", "عمرہ پیکجز"),
    text: ls("Hotels near Haram, direct flights, Ziyarat tours and 24/7 support in Saudi Arabia. Group and family departures every week."),
    image: "",
    cta: { label: ls("See Umrah packages"), href: "/packages?kind=UMRAH" },
    points: [{ text: ls("Ministry-approved agency") }, { text: ls("Hotels within walking distance of Haram") }, { text: ls("Visa, flights and transport included") }],
  },
});

export const featuredPropertiesSection = defineSection({
  key: "featuredProperties",
  label: "Featured properties",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.number("count", "How many", { min: 3, max: 12 }), f.link("cta", "Button")],
  defaults: { eyebrow: "Listings", title: ls("Featured properties", "نمایاں پراپرٹیز"), count: 6, cta: { label: ls("View all properties"), href: "/properties" } },
});

export const areasSection = defineSection({
  key: "areas",
  label: "Popular areas",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.repeater("items", "Areas", [f.text("name", "Area"), f.image("image", "Image"), f.text("href", "Link"), f.text("note", "Note")], { max: 8 })],
  defaults: {
    eyebrow: "Areas",
    title: ls("Browse by area"),
    items: [
      { name: "DHA Lahore", image: "", href: "/properties?city=Lahore&q=DHA", note: "Plots, houses, commercial" },
      { name: "Bahria Town", image: "", href: "/properties?q=Bahria", note: "Ready houses & plots" },
      { name: "Gulberg", image: "", href: "/properties?q=Gulberg", note: "Apartments & offices" },
      { name: "Johar Town", image: "", href: "/properties?q=Johar", note: "Family homes" },
    ],
  },
});

export const plansSection = defineSection({
  key: "plans",
  label: "Membership plans heading",
  description: "Plans are managed under Membership plans. This controls the heading.",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: "Pricing", title: ls("Membership plans", "ممبرشپ پلانز"), subtitle: ls("No hidden fees. Cancel anytime.") },
});

export const classesSection = defineSection({
  key: "classes",
  label: "Class timetable heading",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: "Schedule", title: ls("Weekly classes", "ہفتہ وار کلاسز"), subtitle: ls("Separate ladies timings available.") },
});

export const practiceAreasSection = defineSection({
  key: "practiceAreas",
  label: "Practice areas heading",
  description: "Areas are managed under Practice areas. This controls the heading.",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle")],
  defaults: { eyebrow: "Expertise", title: ls("Practice areas", "شعبہ جات"), subtitle: ls("Civil, criminal, family and corporate matters across Pakistan.") },
});

export const servicesSection = defineSection({
  key: "services",
  label: "Services heading",
  description: "Services are managed under Services. This controls the heading.",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.localized("subtitle", "Subtitle"), f.number("count", "How many to show", { min: 3, max: 12 })],
  defaults: { eyebrow: "Services", title: ls("What we offer", "ہماری خدمات"), subtitle: ls(""), count: 6 },
});

export const portfolioSection = defineSection({
  key: "portfolio",
  label: "Portfolio / work samples",
  description: "Images come from Gallery (album: portfolio).",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.text("album", "Album")],
  defaults: { eyebrow: "Our work", title: ls("Recent work"), album: "portfolio" },
});

export const transformationsSection = defineSection({
  key: "transformations",
  label: "Transformations gallery",
  description: "Images come from Gallery (album: transformations).",
  fields: [f.text("eyebrow", "Small label"), f.localized("title", "Title"), f.text("album", "Album")],
  defaults: { eyebrow: "Results", title: ls("Real transformations"), album: "transformations" },
});

/* ---------- packs ---------- */

type Pack = { sections: SectionDefinition[]; nav: NavItem[] };

const nav = (items: [string, string, string?][]): NavItem[] => items.map(([en, href, ur]) => ({ label: ls(en, ur), href }));

const shopNav = nav([["Home", "/", "ہوم"], ["Shop", "/shop", "شاپ"], ["About", "/#about", "ہمارے بارے میں"], ["Contact", "/contact", "رابطہ"]]);

export function ecommercePack(category: CategoryKey): Pack {
  const heroByCat: Record<string, Partial<typeof heroSection.defaults>> = {
    kitchen: { eyebrow: "Kitchen essentials", title: ls("Everything your kitchen needs"), subtitle: ls("Cookware, crockery, appliances and tools from trusted brands. Cash on delivery across Pakistan."), primaryCta: { label: ls("Shop now", "ابھی خریدیں"), href: "/shop" } },
    clothing: { eyebrow: "New season", title: ls("Wear what you love"), subtitle: ls("Lawn, pret and unstitched collections designed in Pakistan. Free exchanges, cash on delivery."), primaryCta: { label: ls("Shop collection"), href: "/shop" } },
    shoes: { eyebrow: "Step in style", title: ls("Shoes made for Pakistani roads"), subtitle: ls("Comfort-first footwear for men, women and kids. Easy size exchange, cash on delivery."), primaryCta: { label: ls("Shop shoes"), href: "/shop" } },
    gifts: { eyebrow: "Make it special", title: ls("Gifts that say it for you"), subtitle: ls("Curated gift boxes, flowers and personalised keepsakes delivered the same day in the city."), primaryCta: { label: ls("Find a gift"), href: "/shop" } },
    blades: { eyebrow: "Hand-forged in Wazirabad", title: ls("Blades with a soul"), subtitle: ls("Damascus and high-carbon knives, swords and collectibles crafted by master smiths. Worldwide shipping available."), primaryCta: { label: ls("Explore the collection"), href: "/shop" } },
    sports: { eyebrow: "Play harder", title: ls("Gear up for every game"), subtitle: ls("Cricket, football, fitness and sportswear from Sialkot's finest makers and global brands."), primaryCta: { label: ls("Shop gear"), href: "/shop" } },
    electronics: { eyebrow: "Official warranty", title: ls("Latest tech, honest prices"), subtitle: ls("Mobiles, laptops and home appliances with official warranty and cash on delivery nationwide."), primaryCta: { label: ls("Shop electronics"), href: "/shop" } },
    medical: { eyebrow: "Licensed pharmacy", title: ls("Medicines delivered to your door"), subtitle: ls("Genuine medicines, baby care and wellness products with pharmacist support. Upload your prescription in seconds."), primaryCta: { label: ls("Shop now"), href: "/shop" }, secondaryCta: { label: ls("Upload prescription"), href: "/upload-prescription" } },
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
    ...(category === "clothing" || category === "shoes" || category === "gifts" ? [withDefaults(gallerySection, { eyebrow: "Lookbook", title: ls("As seen on our customers"), album: "lookbook" })] : []),
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
      ? { eyebrow: "Hot & fresh", title: ls("Pizza the way you love it"), subtitle: ls("Hand-tossed dough, premium cheese and fresh toppings. Order online for delivery or pickup in 30 minutes."), primaryCta: { label: ls("Order now", "ابھی آرڈر کریں"), href: "/menu" }, secondaryCta: { label: ls("View deals"), href: "#deals" }, badges: [{ text: "30-min delivery", icon: "Timer" }, { text: "Cash on delivery", icon: "Banknote" }] }
      : { eyebrow: "Baked fresh daily", title: ls("Cakes, breads and sweet moments"), subtitle: ls("Freshly baked every morning. Order cakes for birthdays and weddings, or pick up your daily bread."), primaryCta: { label: ls("Order online"), href: "/menu" }, secondaryCta: { label: ls("Custom cakes"), href: "/custom-cake" }, badges: [{ text: "Same-day delivery", icon: "Timer" }, { text: "Halal certified", icon: "BadgeCheck" }] };
  const sections: SectionDefinition[] = [
    withDefaults(heroSection, hero),
    ...(category === "pizza" ? [dealsSection] : [customCakeSection]),
    featuredMenuSection,
    withDefaults(processSection, {
      eyebrow: "How to order",
      title: ls("Order in three taps"),
      steps: [
        { title: ls("Pick your items"), text: ls("Browse the menu and customise sizes and toppings."), icon: "UtensilsCrossed" },
        { title: ls("Choose delivery or pickup"), text: ls("Enter your area for delivery fee and time."), icon: "MapPin" },
        { title: ls("Pay on delivery"), text: ls("Cash on delivery. Track your order live."), icon: "Banknote" },
      ],
    }),
    withDefaults(aboutSection, { eyebrow: "Our story", title: ls(category === "pizza" ? "Made with love since day one" : "A family bakery you can trust") }),
    withDefaults(gallerySection, { eyebrow: "Gallery", title: ls("Fresh from the oven") }),
    deliveryAreasSection,
    hoursSection,
    testimonialsSection,
    faqSection,
    withDefaults(ctaSection, { title: ls("Hungry? Order now."), text: ls("Order online or WhatsApp us your order. Delivery in 30-45 minutes."), cta: { label: ls("Order now"), href: "/menu" } }),
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
      withDefaults(heroSection, { eyebrow: "Overseas & local placement", title: ls("Your next job starts here"), subtitle: ls("Verified vacancies in Saudi Arabia, UAE, Qatar and across Pakistan. Free registration, transparent processing."), primaryCta: { label: ls("Browse jobs"), href: "/jobs" }, secondaryCta: { label: ls("Submit your CV"), href: "/jobs" }, badges: [{ text: "Govt. licensed (OEP)", icon: "BadgeCheck" }, { text: "10,000+ placed", icon: "Users" }] }),
      withDefaults(statsSection, { items: [{ value: "10,000+", label: ls("Candidates placed") }, { value: "250+", label: ls("Employer partners") }, { value: "12", label: ls("Countries") }, { value: "15 yrs", label: ls("Experience") }] }),
      featuredJobsSection,
      industriesSection,
      withDefaults(servicesSection, { title: ls("Our services"), subtitle: ls("Recruitment, visa processing, medical, documentation and pre-departure training.") }),
      withDefaults(processSection, { eyebrow: "Process", title: ls("How placement works"), steps: [{ title: ls("Apply"), text: ls("Submit your CV against a vacancy."), icon: "FileUser" }, { title: ls("Interview"), text: ls("Shortlisted candidates meet the employer."), icon: "Handshake" }, { title: ls("Visa & medical"), text: ls("We handle documentation and processing."), icon: "Stamp" }, { title: ls("Fly"), text: ls("Pre-departure briefing and ticketing."), icon: "Plane" }] }),
      employersCtaSection,
      withDefaults(aboutSection, { title: ls("A licensed agency you can trust") }),
      teamSection,
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Ready to work abroad?"), text: ls("WhatsApp us your CV and target country. We reply the same day."), cta: { label: ls("WhatsApp us"), href: "whatsapp" } }),
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
      withDefaults(heroSection, { eyebrow: "Travel made simple", title: ls("Umrah, tours and tickets, all in one place"), subtitle: ls("Trusted by thousands of Pakistani families. Umrah packages, northern-areas tours, visas and flight tickets at honest prices."), primaryCta: { label: ls("Explore packages"), href: "/packages" }, secondaryCta: { label: ls("Get a quote"), href: "/contact" }, badges: [{ text: "IATA accredited", icon: "BadgeCheck" }, { text: "24/7 support", icon: "Headset" }] }),
      featuredPackagesSection,
      destinationsSection,
      umrahSection,
      withDefaults(servicesSection, { title: ls("Travel services"), subtitle: ls("Visa consultancy, air ticketing, hotel booking and travel insurance.") }),
      withDefaults(featuresSection, { eyebrow: "Why us", title: ls("Why travellers choose us"), items: [{ icon: "BadgeCheck", title: ls("Licensed & insured"), text: ls("Registered agency with full documentation.") }, { icon: "Wallet", title: ls("Best price guarantee"), text: ls("Transparent pricing, no hidden charges.") }, { icon: "Headset", title: ls("24/7 assistance"), text: ls("Support before, during and after your trip.") }, { icon: "Users", title: ls("Group departures"), text: ls("Family and group packages every week.") }] }),
      withDefaults(processSection, { title: ls("Book in three steps"), steps: [{ title: ls("Choose a package"), text: ls("Or tell us your dates and budget."), icon: "Map" }, { title: ls("Confirm details"), text: ls("We share the itinerary and final quote."), icon: "ClipboardCheck" }, { title: ls("Travel"), text: ls("Documents, tickets and support delivered."), icon: "Plane" }] }),
      withDefaults(statsSection, { items: [{ value: "25,000+", label: ls("Happy travellers") }, { value: "1,200+", label: ls("Umrah groups") }, { value: "40+", label: ls("Destinations") }, { value: "4.9", label: ls("Google rating") }] }),
      withDefaults(aboutSection, { title: ls("Your journey, our responsibility") }),
      withDefaults(gallerySection, { title: ls("Moments from our tours") }),
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Planning a trip?"), text: ls("Tell us where and when. We will send a custom quote within an hour."), cta: { label: ls("WhatsApp us"), href: "whatsapp" } }),
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
      withDefaults(heroSection, { eyebrow: "Buy · Sell · Rent", title: ls("Find your next home or investment"), subtitle: ls("Verified plots, houses, apartments and commercial properties in DHA, Bahria Town and across the city."), primaryCta: { label: ls("Browse properties"), href: "/properties" }, secondaryCta: { label: ls("List your property"), href: "/contact" }, badges: [{ text: "Verified listings", icon: "BadgeCheck" }, { text: "Registered agency", icon: "Building2" }] }),
      featuredPropertiesSection,
      areasSection,
      withDefaults(servicesSection, { title: ls("Our services"), subtitle: ls("Buying, selling, renting, property management and investment advice.") }),
      withDefaults(featuresSection, { title: ls("Why work with us"), items: [{ icon: "ShieldCheck", title: ls("Verified documents"), text: ls("Every listing checked for clean title.") }, { icon: "Scale", title: ls("Fair valuations"), text: ls("Honest market pricing, no inflated rates.") }, { icon: "Handshake", title: ls("End-to-end support"), text: ls("From site visit to transfer.") }, { icon: "TrendingUp", title: ls("Investment advice"), text: ls("Data-backed guidance on growing areas.") }] }),
      withDefaults(statsSection, { items: [{ value: "1,500+", label: ls("Properties sold") }, { value: "20 yrs", label: ls("In business") }, { value: "300+", label: ls("Active listings") }, { value: "98%", label: ls("Client satisfaction") }] }),
      withDefaults(processSection, { title: ls("How it works"), steps: [{ title: ls("Tell us your need"), text: ls("Budget, area and property type."), icon: "MessageSquare" }, { title: ls("Visit shortlisted options"), text: ls("We arrange viewings at your convenience."), icon: "Car" }, { title: ls("Close with confidence"), text: ls("Documentation and transfer handled by us."), icon: "FileCheck" }] }),
      withDefaults(aboutSection, { title: ls("Trusted property advisors") }),
      withDefaults(teamSection, { eyebrow: "Agents", title: ls("Meet our agents") }),
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Want to sell or rent out?"), text: ls("Get a free valuation and a marketing plan within 24 hours."), cta: { label: ls("Get free valuation"), href: "/contact" } }),
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
      withDefaults(heroSection, { eyebrow: "No excuses", title: ls("Stronger every day"), subtitle: ls("Modern equipment, certified trainers, separate ladies timings and flexible plans. Your first session is free."), primaryCta: { label: ls("Book a free trial"), href: "/join" }, secondaryCta: { label: ls("See plans"), href: "/plans" }, badges: [{ text: "Certified trainers", icon: "BadgeCheck" }, { text: "Ladies timings", icon: "Clock" }] }),
      withDefaults(statsSection, { items: [{ value: "2,000+", label: ls("Members") }, { value: "15", label: ls("Certified trainers") }, { value: "40+", label: ls("Weekly classes") }, { value: "12,000 sq ft", label: ls("Facility") }] }),
      withDefaults(featuresSection, { eyebrow: "Facilities", title: ls("Everything under one roof"), items: [{ icon: "Dumbbell", title: ls("Strength zone"), text: ls("Free weights, racks and machines.") }, { icon: "HeartPulse", title: ls("Cardio floor"), text: ls("Treadmills, bikes, rowers.") }, { icon: "Users", title: ls("Group classes"), text: ls("HIIT, yoga, Zumba, boxing.") }, { icon: "Apple", title: ls("Nutrition plans"), text: ls("Diet guidance with every plan.") }] }),
      plansSection,
      classesSection,
      withDefaults(teamSection, { eyebrow: "Trainers", title: ls("Meet the trainers") }),
      transformationsSection,
      withDefaults(aboutSection, { title: ls("More than a gym, a community") }),
      hoursSection,
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Start your first week free"), text: ls("No commitment. Walk in or book online."), cta: { label: ls("Book free trial"), href: "/join" } }),
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
      withDefaults(heroSection, { eyebrow: "Advocates & legal consultants", title: ls("Clear counsel. Strong representation."), subtitle: ls("Experienced advocates for civil, criminal, family, property and corporate matters in the High Court and district courts."), primaryCta: { label: ls("Book a consultation"), href: "/consultation" }, secondaryCta: { label: ls("Our practice areas"), href: "/services" }, badges: [{ text: "High Court advocates", icon: "Scale" }, { text: "Confidential", icon: "Lock" }] }),
      practiceAreasSection,
      withDefaults(aboutSection, { eyebrow: "The firm", title: ls("Integrity, diligence and results") }),
      withDefaults(statsSection, { items: [{ value: "1,200+", label: ls("Cases handled") }, { value: "25 yrs", label: ls("Combined experience") }, { value: "94%", label: ls("Success rate") }, { value: "6", label: ls("Advocates") }] }),
      withDefaults(teamSection, { eyebrow: "Attorneys", title: ls("Our attorneys") }),
      withDefaults(processSection, { title: ls("How we work"), steps: [{ title: ls("Consultation"), text: ls("We listen and assess your matter."), icon: "MessageSquare" }, { title: ls("Strategy"), text: ls("A clear plan with transparent fees."), icon: "ClipboardList" }, { title: ls("Representation"), text: ls("Diligent advocacy until resolution."), icon: "Gavel" }] }),
      withDefaults(featuresSection, { title: ls("Why clients trust us"), items: [{ icon: "Lock", title: ls("Strict confidentiality"), text: ls("Your matter stays private.") }, { icon: "Receipt", title: ls("Transparent fees"), text: ls("Written fee agreements, no surprises.") }, { icon: "Clock", title: ls("Responsive"), text: ls("Updates at every hearing.") }, { icon: "Languages", title: ls("Urdu & English"), text: ls("Documents explained in your language.") }] }),
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Need legal advice today?"), text: ls("Book a consultation online or call our office."), cta: { label: ls("Book consultation"), href: "/consultation" } }),
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
      withDefaults(heroSection, { eyebrow: "Digital & offset printing", title: ls("Print anything. Beautifully."), subtitle: ls("Business cards, flyers, banners, packaging and wedding cards with fast turnaround and delivery across Pakistan. Upload your design and get a quote in minutes."), primaryCta: { label: ls("Get a quote"), href: "/quote" }, secondaryCta: { label: ls("See services"), href: "/services" }, badges: [{ text: "24-hr turnaround", icon: "Timer" }, { text: "Free design check", icon: "BadgeCheck" }] }),
      withDefaults(servicesSection, { title: ls("Printing services"), subtitle: ls("Transparent prices, premium papers and finishes."), count: 8 }),
      withDefaults(processSection, { eyebrow: "How it works", title: ls("From file to finished print"), steps: [{ title: ls("Upload your design"), text: ls("PDF, AI or PSD. Or let us design it."), icon: "Upload" }, { title: ls("Approve the quote"), text: ls("Price and proof within an hour."), icon: "ClipboardCheck" }, { title: ls("We print & deliver"), text: ls("Pickup in store or courier nationwide."), icon: "Truck" }] }),
      portfolioSection,
      withDefaults(featuresSection, { title: ls("Why print with us"), items: [{ icon: "Sparkles", title: ls("Premium finishes"), text: ls("Matte, gloss, spot UV, foil, emboss.") }, { icon: "Timer", title: ls("Fast turnaround"), text: ls("Most jobs ready in 24-48 hours.") }, { icon: "Wallet", title: ls("Bulk pricing"), text: ls("Better rates on higher quantities.") }, { icon: "PenTool", title: ls("In-house design"), text: ls("Free design check on every order.") }] }),
      withDefaults(statsSection, { items: [{ value: "5,000+", label: ls("Clients") }, { value: "1M+", label: ls("Cards printed") }, { value: "24 hr", label: ls("Turnaround") }, { value: "15 yrs", label: ls("Experience") }] }),
      withDefaults(aboutSection, { title: ls("Your neighbourhood print partner") }),
      brandsSection,
      testimonialsSection,
      faqSection,
      withDefaults(ctaSection, { title: ls("Have a file ready?"), text: ls("Upload it now and get a quote within the hour."), cta: { label: ls("Get a quote"), href: "/quote" } }),
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
