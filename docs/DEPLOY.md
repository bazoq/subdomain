# Deployment guide

This guide takes you from an empty Supabase project to a live platform on Vercel with wildcard subdomains, customer custom domains and Cloudflare R2 media storage. Replace `yourdomain.pk` with your real root domain everywhere.

Stack: Next.js 16 on Vercel · Supabase Postgres via Prisma · Cloudflare R2 (S3 API) · custom cookie auth.

---

## 0. Before you start

- A GitHub repository with this code.
- Accounts: [Supabase](https://supabase.com), [Cloudflare](https://dash.cloudflare.com), [Vercel](https://vercel.com), and access to your domain's DNS.
- Node 20+ locally. Run `npm install` once (this also runs `prisma generate`).
- Copy `.env.example` to `.env` and fill it in as you go through the steps below.

Environment variables (from `.env.example`):

| Variable | Purpose |
|---|---|
| `ROOT_DOMAIN` / `NEXT_PUBLIC_ROOT_DOMAIN` | Platform root host, e.g. `yourdomain.pk` (dev: `localhost`). Both must be identical. |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -base64 48`). |
| `DATABASE_URL` | Supabase **transaction pooler** URL (port 6543) used by the app at runtime. |
| `DIRECT_URL` | Supabase **direct / session** URL (port 5432) used by migrations and the seed. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | Cloudflare R2 (see step 3). |
| `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | Optional email notifications. |
| `SEED_SUPER_USERNAME`, `SEED_SUPER_EMAIL`, `SEED_SUPER_PASSWORD` | Optional; used only by `npm run db:seed` for the first super admin. |

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
   Why two URLs: the transaction pooler is what serverless functions must use (thousands of short-lived connections), but it does not support prepared statements or DDL reliably, so migrations and the seed use the direct/session URL. `prisma.config.ts` already picks `DIRECT_URL` for migrations.
3. If your password contains `@`, `#`, `/` or `%`, URL-encode it (`@` → `%40`).
4. Apply the schema (run locally with `.env` filled in):
   ```bash
   npx prisma migrate deploy
   ```
   This applies `prisma/migrations/20260916000000_init` (45 tables). Never run `prisma migrate dev` or `db push` against production.
5. Seed the platform:
   ```bash
   SEED_SUPER_USERNAME=admin SEED_SUPER_EMAIL=you@yourdomain.pk SEED_SUPER_PASSWORD='StrongPass123' npm run db:seed
   ```
   (On Windows PowerShell set them with `$env:SEED_SUPER_PASSWORD='StrongPass123'` first.) Without `SEED_SUPER_PASSWORD` a random password is generated and printed **once**.
   The seed also creates a `TemplateSetting` row per template and one demo website per template (`demo-<templateId>.yourdomain.pk`, owner login `demo` / `demo1234`) with realistic sample data. It is idempotent; run it again after adding templates (`npm run gen:templates` first).
6. Optional hardening in Supabase: disable the public Data API (Settings → API) since the app talks to Postgres directly, and enable daily backups (Pro plan).

---

## 2. Cloudflare R2 (media storage)

1. In the Cloudflare dashboard open **R2 → Create bucket**. Name it e.g. `siteforge-media`, location **APAC**. Put the name in `R2_BUCKET`.
2. **API token**: R2 → *Manage R2 API Tokens* → *Create API token*:
   - Permission: **Object Read & Write**
   - Scope: only this bucket
   - Copy `Access Key ID` → `R2_ACCESS_KEY_ID`, `Secret Access Key` → `R2_SECRET_ACCESS_KEY`. The account id shown on the R2 overview page → `R2_ACCOUNT_ID`.
3. **Public access** (needed so product/gallery images load in the browser). Choose one:
   - **Custom domain (recommended)**: bucket → *Settings → Public access → Custom Domains → Connect domain* → `media.yourdomain.pk`. Cloudflare adds the DNS record automatically if the zone is on Cloudflare. Set `R2_PUBLIC_URL=https://media.yourdomain.pk`.
   - **r2.dev subdomain** (quick, rate-limited, not for production traffic): enable *Public Development URL* and use that URL as `R2_PUBLIC_URL`.
4. **CORS** (bucket → *Settings → CORS policy*). Browsers upload directly to R2 with presigned PUTs, so the bucket must allow your hosts:
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

1. **Import** the GitHub repository (Framework preset: Next.js). Build command stays `npm run build` (runs `gen:templates`, `prisma generate`, `next build`).
2. **Environment variables** (Production + Preview): add every variable from the table above. Use the transaction pooler URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`. Set `ROOT_DOMAIN` and `NEXT_PUBLIC_ROOT_DOMAIN` to `yourdomain.pk`.
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

Preview deployments (`*.vercel.app`) render the super website only; tenant hosts need real DNS.

---

## 4. Local development

- `.env`: `ROOT_DOMAIN=localhost`, `NEXT_PUBLIC_ROOT_DOMAIN=localhost`, real Supabase URLs (a separate dev project is recommended), R2 optional (uploads are disabled with a clear message when `R2_*` are empty).
- `npm run dev` → `http://localhost:3000` (super site), `http://localhost:3000/super` (super admin).
- Tenant sites use `*.localhost`, which Chrome, Edge and Firefox resolve to `127.0.0.1` automatically — no hosts-file edits: `http://demo-pizza-01.localhost:3000`, admin at `http://demo-pizza-01.localhost:3000/admin`.
- Safari does not resolve `*.localhost`; use Chrome for tenant testing or add entries to `/etc/hosts`.

---

## 5. First super admin login

1. Open `https://yourdomain.pk/super/login` and sign in with the seeded username/password.
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

- **Adding templates**: add folders under `src/templates/<category>/<nn>/`, run `npm run gen:templates`, commit `src/templates/metas.ts`, deploy, then run `npm run db:seed` to create the new demo sites.
- **Schema changes**: `npx prisma migrate dev --name <change>` locally (against a dev database), commit the migration, and `npx prisma migrate deploy` (or let CI do it) before the new build goes live.
- **Backups**: enable Supabase PITR/daily backups; R2 objects are not versioned — consider a periodic `rclone` copy for critical customers.
- **Monitoring**: Vercel logs + the **Audit log** page in super admin (every super and tenant admin mutation, with actor and IP).

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
