import { SuperHeader } from "@/components/super-site/header";
import { SuperFooter } from "@/components/super-site/footer";
import { JsonLd, organizationJsonLd, webSiteJsonLd } from "@/components/super-site/seo";

export default function SuperSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col overflow-x-clip bg-ink-950 text-zinc-200 [color-scheme:dark] selection:bg-gold-400/30 selection:text-white"
      // Markdown / shared prose styles read the template tokens; give them the dark-premium values here.
      style={{ "--t-primary": "#e2bb72", "--t-fg": "#f4f4f5", "--t-bg": "#060608", "--t-muted": "#15151d", "--t-muted-fg": "#a1a1aa", "--t-border": "rgba(255,255,255,0.1)", "--t-card": "#101016" } as React.CSSProperties}
    >
      <a
        href="#main"
        className="sr-only z-[100] rounded-md bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-gold-400"
      >
        Skip to content
      </a>
      <SuperHeader />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <SuperFooter />
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
    </div>
  );
}
