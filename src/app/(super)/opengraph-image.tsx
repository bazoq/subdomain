import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";

export const alt = `${brand.name} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card for every marketing page that does not provide its own image. */
export default function Image() {
  const chips = ["Cash on delivery", "WhatsApp built in", "English + Urdu", "Your own domain"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: `linear-gradient(135deg, ${brand.colors.dark} 0%, #15120c 60%, #2a2112 100%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.accent})`,
            opacity: 0.35,
          }}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
              color: brand.colors.dark,
            }}
          >
            {brand.name.charAt(0)}
          </div>
          <div style={{ marginLeft: 20, fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{brand.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>A complete website for your business, ready in a day</div>
          <div style={{ marginTop: 22, fontSize: 28, color: "#eed39c", maxWidth: 900 }}>
            {`${TOTAL_TEMPLATES} ready templates across ${CATEGORIES.length} business types, managed for you.`}
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                marginRight: 12,
                padding: "10px 18px",
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 22,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
