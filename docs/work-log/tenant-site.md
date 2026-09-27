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

## [2026-09-27 18:50] Fix 2 — site-seo.ts + tenant sitemap/robots/manifest — DONE
- DONE: `src/server/site-seo.ts` (new, server-only): `tenantIsIndexable` (ACTIVE && !isDemo), `tenantOrigin`/`tenantUrl`,
  `tenantPublicPaths` (module-gated; `/reserve` only when reservations on), `TENANT_DISALLOW`, `buildTenantSitemap(tc, host?)`
  (static paths + SitePage / published posts (publishedAt <= now) / active products + categories / jobs / packages / properties /
  services / team — same filters as the public detail queries so no listed URL 404s; slugs validated; 5k per collection,
  45k total; DB failure → static entries + warn log), `buildTenantRobots(tc, host?)`, `sitemapXml()` / `robotsTxt()` serialisers,
  `buildTenantManifest(tc, lang)` (validated hex/icon), `tenantMetadata(tc, lang, host?)` (metadataBase on the tenant host,
  title template `%s | <name>`, generated EN/UR description, validated icons + OG image, `og:locale` + `og:locale:alternate`,
  manifest link, `noindex` for DRAFT/SUSPENDED/demo), `tenantPageMetadata(tc, lang, {title, description, path, image, type})`
  (full OG/Twitter + canonical per page — Next replaces, not merges, nested `openGraph`), `tenantViewport`, JSON-LD builders
  `localBusinessJsonLd` (schema.org subtype per category: Restaurant/Bakery/ClothingStore/ShoeStore/Pharmacy/ExerciseGym/
  LegalService/RealEstateAgent/TravelAgency/EmploymentAgency/…; validated phone/email/sameAs/address/openingHours; COD payment),
  `webSiteJsonLd`, `breadcrumbJsonLd`, `jsonLdString`.
- DONE: route handlers `src/app/_sites/[host]/sitemap.xml/route.ts`, `robots.txt/route.ts`, `manifest.webmanifest/route.ts`
  (proxy.ts rewrites tenant `/sitemap.xml` etc. to `/_sites/<host>/…`, so these are what actually answer on tenant hosts;
  s-maxage 1h, unknown host → 404 / disallow-all, failure → 503 + disallow-all, never 500).
- NOTE: hreflang alternates deliberately NOT emitted — EN/UR share one URL (cookie), so `hreflang` would be wrong; OG locale
  alternate is used instead. Canonical = request host (a custom domain has no verified flag yet; see Handoffs → data-layer).

## [2026-09-27 18:50] Fix 3 — layouts, metadata, i18n, theme injection, DRAFT gate — DONE
- DONE `src/app/_sites/[host]/layout.tsx`: `generateMetadata` → `tenantMetadata`; `generateViewport` → brand theme-color;
  `<html lang="en-PK|ur-PK" dir>`; Noto Nastaliq Urdu self-hosted via `next/font/google` (`--font-nastaliq`, preload off,
  weight 400/700) and placed in `--t-font-urdu` by `themeVars(…, { urduFontVar })`; Google Fonts `<link>` only for the
  template's heading/body (+ a non-default Urdu family) with preconnects only when a link exists; unknown host → self-contained
  `UnknownHostDocument` (no `notFound()` from a root layout → no nested `<html>`); unknown template id → DEFAULT_THEME and the
  `(site)` layout's `notFound()` lands on `[host]/not-found.tsx`.
- DONE `(site)/layout.tsx`: SUSPENDED → `SuspendedSite`; DRAFT → `ComingSoon` (name + validated phone/WhatsApp only) unless a
  tenant-admin session exists (`getTenantSession`, fail-closed to coming-soon), staff see the real site + sticky `PreviewBanner`
  (security handoff DONE); `SkipLink` (target `#main`, present in all 84 templates); LocalBusiness + WebSite JSON-LD (hero image
  as fallback image); then the template Layout.
- DONE `(site)/page.tsx`: home metadata via `tenantPageMetadata` — SEO-section title as absolute title, description, canonical `/`,
  og:image falls back to hero image / first slide.
- DONE `src/templates/theme.ts`: custom Urdu family first, then `var(--font-nastaliq)`, then fallbacks.
- DONE `src/lib/i18n.ts`: preview / not-set-up / reload strings (EN + UR; dictionary test enforces Urdu on every key).
- DONE `src/components/site/`: `status-page.tsx` (themed body-level shell with one `<main id="main">`), `suspended.tsx` (bilingual,
  no template/contact leakage), `coming-soon.tsx`, `unknown-host.tsx`, `preview-banner.tsx`, `json-ld.tsx`.

## [2026-09-27 18:50] Fix 4 — loading / error / not-found / catch-all / global-error — DONE
- DONE `(site)/loading.tsx` (static skeleton, `aria-busy`, bilingual sr-only text), `(site)/error.tsx` (client; `retry()`;
  language from `<html lang>` via `useSyncExternalStore`; digest shown; structured log), `(site)/not-found.tsx` (branded 404
  inside the template layout: `<section>`, home/contact buttons, "popular pages" from the template nav through `safeLinkHref`),
  `(site)/[...rest]/page.tsx` (catch-all → `notFound()` so unmatched tenant URLs get the branded 404 instead of Next's default),
  `[host]/not-found.tsx` (body-level `StatusPage` for `notFound()` thrown by the `(site)` layout / admin), `src/app/global-error.tsx`
  (created — was absent; own `<html>/<body>`, inline styles only, bilingual, `retry()`, digest). super-site planned the same file →
  handoff so it is not recreated.

## [2026-09-27 18:50] Fix 5 — globals.css tokens / a11y / RTL / print / reduced motion + kit — DONE
- DONE `src/app/globals.css`: `color-scheme`, `scroll-padding-top` + `:target` margin (sticky headers), one global
  `:focus-visible` ring on interactive elements (`--t-primary`, inverted on primary buttons), `.t-skip` (was referenced by the kit
  but undefined), `.t-fab` (safe-area + `--t-fab-offset` for cart bars), `.t-prose` ol/blockquote, RTL refinements (Nastaliq
  heading leading, eyebrow tracking reset, LTR isolation for tel/email/url/number inputs and `code`), global
  `prefers-reduced-motion` (animations, transitions, smooth scroll), print (paper colours, hide FAB/skip/status bars, URL after
  external links, no card splitting).
- DONE `src/templates/ui/index.tsx`: `SkipLink` default target `main`.
- VERIFIED: `npx eslint` clean on all 19 changed files; `npx tsc --noEmit` — 0 errors in my boundary (the only errors are in
  `src/server/super/tenants-actions.ts`, super-site's uncommitted WIP, `requireTenantManager`); `vitest` i18n/utils/site-content/
  tenant-settings 32/32 pass; `node scripts/gen-registry.mjs` → 84 templates, `metas.ts` unchanged.

## Handoffs
- **super-site** (`src/app/sitemap.ts`, `robots.ts`, `manifest.ts`, `src/server/super/host-seo.ts`): builders now exist —
  `import { buildTenantSitemap, buildTenantRobots, buildTenantManifest, tenantIsIndexable, tenantPublicPaths } from "@/server/site-seo";`
  tenant branch: `return buildTenantSitemap(resolved.tc, resolved.host)` / `buildTenantRobots(resolved.tc, resolved.host)` /
  `buildTenantManifest(resolved.tc, lang)`; delete `tenantSitemapFallback` / `tenantRobotsFallback` / `tenantIsIndexable` /
  `tenantPublicPaths` from host-seo.ts. NB: on tenant hosts these root files are never reached (proxy rewrite) — the handlers under
  `src/app/_sites/[host]/` answer; the import only keeps the platform-host code path consistent. `src/app/global-error.tsx` now
  exists (tenant-site) — do not recreate; edit it if the platform wants different copy/colours.
- **commerce / services-modules / admin-ux** (every `(site)/**/page.tsx` `generateMetadata` except home): use
  `tenantPageMetadata(await requireTenant(), ctx.lang, { title, description, path, image, type })` from `@/server/site-seo` and
  return a bare `title` (no `· ${ctx.tenant.name}` — the layout template already appends ` | <name>`; today titles read
  "X · Name | Name"). Partial `openGraph: { images }` objects REPLACE the layout's og:site_name/locale/title — the helper builds the
  full object and adds the canonical URL. Detail pages: also render `<JsonLd data={breadcrumbJsonLd(tc, items)} />`
  (`@/components/site/json-ld`) and Product/JobPosting/Article JSON-LD where applicable.
- **services-modules** (`src/modules/shared/ui/site-footer.tsx` L92-97): replace the hard-coded "Powered by" `<a href="https://<brand>.pk">`
  with `<PoweredBy ctx={ctx} className=… />` from `@/templates/ui` (uses `rootUrl()` and honours the white-label toggle).
  `testimonials-carousel.tsx` / `gallery-grid.tsx`: verify `aria-roledescription="carousel"`, `aria-live="polite"` on the track,
  labelled prev/next buttons, pause on hover/focus and `prefers-reduced-motion` (global CSS now disables autoplay animations only).
- **data-layer / admin-ux** (`src/lib/tenant-settings.ts`, `settings-form.tsx`): add `branding.hidePoweredBy: z.boolean().default(false)`
  + a toggle — `parseSettings` strips unknown keys, so the kit's `hidePoweredBy()` can never be true today.
- **data-layer** (`prisma Domain`): a `verified Boolean` (DNS checked) would let `site-seo.ts` canonicalise the subdomain to the
  custom domain; until then every host is self-canonical (duplicate content between `slug.root` and the custom domain).
- **platform-dx / owner of `src/server/site.ts`**: `currentLang()` ignores `settings.languages.defaultLang` — recruiting
  catalog tenants default to `defaultLang: "ur"` but render English until the visitor toggles. Use
  `resolveLang(jar.get(LANG_COOKIE)?.value, tc.settings.languages)` (already in `@/lib/i18n`); the root layout mirrors whatever
  `getSiteContext` does, so change it in one place.
- **platform-dx** (`tests/unit`): add tests for `safeLinkHref` / `safeImageSrc` / `safeExternalUrl` (utils), `safeHex` /
  `safeFontName` / `themeVars` (theme), and `sitemapXml` / `robotsTxt` / `buildTenantRobots` / `tenantPublicPaths` /
  `localBusinessJsonLd` (site-seo; mock `@/server/db`). Also `proxy.test.ts`: assert `/sitemap.xml`, `/robots.txt`,
  `/manifest.webmanifest` on a tenant host rewrite to `/_sites/<host>/…`.
- **security** (`src/proxy.ts` / `next.config.ts` CSP): `settings.seo.googleAnalyticsId` / `facebookPixelId` are stored but never
  injected (would be blocked by `script-src 'self'` anyway). If/when analytics ship, allow `www.googletagmanager.com` +
  `connect.facebook.net` with the nonce. Minor: `favicon.ico` is excluded from the proxy matcher, so tenant hosts serve the
  platform's favicon.ico; `<link rel=icon>` from settings takes precedence in browsers, so low priority.
- **super-site** (optional): a signed preview link (`/?preview=<hmac>`) for super admins to view DRAFT tenant sites from the
  platform — today only a tenant-admin session on the tenant host bypasses the coming-soon page.

## [2026-09-27 18:55] tenant-site stream — final summary
- FIXED: (1) stored XSS via RichText/SmartLink/CTA hrefs + icon lookup + image src; (2) tenant sitemap/robots/manifest actually
  served (were 404) with module-aware sitemap, noindex for DRAFT/SUSPENDED/demo; (3) per-tenant metadata (metadataBase on tenant
  host, title template, generated bilingual description, validated OG image/icons, og:locale, viewport theme-color) + per-page
  helper + LocalBusiness/WebSite JSON-LD by category; (4) i18n shell: `lang`/`dir`, `ur-PK`/`en-PK`, self-hosted Nastaliq with
  proper leading, Intl `en-PK`/`ur-PK` money/dates pinned to Asia/Karachi, RTL logical utilities; (5) safe theme injection (hex +
  font-name validation for every `style=`/`<link>` value); (6) DRAFT → coming soon (staff preview with banner), SUSPENDED →
  bilingual notice; (7) loading/error/not-found/catch-all/global-error coverage without nested documents; (8) globals.css a11y
  (skip link, focus rings, reduced motion, print, RTL input isolation).
- REMAINING RISKS: (a) no runtime verification — DB unreachable and `next build` blocked by another stream's tsc errors; the
  `[...rest]` catch-all, dotted route folders and `next/font` download are verified by tsc/eslint only; (b) EN/UR share URLs → no
  hreflang, and `defaultLang: "ur"` tenants still open in English until `site.ts` adopts `resolveLang` (handoff); (c) other
  streams' pages still emit "X · Name | Name" titles and partial OG until they adopt `tenantPageMetadata` (handoff); (d) canonical
  is per host (no verified custom-domain flag); (e) carousel a11y and the footer "Powered by" toggle live outside this boundary
  (handoffs); (f) analytics IDs unused.
- READINESS (tenant-site shell): **80/100** — security of tenant-rendered content, SEO plumbing, i18n and error coverage are
  production-grade and defensive (every DB value validated, every failure path degrades). Deductions: unverified at runtime
  (-8), cross-stream adoption pending for page metadata / footer / defaultLang (-7), hreflang + canonical limitations (-3),
  analytics not wired (-2).
- NEXT: none for this stream (done). Orchestrator: commit; route the Handoffs above (super-site import is the urgent one).

## [2026-09-27 19:00] Addendum — incoming handoffs reconciled
- RESOLVED: services-modules + templates-a flagged 8 tsc errors from `src/components/site/*` referencing missing `ui.*` keys
  (18:50 snapshot of my in-flight work) — keys `previewTitle/previewText/openAdmin/siteNotSetUpTitle/siteNotSetUpText/visit/
  unavailableEyebrow/reloadPage` were added in the same fix; `npx tsc --noEmit` is clean for the boundary now.
- DEFERRED (templates-a → tenant-site): `f.text("eyebrow")` → `f.localized("eyebrow")` in `src/templates/shared/sections.ts`.
  Not done on purpose: all 84 templates render `{h.eyebrow}` as a string, so flipping the field type is a tsc break across
  templates I do not own, and stored string values would fail the localized zod schema (row → defaults). Safe sequence:
  (1) templates wrap every eyebrow in `t(x, ctx.lang)` (templates-a/b), (2) tenant-site switches the schema to
  `z.union([z.string().transform(en => ({ en })), localizedString])` so old rows keep working, (3) admin form renders it as localized.
- NOTE (templates-b → services-modules, not mine): `header-nav.tsx` `aria-label="Main"/"Mobile"` are English-only; `ui.mainNavigation`
  already exists in `@/lib/i18n` for that purpose.
