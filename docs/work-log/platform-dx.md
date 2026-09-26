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
