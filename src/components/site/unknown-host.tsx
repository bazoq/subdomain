import { brand } from "@/config/brand";
import { rootUrl } from "@/config/site";
import { t, ui } from "@/lib/i18n";

/**
 * Full document rendered by the tenant root layout when the request host maps to no tenant. It owns
 * `<html>`/`<body>` because there is no tenant to theme; kept dependency-free so it can never fail.
 */
export function UnknownHostDocument() {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>{`${t(ui.siteNotSetUpTitle)} | ${brand.name}`}</title>
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <main id="main" className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">{brand.name}</p>
          <h1 className="mt-4 text-4xl font-bold text-balance sm:text-5xl">{t(ui.siteNotSetUpTitle)}</h1>
          <p className="mt-4 max-w-md text-pretty text-slate-400">{t(ui.siteNotSetUpText)}</p>
          <a
            href={rootUrl()}
            className="mt-8 rounded-full bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50"
          >
            {t(ui.visit)} {brand.name}
          </a>
        </main>
      </body>
    </html>
  );
}
