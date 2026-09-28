# Deployment guide

This guide takes you from an empty Supabase project to a live platform on Vercel with wildcard subdomains, customer custom domains and Cloudflare R2 media storage. Replace `yourdomain.pk` with your real root domain everywhere.

Stack: Next.js 16 on Vercel · Supabase Postgres via Prisma · Cloudflare R2 (S3 API) · custom cookie auth.

---

## 0. Before you start

- A GitHub repository with this code.
- Accounts: [Supabase](https://supabase.com), [Cloudflare](https://dash.cloudflare.com), [Vercel](https://vercel.com), and access to your domain's DNS.
- Node **22** locally (`.nvmrc`; 20.9+ is supported and tested in CI). Run `npm install` once (this also runs `prisma generate`).
- Copy `.env.example` to `.env` and fill it in as you go through the steps below. Every variable is documented inline there; `src/config/env.ts` validates the set at startup and a production deployment refuses to boot with a placeholder secret, a `localhost` root domain or a half-configured R2.

**When the production rules apply.** `src/config/env.ts` has two layers. *Shape rules* (postgres URL, 32+ char secret, bare hostname, `NEXT_PUBLIC_ROOT_DOMAIN = ROOT_DOMAIN`, R2 all-or-nothing, `NOTIFY_FROM_EMAIL` with `RESEND_API_KEY`) apply everywhere. *Production rules* (non-`localhost` `ROOT_DOMAIN`, strong non-placeholder `SESSION_SECRET`) apply only when the app is **running as a real production deployment**: `NODE_ENV=production` **and** not the `next build` phase (`NEXT_PHASE=phase-production-build`, where only the dummy build-time env exists) **and** `VERCEL_ENV` unset or `production`. So `npm run build` / CI passes with dummy values, Vercel **Preview** deployments (`VERCEL_ENV=preview`) boot with whatever env the Preview scope has, and only the **Production** deployment is strict. Consequence: a misconfigured production secret is caught on the first request of the production deployment, not in the build log — check the Vercel *Functions* log after the first production deploy (or hit `/api/health`, step 3.7).

Environment variables (from `.env.example`):

| Variable | Purpose |
|---|---|
| `ROOT_DOMAIN` / `NEXT_PUBLIC_ROOT_DOMAIN` | Platform root host, e.g. `yourdomain.pk` (dev: `localhost`). Both must be identical. |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -base64 48`), not a placeholder. Keys every session hash, upload-confirm token and public order-page link: **rotating it logs every user out** and voids outstanding order links — rotate only on suspected compromise and redeploy. |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical origin of the marketing site when it differs from `https://ROOT_DOMAIN` (e.g. `https://www.yourdomain.pk`). |
| `DATABASE_URL` | Supabase **transaction pooler** URL (port 6543) used by the app at runtime. |
| `DIRECT_URL` | Supabase **direct / session** URL (port 5432) used by migrations and the seed. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 (see step 2). |
| `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | Optional email notifications (`NOTIFY_FROM_EMAIL` is required once the key is set; `Name <address>` allowed). |
| `CRON_SECRET` | 16+ random characters (`openssl rand -hex 24`). Vercel Cron sends it as `Authorization: Bearer …` to `/api/cron/maintenance` (step 3.7); the same header unlocks the detailed `/api/health` body. Unset → cron route answers 404 and health stays minimal. |
| `LOG_LEVEL` | Optional: `debug` / `info` (default) / `warn` / `error` threshold for the JSON logger. |
| `SENTRY_DSN` | Optional, reserved: read by `src/instrumentation.ts` once the Sentry SDK is installed (see `docs/OPERATIONS.md §2`). |
| `SEED_SUPER_USERNAME`, `SEED_SUPER_EMAIL`, `SEED_SUPER_PASSWORD` | Optional; read only by `npx prisma db seed` for the first super admin (defaults `admin` / `admin@example.com` / generated + printed once). |
| `SEED_DEMO_PASSWORD`, `SEED_DEMO_TEMPLATES`, `SEED_DEMO_TENANTS` | Optional, seed only: owner password for all demo sites (generated + printed once when unset); which templates get a demo site (`all` · `first` · comma list of template ids / category keys); `0` skips demo sites entirely. |
| `DB_POOL_MAX`, `DB_LOG_QUERIES` | Optional, runtime: connections per server instance (default 3 on Vercel, 10 locally); `DB_LOG_QUERIES=1` prints every SQL query in development. |

---

## 1. Supabase (Postgres)

1. Create a new project (region closest to Pakistan: **ap-south-1 / Mumbai** or **ap-southeast-1 / Singapore**). Save the database password.
2. Open **Project Settings → Database → Connection string** and copy both:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1`:
     ```
     postgresql://postgres.PROJECT:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```
   - **Session pooler** or **Direct** (port `5432`) → `DIRECT_URL`:
     ```
     postgresql://postgres.PROJECT:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
     ```
   Why two URLs: serverless functions open many short-lived connections, so the app must go through the transaction pooler (Supavisor in transaction mode). Migrations need DDL, advisory locks and session state that transaction pooling does not provide, so the Prisma CLI (`migrate`, `db seed`, `studio`) uses `DIRECT_URL` — `prisma.config.ts` picks it automatically and falls back to `DATABASE_URL`. The app itself (`src/server/db.ts`) connects with `DATABASE_URL` through the `@prisma/adapter-pg` driver adapter; the `?pgbouncer=true&connection_limit=1` suffix is harmless there (node-pg ignores unknown parameters) and the real per-instance pool size is `DB_POOL_MAX` (default 3 on Vercel). Keep the Supabase pool size (Project Settings → Database → Connection pooling) at its default or higher; the app never needs more than `DB_POOL_MAX × concurrent function instances` connections.
3. If your password contains `@`, `#`, `/` or `%`, URL-encode it (`@` → `%40`).
4. Apply the schema. **Automatic:** every Vercel *Production* deployment runs `prisma migrate deploy` as the last step of `npm run build` (`scripts/migrate-on-deploy.mjs`), so an empty database gets every table on the first deploy and later migrations are applied on the deploy that ships them. It needs `DIRECT_URL` in the Vercel **Production** environment; Preview deployments and CI never migrate. A failed migration fails the build and Vercel keeps the previous deployment live. Manual equivalent (locally with production `DIRECT_URL`):
   ```bash
   npx prisma migrate deploy
   npx prisma migrate status   # must print "Database schema is up to date!"
   ```
   This applies, in order, `20260916000000_init` (45 tables), `20260927130000_indexes_and_fks` (indexes for every list/sort query, FK indexes, `Property.agent` / `ClassSchedule.trainer` foreign keys), `20260927182500_order_idempotency_key` (`Order.idempotencyKey` / `FoodOrder.idempotencyKey`) and `20260927200000_superlead_source` (`SuperLead.source`, the page/template a platform lead came from). `npx prisma migrate status` lists exactly these four as applied. All migrations are additive and safe to run on a database that already has data. Never run `prisma migrate dev`, `db push` or `migrate reset` against production.
5. Seed the platform (idempotent — safe to re-run at any time):
   ```bash
   SEED_SUPER_USERNAME=admin SEED_SUPER_EMAIL=you@yourdomain.pk SEED_SUPER_PASSWORD='StrongPass123' npx prisma db seed
   ```
   (On Windows PowerShell set them with `$env:SEED_SUPER_PASSWORD='StrongPass123'` first.) Use `npx prisma db seed`, not `tsx prisma/seed.ts` directly: the seed reuses the app's own password hashing, which needs the `tsconfig.seed.json` shim that `prisma.config.ts` passes to `tsx`.
   What it does:
   - **Super admin** — upserts `SEED_SUPER_USERNAME` with `SEED_SUPER_EMAIL`. Without `SEED_SUPER_PASSWORD` a random password is generated and printed **once** on first creation; on later runs the password is only changed when `SEED_SUPER_PASSWORD` is set (handy for a reset). Passwords must pass the app's policy (8+ chars, letters and digits, not a common password).
   - **Template settings** — one `TemplateSetting` row per registered template (new templates enabled, first six featured).
   - **Demo websites** — one per template: `demo-<templateId>.yourdomain.pk`, owner username `demo`, password from `SEED_DEMO_PASSWORD` or generated + printed once. Each demo gets the template's sections, Pakistani sample data for every module of its category (products/variants/coupons, menu/modifiers/delivery zones, jobs, tours, properties, membership plans, practice areas, print services …) and a week of inbound activity (leads, orders, food orders, reservations, applications, bookings, legal pages). Set `SEED_DEMO_TEMPLATES=first` for one demo per category (16 sites instead of 84), a comma list such as `pizza-01,law` for a subset, or `SEED_DEMO_TENANTS=0` for none. Re-running refreshes settings/owner password but never duplicates content (every table is skipped when the tenant already has rows).
6. Optional hardening in Supabase: disable the public Data API (Settings → API) since the app talks to Postgres directly, and enable daily backups / PITR (Pro plan).

---

## 2. Cloudflare R2 (media storage)

1. Cloudflare dashboard → **Storage & databases → R2 → Overview** (first time: complete the R2 checkout; there is a free tier). **Create bucket**, name it e.g. `siteforge-media`, location **Automatic** — do **not** pick a jurisdiction (EU/FedRAMP), the app uses the default `<ACCOUNT_ID>.r2.cloudflarestorage.com` endpoint. Put the name in `R2_BUCKET`.
2. **Account ID**: press `Ctrl/Cmd + K` anywhere in the dashboard, type `Copy account ID`, select it → `R2_ACCOUNT_ID` (also shown under **Account Details** on the R2 Overview page).
3. **API token**: R2 Overview → **Account Details** → **API Tokens → Manage** → **Create Account API token**:
   - Permissions: **Object Read & Write**, scoped to this bucket only; TTL **Forever**
   - Copy `Access Key ID` → `R2_ACCESS_KEY_ID`, `Secret Access Key` → `R2_SECRET_ACCESS_KEY` (shown once). The "Token value" on the same screen is not used.
   - **No public access is needed.** Leave *Public Development URL* disabled and add no custom domain: public images are served by the app itself at `https://yourdomain.pk/media/<key>` (`src/app/media/[...key]/route.ts`), read from the private bucket and cached by the Vercel CDN.
4. **CORS** (bucket → **Settings → CORS Policy → Add CORS policy** → **JSON** tab). Browsers upload directly to R2 with presigned PUTs, so the bucket must allow your hosts:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://yourdomain.pk",
         "https://www.yourdomain.pk",
         "https://*.yourdomain.pk",
         "https://www.customer-domain.com",
         "http://localhost:3000",
         "http://*.localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["content-type", "content-length"],
       "ExposeHeaders": ["etag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   Add every customer custom domain to `AllowedOrigins` when you attach it (uploads from that admin will fail with a CORS error otherwise). Remove the `localhost` entries in production if you prefer.
5. Uploads are validated server-side (type, size, per-tenant quota of 1 GB by default) and keys are always generated by the server under `t/<tenantId>/…` or `s/…`, so tenants can never read or delete each other's files.

---

## 3. Vercel

1. **Import** the GitHub repository (Framework preset: Next.js). Build command stays `npm run build` (runs `gen:templates`, `prisma generate`, `next build`). Under **Settings → General** set the Node.js version to **22.x** (matches `.nvmrc` and the CI build job). `vercel.json` already pins functions to the `bom1` (Mumbai) region — keep the Supabase project in `ap-south-1` so they sit together — and declares the cron job (step 7).
2. **Environment variables** (Production + Preview): add every variable from the table above. Use the transaction pooler URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`. Set `ROOT_DOMAIN` and `NEXT_PUBLIC_ROOT_DOMAIN` to `yourdomain.pk`. Generate fresh `SESSION_SECRET` and `CRON_SECRET` values for production; never reuse the ones from your `.env`. Nothing may be prefixed `NEXT_PUBLIC_` except the two root-domain/site-URL values. Env values are read at boot — **redeploy after every change**.
3. Deploy once so the project exists, then add **Domains** (Project → Settings → Domains):
   - `yourdomain.pk` (root) and `www.yourdomain.pk` (redirect to root)
   - `*.yourdomain.pk` (wildcard — serves every tenant subdomain and every demo site)
   - later: each customer custom domain, e.g. `www.karachipizza.com`
   Wildcard domains require the DNS zone's nameservers or a CNAME as described below; Vercel shows the exact record it expects next to each domain.
4. **DNS records** (at your registrar or Cloudflare; if the zone is on Cloudflare set these records to *DNS only / grey cloud*, not proxied):

   | Type | Name | Value | Purpose |
   |---|---|---|---|
   | `A` | `@` | `76.76.21.21` | root domain → Vercel |
   | `CNAME` | `www` | `cname.vercel-dns.com` | www → Vercel |
   | `CNAME` | `*` | `cname.vercel-dns.com` | wildcard for all tenant subdomains |
   | `CNAME` | `media` | (created by Cloudflare R2 in step 2.3) | media bucket |

   Vercel may instead ask you to verify the wildcard with a `TXT _vercel` record; add exactly what the dashboard prints.
5. **SSL** is automatic. Vercel issues certificates for the root, `www`, the wildcard and each custom domain a few minutes after DNS propagates.
6. Redeploy after the domains are attached. Check:
   - `https://yourdomain.pk` → super website
   - `https://yourdomain.pk/super/login` → super admin
   - `https://demo-pizza-01.yourdomain.pk` → a demo tenant (if templates are registered)
   - `https://yourdomain.pk/api/health` → `{"status":"ok",…}` (503 `degraded` means the database is unreachable from Vercel — re-check `DATABASE_URL`)
7. **Cron + monitoring.** `vercel.json` schedules `GET /api/cron/maintenance` daily at 03:00 UTC (08:00 PKT); Vercel picks it up on the first deploy after `CRON_SECRET` is set and lists it under **Project → Cron Jobs** (Hobby plan: daily schedules only, may run up to an hour late — fine, the tasks are idempotent). Point an uptime monitor at `/api/health`; the detailed body (build, DB latency) needs `Authorization: Bearer <CRON_SECRET>`. Log lines are JSON — attach a **Log Drain** if you want them outside Vercel. Everything else day-2 (rotation, incidents, rollback) is in `docs/OPERATIONS.md`.
8. **CI.** `.github/workflows/ci.yml` runs lint, typecheck, tests (Node 20 + 22) and a production build on every push/PR with dummy env values — no secrets or database are needed in GitHub. Enable **Vercel → Settings → Git → "Only deploy if checks pass"** (or protect `main` on GitHub with the `CI` check) so a red build never reaches production.

Preview deployments (`*.vercel.app`) render the super website only; tenant hosts need real DNS. Preview env can reuse the dev Supabase project; never point Preview at the production database.

---

## 4. Local development

- `.env`: `ROOT_DOMAIN=localhost`, `NEXT_PUBLIC_ROOT_DOMAIN=localhost`, real Supabase URLs (a separate dev project is recommended), R2 optional (uploads are disabled with a clear message when `R2_*` are empty).
- `npm run dev` → `http://localhost:3000` (super site), `http://localhost:3000/super` (super admin).
- Tenant sites use `*.localhost`, which Chrome, Edge and Firefox resolve to `127.0.0.1` automatically — no hosts-file edits: `http://demo-pizza-01.localhost:3000`, admin at `http://demo-pizza-01.localhost:3000/admin`.
- Safari does not resolve `*.localhost`; use Chrome for tenant testing or add entries to `/etc/hosts`.
- Quality gates: `npm run check` (= `lint` + `typecheck` + `test`) is what CI runs; `npm test -- --watch` while developing. Tests never touch a database (`tests/setup.ts` provides dummy env; DB modules are mocked). `CRON_SECRET` is optional locally — set it to try `/api/cron/maintenance` or the detailed `/api/health` by hand.
- Database in development: `npx prisma migrate dev` (dev database only) applies migrations and regenerates the client; `SEED_DEMO_TEMPLATES=first npx prisma db seed` gives one demo site per category in well under a minute; `DB_LOG_QUERIES=1 npm run dev` prints every SQL query; `npx prisma studio` opens a table browser on `DIRECT_URL`. The client is generated into `src/generated/prisma` by `npm install` (`postinstall`) — run `npx prisma generate` after pulling a schema change.

---

## 5. First super admin login

1. Open `https://yourdomain.pk/super/login` and sign in with the seeded username/password (demo websites: `https://demo-<templateId>.yourdomain.pk/admin`, user `demo`, password from the seed output or `SEED_DEMO_PASSWORD`).
2. Immediately go to **Super users → Change my password**.
3. Add a second SUPERADMIN (Super users → Add) so you are never locked out. Login lockout is 5 failed attempts / 15 minutes.

---

## 6. Creating a customer website

1. **Super admin → Websites → New website**.
2. Fill in business name (slug auto-fills), category, template (search by name or `#code`), one or more hostnames (subdomain under `yourdomain.pk` or a custom domain), status, the owner's username and password (use **Generate** and copy it — it is shown once), contact basics and whether Urdu is enabled.
3. After creation the page shows the admin URL, username and password. Share them with the owner privately (WhatsApp/phone), never by public channels.
4. The owner signs in at `https://<hostname>/admin`, edits sections, adds products/menu/jobs etc. Set the website to **Active** when it should be public (Draft and Suspended sites show a placeholder to visitors; the admin stays reachable).
5. The website detail page (`/super/tenants/<id>`) lets you edit basics, manage domains, switch templates within the same category, manage users, reset passwords and delete the site (type its name to confirm; uploaded files are removed from R2 too).

---

## 7. Assigning a custom domain to a customer

1. In the website's detail page → **Domains** → add the full hostname (e.g. `www.karachipizza.com`). Optionally mark it primary.
2. In **Vercel → Settings → Domains** add the same hostname. Vercel shows the record required.
3. Ask the customer to set at their registrar:
   - `CNAME www → cname.vercel-dns.com` (for `www.`), and
   - for the bare domain either an `A @ → 76.76.21.21` record or an ALIAS/ANAME to `cname.vercel-dns.com` if their DNS provider supports it. Alternatively add both `karachipizza.com` and `www.karachipizza.com` in Vercel and let Vercel redirect the bare domain.
4. Add `https://www.karachipizza.com` to the R2 CORS `AllowedOrigins` (step 2.4) so image uploads from that admin work.
5. Wait for DNS (minutes to a few hours). Vercel issues the certificate automatically; the platform resolves the host to the tenant on every request, so nothing else needs configuring.

---

## 8. Ongoing operations

- **Adding templates**: add folders under `src/templates/<category>/<nn>/`, run `npm run gen:templates`, commit `src/templates/metas.ts`, deploy, then run `npx prisma db seed` to create the new demo sites (existing demos are left alone).
- **Schema changes** (Prisma 7 — the datasource URL lives in `prisma.config.ts`, not in `schema.prisma`):
  1. Edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <change>` against a **dev** database; this writes `prisma/migrations/<timestamp>_<change>/migration.sql` and regenerates the client. Read the SQL: prefer additive changes (nullable columns, new indexes); for anything destructive add a data guard/backfill above the generated statements (see `20260927130000_indexes_and_fks/migration.sql`).
  2. Without a reachable database you can still produce and check a migration: `npx prisma migrate diff --from-schema <previous schema.prisma> --to-schema prisma/schema.prisma --script`, and confirm all migrations add up to the schema with `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --shadow-database-url <dev url>` (empty output = no drift). `npx prisma validate` must stay clean.
  3. Commit the schema, migration and regenerated `src/generated/prisma`, then push. The Vercel production build applies the migration automatically after `next build` succeeds and just before the new deployment goes live (`scripts/migrate-on-deploy.mjs`), so keep migrations additive: the previous deployment keeps serving on the new schema for a moment. Migrations run in a transaction, and `CREATE INDEX` on large tables should become `CONCURRENTLY` in a separate, non-transactional migration once tables have millions of rows.
- **Connections**: each Vercel function instance holds at most `DB_POOL_MAX` (default 3) connections to the transaction pooler. If Supabase reports "too many clients", lower `DB_POOL_MAX` or raise the pooler's pool size — do not switch `DATABASE_URL` to the direct port.
- **Content cache**: public tenant pages read their sections from Next's data cache (tag `tenant-content:<tenantId>`, 60 s TTL). Tenant-admin saves expire the tag immediately; anything else that edits `SiteSection` outside the app (a SQL fix, a re-seed) is visible within 60 s.
- **Rate-limit / idempotency rows**: expired `RateLimit` windows (checkout idempotency locks live there for 24 h), expired sessions and unconfirmed uploads are purged by `GET /api/cron/maintenance` — schedule it (Vercel Cron, e.g. hourly) with `Authorization: Bearer $CRON_SECRET`; the route is disabled until `CRON_SECRET` is set. No manual table maintenance is needed.
- **Backups**: enable Supabase PITR/daily backups; R2 objects are not versioned — consider a periodic `rclone` copy for critical customers.
- **Monitoring**: `/api/health` for uptime, JSON logs (`log.*` events) in Vercel or a log drain, the daily cron job's status page, and the **Audit log** page in super admin (every super and tenant admin mutation, with actor and IP).
- **Runbook**: health, logs, cron, secret rotation (what breaks when), incident playbook, rollback and the routine checklist live in [`docs/OPERATIONS.md`](OPERATIONS.md).

---

## 9. Security checklist (what the platform enforces)

- **Tenant isolation**: every database query is scoped by `tenantId` derived from the request host or the session — never from form data. Cross-tenant IDs return "not found".
- **Auth**: bcrypt (cost 12) password hashes; sessions are random 256-bit tokens stored hashed (SHA-256) in the database; cookies are `httpOnly`, `secure` in production, `sameSite=lax`; separate cookie names for super (`sf_super`) and tenant (`sf_admin`) sessions; sessions are host-scoped by the browser and re-checked against the tenant on every request.
- **Brute force**: login rate limit per IP (10 / 10 min) plus account lockout after 5 failures for 15 minutes. Password resets and deactivations revoke all sessions of that user.
- **Passwords**: minimum 8 characters with letters and digits; generated passwords are shown once and never stored in plain text or logged.
- **Server actions**: every mutation validates input with zod, checks the session (`requireSuperAction` / `requireTenantAdminAction`), and is origin-checked by Next.js. Super-user management requires the SUPERADMIN role; the last active SUPERADMIN / last active tenant OWNER cannot be deactivated; users cannot deactivate themselves.
- **Public forms**: honeypot field, per-IP rate limit (5 / 10 min, Postgres-backed), size limits, phone normalisation; leads are stored per tenant.
- **Hostnames**: validated as DNS labels, lowercase, no protocol/port; the platform root, `www.` root and `*.vercel.app` are reserved; hostnames are globally unique; a tenant always keeps at least one hostname.
- **Media**: object keys are generated server-side under a per-tenant prefix; uploads are presigned for 5 minutes and confirmed via `HEAD`; private files (CVs, prescriptions, print files) are served only through short-lived signed URLs after an ownership check; per-tenant storage quota; R2 credentials exist only on the server.
- **Audit**: super-admin and tenant-admin create/update/delete/status actions are logged with actor, entity, metadata and IP (`/super/audit`).
- **Secrets**: `SESSION_SECRET`, database and R2 credentials are only in Vercel environment variables; nothing sensitive is prefixed `NEXT_PUBLIC_`.
- **Headers/routing**: `/super/*` is only served on the root host; tenant hosts cannot reach `/_sites` or `/super` directly; super admin pages are `noindex`.

Things you must still do yourself: keep dependencies updated, rotate R2/API keys if a laptop is lost, restrict Supabase to the Vercel region where possible, and review the audit log periodically.
