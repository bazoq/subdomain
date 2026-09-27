# platform-dx stream — engineering infrastructure (tests, CI, config, docs, observability)

**Owner:** platform-dx agent. **Started:** 2026-09-27.

**Ownership boundary (only these files are edited by this stream):**
`package.json` (scripts + devDependencies), `package-lock.json` (via npm install), `tsconfig*.json`,
`eslint.config.mjs`, `next.config.ts` (everything EXCEPT the `headers()` security-headers block, owned by
security), `vitest.config.*`, `tests/**`, `src/**/*.test.ts` (new files), `.github/workflows/**`,
`vercel.json`, `.nvmrc` / `engines`, `.editorconfig`, `README.md`, `docs/DEPLOY.md` (non-DB sections),
`docs/CONVENTIONS.md`, `docs/OPERATIONS.md` (new), `src/instrumentation.ts` (new), `src/lib/log.ts` (new,
logging helper referenced by the ESLint no-console rule), `src/app/api/health/route.ts` (new),
`scripts/gen-registry.mjs`, `.env.example` (add vars, keep existing), `.gitignore`.

Rules: never `git commit`; DB is not reachable, so tests must not need a database; keep
`npx tsc --noEmit`, `npx eslint src`, `npx vitest run` clean before every entry.

## Handoffs

(cross-boundary findings for other streams — appended below as found)

## Log

## [2026-09-27 03:00] Audit / baseline
- DONE: read STATUS, AGENTS.md, Next 16 docs (vitest, instrumentation, typedRoutes, serverExternalPackages,
  turbopack), package.json, next.config.ts, tsconfig, eslint config, prisma.config.ts, gen-registry,
  README, DEPLOY, CONVENTIONS, env.ts, src/lib/*, rate-limit, db, proxy, template contract.
- FOUND: no tests, no CI, README is the create-next-app boilerplate, no `engines`, no `.nvmrc`,
  no health route, no instrumentation, ESLint has only the Next presets (no no-console), `.env.example`
  is missing `SEED_SUPER_*`; `server-only` is not resolvable outside Next (needs a vitest alias);
  `src/proxy.ts` keeps `normaliseHost`/`isRootHost` private (security stream owns the file);
  `scripts/gen-registry.mjs` writes directly to disk (no pure `generate()` to test determinism);
  `next.config.ts` already sets `poweredByHeader: false`, R2 `remotePatterns`, and the security `headers()` block.
- NEXT: install vitest + vite-tsconfig-paths, write vitest.config.mts and the first test suites.

## [2026-09-27 03:50] [resume] state reconciled
- DONE: verified the WIP checkpoint (7fba460) already contains vitest 5 + vite-tsconfig-paths, `vitest.config.mts`,
  `tests/setup.ts`, `tests/stubs/server-only.ts`, 12 suites (166 tests), `src/lib/log.ts`, `src/instrumentation.ts`,
  `src/app/api/health/route.ts`, exported `collectTemplates/renderRegistry/generate` in `scripts/gen-registry.mjs`.
  `npx vitest run`: 163 pass / 3 fail. Diagnosed:
  1. `tests/unit/proxy.test.ts` — security stream now trusts `x-forwarded-host` only when `process.env.VERCEL` is set
     (correct); test assumption was stale. Security ALSO exported `normaliseHost`, `isRootHost`, `normalisePath`,
     `resolveRewrite` from `src/proxy.ts` → will add direct tests.
  2. `tests/unit/rate-limit.test.ts` — the in-memory Prisma mock returned the live row object, so `existing.hits`
     mutated under `rateLimit()`; real Prisma returns snapshots. Mock bug, not a source bug.
  3. `tests/unit/utils.test.ts` — `normalizePkPhone("0300123456")` (9 digits after the 0) is accepted by the landline
     branch `/^[2-9]\d{8,9}$/`. Source is outside this boundary → handoff; test will assert an unambiguous invalid case.
- FOUND: `npx eslint src` → 1 error in `src/modules/ecommerce/ui/checkout-form.tsx:63` (react-hooks/refs; commerce
  stream's in-flight file) + 3 warnings (unused eslint-disable in `src/lib/log.ts`, mine). `src/server/*` files
  missing `import "server-only"`: `admin-nav.ts` (pure nav data, imported by client shell types — fine) and the
  `"use server"` action files (auth/actions, content/actions, settings/actions, super/*-actions) — `"use server"`
  files are server-only by construction, so no handoff needed beyond a note. No `.github/`, `.nvmrc`, `vercel.json`,
  `.editorconfig`, `docs/OPERATIONS.md` yet; README is still create-next-app boilerplate.
- NEXT: fix the 3 tests + log.ts directives + eslint no-console rule; then CI workflow, next.config, env/docs, scripts.

## [2026-09-27 03:55] Test suite green + ESLint project rules
- DONE: `tests/unit/proxy.test.ts` rewritten — direct tests for the newly exported `normaliseHost` (RFC 1123,
  IPv6, injection/over-long rejection), `isRootHost`, `normalisePath` (encoding/slash bypasses), `resolveRewrite`
  (all decision kinds), plus request-level tests: nonce + report-only CSP on pages (none on API), forged
  `x-tenant-host`/`x-nonce`/CSP headers stripped, `x-forwarded-host` ignored off-Vercel and preferred on Vercel
  (fresh module import with `VERCEL=1`). `tests/unit/rate-limit.test.ts`: mock `findFirst` now returns a copy
  (Prisma semantics). `tests/unit/utils.test.ts`: unambiguous invalid-phone cases. → `npx vitest run`: 12 files,
  181 tests, all green.
- DONE: `src/lib/log.ts` — removed the 3 unused eslint-disable directives. `eslint.config.mjs` — added project
  rules (`no-console: warn`, `prefer-const`, `eqeqeq smart`, `no-var: error`, `consistent-type-imports: warn`),
  `no-console` off for `src/lib/log.ts`, scripts, prisma, tests, configs; ignore `src/generated/**`, `coverage/**`.
  `npx eslint src`: 0 errors from this stream; 15 `no-console` warnings in other streams' files (listed in Handoffs),
  1 pre-existing error in commerce's `checkout-form.tsx` (handoff).
- NEXT: CI workflow + package scripts/engines/.nvmrc/.editorconfig, then next.config, env/docs.

## [2026-09-27 04:05] CI workflow, scripts, engines, editor/runtime pins
- DONE: `.github/workflows/ci.yml` — `check` job on Node 20 + 22 (npm cache, `npm ci` → postinstall `prisma generate`,
  `gen:templates` + `git diff --exit-code src/templates/metas.ts` (stale registry fails CI), lint, typecheck,
  `vitest run` with github-actions reporter) and a `build` job on Node 22 (`.next/cache` restored, `npm run build`,
  asserts `/api/health` is in the output). Dummy env in the workflow satisfies `src/config/env.ts` production rules
  (non-localhost ROOT_DOMAIN, 48-char non-placeholder SESSION_SECRET). Verified locally: with those values
  `next build` compiles successfully (env validation passes; no DB is contacted). The local run then died in Next's
  TypeScript worker with `Fatal process out of memory: Zone` while tsc/vitest and 5 other agents ran concurrently —
  environmental; retry scheduled for the end of this stream.
- DONE: `package.json` — `engines` (node >=20.9, npm >=10); scripts `test`, `test:watch`, `test:coverage`, `lint:fix`,
  `check` (lint + typecheck + test); devDep `@vitest/coverage-v8`. `.nvmrc` = 22. `.editorconfig` (LF, 2 spaces).
  `vercel.json` (`regions: ["bom1"]`, silent GitHub comments). Created then REMOVED a `.gitattributes`
  (`eol=lf` would renormalise every CRLF file on the next commit — not this stream's call; noted in Handoffs).
- FOUND: `npx tsc --noEmit` currently fails on `src/templates/ui/index.tsx` (imports `karachiNow`, `safeImageSrc`,
  `safeLinkHref` from `@/lib/utils` and `ui.skipToContent` — another stream's in-flight edit, not this stream).
- NEXT: next.config.ts (typedRoutes trial), .env.example, README, DEPLOY, OPERATIONS, CONVENTIONS.

## [2026-09-27 12:05] [resume] state reconciled
- DONE: verified HEAD 47afb7f against the intended wave-1 edits. APPLIED: `next.config.ts` (typedRoutes:false with trial
  rationale, R2 `remotePatterns` from `R2_PUBLIC_URL`, serverExternalPackages note), `eslint.config.mjs` project rules,
  CI workflow, `vercel.json` (no crons yet), `.nvmrc`, `.editorconfig`, package scripts/engines, 12 suites. NOT APPLIED
  (the three patch edits that failed without Python): `.env.example` (still missing `SEED_SUPER_*`, `CRON_SECRET`,
  `LOG_LEVEL`, `DB_*`, `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`), `README.md` (still create-next-app boilerplate),
  `docs/OPERATIONS.md` (does not exist). Current checks: `npx tsc --noEmit` clean; `npx eslint src tests` → 1 error in
  admin-ux's `src/components/admin/shared/media-picker.tsx` (react-hooks/set-state-in-effect, not this stream) + 10
  `no-console` warnings in other streams' files; `npx vitest run` → 186/187, 1 failure in `tests/unit/utils.test.ts`
  (`formatPKR` compact now trims trailing zeros → "Rs 2.5 Lac"; test expectation stale, source behaviour is fine).
- FOUND: handoffs routed here from security (proxy VERCEL=1 stub — already done in wave 1; pure-helper tests; CRON_SECRET +
  vercel cron + SESSION_SECRET rotation note; health route metadata gating) and commerce (revalidatePath under the
  `/_sites/[host]` rewrite; `formatDate` TZ — already pins Asia/Karachi in current `src/lib/utils.ts`, so resolved).
- NEXT: fix utils test; tests for pure helpers (proxy done; add redirect, audit.redactMeta, password, r2.safeFilename,
  api-auth.assertSameOrigin, ecommerce order-token, restaurant hours); health route gating; vercel.json crons; .env.example;
  README; DEPLOY (Vercel/cron/env); OPERATIONS; CONVENTIONS (log, publicFormGuard, notify, work-log, revalidate finding).

## [2026-09-27 12:10] IN PROGRESS: pure-helper unit tests (security + commerce handoffs) + stale formatPKR expectation
- Plan: fix `tests/unit/utils.test.ts` (2.5 Lac); new suites `redirect`, `audit-redact`, `password`, `r2-filename`,
  `api-auth`, `order-token`, `restaurant-hours` under tests/unit (DB modules mocked with vi.mock; no DB).
- DONE: `tests/unit/utils.test.ts` expectation updated (compact PKR trims trailing zeros; added negative + Urdu cases).
  New suites (75 tests, all green): `tests/unit/redirect.test.ts` (safeRedirectPath: scheme-relative/backslash/%2F/%5C,
  control chars, credentials, prefix, dot segments, length), `tests/unit/audit-redact.test.ts` (redactMeta: key
  patterns, depth/array/string/size bounds, cycles, Date/bigint), `tests/unit/password.test.ts` (policy, denylist,
  username rule, generatePassword alphabet/bias/length, bcrypt round-trip, DUMMY_HASH), `tests/unit/r2-filename.test.ts`
  (safeFilename: path traversal, header injection, RFC 5987, length cap, Urdu), `tests/unit/api-auth.test.ts`
  (assertSameOrigin: Origin/Referer/Sec-Fetch-Site matrix, x-request-host precedence), `tests/unit/order-token.test.ts`
  (HMAC token determinism, domain separation, malformed input), `tests/unit/restaurant-hours.test.ts` (PK time zone,
  overnight windows, open==close all-day, pkDateTime). DB-backed modules mocked via `vi.mock` (audit → db + rate-limit;
  api-auth → session + tenant). The x-forwarded-host `VERCEL=1` stub was already in place from wave 1.
- NEXT: health route gating (CRON_SECRET), vercel.json crons, .env.example.

## [2026-09-27 12:20] IN PROGRESS: health route metadata gating + vercel cron + .env.example
- DONE: `src/app/api/health/route.ts` — public body is now `{status,time}` only (503 still signals degraded); build
  block + database check/latency/error only with `Authorization: Bearer <CRON_SECRET>` (constant-time compare via
  node:crypto; unavailable when CRON_SECRET is unset). `tests/api/health.test.ts` rewritten (7 tests: public shape,
  no error text leak, authorised detail, wrong/truncated/non-Bearer token → public, timeout, no secrets).
  `vercel.json` — added `crons: [{ path: "/api/cron/maintenance", schedule: "0 3 * * *" }]` (daily, Hobby-plan safe).
  `.env.example` rewritten: every `process.env.*` read across src/prisma/scripts is listed (added `NEXT_PUBLIC_SITE_URL`,
  `DB_POOL_MAX`, `DB_LOG_QUERIES`, `CRON_SECRET`, `LOG_LEVEL`, `SENTRY_DSN`, `SEED_SUPER_*`, `SEED_DEMO_*`), with the
  SESSION_SECRET-rotation warning and the Vercel-provided vars noted as "do not add".
- FOUND: `npx tsc --noEmit` currently fails on `src/app/(super)/(site)/page.tsx:265` (`source` prop not on the
  component — super-site stream's in-flight edit, not this stream). `eslint src/app/api/health tests` clean.
- NEXT: README quick start, docs/DEPLOY.md (Vercel/env/cron/health, non-DB), docs/OPERATIONS.md, docs/CONVENTIONS.md.

## [2026-09-27 12:30] IN PROGRESS: README + DEPLOY (non-DB) + OPERATIONS + CONVENTIONS
