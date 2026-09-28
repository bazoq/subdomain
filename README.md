# SiteForge

Multi-tenant business-website platform for the Pakistani market. One Next.js 16 app on Vercel serves the marketing
site + platform admin on the root domain and every customer website (84 templates across 16 business categories,
English + Urdu) on its own subdomain or custom domain. Supabase Postgres via Prisma, Cloudflare R2 for media,
custom cookie auth, no third-party auth provider.

| Surface | Host | Path |
|---|---|---|
| Marketing site | `ROOT_DOMAIN` | `/` |
| Platform (super) admin | `ROOT_DOMAIN` | `/super` |
| Tenant website | `<slug>.ROOT_DOMAIN` or a custom domain | `/` |
| Tenant admin | same tenant host | `/admin` |

> This is **not** the Next.js you may know: read `AGENTS.md` and `node_modules/next/dist/docs/` before changing
> framework-facing code. Engineering rules live in [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Quick start (local)

Requirements: Node **22** (`.nvmrc`; 20.9+ works), npm 10+, a Supabase project (a dedicated dev project is
recommended — the app never runs against SQLite or an in-memory DB). R2 and Resend are optional locally.

```bash
git clone <repo> siteforge && cd siteforge
nvm use                      # or make sure `node -v` prints v22.x
npm install                  # also runs `prisma generate`
cp .env.example .env         # fill in DATABASE_URL / DIRECT_URL / SESSION_SECRET (see comments in the file)
npx prisma migrate deploy    # apply prisma/migrations to the dev database
npm run db:seed              # first super admin + one demo website per template (prints passwords once)
npm run dev                  # http://localhost:3000
```

Then open:

- `http://localhost:3000` — marketing site, `http://localhost:3000/super/login` — platform admin (seeded user)
- `http://demo-pizza-01.localhost:3000` — a demo tenant, `…/admin` — its admin (`demo` / the printed password)

`*.localhost` resolves to `127.0.0.1` in Chrome, Edge and Firefox without hosts-file edits (Safari does not).
Full setup for production — Supabase, R2, Vercel domains and DNS — is in [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server (Turbopack). Re-generates the `AGENTS.md` block on start. |
| `npm run check` | `lint` + `typecheck` + `test` — run before every push (this is what CI runs). |
| `npm run lint` / `lint:fix` | ESLint (Next presets + project rules: `no-console`, `prefer-const`, `eqeqeq`, type-only imports). |
| `npm run typecheck` | `tsc --noEmit` (strict). |
| `npm test` / `test:watch` / `test:coverage` | Vitest unit tests in `tests/**` (no database needed). |
| `npm run gen:templates` | Rebuilds `src/templates/metas.ts` from `src/templates/<category>/<nn>/`. Commit the result; CI fails if it is stale. |
| `npm run build` | `gen:templates` → `prisma generate` → `next build` (what Vercel runs). |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma migrations (dev / prod), seed, Studio. |

## Repository layout

```
src/app/(super)/           marketing site + /super admin (root host)
src/app/%5Fsites/[host]/  tenant website (site) + /admin, reached only through the host rewrite
src/app/api/               shared route handlers: health, cron, lang, media, csp-report
src/proxy.ts               host → tenant routing, header hygiene, CSP nonce (Next 16 "middleware")
src/server/                auth, sessions, tenant resolution, audit, rate limit, storage (R2), notify, super actions
src/modules/<module>/      business modules (ecommerce, restaurant, recruiting, travel, realestate, gym, shared …)
src/templates/<cat>/<nn>/  the 84 templates; catalog/ holds the design briefs; metas.ts is generated
src/lib/                   pure helpers (i18n, utils, categories, tenant-settings, log)
src/config/                env validation (env.ts), brand, site URLs
prisma/                    schema, migrations, seed (seed/ has demo data per category)
tests/                     Vitest suites (unit, api, templates) + setup/stubs
docs/                      PLAN, CONVENTIONS, TEMPLATE-GUIDE, DEPLOY, OPERATIONS, work-log/
```

## Quality gates

- **CI** (`.github/workflows/ci.yml`): on every push/PR — Node 20 + 22 matrix: install, registry freshness, lint,
  typecheck, tests; then a production `next build` on Node 22. No database or secrets are needed in CI.
- **Tests** must never need a database: modules that import `@/server/db` are mocked with `vi.mock`; `server-only`
  is aliased to a stub (`vitest.config.mts`). Add a test whenever you add a pure helper.
- **Observability**: structured JSON logs via `log` from `@/lib/log` (no `console.*` in `src/`), request errors
  captured in `src/instrumentation.ts`, `GET /api/health` for uptime monitors. See
  [`docs/OPERATIONS.md`](docs/OPERATIONS.md).

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — product/architecture plan and the template catalogue.
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — how code is written here (routing, tenant scoping, actions, forms, logging, caching, tests).
- [`docs/TEMPLATE-GUIDE.md`](docs/TEMPLATE-GUIDE.md) — implementing a template.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Supabase, Cloudflare R2, Vercel, DNS, custom domains.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — runbook: health, logs, cron, secrets rotation, incidents, rollback.
- [`docs/work-log/`](docs/work-log/README.md) — resume-safe multi-agent work log (STATUS board + one file per stream).
