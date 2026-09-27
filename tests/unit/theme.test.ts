import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, DEFAULT_URDU_FONT, googleFontsHref, isHexColor, safeFontName, safeHex, themePrimary, themeVars } from "@/templates/theme";
import type { TemplateTheme } from "@/templates/types";

/**
 * Theme → CSS custom properties (src/templates/theme.ts). Branding colours and font names come from the
 * tenant database and end up inside a `style` attribute / `<link href>`, so anything that is not a plain
 * hex colour or a plain font family must be dropped — never interpolated.
 */

const theme: TemplateTheme = {
  ...DEFAULT_THEME,
  colors: { ...DEFAULT_THEME.colors, primary: "#B91C1C", bg: "#FFF7ED" },
  fonts: { heading: "Playfair Display", body: "Inter", urdu: "Gulzar" },
  radius: "lg",
};

const HOSTILE = ["red", "#ab", "#abcde", "#ggg", "#fff; background:url(x)", "url(#fff)", "#fff}", "expression(1)", 123, null, undefined, {}, "#12345g"];

describe("safeHex / isHexColor", () => {
  it("accepts #rgb, #rgba, #rrggbb, #rrggbbaa and lowercases", () => {
    expect(safeHex("#abc")).toBe("#abc");
    expect(safeHex("#ABCD")).toBe("#abcd");
    expect(safeHex(" #AABBCC ")).toBe("#aabbcc");
    expect(safeHex("#AaBbCcDd")).toBe("#aabbccdd");
    expect(isHexColor("#fff")).toBe(true);
  });

  it("rejects everything that is not a bare hex colour", () => {
    for (const v of HOSTILE) {
      expect(safeHex(v), String(v)).toBeNull();
      expect(isHexColor(v), String(v)).toBe(false);
    }
  });
});

describe("safeFontName", () => {
  it("accepts Google Fonts family names and collapses whitespace", () => {
    expect(safeFontName("Inter")).toBe("Inter");
    expect(safeFontName("  Noto   Nastaliq  Urdu ")).toBe("Noto Nastaliq Urdu");
    expect(safeFontName("Plus Jakarta Sans")).toBe("Plus Jakarta Sans");
    expect(safeFontName("M PLUS 1p")).toBe("M PLUS 1p");
  });

  it("rejects CSS/URL metacharacters, over-long and non-string values", () => {
    for (const v of ["", " ", 'Inter"', "Inter;}", "Inter, serif", "url(x)", "Inter\\", "Inter<b>", "'Inter'", "x".repeat(70), 12, null, undefined, ["Inter"]]) {
      expect(safeFontName(v), String(v)).toBeNull();
    }
  });
});

describe("themeVars", () => {
  it("falls back to the neutral default theme when none is given", () => {
    const vars = themeVars(null);
    expect(vars["--t-primary"]).toBe(DEFAULT_THEME.colors.primary);
    expect(vars["--t-radius"]).toBe("0.5rem");
    expect(vars["--t-font-heading"]).toMatch(/^"Inter", ui-sans-serif/);
    expect(vars["--t-font-urdu"].startsWith(`"${DEFAULT_URDU_FONT}"`)).toBe(true);
  });

  it("maps template colours (lowercased) and radius", () => {
    const vars = themeVars(theme);
    expect(vars["--t-primary"]).toBe("#b91c1c");
    expect(vars["--t-bg"]).toBe("#fff7ed");
    expect(vars["--t-radius"]).toBe("0.875rem");
    expect(vars["--t-font-heading"]).toBe("\"Playfair Display\", ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif");
  });

  it("lets valid branding colours override the template, ignores invalid ones", () => {
    const vars = themeVars(theme, { primaryColor: "#123456", secondaryColor: "red; x", accentColor: "url(#fff)" });
    expect(vars["--t-primary"]).toBe("#123456");
    expect(vars["--t-secondary"]).toBe(theme.colors.secondary.toLowerCase());
    expect(vars["--t-accent"]).toBe(theme.colors.accent.toLowerCase());
  });

  it("replaces invalid template colours with the default so no variable is ever broken", () => {
    const broken: TemplateTheme = { ...theme, colors: { ...theme.colors, bg: "url(javascript:1)", fg: "" }, dark: "not-a-colour" };
    const vars = themeVars(broken);
    expect(vars["--t-bg"]).toBe(DEFAULT_THEME.colors.bg);
    expect(vars["--t-fg"]).toBe(DEFAULT_THEME.colors.fg);
    expect(vars["--t-dark"]).toBe(DEFAULT_THEME.dark);
  });

  it("drops invalid font names to the generic stack and unknown radii to md", () => {
    const bad = { ...theme, fonts: { heading: 'Evil"; }', body: "x".repeat(80), urdu: "url(x)" }, radius: "huge" as TemplateTheme["radius"] };
    const vars = themeVars(bad);
    expect(vars["--t-font-heading"]).toMatch(/^ui-sans-serif/);
    expect(vars["--t-font-body"]).toMatch(/^ui-sans-serif/);
    expect(vars["--t-font-urdu"].startsWith(`"${DEFAULT_URDU_FONT}"`)).toBe(true);
    expect(vars["--t-radius"]).toBe("0.5rem");
  });

  it("orders the Urdu stack: custom template family, self-hosted variable, Nastaliq fallback", () => {
    const custom = themeVars(theme, undefined, { urduFontVar: "--font-nastaliq" })["--t-font-urdu"];
    expect(custom.startsWith('"Gulzar", var(--font-nastaliq), "Noto Nastaliq Urdu"')).toBe(true);
    const dflt = themeVars({ ...theme, fonts: { heading: "Inter", body: "Inter", urdu: DEFAULT_URDU_FONT } }, undefined, { urduFontVar: "--font-nastaliq" })["--t-font-urdu"];
    expect(dflt.startsWith('var(--font-nastaliq), "Noto Nastaliq Urdu"')).toBe(true);
    expect(dflt.match(/Noto Nastaliq Urdu/g)).toHaveLength(1);
  });

  it("never emits CSS metacharacters from hostile inputs", () => {
    const hostile: TemplateTheme = {
      ...theme,
      colors: Object.fromEntries(Object.keys(theme.colors).map((k) => [k, "#fff; background: url(//evil)"])) as TemplateTheme["colors"],
      fonts: { heading: "A; }", body: "url(x)", urdu: "</style>" },
    };
    const vars = themeVars(hostile, { primaryColor: "#000}", secondaryColor: "url(x)", accentColor: "#123; x" });
    for (const [k, v] of Object.entries(vars)) expect(v, k).not.toMatch(/[;{}<>]|url\(/);
  });
});

describe("themePrimary", () => {
  it("prefers valid branding, then the template, then the default", () => {
    expect(themePrimary(theme, { primaryColor: "#00FF00" })).toBe("#00ff00");
    expect(themePrimary(theme, { primaryColor: "green" })).toBe("#b91c1c");
    expect(themePrimary(null)).toBe(DEFAULT_THEME.colors.primary);
    expect(themePrimary({ ...theme, colors: { ...theme.colors, primary: "nope" } })).toBe(DEFAULT_THEME.colors.primary);
  });
});

describe("googleFontsHref", () => {
  it("builds a css2 URL with encoded family names and default weights", () => {
    expect(googleFontsHref(theme)).toBe("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
  });

  it("lists a shared heading/body family once and appends Urdu only on request", () => {
    const one = googleFontsHref({ ...theme, fonts: { heading: "Inter", body: "Inter" } });
    expect(one?.match(/family=/g)).toHaveLength(1);
    expect(googleFontsHref(theme, true)).toContain("family=Gulzar:wght@400;700");
    expect(googleFontsHref({ ...theme, fonts: { heading: "Inter", body: "Inter" } }, true)).toContain("family=Noto+Nastaliq+Urdu:wght@400;700");
  });

  it("filters, dedupes and sorts weights", () => {
    expect(googleFontsHref({ ...theme, fonts: { heading: "Inter", body: "Inter", headingWeights: [700, 400, 400, 950, 50, 4.5] } })).toContain("family=Inter:wght@400;700");
    expect(googleFontsHref({ ...theme, fonts: { heading: "Inter", body: "Inter", headingWeights: [0] } })).toContain("family=Inter:wght@400;700");
  });

  it("returns null when no valid family is configured", () => {
    expect(googleFontsHref({ ...theme, fonts: { heading: "x;}", body: "" } })).toBeNull();
  });
});
