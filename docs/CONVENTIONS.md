# Engineering conventions (read before writing any code)

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · Prisma 7 (Supabase Postgres) · Cloudflare R2 · Vercel.
**Never** add dependencies without noting it in your final report. Do not touch `package.json`, `globals.css`, `schema.prisma`, `proxy.ts` unless your task says so.
Multi-agent work follows the **work-log protocol** in `docs/work-log/README.md`: read `STATUS.md` + your stream file first, log an entry before ("IN PROGRESS") and after ("DONE") every task, edit only inside your ownership boundary, put cross-boundary findings under `## Handoffs`, never `git commit`.

## Routing model

- Root host (`localhost` / `ROOT_DOMAIN`) → `src/app/(super)/**` (super site + `/super` admin).
- Tenant hosts are rewritten by `src/proxy.ts` to `src/app/_sites/[host]/**`. Inside that folder:
  - `(site)/**` public website pages (wrapped by the template `Layout`).
  - `admin/(dashboard)/**` tenant admin (wrapped by `AdminShell`, auth enforced in layout).
  - `admin/login` login page.
- API routes are shared: `src/app/api/**`. They resolve the caller with `resolveActor()` from `src/server/api-auth.ts`.
- Pages receive `params`/`searchParams` as **Promises** (`const { id } = await params`).
- Every tenant page is dynamic (DB per request). Do not use `"use cache"`. The one cross-request cache is the tagged data cache for section rows in `src/server/content/cache.ts` (`unstable_cache`, tag `tenant-content:<tenantId>`); do not add other `unstable_cache` callers without a tenant-scoped tag and a `revalidate*` helper next to it (see *Caching & revalidation*).

## Getting the tenant / user

| Where | Call | Notes |
|---|---|---|
| Public site page/component | `const ctx = await getSiteContext()` (`@/server/site`) | `SiteContext`: tenant, settings, category, lang, sections, template |
| Public server action | `const tc = await requireTenant()` (`@/server/site`) | tenant from host; then rate-limit + zod |
| Tenant admin page | `const ctx = await requireTenantAdmin()` (`@/server/auth/guards`) | redirects to login; `ctx.user`, `ctx.tenant`, `ctx.settings`, `ctx.category` |
| Tenant admin server action | `const ctx = await requireTenantAdminAction()` | throws; wrap in try/catch and return `fail(message)` |
| Super admin page | `const user = await requireSuper()` | |
| Super admin action | `const user = await requireSuperAction()` | |

**Every Prisma query MUST include `tenantId: ctx.tenant.id` in `where` (and `data` on create).** Never accept a tenantId from a form. For `findUnique` by id use `findFirst({ where: { id, tenantId } })`.

## Server actions

- File starts with `"use server"`. Location: `src/modules/<module>/actions.ts` (tenant admin + public) or `src/server/super/<area>-actions.ts` (super).
- Signature for forms: `async function x(prev: ActionResult, fd: FormData): Promise<ActionResult>`; for JSON: `async function x(input: unknown): Promise<ActionResult<T>>`.
- Parse with zod (`safeParse`); on error return `fromZod(err)`; success returns `success("Saved.")` or `redirect(...)` (redirect must be **outside** try/catch or rethrown — simplest: return `success(msg, { id })` and let the client `router.push`).
- Use `json()` from `@/server/db` when writing to `Json` columns.
- Call `audit({...})` for create/update/delete/status changes.
- After a mutation call the matching invalidation helper (see *Caching & revalidation*): `revalidateTenantContent(tenantId)` for section content, `revalidatePath("/", "layout")` for everything else. Do **not** write `revalidatePath("/admin/…")` — it is a no-op under the host rewrite.
- Money is integer PKR. Phone numbers: normalise with `normalizePkPhone()`; store the normalised value.
- Wrap unexpected errors: `log.error("module.action_failed", errorFields(err))` then `return fail("Something went wrong.")` — never leak `err.message` to the client.

## Caching & revalidation

Facts (verified against `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`, Next 16):

- `revalidatePath` works on the **route file structure, not the URL**. With rewrites you must pass the *destination* path. Tenant admin lives at `src/app/_sites/[host]/admin/(dashboard)/orders/page.tsx`, so `revalidatePath("/admin/orders")` matches **no route** and does nothing; the correct path form would be `revalidatePath("/_sites/[host]/admin/(dashboard)/orders", "page")`, which invalidates that page for **every** tenant.
- Tenant pages are fully dynamic (no `"use cache"`, no ISR), so there is no full-route cache to purge. The only caches are (a) the **client router cache** — `revalidatePath("/", "layout")` inside a Server Action purges it (as does `router.refresh()`), and (b) the **tagged data cache** for section rows (`src/server/content/cache.ts`).
- `revalidateTag(tag)` with one argument is deprecated in Next 16; pass a profile: `revalidateTag(tag, { expire: 0 })` for read-your-own-writes in actions/route handlers, or `updateTag(tag)` inside Server Actions.

Rules:

| You changed … | Call |
|---|---|
| `SiteSection` rows (tenant-admin editor, provisioning, template switch, delete) | `revalidateTenantContent(tenantId)` from `@/server/content/cache` |
| anything else visible on the public site or in admin lists (products, orders, hours, settings) | `revalidatePath("/", "layout")` once, after the write |
| data you cache with `unstable_cache` in a new module | tag it `tenant-<module>:<tenantId>`, export `revalidate<Module>(tenantId)` = `revalidateTag(tag, { expire: 0 })`, call it from every write path |

Never call `revalidatePath` with a browser-visible tenant path (`/admin/...`, `/shop`, `/menu`); there is no such route file.

## Forms (client)

- Prefer `useActionState(action, idle)` with native `<form action={formAction}>` + `Input`/`Select`/`Textarea`/`Switch` from `@/components/ui/input`. Show `state.message` and `state.fieldErrors[name]`.
- Complex JSON (repeaters, localized fields, images) → client state + a JSON server action, like `SectionEditor`.
- Localized text fields: value shape `{ en: string; ur?: string }`. Show the Urdu input only when `urduEnabled`. Use the `FieldsForm` component from `@/components/admin/section-editor` when a form is mostly localized/repeater fields.
- Images: `ImageField` / `ImagesField` (public URLs) and `FileField` (private, returns Media id) from `@/components/admin/uploader`.
- After success: `useToast().push("success", msg)` and `router.refresh()` / `router.push()`.
- Delete buttons: `ConfirmButton` from `@/components/ui/dialog` inside a `<form action={deleteAction.bind(null, id)}>`.

## Admin UI

- Wrap pages with `<PageHeader title description actions />`; lists use `Table/THead/TBody/TR/TH/TD` + `Pagination`; empty lists use `EmptyState`.
- Status pills: `<StatusBadge status={x} />`. Stat tiles: `StatCard`.
- List pages read `searchParams` (`q`, `status`, `page`) and query with `take: 25`, `skip`.
- Routes must match `src/server/admin-nav.ts` exactly (e.g. `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/products/categories`).
- Public forms use `.t-input`, `.t-btn t-btn-primary` classes so they inherit the template theme.

## Public forms (visitors)

- Server action: start with `publicFormGuard` from `@/modules/shared/public-form` — it resolves the tenant, swallows honeypot submissions (pretend success), refuses `SUSPENDED` tenants, and rate-limits per IP (default 5 / 10 min, fail-open with a log line):
  ```ts
  const g = await publicFormGuard({ bucket: `form:${formKey}`, honeypot: fd.get("website") as string });
  if (!g.ok) return g.result;
  const { tc, lang, ip } = g;
  // zod → create row scoped by tc.tenant.id → notifyNewLead(...) → return success(t(ui.thankYou, lang))
  ```
  Wrap the body in try/catch and return `publicFailure(lang, err)` (bilingual, non-leaking). `audit` is not needed for visitor submissions. Every public action that writes (orders, reservations, applications) goes through the guard — do not hand-roll `requireTenant()` + `rateLimit()`.
- Leads go to `Lead` with a `formKey` (`contact`, `quote`, `consultation`, `property_inquiry`, `employer_request`, `custom_cake`, `trial`...). Specific modules have their own tables (`Application`, `Booking`, `Reservation`, orders).
- Store uploaded private files by Media id in `fileIds` / `cvMediaId` etc.

## Notifications (`@/server/notify`)

- Best-effort, never throws into a user flow: every function resolves to `false` on failure and logs `notify.*`.
- `notifyNewLead(tc, { kind, ... })` for leads/applications/bookings/orders — builds subject + text + a WhatsApp reply link (`buildNotification`) and emails the tenant's notification address (Settings → Notifications, falling back to the contact email). `notifyTenant(tc, { subject, text, html? })` for anything else; `sendEmail(to, subject, text, html?)` is the raw Resend call (no-op without `RESEND_API_KEY`).
- Subjects may contain visitor text: they are passed through `safeSubject` (CR/LF stripped, 200 chars). Do not build subjects that bypass it.
- WhatsApp: `tenantWhatsAppLink(tc, text)` / `replyWhatsAppLink(visitorPhone, text)` return `wa.me` links (or `null`); phone numbers go through `normalizePkPhone()` first.
- Fire notifications **after** the DB write succeeds, and never `await` them inside the transaction.

## Logging (`@/lib/log`)

- `console.*` is banned in `src/` (ESLint `no-console`; the only exception is `src/lib/log.ts`). Use `log.debug|info|warn|error("dotted.event", { fields })`: one JSON line per call, parsed by Vercel log drains.
- Event names are `area.event` in snake case (`auth.locked`, `cron.maintenance`, `notify.email_failed`, `order.created`). Fields are plain values (ids, counts, hosts) — **never** passwords, tokens, cookies, full request bodies or connection strings.
- Serialise a caught error with `errorFields(err)` (name, message, digest; stack only outside production).
- Uncaught server errors are already reported by `src/instrumentation.ts#onRequestError` — do not add a second global handler. `LOG_LEVEL` controls verbosity (default `info`, `debug` in dev). Tests can capture output with `setLogSink`.

## Environment variables

- Read server env through `env` from `@/config/env` (zod-validated, `server-only`), never `process.env.X` in app code — the exceptions are `next.config.ts`, `src/proxy.ts`, the logger and the health/instrumentation files, which run before/without the validated object.
- Adding a variable means three edits: the zod schema in `src/config/env.ts`, a documented line in `.env.example`, and the table in `docs/DEPLOY.md §0`. Secrets are never `NEXT_PUBLIC_`.

## Tests (Vitest)

- `npm test` runs `tests/**/*.test.ts` (and colocated `src/**/*.test.ts`) in Node with **no database**: `tests/setup.ts` supplies dummy env, `server-only` is aliased to a stub, and anything that imports `@/server/db` (or `next/headers`) is replaced with `vi.mock(...)` at the top of the test file (see `tests/unit/audit-redact.test.ts`, `tests/api/health.test.ts`).
- Write pure helpers so they can be tested directly (`src/proxy.ts#resolveRewrite`, `src/server/auth/redirect.ts`, `src/modules/restaurant/hours.ts` are the pattern) and add a test whenever you add one. Security-relevant helpers (host/path normalisation, redirects, tokens, filenames, CSRF) must have negative tests for the bypasses they are meant to stop.
- Modules whose behaviour depends on env read at import time (`ROOT_DOMAIN`, `VERCEL`) are re-imported after `vi.stubEnv` + `vi.resetModules()` (see `tests/unit/proxy.test.ts`).
- CI (`.github/workflows/ci.yml`) runs `gen:templates` freshness, lint, typecheck, tests (Node 20 + 22) and a production build; `npm run check` runs the same locally.

## Storefront UI kits (modules)

- Each module exposes React components under `src/modules/<module>/ui/*` that templates compose: they must be **theme-agnostic** (use `t-*` colour utilities, `.t-btn`, `.t-card`, `.t-input`, `font-heading`, `rounded-t`) and accept a `ctx: SiteContext` prop plus data.
- Client components that need money formatting import `formatPKR` from `@/lib/utils`; localized text via `t(value, ctx.lang)` from `@/lib/i18n`; UI strings via `ui.xyz`.
- Cart state lives in `localStorage` keyed per host (`sf_cart:<host>`), exposed via a `CartProvider` in the module.
- Links to module pages are fixed paths: `/shop`, `/shop/[slug]`, `/shop/c/[category]`, `/cart`, `/checkout`, `/order/[number]`, `/menu`, `/track/[number]`, `/jobs`, `/jobs/[slug]`, `/packages`, `/packages/[slug]`, `/properties`, `/properties/[slug]`, `/services`, `/services/[slug]`, `/team`, `/team/[slug]`, `/gallery`, `/contact`, `/blog`, `/blog/[slug]`, `/p/[slug]`.

## Code style

- Server Components by default; `"use client"` only where state/effects are needed.
- Internal navigation uses `<Link>` from `next/link` (works on tenant hosts through the rewrite). Plain `<a>` only for cross-host links, `mailto:`/`tel:`/`wa.me`, file downloads, and inside `global-error.tsx` (the router may be unavailable there). The `@next/next/no-html-link-for-pages` lint rule is switched off because a root-level dynamic route makes it flag every internal href — the convention still stands; reviewers enforce it.
- Small, typed helpers; no `any`. Reuse `cn`, `slugify`, `formatPKR`, `formatDate` (pins `Asia/Karachi` — do not format dates with bare `toLocale*` calls).
- Type-only imports use `import type` / inline `type` specifiers (lint rule); `const` over `let`; `===` (`eqeqeq smart`).
- Run `npm run check` (`eslint` + `tsc --noEmit` + `vitest run`) and fix everything in your files before finishing. Do not run `next build` locally — CI does it on every push.
