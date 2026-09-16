import type { Metadata } from "next";
import "@/app/globals.css";
import { getCurrentTenant } from "@/server/tenant";
import { getTemplateMeta } from "@/templates/registry";
import { googleFontsHref, themeVars } from "@/templates/theme";
import { currentLang } from "@/server/site";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tc = await getCurrentTenant();
  if (!tc) return { title: "Site not found" };
  const seo = tc.settings.seo;
  return {
    title: { default: seo.title || tc.tenant.name, template: `%s | ${tc.tenant.name}` },
    description: seo.description || `${tc.tenant.name} — ${tc.category.name} in ${tc.settings.contact.city || "Pakistan"}`,
    icons: tc.settings.branding.faviconUrl ? { icon: tc.settings.branding.faviconUrl } : undefined,
    openGraph: seo.ogImageUrl ? { images: [seo.ogImageUrl] } : undefined,
    robots: tc.tenant.isDemo ? { index: false, follow: false } : undefined,
  };
}

/**
 * Root layout for every tenant host. Sets language/direction, theme variables and fonts.
 * Unknown hosts render the tenant not-found page.
 */
export default async function TenantRootLayout({ children }: { children: React.ReactNode }) {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  const meta = getTemplateMeta(tc.tenant.templateId);
  if (!meta) notFound();
  const lang = tc.settings.languages.urduEnabled ? await currentLang() : "en";
  const vars = themeVars(meta.theme, tc.settings.branding);
  const fontsHref = googleFontsHref(meta.theme, tc.settings.languages.urduEnabled);

  return (
    <html lang={lang} dir={lang === "ur" ? "rtl" : "ltr"} style={vars as React.CSSProperties} className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontsHref} />
        <meta name="theme-color" content={vars["--t-primary"]} />
      </head>
      <body className="min-h-screen bg-t-bg text-t-fg antialiased">{children}</body>
    </html>
  );
}
