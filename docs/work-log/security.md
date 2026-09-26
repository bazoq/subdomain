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
