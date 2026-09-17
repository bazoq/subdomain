import { templateCode, type CategoryKey } from "@/lib/categories";
import type { TenantSettings } from "@/lib/tenant-settings";
import type { SectionDefinition, TemplateMeta, TemplateTheme } from "@/templates/types";
import { packFor } from "@/templates/shared/packs";
import { withDefaults } from "@/templates/shared/sections";
import { ecommerceBlueprints } from "@/templates/catalog/ecommerce";
import { restaurantBlueprints } from "@/templates/catalog/restaurant";
import { recruitingBlueprints } from "@/templates/catalog/recruiting";
import { travelBlueprints } from "@/templates/catalog/travel";
import { serviceBlueprints } from "@/templates/catalog/services";

/**
 * A blueprint is the design brief + static meta for one template. Every template's
 * `meta.ts` is a one-liner: `export const meta = buildMeta("pizza-01")`.
 * The visual implementation lives in `index.tsx` next to it.
 */
export interface Blueprint {
  id: string;
  category: CategoryKey;
  name: string;
  tagline: string;
  description: string;
  /** style adjectives shown on the super site */
  style: string[];
  theme: TemplateTheme;
  /** design brief for the implementer */
  brief: {
    header: string;
    hero: string;
    signature: string;
    layout: string;
    motion?: string;
  };
  /** ordered section keys for the home page (subset of the category pack, may add none) */
  order?: string[];
  /** per-section default overrides { sectionKey: partialDefaults } */
  overrides?: Record<string, Record<string, unknown>>;
  features?: string[];
  demo: { name: string; city: string };
  defaultSettings?: Partial<TenantSettings>;
}

export const BLUEPRINTS: Blueprint[] = [
  ...ecommerceBlueprints,
  ...restaurantBlueprints,
  ...recruitingBlueprints,
  ...travelBlueprints,
  ...serviceBlueprints,
];

const byId = new Map(BLUEPRINTS.map((b) => [b.id, b]));

export function getBlueprint(id: string): Blueprint {
  const b = byId.get(id);
  if (!b) throw new Error(`No blueprint for template ${id}`);
  return b;
}

/** Category-level feature bullets (shared by all templates in the category). */
const CATEGORY_FEATURES: Record<CategoryKey, string[]> = {
  kitchen: ["Full online store with categories, variants and stock", "Cash on delivery checkout with city-based shipping", "Order tracking by order number", "Coupons and promo strips", "WhatsApp order button"],
  clothing: ["Size & colour variants with per-variant stock", "Lookbook gallery and collection banners", "Cash on delivery with free-shipping threshold", "Sale badges and compare-at pricing", "Order tracking"],
  shoes: ["Size variants (EU/UK) with stock per size", "Size guide and easy-exchange messaging", "Collections showcase", "COD checkout with shipping zones", "Order tracking"],
  gifts: ["Occasion-based collections", "Gift message at checkout", "Same-day delivery messaging", "COD checkout", "Coupons"],
  blades: ["Craftsmanship story section", "Age confirmation at checkout", "Custom order / enquiry form", "Specs table per product", "Export-ready catalogue"],
  sports: ["Brand strip and category showcase", "Variants (sizes) and stock", "COD checkout with shipping zones", "Coupons and deals", "Order tracking"],
  electronics: ["Specifications table per product", "Warranty & brand badges", "Compare-at pricing", "COD checkout", "Order tracking"],
  medical: ["Prescription upload and pharmacist verification", "Prescription-required products", "Generic name & manufacturer fields", "COD home delivery", "Order tracking"],
  pizza: ["Online ordering with sizes and toppings", "Delivery zones with fees and minimums", "Live kitchen order board with sound alerts", "Order tracking with status steps", "Deals & combos section", "Opening hours and open-now badge"],
  bakery: ["Online ordering with sizes/weights", "Custom cake request form with reference photo", "Pickup and delivery", "Live order board", "Order tracking", "Opening hours"],
  recruiting: ["Job board with filters", "Online application with CV upload", "Candidate pipeline (shortlist to hired)", "Employer staff-request form", "Industries and process sections"],
  travel: ["Package catalogue by type (Umrah, tours, visa)", "Itinerary, inclusions and departures", "Booking requests", "Destinations showcase", "Visa & ticketing services"],
  realestate: ["Property listings for sale and rent", "Filters by area, type, price, bedrooms", "Marla/Kanal/Sqft units", "Agent profiles", "Inquiry forms per property"],
  gym: ["Membership plans", "Weekly class timetable", "Trainer profiles", "Free trial / join form", "Transformations gallery", "BMI calculator"],
  law: ["Practice areas", "Attorney profiles with specialties", "Consultation booking", "Case results stats", "Confidential contact"],
  printing: ["Quote request with file upload", "Services with starting prices", "Price estimator", "Portfolio gallery", "Process section"],
};

export function buildMeta(id: string): TemplateMeta {
  const b = getBlueprint(id);
  const pack = packFor(b.category);
  let sections: SectionDefinition[] = pack.sections;
  if (b.order) {
    const map = new Map(sections.map((s) => [s.key, s]));
    const ordered = b.order.map((k) => map.get(k)).filter((s): s is SectionDefinition => Boolean(s));
    const rest = sections.filter((s) => !b.order!.includes(s.key));
    sections = [...ordered, ...rest];
  }
  if (b.overrides) {
    sections = sections.map((s) => (b.overrides![s.key] ? withDefaults(s, b.overrides![s.key] as Partial<typeof s.defaults>) : s));
  }
  return {
    id: b.id,
    code: templateCode(b.id),
    category: b.category,
    name: b.name,
    tagline: b.tagline,
    description: b.description,
    features: [...(b.features ?? []), ...CATEGORY_FEATURES[b.category]],
    style: b.style,
    theme: b.theme,
    sections,
    nav: pack.nav,
    defaultSettings: b.defaultSettings,
    demo: b.demo,
  };
}

/* ---------- theme helpers used by catalog files ---------- */
export function theme(
  t: Partial<TemplateTheme["colors"]> & { heading: string; body: string; radius?: TemplateTheme["radius"]; dark?: string; darkFg?: string; urdu?: string },
): TemplateTheme {
  const c = {
    primary: "#4f46e5",
    primaryFg: "#ffffff",
    secondary: "#0f172a",
    secondaryFg: "#ffffff",
    accent: "#f59e0b",
    accentFg: "#111827",
    bg: "#ffffff",
    fg: "#0f172a",
    muted: "#f1f5f9",
    mutedFg: "#64748b",
    card: "#ffffff",
    border: "#e2e8f0",
    ...t,
  };
  return {
    colors: {
      primary: c.primary,
      primaryFg: c.primaryFg,
      secondary: c.secondary,
      secondaryFg: c.secondaryFg,
      accent: c.accent,
      accentFg: c.accentFg,
      bg: c.bg,
      fg: c.fg,
      muted: c.muted,
      mutedFg: c.mutedFg,
      card: c.card,
      border: c.border,
    },
    fonts: { heading: t.heading, body: t.body, urdu: t.urdu },
    radius: t.radius ?? "md",
    dark: t.dark,
    darkFg: t.darkFg,
  };
}
