# Operations runbook

Day-2 operations for a deployed SiteForge platform. Setup lives in `docs/DEPLOY.md`; engineering rules in
`docs/CONVENTIONS.md`. Everything here assumes Vercel + Supabase + Cloudflare R2 as deployed by that guide.

---

## 1. Health checks

`GET https://<ROOT_DOMAIN>/api/health` (works on any host: root, tenant, preview).

| Caller | Response |
|---|---|
| Anyone | `200 {"status":"ok","time":…}` when `SELECT 1` succeeds within 2.5 s, otherwise `503 {"status":"degraded",…}`. Nothing else is disclosed. |
| `Authorization: Bearer <CRON_SECRET>` | Same status codes plus `uptimeSec`, `build {env, commit, branch, region, node}`, `checks.database {status, latencyMs, error?}`, `totalMs`. |

- Point your uptime monitor (Better Stack, UptimeRobot, Vercel Checks …) at the public URL; alert on non-200.
- For a quick manual diagnosis: `curl -sS -H "Authorization: Bearer $CRON_SECRET" https://<ROOT_DOMAIN>/api/health | jq`.
- The route never throws and never caches (`Cache-Control: no-store`, `X-Robots-Tag: noindex`).

## 2. Logs

- Everything server-side logs **one JSON object per line** through `log` (`src/lib/log.ts`): `{time, level, msg, …fields}`.
  Event names are dotted (`auth.locked`, `cron.maintenance`, `health.degraded`, `request.error`, `notify.email_failed`).
- Level threshold: `LOG_LEVEL` (`debug|info|warn|error`; default `info`, `debug` in development).
- Uncaught server errors (render, route handler, server action, proxy) are reported once each as `request.error` by
  `src/instrumentation.ts#onRequestError` with method, path, host, tenant host and route metadata — no stack in production.
- On Vercel read them under **Project → Logs** (filter on `level:"error"` or an event name) or attach a **Log Drain**
  (Vercel → Settings → Log Drains) to Better Stack / Axiom / Datadog; the JSON lines parse without configuration.
- Error tracking SaaS is not wired yet. To add Sentry: `npm i @sentry/nextjs`, set `SENTRY_DSN`, and follow the two-step
  comment in `src/instrumentation.ts` (`register()` + `onRequestError`). Nothing else in the app changes.
- Secrets never reach the logs: audit `meta` is passed through `redactMeta` (masks password/token/secret/cookie… keys),
  and the logger is the only sanctioned `console` transport (`no-console` lint rule).

## 3. Scheduled maintenance (cron)

`vercel.json` schedules `GET /api/cron/maintenance` daily at **03:00 UTC (08:00 PKT)**. Vercel Cron sends
`Authorization: Bearer <CRON_SECRET>`; the route answers `404` while `CRON_SECRET` is unset and `401` on a wrong token.

Tasks (each isolated; one failure does not stop the others):

| Task | What it purges |
|---|---|
| `sessions` | expired `Session` rows |
| `rateLimits` | rate-limit / idempotency windows past `windowEnd` (the commerce idempotency locks rely on `windowEnd` being honoured — do not shorten it) |
| `unconfirmedMedia` | uploads that were presigned but never confirmed (row + R2 object), 500 per run |

- Verify: Vercel → Project → **Cron Jobs** shows the last run and status; the log line `cron.maintenance` carries per-task
  counts and `ms`. Run it by hand with `curl -H "Authorization: Bearer $CRON_SECRET" https://<ROOT_DOMAIN>/api/cron/maintenance`.
- Hobby plan crons may run up to an hour late and are limited to daily schedules; the tasks are idempotent so this is fine.

## 4. Secrets and rotation

| Secret | Where | Rotation effect |
|---|---|---|
| `SESSION_SECRET` | Vercel env | **Logs every user out** (session hashes are keyed with it) and invalidates outstanding order-page links and pending upload confirmations. Rotate only on suspected compromise; announce it; redeploy. |
| `CRON_SECRET` | Vercel env | Cron runs fail with 401 until Vercel Cron picks up the new value (redeploy). Detailed health needs the new token. No user impact. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Vercel env + Cloudflare R2 API tokens | Create the new token first, update env, redeploy, then delete the old token. In-flight presigned uploads (5 min) may fail once. |
| Database password (`DATABASE_URL`, `DIRECT_URL`) | Supabase → Settings → Database | Update both URLs (URL-encode special characters), redeploy. Connections re-establish on the next request. |
| `RESEND_API_KEY` | Resend dashboard + Vercel env | Emails silently fall back to "not sent" (`notify.email_rejected`) until updated. |

Redeploy after every env change (Vercel → Deployments → ⋯ → Redeploy); env vars are read at boot, and
`src/config/env.ts` refuses to boot a **production deployment** (`NODE_ENV=production`, `VERCEL_ENV` unset or `production`,
not the build phase) with a weak or placeholder `SESSION_SECRET` or a `localhost` root domain;
a half-configured R2 or `NEXT_PUBLIC_ROOT_DOMAIN ≠ ROOT_DOMAIN` is rejected in every environment. The build itself and
Preview deployments are not strict, so after a production env change watch the first request in the Functions log
(or `/api/health`) rather than the build log — see `docs/DEPLOY.md §0`.

## 5. Deploys and rollback

- Every push to `main` deploys to production after CI (`.github/workflows/ci.yml`: lint, typecheck, tests on Node 20 + 22,
  registry freshness, production build). Preview deployments (`*.vercel.app`) render the marketing site only — tenant
  hosts need real DNS.
- **Schema changes are forward-only**: run `npx prisma migrate deploy` against production *before* the code that needs the
  new columns goes live (see `DEPLOY.md §8`). Never `migrate dev` / `db push` against production.
- **Rollback**: Vercel → Deployments → previous deployment → **Promote to Production** (instant, no rebuild). Code rollback
  is safe as long as the previous code tolerates the current schema (additive migrations do; destructive ones need a
  compensating migration).
- Runtime pins: `.nvmrc` = 22, `engines.node >= 20.9`. Set the Vercel project's Node.js version to **22.x**
  (Settings → General) so the build matches CI.
- Region: `vercel.json` pins functions to `bom1` (Mumbai) next to the Supabase `ap-south-1` project. Keep them together.

## 6. Incident playbook

| Symptom | First checks | Action |
|---|---|---|
| `/api/health` → 503 `degraded` | Supabase status page; Supabase → Database → connection count; authorised health shows `timeout` vs `error` | Pooler saturation → check `DB_POOL_MAX` (default 3 on Vercel) and long-running queries; paused project (free tier) → restore in Supabase. |
| Logins fail for everyone | Was `SESSION_SECRET` changed/redeployed? `auth.locked` spikes in logs? | Expected after rotation. Lockouts are per account (5 failures / 15 min) — wait or reset the password from super admin. |
| Uploads fail in a tenant admin | Browser console shows CORS error? R2 token valid? | Add the tenant's custom domain to the R2 CORS `AllowedOrigins` (DEPLOY §2.4). R2 credentials → rotate as above. |
| Images 404 / broken | Open the image URL (`https://<root>/media/…`) directly: 404 vs 502? Functions log `media.serve.failed`? | 502 → R2 credentials/bucket (`R2_*` env, token revoked?). 404 → object missing in the bucket. Image URLs are absolute on `ROOT_DOMAIN`, so changing the platform domain breaks previously stored image URLs. |
| A tenant is abusive / unpaid | — | Super admin → website → status **Suspended**: public site shows a placeholder, public forms/orders refuse, all its sessions are revoked. Admin stays reachable. |
| Suspicious activity | `/super/audit` (every super and tenant admin mutation with actor + IP); `auth.locked` events; `/api/csp-report` warnings | Reset the affected user's password (revokes its sessions); rotate `SESSION_SECRET` if a session token may have leaked. |
| Cron job red in Vercel | Log line `cron.maintenance.task_failed` names the task | Tasks are idempotent — re-run manually after fixing the cause (usually DB or R2 availability). |
| Build fails on Vercel but not locally | Env validation error text in the build log lists every offending variable | Fix the variable(s) in Vercel env; redeploy. |

## 7. Backups and data

- **Postgres**: enable Supabase daily backups / PITR (Pro plan). Restore = Supabase dashboard; the app needs no change.
- **R2**: objects are not versioned. For critical customers run a periodic `rclone sync` of the bucket to a second bucket
  or cold storage. Deleting a website in super admin removes its objects (prefix `t/<tenantId>/`) permanently.
- **Audit log**: append-only `AuditLog` table, viewable at `/super/audit`; export with SQL when needed.

## 8. Routine checklist

| Cadence | Do |
|---|---|
| Daily (automated) | Cron purge; uptime monitor on `/api/health`. |
| Weekly | Skim `level:"error"` logs and `/api/csp-report` warnings (the strict CSP is report-only until they are quiet — see `src/proxy.ts`). Check Vercel Cron Jobs page is green. |
| Monthly | `npm outdated` / Dependabot PRs; review `/super/audit` for unexpected super-admin actions; confirm Supabase backups exist; check R2 storage vs per-tenant quota. |
| On every custom domain | Add to Vercel Domains, customer DNS, and R2 CORS `AllowedOrigins`. |
| After adding templates | `npm run gen:templates`, commit `src/templates/metas.ts`, deploy, `npm run db:seed` for demo sites. |
