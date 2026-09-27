# Stream: data-layer

Owner boundary (only these paths are edited by this stream):
- `prisma/**` (schema, migrations, seed)
- `src/server/db.ts`, `prisma.config.ts`
- `src/server/site-content.ts`, `src/server/content/**`, `src/server/settings/**`
- `src/lib/tenant-settings.ts`
- `docs/DEPLOY.md` (DB sections only)

Everything else → `## Handoffs` below.

Validation commands (DB is NOT reachable in this environment):
`npx prisma validate` · `npx prisma generate` · `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` (compare with migrations by hand) · `npx tsc --noEmit` · `npx eslint <files>`

## Handoffs
(none yet)

---

## [2026-09-27 00:00] Stream opened
- DONE: read README/STATUS/AGENTS/CONVENTIONS/PLAN§4, schema, init migration, seed, db.ts, prisma.config.ts, content + settings layers, DEPLOY.md
- NEXT: drift check (migrate diff --from-empty vs init migration)

## [2026-09-27 13:00] Drift check
- DONE: `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` (note: `--to-schema-datamodel` was removed in Prisma 7) normalised-diffed against `prisma/migrations/20260916000000_init/migration.sql` → 0 lines of drift. Init migration matches schema exactly.
- NEXT: read db.ts / prisma.config.ts / seed / content / settings; audit indexes+FKs; check commerce + services-modules handoffs for missing columns

## [2026-09-27 13:20] Audit complete → fix plan
- FOUND: (1) missing indexes for real list/sort patterns (Order/FoodOrder/Product/Application/Job/Booking/Customer/Media by tenantId+createdAt; FK columns without indexes: OrderItem.productId, FoodOrderItem.menuItemId, Application.jobId, Booking.packageId, Modifier.groupId, Order/FoodOrder.customerId, Session.superUserId/tenantUserId; isActive filters on TeamMember/Service/Testimonial/FaqItem/ShippingZone/DeliveryZone/MembershipPlan; TenantPost published+publishedAt; MenuItem featured; SuperLead/BlogPost). (2) Property.agentId and ClassSchedule.trainerId are dangling string refs to TeamMember (no FK). (3) db.ts: fixed pool size, no error helpers, no opt-in query log. (4) seed: demo owner password hard-coded `demo1234`; hashes bypass the app helper (`server-only` not resolvable under tsx — Next aliases it, package is not installed); no inbound sample data (orders, leads, applications, bookings, reservations, pages). (5) content layer: no cross-request cache; reset/reorder not audited; reorder not validated for duplicates. (6) DEPLOY.md: seed command / Prisma 7 notes incomplete.
- DECIDED (not doing, with reasons): string statuses (Reservation/Booking/Prescription.status, Coupon.type) NOT converted to enums now — other streams are concurrently editing the modules/pages that pass `status: string` into `where`; a type change would break their tsc. Logged as follow-up. RateLimit `@@unique([tenantId, bucket])` with nullable tenantId does not dedupe global (tenantId=null) buckets in Postgres; a partial unique index is not expressible in Prisma schema (would create permanent `migrate dev` drift) → logged as risk. SitePage nav NOT cached (writers live in src/modules/shared/pages-actions.ts, outside boundary; the query is tiny). Sections ARE cached (all writers in-boundary + super provisioning → handoff).
- IN PROGRESS: schema indexes/FKs + migration `20260927130000_indexes_and_fks` (generated with `migrate diff --from-schema <old> --to-schema <new>`, reviewed by hand)
- DONE: schema: 62 new indexes (tenantId+createdAt list sorts, isActive/sortOrder public lists, FK columns, Session per-user, Media cleanup, TenantPost published, Job deadline, FoodOrder scheduledFor …), GalleryItem index widened to (tenantId, album, sortOrder), real FKs `Property.agent -> TeamMember` and `ClassSchedule.trainer -> TeamMember` (onDelete SetNull, named relations PropertyAgent/ClassTrainer, back-relations on TeamMember). `prisma format` re-aligned the file (cosmetic diff).
- DONE: migration `prisma/migrations/20260927130000_indexes_and_fks/migration.sql` (delta via `migrate diff --from-schema old --to-schema new`, hand-reviewed, plus a null-out guard before each new FK). Verified: normalised statement set of init + new migration == `migrate diff --from-empty --to-schema` (229 statements, 0 diff). `prisma validate` + `prisma generate` clean.
- IN PROGRESS: src/server/db.ts (pool sizing, opt-in query log, typed error helpers)

## [2026-09-27 18:20] [resume] state reconciled
- Reconciled from `git diff 9a2d796` (working tree clean at HEAD 47afb7f). Verified present and clean (`tsc`, `tsc -p tsconfig.seed.json`, `eslint`, `prisma validate` all 0 errors):
  - `src/server/db.ts` — DONE by previous agent (pool sizing `DB_POOL_MAX`/VERCEL default, `DB_LOG_QUERIES=1` opt-in query log, `Tx`/`DbOrTx` types, `isPrismaError`/`isUniqueViolation`/`uniqueViolationFields`/`isNotFound`/`isForeignKeyViolation`/`isTransactionConflict`/`withDbRetry`/`dbErrorMessage`). Nothing left to add.
  - `src/server/content/cache.ts` — `unstable_cache` per tenant, tag `tenant-content:<id>`, TTL 60s; `revalidateTenantContent()` = `revalidateTag(tag, { expire: 0 })` (Next 16 two-arg form — verified against node_modules/next/dist/docs). READ side wired: `site-content.ts#loadSections` → `getSectionRows`. WRITE side wired: all 4 writers in `content/actions.ts` (save/toggle/reorder/reset) call `afterWrite()` → revalidateTenantContent + revalidatePath layout. Out-of-boundary SiteSection writers still not calling it: `src/server/super/provision.ts` (provisionTenantSections/migrateTenantSections) and `src/server/super/tenants-actions.ts:139` (createMany on tenant create) → covered by the 60s TTL, handoff below.
  - `src/server/settings/store.ts` (read→mutate→validate→write in a tx) + `settings/actions.ts` on top of it.
  - `prisma/seed.ts` + `prisma/seed/{inbox,demo-data,sections,server-only}.ts` + `tsconfig.seed.json` + `prisma.config.ts` seed command: idempotent, SEED_SUPER_USERNAME/EMAIL/PASSWORD, SEED_DEMO_PASSWORD, SEED_DEMO_TEMPLATES, SEED_DEMO_TENANTS=0; `seedCategoryData` covers all 16 category keys; inbox data (leads/pages/orders/food orders/reservations/applications/bookings).
- Remaining: (a) `Order.idempotencyKey` / `FoodOrder.idempotencyKey` nullable + `@@unique([tenantId, idempotencyKey])` (commerce handoff) in a new migration; (b) DEPLOY.md DB sections (§1 Supabase, §4 local dev, §5 seed/first login, §8 ops) — Prisma 7 / DIRECT_URL / seed env / pool notes; (c) handoffs + final entry.
- NEXT: (a) idempotency-key migration

## [2026-09-27 18:25] Order/FoodOrder.idempotencyKey — IN PROGRESS
- Plan (commerce handoff): nullable `idempotencyKey String?` on `Order` and `FoodOrder` + `@@unique([tenantId, idempotencyKey])`. Nullable → no backfill, no write-path change required (Postgres treats NULLs as distinct in unique indexes, so existing/unkeyed orders never collide). Migration generated with `migrate diff --from-schema <HEAD schema> --to-schema <new>` and hand-reviewed; commerce can adopt the column later (handoff).
- DONE: `prisma/schema.prisma` — `Order.idempotencyKey String?`, `FoodOrder.idempotencyKey String?`, `@@unique([tenantId, idempotencyKey])` on both (`prisma format` realigned FoodOrder, cosmetic). Migration `prisma/migrations/20260927182500_order_idempotency_key/migration.sql` (2× ADD COLUMN nullable, 2× CREATE UNIQUE INDEX; additive, no backfill). Verified: normalised statement set of all three migrations vs `migrate diff --from-empty --to-schema` differs only by the expected ADD COLUMN-vs-CREATE TABLE representation, the FK null-out guards and the GalleryItem index rename churn → schema and migrations are equivalent. `prisma validate` + `prisma generate` (7.10.0) clean. Commerce is NOT yet writing the column (handoff).
- NEXT: DEPLOY.md DB sections

## [2026-09-27 18:35] DEPLOY.md DB sections — IN PROGRESS
- FOUND: `package.json` `"db:seed": "tsx prisma/seed.ts"` (platform-dx boundary) fails at runtime — verified with a tsx smoke import: `Cannot find module 'server-only'` (not an installed package; Next aliases it). `npx prisma db seed` (→ prisma.config.ts → `tsx --tsconfig tsconfig.seed.json prisma/seed.ts`) resolves the whole seed import graph (84 templates, bcrypt hash OK). DEPLOY.md will document `npx prisma db seed`; package.json fix → handoff.
- Plan: env table (+SEED_DEMO_*, DB_POOL_MAX, DB_LOG_QUERIES), §1 (pooler rationale corrected for driver adapters, migration list = 3, seed command + env, no hard-coded demo password), §4 (dev DB knobs, partial demo seed), §5 (demo owner login), §8 (Prisma 7 schema-change workflow, drift check, pool sizing, cache TTL, RateLimit purge).
