# STATUS BOARD — SiteForge production-hardening (started 2026-09-27)

Baseline (2026-09-27): `tsc` clean, `eslint src` clean, 84 templates, no tests, no CI, DB not reachable locally.

| Stream | File | State | Last update | NEXT |
|---|---|---|---|---|
| security | security.md | done | 2026-09-27 04:35 | done - see security.md Handoffs (revokeSessions adoption, commerce SUSPENDED, CSP promotion) |
| data-layer | data-layer.md | done | 2026-09-27 18:50 | done - readiness 82/100; see data-layer.md Handoffs (db:seed script, .env.example, super revalidateTenantContent, commerce idempotencyKey adoption) |
| commerce | commerce.md | done | 2026-09-27 18:25 | done - 12 fixes, score 78/100; see commerce.md Handoffs (notify.ts U+2028 build break → services-modules; formatDate TZ; revalidatePath; idempotencyKey column) |
| services-modules | services-modules.md | done | 2026-09-27 18:55 | done - 9 fix groups + 3 security handoffs, score 84/100; see services-modules.md Handoffs (admin-ux min-length 10, tenant-site i18n keys, revokeSessions except-current, commerce module gates) |
| super-site | super-site.md | done | 2026-09-27 19:30 | done - 7/7 fixes; see super-site.md Handoffs (SuperLead.source column, navForRole allow-list, NEXT_PUBLIC_SITE_URL in .env.example) |
| tenant-site | tenant-site.md | done | 2026-09-27 18:55 | done - see tenant-site.md Handoffs (super-site import, page metadata adoption, footer PoweredBy, defaultLang) |
| templates-a | templates-a.md | done | 2026-09-27 18:30 | done — 35 templates hardened; score 88/100; see templates-a.md Handoffs (eyebrow localisation, pack Urdu, notify.ts + components/site tsc) |
| templates-b | templates-b.md | done | 2026-09-27 18:40 | done - 49 templates + catalog Urdu; see templates-b.md summary (score 86) + Handoffs (packs eyebrow/note localized, notify.ts tsc error) |
| admin-ux | admin-ux.md | done | 2026-09-27 20:10 | done - score 78/100; see admin-ux.md Handoffs (server-side settings/password validation, media usage index, unlock action, uploader a11y) |
| templates-i18n | templates-i18n.md | done | 2026-09-27 22:45 | eyebrow/note localized + Urdu across sections/packs/catalog, 84 renderers swept, tests/unit/templates-i18n.test.ts (10). Handoff: src/modules section-types `eyebrow?: string` → `LocalizedString | string` |
| platform-dx | platform-dx.md | done | 2026-09-27 13:05 | done — 252 tests, health gating, cron, env/docs, eslint fix; see platform-dx.md Handoffs (header.tsx lint error blocks CI; revalidatePath pattern → data-layer/commerce) |

## Wave 4 (handoff follow-ups, started 2026-09-27 after all 10 streams done; HEAD cfc86f3)
Consolidated handoffs: `_handoffs-consolidated.md`. Agents log under "## Wave 4 follow-ups" in their stream file.

| Follow-up agent | Logs in | Scope |
|---|---|---|
| commerce-w4 | commerce.md | done | 2026-09-27 21:42 | done - idempotencyKey column adopted, revalidation normalised, module gates on 8 actions + 12 pages, tenantPageMetadata + JSON-LD on 12 pages; see commerce.md "Handoffs (wave 4)" (submitLead custom_cake gate → leads) |
| services-w4 | services-modules.md | done | 2026-09-27 21:50 | done - unlock action, uploader a11y, revalidation, tenantPageMetadata + JSON-LD on 22 pages; see services-modules.md Handoffs (wave 4): templates-i18n eyebrow tsc/test breakage, jsonld tests, ImageField label |
| templates-i18n | templates-i18n.md | eyebrow/note → localized (legacy-string tolerant), packs Urdu, sweep 84 renderers, tests |
| data-super-w4 | data-layer.md | done | 2026-09-27 20:55 | tasks 1-6 done (SuperLead.source + migration, super revalidation, strict-write/lenient-read settings + hidePoweredBy toggle + 14 tests, Media index = not needed (PK lookup), DEPLOY.md migrations); see data-layer.md Handoffs (super leads UI `source` column, theme test fixtures if hidePoweredBy becomes required, templates eyebrow tsc) |
| platform-w4 | platform-dx.md | done | 2026-09-27 21:40 | all 8 items done (+site-seo 31 tests, env.ts gate 11 tests, docs for runtime-scoped prod rules, vite-tsconfig-paths removed); tests/tsc red only via templates-i18n in-flight eyebrow defaults — see platform-dx.md Handoffs |
