########## FROM security
- **platform-dx** (`tests/unit/proxy.test.ts`): the "prefers x-forwarded-host" case must stub `VERCEL=1` (forwarded host is only trusted on Vercel by design); please add unit tests for the now-exported pure helpers `normaliseHost`, `isRootHost(host, root)`, `normalisePath`, `resolveRewrite(host, pathname, root)` (src/proxy.ts), `safeRedirectPath` (src/server/auth/redirect.ts), `redactMeta` (src/server/audit.ts), `passwordPolicy`/`generatePassword` (src/server/auth/password.ts), `safeFilename` (src/server/storage/r2.ts), `assertSameOrigin` (src/server/api-auth.ts).
- **platform-dx** (`.env.example`, `docs/DEPLOY.md`, `vercel.json`): add `CRON_SECRET=` (>=16 chars, `openssl rand -hex 24`) and a Vercel cron entry `{"crons":[{"path":"/api/cron/maintenance","schedule":"0 3 * * *"}]}`; document that `SESSION_SECRET` rotation logs everyone out (session hashes are keyed).
- **platform-dx** (`src/app/api/health/route.ts`): the unauthenticated health body exposes commit SHA, branch, region and Node version to anyone. Suggest returning only `{status,time}` publicly and the build block only when `Authorization: Bearer CRON_SECRET` matches.
- **services-modules / admin-ux** (`src/modules/shared/users-actions.ts`, `src/server/super/users-actions.ts`, `src/server/super/tenants-actions.ts`): call `revokeSessions({ tenantUserId })` / `revokeSessions({ superUserId })` (src/server/auth/session.ts) after every password reset, self password change (optionally keep the current session), deactivation and role change; call `revokeSessions({ tenantId })` inside `setTenantStatus(..., "SUSPENDED")`. Use `requireSuperRole(user, ["SUPERADMIN"])` (src/server/auth/guards.ts) for tenant delete/status and super-user management instead of ad-hoc role checks.
- **admin-ux / super** (`src/components/admin/shared/user-forms.tsx`, `src/components/admin/super/super-users.tsx`, zod `min(8)` in `src/server/super/users-actions.ts` + `tenants-actions.ts`): password policy is now 10+ chars (letters + digits, not a common password). Update `minLength={8}` / help text / zod `.min(8)` to 10 so users get the right message client-side; `passwordPolicy(pw, { username })` also rejects passwords containing the username — pass it where the username is known.
- **commerce** (`src/modules/ecommerce/actions.ts#placeOrder`, `#applyCoupon`, `#trackOrder`, `#submitPrescription`; `src/modules/restaurant/actions.ts#placeFoodOrder`, reservations): these public actions never check `tc.tenant.status === "SUSPENDED"` (the leads module does via `publicFormGuard`). Add the check (or route through `publicFormGuard`) so a suspended shop cannot take orders. Rate-limit buckets containing raw phone numbers are fine (bucket length is now capped).
- **tenant-site** (`src/app/_sites/[host]/(site)/layout.tsx`): DRAFT tenants are publicly browsable; suggest a "coming soon" page for `status === "DRAFT"` unless a tenant-admin session exists, and `robots: noindex` for DRAFT/SUSPENDED.
- **services-modules** (`src/server/notify.ts`): strip CR/LF from `subject` (`subject.replace(/[\r\n]+/g, " ")`) before sending — visitor-controlled names end up in the subject line.
- **templates** (`src/templates/ui/index.tsx` RichText): confirmed the services-modules finding — markdown link hrefs need an `https?:|mailto:|tel:|/|#` allow-list (stored XSS otherwise).
########## FROM commerce
- [services-modules] `src/server/notify.ts` line 25 (`safeSubject`) has literal U+2028/U+2029 bytes (E2 80 A8 / E2 80 A9) inside the regex character class after `\u007f`. JS treats them as line terminators → `TS1161 Unterminated regular expression literal` (3 errors, whole build fails). Replace with the escapes `\u2028\u2029`. Found 18:20 while running tsc; not in commerce ownership, not touched.
- [security] Commerce public actions now check `tc.tenant.status === "SUSPENDED"` inline (8 actions, after the honeypot, before rate limits/DB). `publicFormGuard` was not adopted because its honeypot branch returns `success` with no data and commerce clients need `{number:0, token:""}`; if the guard grows a `honeypotData` option we can switch.
- [platform-dx / tenant-site] `formatDate` in `src/lib/utils.ts` formats in the server TZ (UTC on Vercel); admin pages and invoices show times 5h early for PK. Add `timeZone: "Asia/Karachi"` (owned pages cannot change the helper). Reservation admin page already works around it locally.
- [platform-dx] `revalidatePath("/admin/orders")` etc. (pre-existing pattern everywhere) targets the public path while the route lives under `/_sites/[host]/…` via rewrite — please verify it invalidates the intended segment in Next 16 or switch the codebase to `revalidateTag`. Commerce relies on it for storefront stock badges after cancellations.
- [data-layer] No schema change needed for this wave (tokens are HMAC-derived, idempotency uses the RateLimit table). Nice-to-have later: `Order.idempotencyKey String?` + `@@unique([tenantId, idempotencyKey])` and same on FoodOrder, which would let idempotency survive RateLimit cleanup and remove the lock rows.
- [security] The `RateLimit` table doubles as the idempotency lock store (`idem:*` buckets, 24h windowEnd). `purgeExpiredRateLimits` must keep honouring `windowEnd` (it does) — do not add a shorter global TTL.
## Entries
########## FROM data-layer
- [platform-dx] `package.json` `"db:seed": "tsx prisma/seed.ts"` fails at runtime (`Cannot find module 'server-only'` — verified with a tsx smoke import). Change to `tsx --tsconfig tsconfig.seed.json prisma/seed.ts` (identical to the `migrations.seed` command in prisma.config.ts) or delete the script and document `npx prisma db seed` only. DEPLOY.md already says `npx prisma db seed`.
- [platform-dx] `.env.example`: add commented optional vars `SEED_SUPER_USERNAME/EMAIL/PASSWORD`, `SEED_DEMO_PASSWORD`, `SEED_DEMO_TEMPLATES` (`all|first|<ids/categories>`), `SEED_DEMO_TENANTS=0`, `DB_POOL_MAX`, `DB_LOG_QUERIES=1`, `CRON_SECRET` (all documented in docs/DEPLOY.md §0/§8). Also fix the DIRECT_URL comment: it is used by all Prisma CLI commands (migrate, db seed, studio), not only migrations.
- [super-site] Out-of-boundary `SiteSection` writers do not expire the content cache: `src/server/super/tenants-actions.ts` (tenant create → `createMany` sections; template switch → `migrateTenantSections`; tenant delete) and the callers of `src/server/super/provision.ts`. Add `revalidateTenantContent(tenantId)` from `@/server/content/cache` right after each of those writes (call it in the action, not in provision.ts, which must stay free of Next imports for the seed). Until then a template switch is visible on the public site after at most 60 s (CONTENT_TTL_SECONDS).
- [commerce] Schema now has `Order.idempotencyKey String?` / `FoodOrder.idempotencyKey String?` with `@@unique([tenantId, idempotencyKey])` (migration `20260927182500_order_idempotency_key`). To adopt: write the key on create; on `isUniqueViolation(e, "idempotencyKey")` (from `@/server/db`) re-read `findUnique({ where: { tenantId_idempotencyKey: … } })` and return that order; the RateLimit lock rows can then go. Optional: `withDbRetry(fn, { retryOnUnique: true })` for the per-tenant order-number max+1 race, replacing the hand-rolled P2002 retry.
- [super-site] `npx tsc --noEmit` currently fails outside this boundary: `src/app/(super)/(site)/page.tsx(265)` passes `source="home"` to `LeadForm` (`src/components/super-site/lead-form.tsx`) which has no such prop — in-progress super-site work committed mid-change in checkpoint 3. All data-layer files type-check (this is the only error in both tsconfigs).
- [security] `RateLimit @@unique([tenantId, bucket])` does not dedupe global buckets (tenantId NULL — NULLs are distinct in Postgres unique indexes). Harmless today (rows are looked up by id/bucket and purged by windowEnd) but a partial unique index `WHERE "tenantId" IS NULL` cannot be expressed in Prisma schema without permanent `migrate dev` drift; if global buckets ever need a hard uniqueness guarantee, add a hand-written migration and accept the drift, or key global buckets with a sentinel tenantId.
- [commerce / services-modules] Status columns kept as `String` (Reservation/Booking/Prescription.status, Coupon.type) to avoid breaking concurrent streams; convert to enums in a later wave once `where: { status: string }` call sites are stable.
---
########## FROM services-modules
- **templates stream (`src/templates/ui/index.tsx` RichText.inline):** markdown link renderer emits `<a href>` for any scheme, so `[x](javascript:alert(1))` in any rich-text field is stored XSS (tenant staff -> visitors). Needs an `http(s)|mailto|tel|/|#` allowlist. This stream sanitises on write as defence-in-depth, but existing rows are unaffected until the renderer is fixed.
- **admin-ux** (`src/components/admin/shared/user-forms.tsx` lines ~215-218): `minLength={8}` on password/confirm must become 10 to match `passwordPolicy` (server now enforces 10+ with letters+digits and rejects the username); add matching help text.
- **tenant-site** (`src/components/site/preview-banner.tsx`, `suspended.tsx`, `unknown-host.tsx`): reference `ui.previewTitle/previewText/openAdmin/unavailableEyebrow/siteNotSetUpTitle/siteNotSetUpText/visit` which do not exist in `src/lib/i18n` → 8 tsc errors at 18:50 (their in-flight work; not services-modules).
- **security / platform-dx** (`src/server/auth/session.ts`): `revokeSessions` has no "except current session" option; services-modules works around it by revoke-all + `createSession` re-issue in `changeOwnPassword`. A `revokeSessions({ tenantUserId, exceptTokenHash })` variant would avoid the extra row churn.
- **commerce** (`src/modules/ecommerce/actions.ts#submitPrescription`, restaurant custom-cake): consider `hasModule(tc, "medical")` / category check via `src/modules/shared/module-gate.ts` in the public actions, mirroring what recruiting/travel/gym actions now do.
- **data-layer**: `deleteTenantPrivateMedia` decrements `tenant.storageUsed`; confirm `Media.confirmed`/`size` are indexed for the `(tenantId, folder, confirmed)` lookups used by `findPrivateUpload`.
########## FROM super-site
- **data-layer** (`prisma/schema.prisma`): add `SuperLead.source String?` (page / template code the lead came from). `leads-actions.ts` currently appends "(via template:901)" to `message`; switch to the column once it exists.
- **security / platform-dx** (`src/server/admin-nav.ts`): `superNav` is unfiltered by design; `src/server/super/access.ts#navForRole` filters it per role. If nav entries are added, also extend `EDITOR_PREFIXES` there (or move the allow-list next to `superNav`).
- **admin-ux** (`src/components/admin/admin-shell.tsx`): nothing required; FYI EDITORs now get an extra "Account → Change password" nav group.
- **tenant-site**: `src/app/global-error.tsx` is yours (kept as-is). Root `sitemap/robots/manifest` now import your builders; if `buildTenantManifest`'s signature changes, update `src/app/manifest.ts`.
- **platform-dx**: consider `NEXT_PUBLIC_SITE_URL` in `.env.example` (used by `SITE_URL` for canonicals when the canonical host differs from ROOT_DOMAIN, e.g. `www.`); not added because `.env.example` is outside this stream.
- **security** (optional): `forbidden()` / `authInterrupts` would give a real 403 for EDITOR page access instead of the `/super?denied=1` redirect.
########## FROM tenant-site
- **super-site** (`src/app/sitemap.ts`, `robots.ts`, `manifest.ts`, `src/server/super/host-seo.ts`): builders now exist —
  `import { buildTenantSitemap, buildTenantRobots, buildTenantManifest, tenantIsIndexable, tenantPublicPaths } from "@/server/site-seo";`
  tenant branch: `return buildTenantSitemap(resolved.tc, resolved.host)` / `buildTenantRobots(resolved.tc, resolved.host)` /
  `buildTenantManifest(resolved.tc, lang)`; delete `tenantSitemapFallback` / `tenantRobotsFallback` / `tenantIsIndexable` /
  `tenantPublicPaths` from host-seo.ts. NB: on tenant hosts these root files are never reached (proxy rewrite) — the handlers under
  `src/app/_sites/[host]/` answer; the import only keeps the platform-host code path consistent. `src/app/global-error.tsx` now
  exists (tenant-site) — do not recreate; edit it if the platform wants different copy/colours.
- **commerce / services-modules / admin-ux** (every `(site)/**/page.tsx` `generateMetadata` except home): use
  `tenantPageMetadata(await requireTenant(), ctx.lang, { title, description, path, image, type })` from `@/server/site-seo` and
  return a bare `title` (no `· ${ctx.tenant.name}` — the layout template already appends ` | <name>`; today titles read
  "X · Name | Name"). Partial `openGraph: { images }` objects REPLACE the layout's og:site_name/locale/title — the helper builds the
  full object and adds the canonical URL. Detail pages: also render `<JsonLd data={breadcrumbJsonLd(tc, items)} />`
  (`@/components/site/json-ld`) and Product/JobPosting/Article JSON-LD where applicable.
- **services-modules** (`src/modules/shared/ui/site-footer.tsx` L92-97): replace the hard-coded "Powered by" `<a href="https://<brand>.pk">`
  with `<PoweredBy ctx={ctx} className=… />` from `@/templates/ui` (uses `rootUrl()` and honours the white-label toggle).
  `testimonials-carousel.tsx` / `gallery-grid.tsx`: verify `aria-roledescription="carousel"`, `aria-live="polite"` on the track,
  labelled prev/next buttons, pause on hover/focus and `prefers-reduced-motion` (global CSS now disables autoplay animations only).
- **data-layer / admin-ux** (`src/lib/tenant-settings.ts`, `settings-form.tsx`): add `branding.hidePoweredBy: z.boolean().default(false)`
  + a toggle — `parseSettings` strips unknown keys, so the kit's `hidePoweredBy()` can never be true today.
- **data-layer** (`prisma Domain`): a `verified Boolean` (DNS checked) would let `site-seo.ts` canonicalise the subdomain to the
  custom domain; until then every host is self-canonical (duplicate content between `slug.root` and the custom domain).
- **platform-dx / owner of `src/server/site.ts`**: `currentLang()` ignores `settings.languages.defaultLang` — recruiting
  catalog tenants default to `defaultLang: "ur"` but render English until the visitor toggles. Use
  `resolveLang(jar.get(LANG_COOKIE)?.value, tc.settings.languages)` (already in `@/lib/i18n`); the root layout mirrors whatever
  `getSiteContext` does, so change it in one place.
- **platform-dx** (`tests/unit`): add tests for `safeLinkHref` / `safeImageSrc` / `safeExternalUrl` (utils), `safeHex` /
  `safeFontName` / `themeVars` (theme), and `sitemapXml` / `robotsTxt` / `buildTenantRobots` / `tenantPublicPaths` /
  `localBusinessJsonLd` (site-seo; mock `@/server/db`). Also `proxy.test.ts`: assert `/sitemap.xml`, `/robots.txt`,
  `/manifest.webmanifest` on a tenant host rewrite to `/_sites/<host>/…`.
- **security** (`src/proxy.ts` / `next.config.ts` CSP): `settings.seo.googleAnalyticsId` / `facebookPixelId` are stored but never
  injected (would be blocked by `script-src 'self'` anyway). If/when analytics ship, allow `www.googletagmanager.com` +
  `connect.facebook.net` with the nonce. Minor: `favicon.ico` is excluded from the proxy matcher, so tenant hosts serve the
  platform's favicon.ico; `<link rel=icon>` from settings takes precedence in browsers, so low priority.
- **super-site** (optional): a signed preview link (`/?preview=<hmac>`) for super admins to view DRAFT tenant sites from the
  platform — today only a tenant-admin session on the tenant host bypasses the coming-soon page.
########## FROM admin-ux
- security / users-actions: pass `{ username }` to `passwordPolicy` in `createTenantUser`, `resetTenantUserPassword` (target user's username) and `changeOwnPassword` (ctx.user.username); UI already mirrors this.
- data-layer / settings: `tenantSettingsSchema` should validate `contact.phone/phone2/whatsapp` and `notifications.whatsappTo` with `normalizePkPhone` (reject instead of falling back to raw), `contact.email`/`notifications.emailTo` as email, `social.*`/`announcement.link` as safe URLs, `branding.*Color` as hex, `seo.title` ≤70 / `seo.description` ≤170.
- data-layer / media: add a usage lookup (sections JSON, products, menu items, posts) so the media library can block or precisely warn before delete.
- users-actions: an owner-facing "Unlock now" action (clear `lockedUntil`/`failedLogins`) for locked-but-active users.
- uploader.tsx (owner: whichever stream holds `src/components/admin/uploader.tsx`): give Replace/Remove buttons `aria-label`s and 40px targets; optionally prompt for alt text on upload.
- revokeSessions adoption for password reset/deactivate remains with security (already listed there).
########## FROM platform-dx
- **data-layer / commerce** (`src/modules/ecommerce/actions.ts`, `src/modules/restaurant/actions.ts`, `src/modules/travel/actions.ts`, `src/modules/recruiting/actions.ts`, `src/server/super/*-actions.ts`): VERIFIED against Next 16 docs (`revalidatePath.md`, "Using revalidatePath with rewrites"): `revalidatePath` operates on the route file structure and needs the *destination* path, so `revalidatePath("/admin/orders")`, `"/admin/products"`, `"/admin/kitchen"`, `"/admin/food-orders"`, `"/admin/reservations"`, `"/admin/coupons"`, `"/admin/shipping"`, `"/admin/prescriptions"`, `"/admin/bookings"`, `"/admin/applications"` (route files live under `/_sites/[host]/admin/(dashboard)/…`) are **no-ops** today. Nothing is broken because tenant pages are dynamic, but the calls are dead code and give a false sense of safety. Recommended pattern (documented in `docs/CONVENTIONS.md` → *Caching & revalidation*): delete those calls and keep one `revalidatePath("/", "layout")` per action (purges the client router cache); for section content use `revalidateTenantContent(tenantId)`; if a module later caches its own reads with `unstable_cache`, tag them `tenant-<module>:<tenantId>` and expose `revalidate<Module>(tenantId)` = `revalidateTag(tag, { expire: 0 })` (single-argument `revalidateTag` is deprecated in Next 16; `updateTag` is available inside Server Actions). The `/super/*` calls (`revalidatePath("/super/users")` etc.) DO match real route files under `src/app/(super)/super/...` only if the segment path is passed exactly — `(super)` is a route group, so `"/super/users"` is the correct file path there.
- **commerce** (`formatDate` TZ handoff): already resolved — `src/lib/utils.ts#formatDate` pins `Asia/Karachi` at HEAD. Nothing to do.
- **admin-ux** (`src/components/admin/shared/media-picker.tsx:61`): `react-hooks/set-state-in-effect` ERROR (resetting `selected`/`q` inside a `useEffect` on `open`) — the only eslint error in the repo; CI `npm run lint` fails until it is fixed (reset state in the open/close handler, or key the dialog body on `open`). Also a `react-hooks/exhaustive-deps` warning at line 52.
- **super-site** (`src/app/(super)/(site)/page.tsx:265`): `tsc` error — `source` prop passed to a component whose props are `{ defaultCategory?, compact?, className? }`. CI typecheck fails until fixed.
- **services-modules / commerce / super** (`no-console` warnings, non-blocking): `src/modules/shared/media.ts:22`, `src/modules/shared/public-form.ts:49,58`, `src/server/super/leads-actions.ts:88`, `src/server/super/tenants-actions.ts:367` → replace with `log.warn/error("…", errorFields(err))` from `@/lib/log`. (`src/server/notify.ts` is already migrated at HEAD.)
- **orchestrator**: `.gitattributes` (`* text=auto eol=lf`) was deliberately NOT added — it would renormalise every CRLF file in the next commit. Decide once, in a dedicated commit. `.editorconfig` already asks editors for LF.
- **security** (FYI, no action): `/api/health` now gates build/DB detail behind `Authorization: Bearer <CRON_SECRET>` as requested; public body is `{status,time}`.
- **super-site** (`src/components/super-site/header.tsx:39`): `react-hooks/set-state-in-effect` ERROR — the only remaining eslint error in `src` after the wave; CI `npm run lint` is red until fixed (derive the value during render or move the setState into the event/subscription callback).
- **tenant-site / super-site** (`src/app/global-error.tsx:43`): `// eslint-disable-next-line @next/next/no-html-link-for-pages` is now an *unused directive* warning because the rule is off globally (see eslint.config.mjs) — delete the comment line.
- **all streams** (FYI): `@next/next/no-html-link-for-pages` was producing false positives for every internal `<a href>` (root cause: `src/app/(super)/(site)/[...rest]/page.tsx` makes the rule generate a catch-all regex). It is now OFF in `eslint.config.mjs`; keep using `<Link>` for internal navigation per CONVENTIONS — the rule is not there to catch you any more.
## Log
########## FROM templates-a
---
- tenant-site / shared: `f.text("eyebrow")` in `src/templates/shared/sections.ts` (hero, about, features, testimonials,
  faq, gallery, contact, team, process) is a plain string → Urdu visitors see English eyebrows/defaults. Consider
  `f.localized("eyebrow")` + `ls()` defaults (templates render via `h.eyebrow` directly; `t()` already accepts strings,
  so switching the field type is backwards compatible if renderers wrap with `t(x, lang)`).
- shared/packs: category pack hero titles/subtitles are single-arg `ls("…")` (English only) — e.g.
  "Everything your kitchen needs", "Shoes made for Pakistani roads". Add Urdu second args.
- commerce: `src/server/notify.ts` currently fails tsc (unterminated regex, lines 25-27) — blocks a clean repo-wide tsc.
- tenant-site: `src/components/site/{preview-banner,suspended,unknown-host}.tsx` reference `ui.*` keys that do not
  exist yet (previewTitle, openAdmin, unavailableEyebrow, siteNotSetUp*) — tsc errors.
########## FROM templates-b
- shared/packs.ts (templates contract owner): `eyebrow` and destinations `note` are `f.text` — make them `f.localized` so
  catalog eyebrows ("Saudi · UAE · Qatar · Oman", "5 days from Rs 45,000") can carry Urdu; `note` should also be built from
  `formatPKR` rather than a hard-coded "Rs 45,000" string in defaults.
- commerce / server: `src/server/notify.ts(25,33)` TS1487 octal escape breaks `tsc --noEmit` repo-wide (introduced in bfde950).
- tenant-site / product: consider a per-menu-item "pairs with" field if bakery/05 pairing chips should be editable.
- modules/shared/ui/header-nav.tsx: `aria-label="Main"` / `"Mobile"` are English-only; localize via `ctx.lang`.
