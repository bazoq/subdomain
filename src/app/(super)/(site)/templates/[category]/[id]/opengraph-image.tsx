import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";
import { getCategory } from "@/lib/categories";
import { getTemplateMeta } from "@/templates/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card for a template detail page: the template's own palette, name, numeric code and
 * category, so a shared link looks like the template rather than a generic brand card.
 */
export default async function Image({ params }: { params: Promise<{ category: string; id: string }> }) {
  const { id } = await params;
  const t = getTemplateMeta(id);
  const cat = t ? getCategory(t.category) : undefined;
  const c = t?.theme.colors ?? { primary: brand.colors.primary, secondary: brand.colors.dark, accent: brand.colors.accent, bg: "#ffffff", fg: brand.colors.dark, muted: "#f1f5f9", mutedFg: "#64748b", card: "#ffffff", border: "#e2e8f0" };
  const dark = t?.theme.dark ?? c.secondary;
  const isDark = t ? t.style.some((s) => ["dark", "neon", "night"].includes(s)) : false;
  const bg = isDark ? dark : c.bg;
  const fg = isDark ? "#ffffff" : c.fg;
  const sub = isDark ? "rgba(255,255,255,0.72)" : c.mutedFg;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg, color: fg, fontFamily: "sans-serif" }}>
        {/* left: copy */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 720, padding: 64 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ padding: "8px 16px", borderRadius: 10, background: c.primary, color: "#ffffff", fontSize: 26, fontWeight: 800 }}>{t ? `#${t.code}` : brand.name}</div>
            <div style={{ marginLeft: 16, fontSize: 24, color: sub, textTransform: "uppercase", letterSpacing: 3 }}>{cat?.name ?? "Website template"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{t?.name ?? brand.name}</div>
            <div style={{ marginTop: 18, fontSize: 30, lineHeight: 1.3, color: sub }}>{t?.tagline ?? brand.tagline}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: sub }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.accent})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>S</div>
            <div style={{ marginLeft: 12 }}>{`${brand.name} · live demo included · English + Urdu`}</div>
          </div>
        </div>
        {/* right: miniature */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 480, padding: "48px 48px 48px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", height: 420, borderRadius: 24, overflow: "hidden", background: c.card, border: `2px solid ${c.border}`, boxShadow: "0 30px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: isDark ? dark : c.card, borderBottom: `1px solid ${c.border}` }}>
              <div style={{ width: 90, height: 12, borderRadius: 6, background: isDark ? c.primary : c.fg }} />
              <div style={{ width: 70, height: 20, borderRadius: 999, background: c.primary }} />
            </div>
            <div style={{ display: "flex", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", width: 240 }}>
                <div style={{ width: 60, height: 8, borderRadius: 4, background: c.accent }} />
                <div style={{ marginTop: 12, width: 220, height: 18, borderRadius: 6, background: c.fg, opacity: isDark ? 0.9 : 1 }} />
                <div style={{ marginTop: 8, width: 180, height: 18, borderRadius: 6, background: c.fg, opacity: isDark ? 0.9 : 1 }} />
                <div style={{ marginTop: 16, width: 200, height: 8, borderRadius: 4, background: c.mutedFg, opacity: 0.4 }} />
                <div style={{ marginTop: 8, width: 150, height: 8, borderRadius: 4, background: c.mutedFg, opacity: 0.4 }} />
                <div style={{ display: "flex", marginTop: 20 }}>
                  <div style={{ width: 90, height: 30, borderRadius: t?.theme.radius === "full" ? 999 : 8, background: c.primary }} />
                  <div style={{ marginLeft: 10, width: 90, height: 30, borderRadius: t?.theme.radius === "full" ? 999 : 8, border: `2px solid ${c.fg}`, opacity: 0.6 }} />
                </div>
              </div>
              <div style={{ marginLeft: 20, width: 160, height: 150, borderRadius: 16, background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`, opacity: 0.85 }} />
            </div>
            <div style={{ display: "flex", padding: "0 20px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", width: 96, marginRight: i < 3 ? 12 : 0, borderRadius: 10, overflow: "hidden", border: `1px solid ${c.border}`, background: c.card }}>
                  <div style={{ height: 56, background: c.muted }} />
                  <div style={{ padding: 8, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: 6, borderRadius: 3, background: c.mutedFg, opacity: 0.5 }} />
                    <div style={{ marginTop: 6, width: 40, height: 6, borderRadius: 3, background: c.primary }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
