# Stream: tenant-site

**Owner:** tenant-site agent. Started 2026-09-27 (previous agent cut off before writing any code or log — verified with `git diff 9a2d796 --stat` on the boundary: no changes).
**Goal:** production-grade tenant website shell: host → tenant resolution, i18n (EN + Urdu RTL), per-tenant SEO, shared UI kit a11y, error/loading coverage, globals.css tokens.

## Ownership (only edit these)
- `src/app/_sites/[host]/layout.tsx`, `src/app/_sites/[host]/(site)/layout.tsx`, `src/app/_sites/[host]/(site)/page.tsx`, `src/app/_sites/[host]/not-found.tsx`
- `src/app/_sites/[host]/(site)/**/{loading,error}.tsx` (create; admin ones belong to admin-ux)
- `src/components/site/**`, `src/templates/shared/**`, `src/templates/ui/**`
- `src/templates/{types,fields,theme,registry,metas}.*` (contract files)
- `src/lib/i18n.ts`, `src/lib/utils.ts`, `src/lib/action-result.ts`, `src/app/globals.css`, `src/app/layout.tsx` (root, if exists)
- `src/server/site-seo.ts` (NEW — `buildTenantSitemap(tenant)` / `buildTenantRobots(tenant)` for the super-site stream's host-aware `src/app/sitemap.ts` + `robots.ts`)

NOT mine: `scripts/gen-registry.mjs` (platform-dx), `src/templates/<category>/<nn>/**` (templates streams), `src/proxy.ts` (security), `src/modules/**` (commerce / services-modules), admin `loading/error.tsx` (admin-ux). Cross-boundary problems → `## Handoffs`.

**Rules:** never `git commit`; DB not reachable (reason from code); `npx tsc --noEmit` + `npx eslint <changed>` + `node scripts/gen-registry.mjs` clean before every entry.

## [2026-09-27 15:00] Started — reading docs + boundary
- DONE: read work-log README/STATUS, AGENTS.md, PLAN.md, CONVENTIONS.md, TEMPLATE-GUIDE.md, all boundary files, site.ts / tenant.ts / proxy.ts / site-content.ts / tenant-settings.ts.
- NEXT: fix priority handoff (RichText XSS allowlist), then create `src/server/site-seo.ts` early for the super-site stream.

## [2026-09-27 15:10] Fix 1 — RichText / SmartLink stored XSS (handoff from services-modules) — IN PROGRESS
- FOUND: `src/templates/ui/index.tsx` `inline()` emits `<a href>` for any scheme (`[x](javascript:...)`); `resolveHref()` also passes unknown schemes (`javascript:`, `data:`) straight into `<Link href>` for every CTA/footer/nav link stored in DB.
- PLAN: `safeHref()` allowlist (http(s), mailto, tel, whatsapp/wa.me, relative `/`, `#`, `?`), `rel="noopener noreferrer"` + `target=_blank` for external only.

## [2026-09-27 18:20] [resume] state reconciled (HEAD 47afb7f, tree clean)
- VERIFIED via `git diff 9a2d796` on the boundary (5 files, +650/-102): the previous agent's Fix 1 is complete in tree:
  `src/lib/utils.ts` gained `safeExternalUrl` / `safeLinkHref` (allowlist: `/`, `#`, `?`, http(s), mailto, tel, sms, whatsapp;
  bare domains → https; rejects `javascript:`, `data:`, `vbscript:`, `//`, control chars) + `safeImageSrc`, `formatDate` pinned
  to `Asia/Karachi` (commerce handoff DONE), `karachiNow`, `localeFor`/`formatNumber`, Urdu `formatPKR`.
  `src/templates/ui/index.tsx`: `RichText.inline()` and `resolveHref()`/`SmartLink` route every DB href through `safeLinkHref`;
  unsafe markdown links render as plain text; `target=_blank` + `rel="noopener noreferrer"` only for http(s); icon lookup
  hardened (`ICON_NAME_RE`, NOT_ICONS); `Img` validates src; `SkipLink`/`PoweredBy`/`hidePoweredBy`/`LangSwitch` added.
  `src/templates/theme.ts`: `safeHex`/`safeFontName` validation of every value that reaches `style=`/`<link href>`.
  `src/lib/i18n.ts`: `isLang`, `resolveLang`, `htmlLang`, `ogLocale`, shell strings (skip link, menu, 404/error, suspended, coming soon).
- Orchestrator's two fixes in `[host]/layout.tsx` (nullable `fontsHref`, `theme-color ?? undefined`) reviewed: correct, kept
  (layout is being rewritten below anyway).
- FOUND (new, this pass):
  1. Tenant `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` are rewritten by proxy.ts to `/_sites/<host>/…` where no
     route exists → 404 today. Root `src/app/sitemap.ts`/`robots.ts` (super-site) only ever see the platform host. Fix: route
     handlers under `src/app/_sites/[host]/{sitemap.xml,robots.txt,manifest.webmanifest}/route.ts` backed by `site-seo.ts`.
  2. `notFound()` thrown by a (site) page resolves to `[host]/not-found.tsx`, which renders its own `<html>` inside the root
     layout's `<html>` (nested documents). Also unmatched tenant URLs have no branded 404 (no catch-all).
  3. Kit classes `t-skip` / `t-fab` referenced by `SkipLink` / `WhatsAppFloat` are not defined in globals.css; `SkipLink`
     targets `#sf-content` but all 84 templates render `<main id="main">`.
  4. `branding.hidePoweredBy` is stripped by `parseSettings` (zod object strips unknown keys) → toggle can never be true (handoff).
  5. `SiteFooter` (modules/shared) hard-codes the "Powered by" link/host and ignores `hidePoweredBy` (handoff).
  6. hreflang alternates are not possible while EN/UR share one URL (cookie-based) → use `og:locale` + `og:locale:alternate` instead.
- NEXT: Fix 2 `src/server/site-seo.ts` (+ route handlers) → Fix 3 layouts/metadata/JSON-LD/DRAFT gate → Fix 4 error/loading/not-found/catch-all/global-error → Fix 5 globals.css + kit a11y → verification + score.

## [2026-09-27 18:25] Fix 2 — src/server/site-seo.ts + tenant sitemap/robots/manifest route handlers — IN PROGRESS
- PLAN: `src/server/site-seo.ts` (server-only): `tenantIsIndexable`, `tenantOrigin/tenantUrl`, `tenantPublicPaths`,
  `buildTenantSitemap(tc, host?)` (static paths + SitePage/posts/products/categories/jobs/packages/properties/services/team,
  module-gated, capped, DB failure → static entries), `buildTenantRobots(tc, host?)`, `sitemapXml()`/`robotsTxt()` serialisers,
  `buildTenantManifest(tc, lang)`, `tenantMetadata(tc, lang, host)`, `tenantViewport(tc)`, JSON-LD builders
  (`localBusinessJsonLd` by category, `webSiteJsonLd`, `breadcrumbJsonLd`). Route handlers:
  `src/app/_sites/[host]/{sitemap.xml,robots.txt,manifest.webmanifest}/route.ts` (proxy rewrites tenant requests there).
