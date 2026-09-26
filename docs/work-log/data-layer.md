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
