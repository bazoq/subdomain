import type { Metadata, Viewport } from "next";
import { Noto_Nastaliq_Urdu } from "next/font/google";
import "@/app/globals.css";
import { getCurrentTenant, type TenantContext } from "@/server/tenant";
import { currentLang } from "@/server/site";
import { tenantMetadata, tenantViewport } from "@/server/site-seo";
import { getTemplateMeta } from "@/templates/registry";
import { DEFAULT_THEME, DEFAULT_URDU_FONT, googleFontsHref, safeFontName, themeVars } from "@/templates/theme";
import { dirFor, htmlLang, type Lang } from "@/lib/i18n";
import { UnknownHostDocument } from "@/components/site/unknown-host";

export const dynamic = "force-dynamic";

/**
 * Urdu is self-hosted through next/font (no Google Fonts request, no layout shift). `preload: false`
 * because most tenants are English-only; the browser fetches the file only when Urdu text renders.
 * The variable is placed first in `--t-font-urdu` by `themeVars()`.
 */
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-nastaliq", display: "swap", preload: false });
const URDU_FONT_VAR = "--font-nastaliq";

/** Same rule as `getSiteContext()`: the visitor's cookie only counts when the tenant has enabled Urdu. */
async function siteLang(tc: TenantContext): Promise<Lang> {
  return tc.settings.languages.urduEnabled ? currentLang() : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const tc = await getCurrentTenant();
  if (!tc) return { title: "Site not found", robots: { index: false, follow: false } };
  return tenantMetadata(tc, await siteLang(tc));
}

export async function generateViewport(): Promise<Viewport> {
  const tc = await getCurrentTenant();
  return tc ? tenantViewport(tc) : { width: "device-width", initialScale: 1, colorScheme: "dark" };
}

/**
 * Root layout for every tenant host (public site + tenant admin). Sets language/direction, validated
 * theme variables and fonts. Unknown hosts get a self-contained "not set up" document (never `notFound()`
 * from a root layout: the not-found file would render inside a half-built document).
 */
export default async function TenantRootLayout({ children }: { children: React.ReactNode }) {
  const tc = await getCurrentTenant();
  if (!tc) return <UnknownHostDocument />;

  const lang = await siteLang(tc);
  const theme = getTemplateMeta(tc.tenant.templateId)?.theme ?? DEFAULT_THEME;
  const vars = themeVars(theme, tc.settings.branding, { urduFontVar: URDU_FONT_VAR });
  // Only a template-specific (non-default) Urdu family still comes from Google Fonts.
  const customUrdu = safeFontName(theme.fonts.urdu);
  const fontsHref = googleFontsHref(theme, Boolean(tc.settings.languages.urduEnabled && customUrdu && customUrdu !== DEFAULT_URDU_FONT));

  return (
    <html lang={htmlLang(lang)} dir={dirFor(lang)} className={nastaliq.variable} style={vars as React.CSSProperties}>
      <head>
        {fontsHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={fontsHref} />
          </>
        ) : null}
      </head>
      <body className="min-h-screen bg-t-bg text-t-fg antialiased">{children}</body>
    </html>
  );
}
