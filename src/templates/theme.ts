import type { TemplateTheme } from "@/templates/types";
import type { TenantSettings } from "@/lib/tenant-settings";

const RADIUS: Record<TemplateTheme["radius"], string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.875rem",
  xl: "1.25rem",
  full: "9999px",
};

/** CSS custom properties for a template theme, with tenant branding overrides applied. */
export function themeVars(theme: TemplateTheme, branding?: TenantSettings["branding"]): Record<string, string> {
  const c = { ...theme.colors };
  if (branding?.primaryColor) c.primary = branding.primaryColor;
  if (branding?.secondaryColor) c.secondary = branding.secondaryColor;
  if (branding?.accentColor) c.accent = branding.accentColor;
  return {
    "--t-primary": c.primary,
    "--t-primary-fg": c.primaryFg,
    "--t-secondary": c.secondary,
    "--t-secondary-fg": c.secondaryFg,
    "--t-accent": c.accent,
    "--t-accent-fg": c.accentFg,
    "--t-bg": c.bg,
    "--t-fg": c.fg,
    "--t-muted": c.muted,
    "--t-muted-fg": c.mutedFg,
    "--t-card": c.card,
    "--t-border": c.border,
    "--t-dark": theme.dark ?? "#0f172a",
    "--t-dark-fg": theme.darkFg ?? "#f8fafc",
    "--t-radius": RADIUS[theme.radius],
    "--t-font-heading": `"${theme.fonts.heading}", ui-sans-serif, system-ui, sans-serif`,
    "--t-font-body": `"${theme.fonts.body}", ui-sans-serif, system-ui, sans-serif`,
    "--t-font-urdu": `"${theme.fonts.urdu ?? "Noto Nastaliq Urdu"}", "Noto Naskh Arabic", serif`,
  };
}

/** Google Fonts stylesheet URL for the template's families (plus Urdu). */
export function googleFontsHref(theme: TemplateTheme, includeUrdu: boolean) {
  const fam = (name: string, weights: number[]) =>
    `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@${weights.join(";")}`;
  const parts = [
    fam(theme.fonts.heading, theme.fonts.headingWeights ?? [400, 600, 700, 800]),
  ];
  if (theme.fonts.body !== theme.fonts.heading) parts.push(fam(theme.fonts.body, theme.fonts.bodyWeights ?? [400, 500, 600, 700]));
  if (includeUrdu) parts.push(fam(theme.fonts.urdu ?? "Noto Nastaliq Urdu", [400, 700]));
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

export function styleFromVars(vars: Record<string, string>) {
  return vars as React.CSSProperties;
}
