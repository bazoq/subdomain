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

/** Social profile URLs that are actually configured (placeholder roots are skipped). */
export function configuredSocialLinks(): string[] {
  return Object.values(brand.social).filter((u) => /^https:\/\/[^/]+\/.+/.test(u));
}
