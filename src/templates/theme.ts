import type { TemplateTheme } from "@/templates/types";
import type { TenantSettings } from "@/lib/tenant-settings";

/**
 * Theme → CSS custom properties. Everything that ends up inside a `style` attribute or a
 * `<link href>` is validated here, because branding colours come from the tenant database and
 * a stray `;` or `url(` would otherwise become CSS injection.
 */

const RADIUS: Record<TemplateTheme["radius"], string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.875rem",
  xl: "1.25rem",
  full: "9999px",
};

/** #rgb, #rgba, #rrggbb or #rrggbbaa */
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** Google Fonts family names: letters, digits, spaces (e.g. "Noto Nastaliq Urdu", "Plus Jakarta Sans") */
const FONT_RE = /^[A-Za-z0-9][A-Za-z0-9 +-]{0,60}$/;

export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v.trim());
}

/** Returns a normalised (lowercase) hex colour or null. */
export function safeHex(v: unknown): string | null {
  return isHexColor(v) ? v.trim().toLowerCase() : null;
}

/** Font family name safe to embed in CSS / a Google Fonts URL, or null. */
export function safeFontName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return FONT_RE.test(s) ? s : null;
}

export const DEFAULT_URDU_FONT = "Noto Nastaliq Urdu";

/** Neutral theme used when no template is resolved (unknown host, misconfigured tenant). */
export const DEFAULT_THEME: TemplateTheme = {
  colors: {
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
  },
  fonts: { heading: "Inter", body: "Inter" },
  radius: "md",
  dark: "#0f172a",
  darkFg: "#f8fafc",
};

function fontStack(name: string | null, generic: string) {
  return name ? `"${name}", ${generic}` : generic;
}

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const URDU_FALLBACK = `"${DEFAULT_URDU_FONT}", "Noto Naskh Arabic", "Jameel Noori Nastaleeq", serif`;

/**
 * CSS custom properties for a template theme with tenant branding overrides applied.
 * Invalid branding colours are ignored (template colour wins); invalid template colours fall back
 * to the neutral default so the page never renders with a broken variable.
 *
 * `urduFontVar` is the CSS variable name of a self-hosted Urdu font (next/font) — when given, it is
 * placed first in `--t-font-urdu` so no Google Fonts request is needed for Urdu.
 */
export function themeVars(
  theme: TemplateTheme | null | undefined,
  branding?: TenantSettings["branding"],
  opts: { urduFontVar?: string } = {},
): Record<string, string> {
  const base = theme ?? DEFAULT_THEME;
  const pick = (v: string | undefined, fallback: string) => safeHex(v) ?? fallback;
  const d = DEFAULT_THEME.colors;
  const c = {
    primary: pick(safeHex(branding?.primaryColor) ?? base.colors.primary, d.primary),
    primaryFg: pick(base.colors.primaryFg, d.primaryFg),
    secondary: pick(safeHex(branding?.secondaryColor) ?? base.colors.secondary, d.secondary),
    secondaryFg: pick(base.colors.secondaryFg, d.secondaryFg),
    accent: pick(safeHex(branding?.accentColor) ?? base.colors.accent, d.accent),
    accentFg: pick(base.colors.accentFg, d.accentFg),
    bg: pick(base.colors.bg, d.bg),
    fg: pick(base.colors.fg, d.fg),
    muted: pick(base.colors.muted, d.muted),
    mutedFg: pick(base.colors.mutedFg, d.mutedFg),
    card: pick(base.colors.card, d.card),
    border: pick(base.colors.border, d.border),
    dark: pick(base.dark, DEFAULT_THEME.dark!),
    darkFg: pick(base.darkFg, DEFAULT_THEME.darkFg!),
  };
  const heading = safeFontName(base.fonts.heading);
  const body = safeFontName(base.fonts.body);
  const urdu = safeFontName(base.fonts.urdu);
  const urduStack = urdu && urdu !== DEFAULT_URDU_FONT ? `"${urdu}", ${URDU_FALLBACK}` : URDU_FALLBACK;
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
    "--t-dark": c.dark,
    "--t-dark-fg": c.darkFg,
    "--t-radius": RADIUS[base.radius] ?? RADIUS.md,
    "--t-font-heading": fontStack(heading, SANS),
    "--t-font-body": fontStack(body, SANS),
    "--t-font-urdu": opts.urduFontVar ? `var(${opts.urduFontVar}), ${urduStack}` : urduStack,
  };
}

/** Effective primary colour (for theme-color meta / manifest). */
export function themePrimary(theme: TemplateTheme | null | undefined, branding?: TenantSettings["branding"]): string {
  return safeHex(branding?.primaryColor) ?? safeHex(theme?.colors.primary) ?? DEFAULT_THEME.colors.primary;
}

/**
 * Google Fonts stylesheet URL for the template's heading/body families. The Urdu family is only
 * appended when `includeUrdu` is true (the tenant layout self-hosts Urdu via next/font instead).
 * Returns null when no valid family is configured.
 */
export function googleFontsHref(theme: TemplateTheme, includeUrdu = false): string | null {
  const fam = (name: string, weights: number[]) => {
    const w = [...new Set(weights.filter((n) => Number.isInteger(n) && n >= 100 && n <= 900))].sort((a, b) => a - b);
    return `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@${(w.length ? w : [400, 700]).join(";")}`;
  };
  const heading = safeFontName(theme.fonts.heading);
  const body = safeFontName(theme.fonts.body);
  const parts: string[] = [];
  if (heading) parts.push(fam(heading, theme.fonts.headingWeights ?? [400, 600, 700, 800]));
  if (body && body !== heading) parts.push(fam(body, theme.fonts.bodyWeights ?? [400, 500, 600, 700]));
  if (includeUrdu) {
    const urdu = safeFontName(theme.fonts.urdu) ?? DEFAULT_URDU_FONT;
    parts.push(fam(urdu, [400, 700]));
  }
  if (!parts.length) return null;
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

export function styleFromVars(vars: Record<string, string>) {
  return vars as React.CSSProperties;
}
