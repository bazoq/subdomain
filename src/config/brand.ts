/**
 * Brand / platform identity. Placeholder values — change here only.
 * Everything here is public (rendered into HTML, JSON-LD and the web manifest).
 */
export const brand = {
  name: "SiteForge",
  legalName: "SiteForge",
  tagline: "Ready-made, fully managed websites for Pakistani businesses",
  taglineUr: "پاکستانی کاروباروں کے لیے تیار، مکمل منظم ویب سائٹس",
  /** Long-form description for meta descriptions, Organization JSON-LD and the manifest. */
  description:
    "SiteForge builds and manages complete business websites for Pakistan: 84 industry-specific templates, cash on delivery, WhatsApp, English + Urdu, and a simple admin panel — connected to your own domain in a day.",
  supportEmail: "support@siteforge.pk",
  supportPhone: "+92 300 0000000",
  whatsapp: "923000000000",
  address: "Lahore, Pakistan",
  addressLocality: "Lahore",
  addressRegion: "Punjab",
  addressCountry: "PK",
  /** Brand colours used by the web manifest, theme-color and generated OG images. */
  colors: {
    primary: "#4f46e5",
    accent: "#7c3aed",
    dark: "#0f172a",
  },
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  },
} as const;

/**
 * Public price list (PKR, whole rupees). Single source for the pricing page, Product JSON-LD offers and
 * the SoftwareApplication offer. `monthly: null` means "custom quote".
 */
export interface PricingPlan {
  key: "starter" | "business" | "chain";
  name: string;
  tagline: string;
  monthly: number | null;
  setup: number | null;
  featured?: boolean;
  features: string[];
}

export const pricing: { currency: "PKR"; plans: PricingPlan[] } = {
  currency: "PKR",
  plans: [
    {
      key: "starter",
      name: "Starter",
      tagline: "For a single-location business getting online.",
      monthly: 4999,
      setup: 15000,
      features: ["Any template from your category", "Free subdomain on our platform", "Admin panel with 2 users", "Orders, bookings & leads", "English + Urdu", "1 GB media storage", "WhatsApp support"],
    },
    {
      key: "business",
      name: "Business",
      tagline: "Your own domain and room to grow.",
      monthly: 8999,
      setup: 25000,
      featured: true,
      features: ["Everything in Starter", "Custom domain (yourshop.pk) connected", "5 admin users", "Email notifications", "5 GB media storage", "Template switch once a year", "Priority support"],
    },
    {
      key: "chain",
      name: "Chain",
      tagline: "Several websites managed from one place.",
      monthly: null,
      setup: null,
      features: ["Multiple domains & templates", "Unlimited users", "Custom sections & integrations", "Dedicated onboarding", "Data export on request"],
    },
  ],
};

/** The cheapest plan with a price — what "from Rs X / month" and schema.org offers refer to. */
export function entryPlan(): { monthlyPrice: number; setupPrice: number } {
  const p = pricing.plans.find((x) => x.monthly != null) ?? pricing.plans[0];
  return { monthlyPrice: p.monthly ?? 0, setupPrice: p.setup ?? 0 };
}

/** Social profile URLs that are actually configured (placeholder roots are skipped). */
export function configuredSocialLinks(): string[] {
  return Object.values(brand.social).filter((u) => /^https:\/\/[^/]+\/.+/.test(u));
}
