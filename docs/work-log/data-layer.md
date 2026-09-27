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
