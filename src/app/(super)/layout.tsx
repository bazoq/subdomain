import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Noto_Nastaliq_Urdu, Instrument_Serif } from "next/font/google";
import "@/app/globals.css";
import { brand } from "@/config/brand";
import { SITE_URL } from "@/config/site";
import { CATEGORIES } from "@/lib/categories";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["500", "600", "700", "800"] });
// Display serif for the marketing site's headlines (`font-display`).
const instrument = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument", display: "swap", weight: "400", style: ["normal", "italic"] });
// Loaded once here (self-hosted by next/font) so every `font-urdu` element on the marketing site renders in Nastaliq.
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--font-nastaliq", display: "swap", weight: ["400", "700"], preload: false });

const defaultTitle = `${brand.name} — ${brand.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: defaultTitle, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  keywords: [
    "business website Pakistan",
    "website templates Pakistan",
    "cash on delivery website",
    "WhatsApp website",
    "Urdu website",
    "managed website hosting Pakistan",
    ...CATEGORIES.map((c) => `${c.name.toLowerCase()} website`),
  ],
  authors: [{ name: brand.name, url: SITE_URL }],
  creator: brand.name,
  publisher: brand.name,
  category: "technology",
  formatDetection: { telephone: true, email: true, address: false },
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_PK",
    title: defaultTitle,
    description: brand.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: brand.colors.dark },
  ],
  colorScheme: "light",
};

/** Root layout for the super website and the super admin (root domain only). */
export default function SuperRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${instrument.variable} ${nastaliq.variable}`}
      style={
        {
          "--t-font-heading": "var(--font-jakarta)",
          "--t-font-body": "var(--font-inter)",
          "--t-font-urdu": 'var(--font-nastaliq), "Noto Nastaliq Urdu", serif',
        } as React.CSSProperties
      }
    >
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
