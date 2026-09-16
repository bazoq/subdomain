# Engineering conventions (read before writing any code)

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · Prisma 7 (Supabase Postgres) · Cloudflare R2 · Vercel.
**Never** add dependencies without noting it in your final report. Do not touch `package.json`, `globals.css`, `schema.prisma`, `proxy.ts` unless your task says so.

## Routing model

- Root host (`localhost` / `ROOT_DOMAIN`) → `src/app/(super)/**` (super site + `/super` admin).
- Tenant hosts are rewritten by `src/proxy.ts` to `src/app/_sites/[host]/**`. Inside that folder:
  - `(site)/**` public website pages (wrapped by the template `Layout`).
  - `admin/(dashboard)/**` tenant admin (wrapped by `AdminShell`, auth enforced in layout).
  - `admin/login` login page.
- API routes are shared: `src/app/api/**`. They resolve the caller with `resolveActor()` from `src/server/api-auth.ts`.
- Pages receive `params`/`searchParams` as **Promises** (`const { id } = await params`).
- Every tenant page is dynamic (DB per request). Do not use `"use cache"`; do not use `unstable_cache`.

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
- Call `revalidatePath("/", "layout")` after mutations that affect the public site.
- Money is integer PKR. Phone numbers: normalise with `normalizePkPhone()`; store the normalised value.

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

- Server action: `requireTenant()`, honeypot field `website` must be empty, `rateLimit({ bucket: \`form:${formKey}:${ip}\`, limit: 5, windowSec: 600, tenantId })`, zod, then create the row, `audit` not needed. Return `success(t(ui.thankYou, lang))`.
- Leads go to `Lead` with a `formKey` (`contact`, `quote`, `consultation`, `property_inquiry`, `employer_request`, `custom_cake`, `trial`...). Specific modules have their own tables (`Application`, `Booking`, `Reservation`, orders).
- Store uploaded private files by Media id in `fileIds` / `cvMediaId` etc.

## Storefront UI kits (modules)

- Each module exposes React components under `src/modules/<module>/ui/*` that templates compose: they must be **theme-agnostic** (use `t-*` colour utilities, `.t-btn`, `.t-card`, `.t-input`, `font-heading`, `rounded-t`) and accept a `ctx: SiteContext` prop plus data.
- Client components that need money formatting import `formatPKR` from `@/lib/utils`; localized text via `t(value, ctx.lang)` from `@/lib/i18n`; UI strings via `ui.xyz`.
- Cart state lives in `localStorage` keyed per host (`sf_cart:<host>`), exposed via a `CartProvider` in the module.
- Links to module pages are fixed paths: `/shop`, `/shop/[slug]`, `/shop/c/[category]`, `/cart`, `/checkout`, `/order/[number]`, `/menu`, `/track/[number]`, `/jobs`, `/jobs/[slug]`, `/packages`, `/packages/[slug]`, `/properties`, `/properties/[slug]`, `/services`, `/services/[slug]`, `/team`, `/team/[slug]`, `/gallery`, `/contact`, `/blog`, `/blog/[slug]`, `/p/[slug]`.

## Code style

- Server Components by default; `"use client"` only where state/effects are needed.
- Small, typed helpers; no `any`. Reuse `cn`, `slugify`, `formatPKR`, `formatDate`.
- Run `npx tsc --noEmit` and fix all errors before finishing. Do not run `next build`.
