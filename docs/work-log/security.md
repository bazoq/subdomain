# Stream: security

Owner boundary (only these files are edited by this stream):
- `src/proxy.ts`
- `src/server/auth/**`
- `src/server/api-auth.ts`, `src/server/rate-limit.ts`, `src/server/audit.ts`
- `src/server/storage/**`
- `src/app/api/**`
- `src/server/tenant.ts`, `src/server/site.ts`
- `src/config/env.ts`
- `next.config.ts` (security headers only)
- `src/lib/upload-client.ts`

Everything else -> `## Handoffs` at the bottom of this file.

Audit scope (from brief): auth/session, tenant isolation, R2 presign flow, proxy host parsing,
rate limiting, security headers/CSP, env validation, audit log, open redirects / mass assignment.

---

## [2026-09-27 12:00] Audit started — baseline read of every file in boundary
- DONE: read all boundary files + Prisma models (Session, Tenant, Media, RateLimit, AuditLog) + Next 16 docs (proxy.md, content-security-policy.md, serverActions.md).
- FOUND (not yet fixed):
  1. `proxy.ts` matcher regex `.*\.(?:png|...)` is written in a normal JS string, so `\.` collapses to `.` → any path ending in `css|js|map|txt|ico…` (e.g. `/roadmap`, `/tips`) bypasses the tenant rewrite. Also inbound `x-tenant-host` / `x-request-host` are not stripped on the root host, and `x-forwarded-host` is trusted unconditionally.
  2. Open redirect: `safeNext()` (login) and `/api/lang?back=` only reject `//`; `/\evil.com` is parsed by browsers/WHATWG as scheme-relative → open redirect.
  3. `SESSION_SECRET` is required but never used: session tokens hashed with unkeyed SHA-256. Cookies lack `__Host-` prefix in prod.
  4. Login leaks user existence via timing (bcrypt skipped when user unknown) and via the "Account locked" message.
  5. `assertSameOrigin` skips the check when `Origin` is absent, and trusts `x-forwarded-host` blindly.
  6. Rate limiter is Postgres-backed (serverless-safe) but non-atomic (read-then-write race) and fails closed on DB error (throws).
  7. No CSP at all; XFO only. `frame-ancestors`, `base-uri`, `form-action`, `object-src` absent.
  8. `env.ts` accepts `localhost` root domain / placeholder secrets in production; R2 vars not all-or-nothing.
  9. Guards never check `tenant.status` (SUSPENDED tenants can still run admin actions, public forms, uploads).
  10. Storage: presignGet filename only strips `"` (CRLF possible); PUBLIC visitors may confirm any unconfirmed media id of the tenant; unconfirmed rows never purged; confirm does not compare content-type; SVG allowed for everyone.
  11. `audit()` stores `meta` verbatim (no secret redaction).
  12. `generatePassword` has modulo bias and a fixed `a7` suffix; policy is 8 chars.
- NEXT: fix proxy.ts (host parsing, header stripping, matcher, nonce/report-only CSP).

## [2026-09-27 03:45] [resume] state reconciled
- Previous agent changed code after its last log entry; verified via `git diff 9a2d796`.
- ALREADY FIXED (by previous agent, verified):
  - #1 proxy.ts: host validated (RFC 1123 + IPv6, port stripped), x-forwarded-host trusted only on Vercel, inbound x-tenant-host/x-request-host/x-nonce/CSP headers stripped, matcher `\.` fixed, `/_sites` + `/super` blocked after percent-decoding, per-request nonce + strict report-only CSP → /api/csp-report (new route, bounded body, no DB).
  - #7 CSP/headers: next.config.ts now sends enforced pragmatic CSP (frame-ancestors, base-uri, form-action, object-src), HSTS (prod only), Referrer-Policy, Permissions-Policy, COOP + XFO DENY + noindex on /admin,/super, Cache-Control no-store on /api.
  - #8 env.ts: strong-secret check, non-localhost ROOT_DOMAIN in prod, NEXT_PUBLIC_ROOT_DOMAIN must match, R2 all-or-nothing + https in prod.
- DEFECTS in the previous work found now: (a) unused eslint-disable at proxy.ts:86; (b) env.ts `NOTIFY_FROM_EMAIL: z.string().email()` rejects the documented `Name <email>` format in .env.example; (c) helpers still private (platform-dx asked for `normaliseHost`/`isRootHost`/`resolveRewrite`); (d) tests/unit/proxy.test.ts expects x-forwarded-host to be honoured without VERCEL (test belongs to platform-dx → handoff).
- PENDING: #2 safeNext/lang open redirect, #3 keyed session hashing + __Host- cookie, #4 login enumeration/timing, #5 assertSameOrigin, #6 atomic + fail-open rate limiter, #9 SUSPENDED checks in guards/uploads/login, #10 storage hardening, #11 audit meta redaction, #12 generatePassword/policy.
- NEXT: proxy.ts exports + eslint cleanup + env.ts NOTIFY_FROM_EMAIL fix, then #3/#4/#2 (auth), #5, #6, #9, #10, #11, #12.

## [2026-09-27 03:46] IN PROGRESS: proxy.ts pure exports (normaliseHost/isRootHost/resolveRewrite), eslint cleanup, matcher tightened for /_sites; env.ts NOTIFY_FROM_EMAIL format
- DONE: `src/proxy.ts` now exports pure `normaliseHost`, `isRootHost(host, root?)`, `normalisePath`, `resolveRewrite(host, pathname, root?)` (+ `RewriteDecision` type); `proxy()` is a thin adapter — behaviour unchanged. Unused eslint-disable removed (control chars checked by charCode loop). Matcher now keeps `/_sites/**` inside the proxy even for asset-like paths (`(?!_sites)` guard). `src/config/env.ts`: NOTIFY_FROM_EMAIL accepts `Name <address>`; new optional `CRON_SECRET` (>=16 chars) for the maintenance route.
- NOTE: tests/unit/proxy.test.ts "prefers x-forwarded-host" fails by design (forwarded host is only trusted with VERCEL=1) → handoff to platform-dx.

## [2026-09-27 03:55] IN PROGRESS: #3 keyed session tokens (HMAC-SHA256 with SESSION_SECRET), __Host- cookie in prod, session rotation on login, revoke helpers; #4 constant-time login + generic lock message + per-account limiter; #2 safeNext hardening
- DONE #3: `src/server/auth/session.ts` — tokens are 256-bit base64url, stored as HMAC-SHA256(SESSION_SECRET, token); cookies `__Host-sf_admin` / `__Host-sf_super` in prod (Secure, Path=/, HttpOnly, SameSite=Lax); login rotates the session (old row deleted); `destroySession` deletes the row and returns who signed out; new `revokeSessions({tenantUserId|superUserId|tenantId})`; cookie value shape validated before any DB lookup. (Existing plain-SHA256 sessions become invalid on deploy — acceptable pre-launch.)
- DONE #4: `src/server/auth/actions.ts` — one generic message for unknown/inactive/locked/wrong password; bcrypt always runs (DUMMY_HASH when no account); per-IP + per-account (hashed username) limiters; lockout audited (`auth.locked`); logout audited; SUSPENDED tenants cannot log in.
- DONE #2: new pure `src/server/auth/redirect.ts#safeRedirectPath` (single leading `/`, rejects `//`, `/\`, `%2F`/`%5C` first segment, backslashes, control chars, credentials; must resolve to same origin; optional prefix). Used by login (`/admin`, `/super` prefixes) and `/api/lang?back=` (cookie now Secure in prod, no-store).
- DONE #12: `src/server/auth/password.ts` — policy min 10 chars, letters+digits, denylist of common passwords, no single repeated char, optional username check; `generatePassword` uses rejection sampling (no modulo bias) and loops until the policy passes (no fixed suffix); `DUMMY_HASH` exported.
- DONE #9 (guards): `requireTenantAdmin` redirects SUSPENDED tenants to `/` (public suspension page); `requireTenantAdminAction` throws `AuthError(SUSPENDED_MESSAGE, 403)`; new `AuthError` class and `requireSuperRole`.

## [2026-09-27 04:05] IN PROGRESS: #5 assertSameOrigin (Sec-Fetch-Site/Origin/Referer, fail closed, proxy-validated host), #6 atomic fail-open rate limiter, #11 audit meta redaction
- DONE #5: `src/server/api-auth.ts#assertSameOrigin` fails closed: rejects `Sec-Fetch-Site` other than same-origin/none; requires Origin (or Referer) to match the proxy-validated `x-request-host` (falls back to Host, never to x-forwarded-host); missing both headers → 403; non-http(s) origins → 403.
- DONE #6: `src/server/rate-limit.ts` — hit counter advanced with an atomic `increment` + RETURNING (no read-then-write admit race); window reset is a conditional update (`where: {id, windowEnd < now}`) so only one racer resets; DB errors FAIL OPEN with `ratelimit.degraded` log; `clientIp` validates IP shape (else "unknown"); new `purgeExpiredRateLimits`. Existing tests pass (7/7).
- DONE #11: `src/server/audit.ts#redactMeta` masks values under credential-like keys (password/secret/token/hash/cookie/session/api key/otp…), bounds depth 6 / arrays 100 / strings 2000 / total 16 KB; actor/action fields length-capped; failures logged via `log.error`.
- DONE (storage prep): `src/server/auth/hmac.ts` — `hmacHex(purpose, input)` (domain-separated HMAC-SHA256 with SESSION_SECRET) + `timingSafeEqualHex`; session.ts now uses it.

## [2026-09-27 04:20] IN PROGRESS: #10 storage (SVG super-only, confirm token for anonymous uploads, HEAD content-type check, CRLF-safe filenames, signed content-type/length on PUT, purge helper), /api/cron/maintenance, tenant.ts host fallback validation
- DONE #10: `src/server/storage/r2.ts` — SVG moved to `SUPER_ONLY_TYPES` (platform owner only); `normaliseMime`; `buildKey` validates the extension; `keyBelongsTo` also rejects `//`; `safeFilename` strips directories, control chars (CRLF), quotes, backslashes, semicolons, caps at 100 chars and emits ASCII `filename=` + RFC 5987 `filename*=`; presigned PUT now signs `content-type` + `content-length` (browser must send exactly what was reserved). `src/server/storage/media.ts` — presign returns a `token` = HMAC("media-confirm", mediaId); anonymous (PUBLIC) confirm requires the token AND `createdBy = public` AND PRIVATE visibility (no probing/confirming other visitors' rows); confirm compares HEAD size AND content-type (mismatch deletes object+row, 409); SUSPENDED tenant → 403 for presign/confirm/download/delete (SUPER exempt); tenantId override only for SUPER; `purgeUnconfirmedMedia` (1 h TTL, objects + rows, bounded batch) + 2 % opportunistic call from presign. Routes: id/token shapes validated, body size capped (presign 4 KB), `Retry-After` on 429, download redirect `no-store` + `Referrer-Policy: no-referrer`, optional `?name=` sanitised; errors go through `log.error`. `src/lib/upload-client.ts` passes the token and uses the same normalised MIME for presign and PUT.
- DONE: new `src/app/api/cron/maintenance/route.ts` — GET, `Authorization: Bearer CRON_SECRET` (constant-time compare, 404 when unset); purges expired sessions, rate-limit windows, unconfirmed media; per-task isolation + structured logs.
- DONE: `src/server/tenant.ts#currentHost` validates the hostname shape (RFC 1123, port/trailing dot stripped) before any DB lookup; `src/app/api/csp-report` uses `log.warn` (eslint no-console clean).
- CHECKS: `npx tsc --noEmit` clean; `npx eslint <all boundary files>` clean; vitest: all suites in my area pass (proxy 7/8 — the 1 failure is the platform-dx x-forwarded-host expectation, see Handoffs; the unrelated `utils.test.ts` failures belong to another stream's in-flight edits).

## Handoffs
- **platform-dx** (`tests/unit/proxy.test.ts`): the "prefers x-forwarded-host" case must stub `VERCEL=1` (forwarded host is only trusted on Vercel by design); please add unit tests for the now-exported pure helpers `normaliseHost`, `isRootHost(host, root)`, `normalisePath`, `resolveRewrite(host, pathname, root)` (src/proxy.ts), `safeRedirectPath` (src/server/auth/redirect.ts), `redactMeta` (src/server/audit.ts), `passwordPolicy`/`generatePassword` (src/server/auth/password.ts), `safeFilename` (src/server/storage/r2.ts), `assertSameOrigin` (src/server/api-auth.ts).
- **platform-dx** (`.env.example`, `docs/DEPLOY.md`, `vercel.json`): add `CRON_SECRET=` (>=16 chars, `openssl rand -hex 24`) and a Vercel cron entry `{"crons":[{"path":"/api/cron/maintenance","schedule":"0 3 * * *"}]}`; document that `SESSION_SECRET` rotation logs everyone out (session hashes are keyed).
- **platform-dx** (`src/app/api/health/route.ts`): the unauthenticated health body exposes commit SHA, branch, region and Node version to anyone. Suggest returning only `{status,time}` publicly and the build block only when `Authorization: Bearer CRON_SECRET` matches.
- **services-modules / admin-ux** (`src/modules/shared/users-actions.ts`, `src/server/super/users-actions.ts`, `src/server/super/tenants-actions.ts`): call `revokeSessions({ tenantUserId })` / `revokeSessions({ superUserId })` (src/server/auth/session.ts) after every password reset, self password change (optionally keep the current session), deactivation and role change; call `revokeSessions({ tenantId })` inside `setTenantStatus(..., "SUSPENDED")`. Use `requireSuperRole(user, ["SUPERADMIN"])` (src/server/auth/guards.ts) for tenant delete/status and super-user management instead of ad-hoc role checks.
- **admin-ux / super** (`src/components/admin/shared/user-forms.tsx`, `src/components/admin/super/super-users.tsx`, zod `min(8)` in `src/server/super/users-actions.ts` + `tenants-actions.ts`): password policy is now 10+ chars (letters + digits, not a common password). Update `minLength={8}` / help text / zod `.min(8)` to 10 so users get the right message client-side; `passwordPolicy(pw, { username })` also rejects passwords containing the username — pass it where the username is known.
- **commerce** (`src/modules/ecommerce/actions.ts#placeOrder`, `#applyCoupon`, `#trackOrder`, `#submitPrescription`; `src/modules/restaurant/actions.ts#placeFoodOrder`, reservations): these public actions never check `tc.tenant.status === "SUSPENDED"` (the leads module does via `publicFormGuard`). Add the check (or route through `publicFormGuard`) so a suspended shop cannot take orders. Rate-limit buckets containing raw phone numbers are fine (bucket length is now capped).
- **tenant-site** (`src/app/_sites/[host]/(site)/layout.tsx`): DRAFT tenants are publicly browsable; suggest a "coming soon" page for `status === "DRAFT"` unless a tenant-admin session exists, and `robots: noindex` for DRAFT/SUSPENDED.
- **services-modules** (`src/server/notify.ts`): strip CR/LF from `subject` (`subject.replace(/[\r\n]+/g, " ")`) before sending — visitor-controlled names end up in the subject line.
- **templates** (`src/templates/ui/index.tsx` RichText): confirmed the services-modules finding — markdown link hrefs need an `https?:|mailto:|tel:|/|#` allow-list (stored XSS otherwise).

## [2026-09-27 04:35] Security stream — final summary
- FIXED (all 12 audit findings): #1 proxy host/headers/matcher, #2 open redirects, #3 keyed sessions + __Host- cookies + rotation + revocation, #4 login enumeration/timing + per-account limits + lock audit, #5 fail-closed CSRF/Origin guard, #6 atomic fail-open rate limiter, #7 CSP (enforced pragmatic + nonce report-only) / HSTS / frame-ancestors / Referrer-Policy / Permissions-Policy / COOP, #8 env production rules, #9 SUSPENDED enforcement in guards, login and media, #10 storage hardening (SVG, confirm token, HEAD type check, CRLF-safe filenames, signed PUT headers, purge), #11 audit redaction, #12 unbiased password generator + stronger policy. Plus: pure proxy helpers for tests, maintenance cron route, CRON_SECRET, tenant host validation.
- REMAINING RISKS (not fixable inside this boundary or by design):
  1. Strict nonce CSP is report-only; `'unsafe-inline'` scripts remain allowed by the enforced policy until reports are quiet (promote in proxy.ts by renaming the header). Inline `style` attributes require `'unsafe-inline'` for styles.
  2. Session revocation on password change / deactivation / suspension depends on callers adopting `revokeSessions` (handoff). Until then sessions live up to 14 days.
  3. Commerce public actions don't honour SUSPENDED (handoff). DRAFT sites are public (handoff).
  4. Rate limiting fails open when Postgres is down (deliberate availability trade-off, logged).
  5. Rate-limit rows with `tenantId = NULL` can duplicate under a first-hit race (Postgres treats NULLs as distinct in the unique index); each duplicate still counts every hit, so the limit holds. A `NULLS NOT DISTINCT` index (data-layer) would remove the duplicates.
  6. No MFA for super admins; no IP allow-list for /super. Recommended before handling real customer data at scale.
  7. Uploaded documents (pdf/doc/zip) are not malware-scanned; only tenant staff can download them, via 60 s signed URLs.
  8. Health endpoint leaks build metadata (handoff).
- SECURITY-READINESS: **82/100**. Auth, tenant isolation, CSRF, storage and headers are now production-grade and defence-in-depth; the deductions are for the report-only strict CSP (-5), pending cross-stream adoption of session revocation / SUSPENDED checks in commerce (-6), no MFA / IP restriction on the platform admin (-4), and the absence of automated security tests for the new pure helpers until platform-dx adds them (-3).
- NEXT: none for this stream (done). Orchestrator: commit; route the Handoffs above.
