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

## Handoff received from tenant-site [2026-09-27 18:50]
- `src/server/site-seo.ts` now exists. Exact import:
  `import { buildTenantSitemap, buildTenantRobots, buildTenantManifest, tenantIsIndexable, tenantPublicPaths } from "@/server/site-seo";`
  — `buildTenantSitemap(tc, host?) : Promise<MetadataRoute.Sitemap>`, `buildTenantRobots(tc, host?) : MetadataRoute.Robots`,
  `buildTenantManifest(tc, lang) : MetadataRoute.Manifest`. In `sitemap.ts` / `robots.ts` / `manifest.ts` replace the
  `tenant*Fallback` calls and delete the fallbacks (+ `tenantIsIndexable` / `tenantPublicPaths`) from `host-seo.ts`.
  Note: tenant hosts never reach the root files (proxy rewrites `/sitemap.xml` → `/_sites/<host>/sitemap.xml`); tenant-site added
  route handlers under `src/app/_sites/[host]/{sitemap.xml,robots.txt,manifest.webmanifest}/route.ts` that serve them.
- `src/app/global-error.tsx` has been created by tenant-site (bilingual, inline styles, `retry()`); skip your fix-6 item for it or edit in place.

## [2026-09-27 19:20] Fix 1 — SEO foundation — DONE
- DONE: every public page now uses `pageMetadata()` (canonical + complete OG/Twitter; home uses an absolute title): `(site)/{page,about,contact,pricing}.tsx`, `templates/{page,[category]/page,[category]/[id]/page}.tsx`, `blog/{page,[category]/page,[category]/[slug]/page}.tsx`.
- DONE: JSON-LD per page (`src/components/super-site/seo.tsx` builders): SoftwareApplication + category ItemList (home); BreadcrumbList everywhere; ItemList + FAQPage (template category); Product with PKR offers (template detail); FAQPage (pricing); Article (+wordCount) on guide pages and blog posts. `isMostlyUrdu()` helper added.
- DONE: `src/config/brand.ts` gained `pricing` (numeric PKR plans) + `entryPlan()` — single source for pricing page copy, JSON-LD offers and "from Rs X" lines.
- DONE: tenant-site's `src/server/site-seo.ts` exists → `src/app/{sitemap,robots,manifest}.ts` now call `buildTenantSitemap/buildTenantRobots/buildTenantManifest`; `host-seo.ts` reduced to host resolution (fallbacks deleted). `src/app/global-error.tsx` is owned by tenant-site (they created it while I was writing mine; theirs stands).

## [2026-09-27 19:20] Fix 2 — Gallery honours TemplateSetting — DONE
- DONE: public pages read `src/server/super/gallery.ts` (`getFeaturedTemplates`, `getGalleryMetas`, `galleryTemplatesForCategory`, `getGalleryTemplate`) instead of the raw registry; disabled templates 404 on their detail page and vanish from sitemap/lists; featured + sortOrder drive the home grid. Pages export `revalidate = 3600` and `upsertTemplateSetting` already calls `revalidatePath("/", "layout")`.
- DONE: `TemplateMini` no longer emits a Google Fonts `<link>` per card (was 84 stylesheet requests on /templates); `alpha(hex, a)` replaces `hex + "66"` string concat (3/4/6/8-digit hex → rgba). Card is an `<article>` with one named link (`aria-label` "Name — template #code"), decorative swatches `aria-hidden`, demo link announces "opens in new tab". Numeric code shown on cards, headings, OG image, JSON-LD sku and lead messages.
- DONE: `/templates?style=` chips capped to the 12 most-used tags with counts; unknown style values ignored; result count announced via `role="status"`.

## [2026-09-27 19:20] Fix 3 — Blog — DONE
- DONE: `/blog/general` renders (article list, breadcrumb, metadata) and `generateStaticParams` includes it; blog index links to it when general posts exist.
- DONE: Article JSON-LD, reading time (index, category, post), cover `alt="Cover image for “title”"`, `<time dateTime>`, Urdu posts auto-switch to `dir="rtl" lang="ur"` + `font-urdu` (Nastaliq is loaded once in the root layout via next/font).

## [2026-09-27 19:20] Fix 4 — LeadForm + pricing — DONE
- DONE: `lead-form.tsx` captures the form element before `await` (fixes the `currentTarget.reset()` TypeError on success), real `<label>`s for every field, `aria-invalid`/`aria-describedby` errors, focus moves to the first invalid field, `role="alert"` summary, network-failure message, "Send another request" after success; new `source` / `defaultMessage` props (template detail pre-fills "interested in template #901").
- DONE: `leads-actions.ts` honeypot is checked before zod and answers with the normal success message (previously `.max(0)` produced a visible "Spam detected" field error); invalid PK phone now returns a field error instead of storing garbage; `source` is appended to the stored message as "(via …)" (no column yet — handoff); `console.error` → `log`.
- DONE: pricing page uses `brand.pricing` + `formatPKR`, "placeholder" copy and hard-coded `siteforge.pk` removed (subdomain example derives from ROOT_DOMAIN), pricing FAQ (+ FAQPage JSON-LD), plan CTA carries `?plan=` into the contact form.

## [2026-09-27 19:20] Fix 5 — Super admin RBAC — DONE
- DONE: `src/server/super/access.ts` (`canOpenSuperPath`, `navForRole`, `requireSuperPage`) — EDITOR sees Dashboard/Blog/Leads + "Change password"; tenants/*, templates, users, audit pages redirect EDITORs to `/super?denied=1` (notice rendered on the dashboard).
- DONE: actions — every tenant mutation in `tenants-actions.ts` goes through `requireTenantManager()` (`requireSuperRole(user, ["SUPERADMIN"])`); `templates-actions.ts` SUPERADMIN-only; `users-actions.ts` uses `requireSuperRole`, adds `setSuperUserRole` (UI: "Make editor / Make super admin" in `super-users.tsx`), calls `revokeSessions({ superUserId })` after reset / deactivate / role change, blocks reuse of the current password.
- DONE: `setTenantStatus` and `updateTenantBasics` call `revokeSessions({ tenantId })` when a tenant becomes SUSPENDED (audit meta records the count).
- DONE: password policy — zod `.min(8)` → `PASSWORD_MIN` (10) in `users-actions.ts` + `tenants-actions.ts`; `passwordPolicy(pw, { username })` everywhere; client help text/minLength via `PASSWORD_MIN` in `password-utils.tsx` (server-only module cannot be imported client-side; comment says keep in sync).
- DONE: `metadata.title` on dashboard, tenants, leads, blog list/edit, audit; dashboard layout sets `title.template` + `robots noindex, nocache`; blog delete button has a pending state; `console.error` in `tenants-actions.ts` → `log.warn`.

## [2026-09-27 19:20] Fix 6 — loading / error / not-found — DONE
- DONE: `(site)/{loading,error,not-found}.tsx` + `(site)/[...rest]/page.tsx` catch-all so any unmatched root-host URL renders the branded 404 inside header/footer (multiple root layouts → no framework-level fallback); `super/(dashboard)/{loading,error,not-found}.tsx` inside the AdminShell. Error boundaries accept Next 16.3 `retry()` with `reset()` fallback and log via `src/lib/log.ts`.

## [2026-09-27 19:20] Fix 7 — Header a11y — DONE
- DONE: `<nav aria-label="Main">`, `aria-current="page"`, disclosure button with `aria-expanded`/`aria-controls`/dynamic label, Escape closes and returns focus, menu closes on navigation (path-keyed state, no setState-in-effect), visible focus rings; public "Sign in" (→ platform owner login) removed from the header — owners log in at their own domain's `/admin`; `/super/login` remains in the footer. Skip link + `<main id="main" tabIndex={-1}>` were already added in fix 1.

## [2026-09-27 19:25] Verification
- `npx tsc --noEmit` clean; `npx eslint` clean on `src/app/(super)`, `src/app/{sitemap,robots,manifest}.ts`, `src/components/super-site`, `src/components/admin/super`, `src/server/super`, `src/config/{brand,site}.ts`.
- Not verified (DB unreachable, no `next build` run this session): production build of `generateStaticParams` pages that now read `TemplateSetting` — `loadSettings` catches DB errors and falls back to "all enabled", so a build without DATABASE_URL still succeeds.

## Handoffs
- **data-layer** (`prisma/schema.prisma`): add `SuperLead.source String?` (page / template code the lead came from). `leads-actions.ts` currently appends "(via template:901)" to `message`; switch to the column once it exists.
- **security / platform-dx** (`src/server/admin-nav.ts`): `superNav` is unfiltered by design; `src/server/super/access.ts#navForRole` filters it per role. If nav entries are added, also extend `EDITOR_PREFIXES` there (or move the allow-list next to `superNav`).
- **admin-ux** (`src/components/admin/admin-shell.tsx`): nothing required; FYI EDITORs now get an extra "Account → Change password" nav group.
- **tenant-site**: `src/app/global-error.tsx` is yours (kept as-is). Root `sitemap/robots/manifest` now import your builders; if `buildTenantManifest`'s signature changes, update `src/app/manifest.ts`.
- **platform-dx**: consider `NEXT_PUBLIC_SITE_URL` in `.env.example` (used by `SITE_URL` for canonicals when the canonical host differs from ROOT_DOMAIN, e.g. `www.`); not added because `.env.example` is outside this stream.
- **security** (optional): `forbidden()` / `authInterrupts` would give a real 403 for EDITOR page access instead of the `/super?denied=1` redirect.

## [2026-09-27 19:30] Final summary — super-site stream done
- FIXED: 7/7 groups above (SEO foundation incl. host-aware sitemap/robots/manifest + per-page metadata + JSON-LD; gallery honours TemplateSetting + card perf/a11y; blog general route/Article/reading time/Urdu; LeadForm reset bug + labels + silent honeypot + real PKR pricing; super admin RBAC + session revocation + 10-char password policy; loading/error/404 coverage; header a11y).
- REMAINING RISKS: (1) no automated tests — RBAC redirects and honeypot behaviour verified by reading code only; (2) `TemplateMini` is a CSS sketch, not a screenshot — real template screenshots would lift conversion and OG quality; (3) social links in `brand.ts` are still placeholder roots (filtered out of JSON-LD `sameAs` automatically); (4) `brand.pricing` numbers are launch placeholders that marketing must confirm; (5) pages with `generateStaticParams` are ISR (1h) + on-demand revalidation — a DB outage at build time silently yields "all templates enabled"; (6) EDITOR restriction relies on `requireSuperPage` being present on every SUPERADMIN-only page — a new page added without it would be open to editors (actions are still guarded server-side).
- READINESS: 82/100 — the marketing site is now indexable and share-ready (canonicals, OG images, structured data, sitemap), the super admin is role-safe, and the failure paths are branded; the gap to 100 is real screenshots, confirmed pricing/social data, a `SuperLead.source` column and automated tests around RBAC and the lead form.
- NEXT: none (stream done). Orchestrator: commit; `next build` once DATABASE_URL is available.
