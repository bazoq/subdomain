import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** PNG favicon / PWA icon generated from the brand mark (the .ico in app/ remains the legacy fallback). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 112,
          background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.accent})`,
          color: "#ffffff",
          fontSize: 300,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    size,
  );
}
