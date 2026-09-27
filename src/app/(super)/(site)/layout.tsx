import { SuperHeader } from "@/components/super-site/header";
import { SuperFooter } from "@/components/super-site/footer";
import { JsonLd, organizationJsonLd, webSiteJsonLd } from "@/components/super-site/seo";

export default function SuperSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main"
        className="sr-only z-[100] rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
