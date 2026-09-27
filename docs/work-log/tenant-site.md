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
