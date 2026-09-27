# Stream: super-site

Owner: super-site agent. Started 2026-09-27.

## Ownership (only edit these)
- `src/app/(super)/**` (incl. `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere beneath)
- `src/components/super-site/**`, `src/components/admin/super/**`, `src/server/super/**`
- `src/lib/guides.ts`, `src/config/brand.ts`, `src/config/site.ts`
- `public/**` (super-site assets only)
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts`, `src/app/global-error.tsx` (created only because absent)

Everything else -> `## Handoffs` at the bottom.

## [2026-09-27 03:10] Audit complete (no code changed yet)
- FOUND (to fix, in order):
  1. SEO: root layout has no `metadataBase`, OG/Twitter defaults, canonical; no JSON-LD anywhere; no `sitemap.ts` / `robots.ts` / `manifest.ts` / opengraph image. `proxy.ts` matcher skips `robots.txt|sitemap.xml|manifest.webmanifest`, so `src/app/sitemap.ts` would answer on EVERY host -> must be host-aware (root host -> super sitemap; tenant host -> tenant sitemap; demo tenants -> disallow).
  2. Gallery: public pages ignore `TemplateSetting.enabled/featured/sortOrder` (super admin toggles have no effect). `TemplateMini` renders a Google Fonts `<link>` per card (84 requests on /templates) and does `hex + "66"` alpha concat (98 `#fff` 3-digit colours in catalog -> invalid colours). Card image link has no accessible name (`aria-hidden` child only). `/templates?style=` chip row would list ~130 tags.
  3. Blog: `/blog/general` (category used by admin "General" posts) 404s; no Article JSON-LD; no reading time; cover `<img alt="">`; Urdu font (`font-urdu`) never loaded in super layout.
  4. LeadForm: `e.currentTarget.reset()` after `await` -> TypeError on success in React; inputs have placeholders but no labels; honeypot triggers a zod field error instead of a silent drop. Pricing page contains "Prices are placeholders..." copy, hard-coded `siteforge.pk`, string prices (no `formatPKR`).
  5. Super admin: EDITOR role (described as "blog, leads") can run every tenant/template/domain action - no role check outside users-actions; nav not filtered; several pages lack `metadata.title`; blog delete button has no pending state.
  6. No `loading.tsx` / `error.tsx` / `not-found.tsx` under `(super)`; no `global-error.tsx`; multiple root layouts mean unmatched root-host URLs need a `(site)/[...rest]` catch-all to reach a branded 404.
  7. Header mobile toggle lacks `aria-expanded`/`aria-controls`; no skip link; "Sign in" in the public header points at the platform owner's login (confusing for business owners).
- NEXT: implement fix 1 (SEO foundation: site.ts helpers, seo.tsx, root layout metadata, sitemap/robots/manifest, OG image).

## [2026-09-27 14:10] Resumed after cutoff — verified no super-site code changed since 9a2d796
- FOUND: `git diff 9a2d796 --stat` on ownership paths shows only `src/config/env.ts` (other stream). Audit list stands.
- FOUND (new, affects fix 1): current `proxy.ts` matcher no longer excludes `robots.txt|sitemap.xml|manifest.webmanifest` — on tenant hosts these are now rewritten to `/_sites/{host}/…`, so root `sitemap.ts`/`robots.ts` only answer on root/preview hosts. Still making them host-aware (cheap, defensive) and leaving a handoff for tenant-site.
- FOUND: Next 16.3 `error.tsx` receives `retry()` (preferred) + `reset()`; `global-error` must own `<html>/<body>`; `next/og` present (bundled Geist-Regular.ttf, no project TTFs).
- IN PROGRESS: fix 1 — SEO foundation (site.ts helpers, super-site/seo.tsx JSON-LD, root layout metadata + Urdu next/font, sitemap/robots/manifest host-aware, opengraph-image + twitter-image, per-template OG image).
- NEXT: finish fix 1, then fix 2 (gallery honours TemplateSetting, TemplateMini fonts/alpha/a11y).

## [2026-09-27 18:05] [resume] state reconciled
- FOUND: `git diff 9a2d796 --stat` on ownership paths matches the handoff list exactly (18 files, +1032/-23; `src/config/env.ts` belongs to another stream). `npx tsc --noEmit` clean at HEAD 47afb7f.
- FOUND: fix 1 is ~70% done — root layout metadata/viewport/fonts, `seo.tsx` (pageMetadata + JSON-LD builders), host-aware sitemap/robots/manifest, OG/twitter/icon routes, per-template OG image, `gallery.ts` all exist. NOT yet done: no public page calls `pageMetadata()` (no canonical/OG per page), no page emits JSON-LD beyond Organization/WebSite in the layout, pages still import `TEMPLATES`/`templatesForCategory` directly (gallery.ts unused), `tsconfig`/env for `NEXT_PUBLIC_SITE_URL` unchecked.
- FOUND: `src/server/site-seo.ts` (tenant-site) still absent → keeping `tenantSitemapFallback` / `tenantRobotsFallback`; handoff recorded below.
- FOUND: `src/app/global-error.tsx` absent → I create it (fix 6).
- NEXT: finish fix 1 (per-page metadata + JSON-LD, env example), then fix 2.

## [2026-09-27 18:15] Fix 1 (finish) + Fix 2 — IN PROGRESS
- IN PROGRESS: per-page `pageMetadata()` + JSON-LD on all 10 public pages; `brand.pricing` (numeric PKR plans) feeding pricing page + Product offers; pages switched to `gallery.ts` (TemplateSetting honoured); `TemplateMini` alpha helper + no per-card font `<link>` + accessible card links; style chips capped.
