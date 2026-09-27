# Stream: services-modules

**Owner:** services-modules agent
**Ownership (only edit):** `src/modules/{recruiting,travel,realestate,gym,law,printing,leads,shared}/**`,
`src/components/admin/{recruiting,realestate,travel,shared}/**`, `src/components/admin/{testimonial-form.tsx,uploader.tsx}`,
`src/app/_sites/[host]/(site)/{jobs,employers,packages,properties,classes,plans,join,consultation,quote,upload-prescription,services,team,gallery,faq,contact,custom-cake,p,blog}/**`,
`src/app/_sites/[host]/admin/(dashboard)/{applications,jobs,packages,bookings,properties,classes,plans,services,team,gallery,faq,testimonials,leads,prescriptions,pages,posts}/**`,
`src/server/notify.ts`.
**Rules:** never `git commit`; DB not reachable (reason from code); tsc + eslint clean before every entry.

## [2026-09-27 10:00] Audit complete (read-only pass)
- DONE: read AGENTS.md, PLAN.md, CONVENTIONS.md, schema (recruiting/travel/realestate/gym/shared/Lead/Media/RateLimit), all owned module code, admin components, public + admin routes, rate-limit/notify/site-content/storage infra.
- FOUND (to fix, in ownership):
  1. `notify.ts`: `sendEmail` can reject (network) - callers rely on `.catch`; no timeout; no WhatsApp builder; no per-lead-type templates; admin links are relative (useless in email).
  2. `leads/actions.ts submitLead`: `extra` JSON accepted unvalidated (any shape); `fileIds` not restricted to PRIVATE; no duplicate-submit guard; rate-limit message EN only; `deleteLead` has no audit; property/plan/service ids inside `extra` never verified against tenant.
  3. Recruiting: application status is any->any (no state machine); CV media not checked for document mime; no duplicate application guard; deleting an application orphans the private CV object; rate-limit message EN only.
  4. Travel: booking `date` not validated against departures/past; no duplicate guard; booking status any->any; `nights` may exceed `days`; no per-person total shown.
  5. Real estate: `mapEmbedUrl` accepts any URL containing `output=embed` (iframe to arbitrary host); `videoUrl`/`mapUrl` zod `.url()` accepts `javascript:`; detail-page map iframe has no sandbox; min/max price not swapped when inverted.
  6. Gym: `togglePlan` does not validate `field`; toggles lack audit; no trainer overlap check for classes; trial form text inputs lack labels.
  7. Shared: RichText link renderer (templates/ui, NOT mine) allows `[x](javascript:...)` - mitigate on write by sanitising rich text in every admin action; image URL fields accept any string; testimonial `text.en` may be empty; team social URLs unrestricted; `getPosts/getPost` and blog pages show posts whose `publishedAt` is in the future; toggles lack audit.
  8. Public forms a11y: ContactForm / QuoteForm inputs have no labels (placeholder only), message boxes lack `role`.
  9. Module pages (/jobs, /employers, /packages, /properties) do not 404 for tenants without that module.
- NEXT: create shared validation + public-form helpers, rewrite notify.ts, then fix modules in order leads -> recruiting -> travel -> realestate -> gym -> shared -> pages.

## Handoffs
- **templates stream (`src/templates/ui/index.tsx` RichText.inline):** markdown link renderer emits `<a href>` for any scheme, so `[x](javascript:alert(1))` in any rich-text field is stored XSS (tenant staff -> visitors). Needs an `http(s)|mailto|tel|/|#` allowlist. This stream sanitises on write as defence-in-depth, but existing rows are unaffected until the renderer is fixed.

## [2026-09-27 14:10] [resume] state reconciled
- VERIFIED (tsc clean at resume): previous agent's uncommitted work is complete and compiles:
  - `src/modules/shared/validation.ts` (zPhone/zEmailOptional, http(s)-only URL + image URL schemas, `sanitizeRichText`/`sanitizeLocalized`, `parseExtraFields`, `todayPk`, ISO_DATE).
  - `src/modules/shared/public-form.ts` (`publicFormGuard`: tenant -> honeypot -> suspended check -> rate limit (fail-open with log); bilingual `publicMessages`; `publicFailure`).
  - `src/server/notify.ts` rewritten: 8s timeout, never throws, `notifyNewLead` + `buildNotification` per lead type (application/booking/lead), WhatsApp builders, absolute admin links.
  - `src/modules/leads/actions.ts`: fix group #2 DONE (extra parsed+bounded, per-form enrichment verifying property/plan/service ids against tenant, PRIVATE+confirmed fileIds only, 2-min duplicate guard, bilingual messages, audit on delete, notifyNewLead).
  - `src/modules/recruiting/constants.ts`: state machine helpers (`canTransitionApplication`, `allowedApplicationTransitions`), `CV_MIME_TYPES`, `APPLICATION_DUPLICATE_HOURS` added — NOT yet wired into actions.
- PENDING: #1 (notify callers in recruiting/travel still use old `notifyTenant` text), #3 recruiting actions, #4 travel, #5 realestate, #6 gym, #7 shared, #8 forms a11y, #9 module 404s.
- NEXT: recruiting actions (wire state machine, CV mime, duplicate guard, CV delete, bilingual) then travel.

## [2026-09-27 14:20] IN PROGRESS: recruiting (#3) + notify callers (#1)
- Plan: applySchema -> zPhone/zEmailOptional; publicFormGuard("apply"); CV must be PRIVATE+confirmed+document mime+folder cv, not reused; 24h duplicate guard (same job+phone => idempotent success, new CV replaces old); status state machine enforced server-side + admin UI disables invalid moves; deleteApplication removes orphaned CV object; notifyNewLead(kind application); bilingual messages in strings.ts; new `src/modules/shared/media.ts` (deleteTenantPrivateMedia).

## [2026-09-27 14:40] DONE: recruiting (#3) + notify callers for applications (#1)
- DONE: `src/modules/recruiting/actions.ts` rewritten — publicFormGuard("apply"), zPhone/zEmailOptional (schema.ts), phone normalised, CV must be confirmed PRIVATE upload in folder `cv` with PDF/DOC/DOCX mime (wrong type -> object deleted + bilingual error), CV cannot back two applications, 24h duplicate guard (same job+phone => idempotent success, replaces CV, deletes old object), notifyNewLead(kind "application"), rich text sanitised on job upsert, status transitions enforced via canTransitionApplication (audit records from/to), deleteApplication removes orphaned CV object, revalidatePath on every write.
- DONE: `src/modules/shared/media.ts` (new): `deleteTenantPrivateMedia`, `findPrivateUpload` — reusable by prescriptions/quote files.
- DONE: `src/components/admin/recruiting/application-status-form.tsx` — disables illegal transitions, shows allowed moves, surfaces server fieldError.
- DONE: bilingual strings added to `recruiting/strings.ts` (alreadyApplied, jobUnavailable, jobClosed, cvInvalid, cvWrongType).
- tsc + eslint clean.
- NEXT: travel (#4).

## [2026-09-27 14:41] IN PROGRESS: travel (#4)
- Plan: booking state machine in constants; bookingSchema zPhone/zEmailOptional; createBooking via publicFormGuard, date >= today (PK) and in departures when the package publishes departures, 24h duplicate guard, notifyNewLead(kind booking); upsertPackage nights<=days + sanitised rich text + image URL validation; BookingForm shows per-person x travellers total; BookingStatusSelect disables illegal moves.

## [2026-09-27 15:00] DONE: travel (#4) + notify caller for bookings (#1)
- DONE: `travel/constants.ts` booking state machine (`canTransitionBooking`, `allowedBookingTransitions`, `isBookingStatus`), BOOKING_DUPLICATE_HOURS, BOOKING_MAX_DAYS_AHEAD.
- DONE: `travel/schema.ts` zPhone/zEmailOptional, images via zImageUrlList(12), `nights <= days` refine.
- DONE: `travel/actions.ts` — publicFormGuard("booking"), date must be today+ (Asia/Karachi), <= 2y ahead, and one of the published upcoming departures when any exist; 24h duplicate guard (idempotent); notifyNewLead(kind "booking") with per-person + estimated total; rich text sanitised on package upsert; booking status transitions enforced + audited from/to; revalidatePath on every write.
- DONE: `travel/ui/booking-form.tsx` — estimated total (price x travellers, aria-live), min date, useId-based ids, aria-invalid/aria-describedby, role=alert errors; `package-detail.tsx` passes `pricePerPerson`.
- DONE: `components/admin/travel/booking-status-select.tsx` disables illegal transitions.
- tsc: my files clean; `tests/unit/rate-limit.test.ts` fails on `retryAfterSec` typing — belongs to security/platform-dx stream (they are editing `src/server/rate-limit.ts` concurrently). See Handoffs.
- NEXT: realestate (#5).

## [2026-09-27 15:01] IN PROGRESS: realestate (#5) + gym (#6)
- Plan: strict Google Maps embed allowlist, http(s)-only video/map URLs, image URL list validation, iframe sandbox, swap inverted min/max in getProperties, sanitised rich text; gym togglePlan field validation, audits on toggles, trainer overlap check, trial form labels.

## [2026-09-27 15:20] DONE: realestate (#5) + gym (#6)
- DONE realestate: `shared/validation.ts` gained `isHttpUrl` + `googleMapsEmbedUrl` (https, google.com/maps.google.com incl. country TLDs, `/maps/embed…` or `output=embed` only); `realestate/helpers.ts` mapEmbedUrl uses it, videoEmbedUrl https-only, new `safeExternalUrl`; `schema.ts` videoUrl/mapUrl -> zHttpUrlOrEmpty, images -> zImageUrlList(20); `actions.ts` sanitised title/description, boolean check on toggle; `queries.ts` swaps inverted min/max; `ui/property-detail.tsx` iframes get `sandbox` (+ referrerPolicy on video), fallback links only when http(s), rel noopener.
- DONE gym: `gym/actions.ts` — togglePlan validates field+value and audits, toggleClass audits and refuses re-activation that double-books a trainer, upsertClass rejects trainer time overlap on the same day (fieldErrors trainerId/startTime), rich text sanitised; `ui/trial-form-client.tsx` — every input has a visible `<label htmlFor>` (useId), removed aria-label-only selects.
- tsc + eslint clean (repo-wide tsc green again).
- NEXT: shared (#7).

## [2026-09-27 15:21] IN PROGRESS: shared (#7)
- Plan: sanitizeLocalized on every rich-text write (faq, gallery caption, page, post, service, team bio, testimonial); zImageUrlOrEmpty for imageUrl/coverUrl/gallery urls; testimonial text.en required; team socials http(s) only; getPosts/getPost + blog pages hide publishedAt > now; audits on every toggle/move; boolean checks on toggles; RESERVED slugs extended.

## [2026-09-27 15:40] DONE: shared (#7)
- DONE: every shared admin write sanitises rich text (`sanitizeLocalized`): faq, gallery caption, page title/content, post title/excerpt/content, service name/summary/description/features, team role/bio, testimonial text, gym plan/class names, job/package/property text.
- DONE: image URL fields restricted to http(s) or site-relative (`zImageUrlOrEmpty` / `isSafeImageUrl`): service.imageUrl, team.imageUrl, testimonial.imageUrl, post.coverUrl, gallery urls; service.icon restricted to an icon name.
- DONE: testimonial `text.en` required (+2000 char cap); team socials http(s) only (`zHttpUrlOrEmpty`).
- DONE: `shared/queries.ts` `publicPostsWhere` (published && publishedAt <= now) used by getPosts/getPost and both blog pages (`blog/page.tsx`, `blog/[slug]/page.tsx`); upsertPost reports "scheduled" for future dates.
- DONE: audits + boolean/field validation on every toggle (faq, page, service, team, testimonial, gallery update/move); RESERVED page slugs extended (employers, reserve, custom-cake, upload-prescription, login, logout, _next, sitemap.xml, robots.txt).
- eslint clean (3 pre-existing no-console warnings in server helpers, consistent with codebase). tsc: repo currently shows ~30 `RouteImpl` typed-routes errors in files outside this stream (shop, kitchen, customers, admin lists…) — another stream enabled typed routes concurrently; none originate from services-modules files. See Handoffs.
- NEXT: forms a11y (#8) then module 404s (#9).

## [2026-09-27 15:41] IN PROGRESS: forms a11y (#8) + module 404s (#9)
- (previous agent cut off here; see resume entry below)

## [2026-09-27 18:05] [resume] state reconciled
- VERIFIED: working tree clean at HEAD 47afb7f; `npx tsc --noEmit` clean; `git diff 9a2d796 --stat` on owned paths matches log entries #1-#7 (validation/public-form/media helpers, notify rewrite, leads/recruiting/travel/realestate/gym/shared actions, status forms, blog publishedAt gate).
- FOUND (still open): eslint `no-console` warnings in `src/modules/shared/public-form.ts` (2), `src/modules/shared/media.ts` (1), `src/server/notify.ts` (4) — must use `log` from `src/lib/log.ts`.
- FOUND (#8 partially done by previous agent): contact-form, quote-form-client, inquiry-form, employer-request-form, booking-form, trial-form-client already have labels/aria. Remaining: `recruiting/ui/apply-form.tsx` (errors lack role/aria-describedby, static ids), `law/ui/consultation-form-client.tsx` (aria-label-only selects, unlabeled practice-area input, no field errors), `gym/ui/bmi-calculator.tsx` (labels wrap inputs — ok).
- FOUND (#9): `/jobs`, `/jobs/[slug]`, `/employers`, `/packages`, `/packages/[slug]`, `/properties`, `/properties/[slug]` do not gate on `ctx.category.modules` (pattern used by classes/plans/join/quote/consultation: `if (!ctx.category.modules.includes("gym")) notFound()`); admin `applications`, `jobs`, `packages`, `bookings`, `properties` pages likewise (gym admin pages already gate).
- HANDOFFS RECEIVED (security): (a) users-actions revokeSessions adoption, (b) notify subject CR/LF strip, (c) passwordPolicy with username.
- NEXT: eslint console -> log; notify CRLF; users-actions revokeSessions + username policy; then #8 (apply-form, consultation-form-client), #9 (public + admin module gates), final verification.

## [2026-09-27 18:10] IN PROGRESS: structured logging + security handoffs (a)(b)(c)
- Plan: `console.*` -> `log` (src/lib/log.ts) in public-form.ts, media.ts, notify.ts; notify `sendEmail` strips CR/LF + control chars from subject (covers every caller incl. commerce; API unchanged); users-actions: `revokeSessions` after role change / deactivation / password reset, self password change revokes all then re-issues the current session via `createSession`; `passwordPolicy(pw, { username })` everywhere.

## [2026-09-27 18:25] IN PROGRESS: forms a11y (#8) + module 404s (#9)
- Plan #8: `recruiting/ui/apply-form.tsx` useId ids, role=alert field errors, aria-invalid/aria-describedby, maxLengths, CV field described by its error; `law/ui/consultation-form-client.tsx` real `<label htmlFor>` for practice-area select/input and case-type select (no aria-label-only controls).
- Plan #9: new `src/modules/shared/module-gate.ts` (`hasModule`, `requireModulePage`, `moduleUnavailable`); public pages jobs, jobs/[slug], employers (recruiting), packages, packages/[slug] (travel), properties, properties/[slug] (realestate) 404 when the category lacks the module (page + generateMetadata); admin pages applications(+[id]), jobs(+new,[id]), packages(+new,[id]), bookings, properties(+new,[id]) likewise; admin + public actions in recruiting/travel/realestate return `moduleUnavailable()` / bilingual `unavailable` for foreign categories.

## [2026-09-27 18:40] DONE: structured logging + security handoffs (a)(b)(c)
- DONE: `src/server/notify.ts` — all `console.*` replaced by `log.warn/error` with structured fields; new exported `safeSubject()` collapses CR/LF/control chars (and via `\s` U+2028/9) before the Resend call, applied inside `sendEmail` so every caller (leads, recruiting, travel, commerce) is covered. Public API unchanged (`sendEmail`, `notifyTenant`, `notifyNewLead`, `buildNotification`, WhatsApp builders).
- DONE: `src/modules/shared/public-form.ts`, `src/modules/shared/media.ts` — `log.error` with `errorFields(err)`; no `no-console` warnings remain in owned files.
- DONE: `src/modules/shared/users-actions.ts` — `revokeSessions({ tenantUserId })` after role change (skips no-op), deactivation, owner password reset (self-reset re-issues a session via `createSession`); `changeOwnPassword` revokes all sessions then re-issues the current browser's session (other devices signed out), rejects reusing the current password; `passwordPolicy(pw, { username })` used in create/reset/self-change; `PASSWORD_MAX` bounds on inputs; audit meta records sessionsRevoked.
- tsc: owned files clean; eslint clean.

## [2026-09-27 18:45] DONE: forms a11y (#8) + module 404s (#9)
- DONE #8: `recruiting/ui/apply-form.tsx` — `useId`-based ids (no duplicate static ids when two forms render), `name` attributes, maxLength on name/phone/email/city, field errors `role="alert"` linked via `aria-invalid`/`aria-describedby`, CV upload wrapped in a labelled `role="group"` described by its error. `law/ui/consultation-form-client.tsx` — practice-area select/input, case-type select and date each have a real `<label htmlFor>` (sr-only where the design is placeholder-led), no aria-label-only controls. `components/admin/uploader.tsx` upload error messages `role="alert"`. Already-compliant forms verified: contact, quote, inquiry, employer-request, booking, trial, bmi.
- DONE #9: new `src/modules/shared/module-gate.ts` (`hasModule`, `requireModulePage`, `moduleUnavailable`). Public pages `/jobs`, `/jobs/[slug]`, `/employers` (recruiting), `/packages`, `/packages/[slug]` (travel), `/properties`, `/properties/[slug]` (realestate) now 404 in both `generateMetadata` and the page for tenants whose category lacks the module. Admin pages `applications` (+`[id]`), `jobs` (+`new`, `[id]`), `packages` (+`new`, `[id]`), `bookings`, `properties` (+`new`, `[id]`) 404 likewise. Server actions: every admin action in recruiting/travel/realestate/gym returns `moduleUnavailable()` for foreign categories; public `applyToJob`/`createBooking` return the bilingual `unavailable` message.
- tsc: only error in repo is `src/app/(super)/(site)/page.tsx:265` (`source` prop on a super-site component) — super-site stream's in-flight work, not mine (see Handoffs). eslint on all owned changed paths clean.
- NEXT: final verification + summary.

## Handoffs (added 2026-09-27 18:50)
- **admin-ux** (`src/components/admin/shared/user-forms.tsx` lines ~215-218): `minLength={8}` on password/confirm must become 10 to match `passwordPolicy` (server now enforces 10+ with letters+digits and rejects the username); add matching help text.
- **tenant-site** (`src/components/site/preview-banner.tsx`, `suspended.tsx`, `unknown-host.tsx`): reference `ui.previewTitle/previewText/openAdmin/unavailableEyebrow/siteNotSetUpTitle/siteNotSetUpText/visit` which do not exist in `src/lib/i18n` → 8 tsc errors at 18:50 (their in-flight work; not services-modules).
- **security / platform-dx** (`src/server/auth/session.ts`): `revokeSessions` has no "except current session" option; services-modules works around it by revoke-all + `createSession` re-issue in `changeOwnPassword`. A `revokeSessions({ tenantUserId, exceptTokenHash })` variant would avoid the extra row churn.
- **commerce** (`src/modules/ecommerce/actions.ts#submitPrescription`, restaurant custom-cake): consider `hasModule(tc, "medical")` / category check via `src/modules/shared/module-gate.ts` in the public actions, mirroring what recruiting/travel/gym actions now do.
- **data-layer**: `deleteTenantPrivateMedia` decrements `tenant.storageUsed`; confirm `Media.confirmed`/`size` are indexed for the `(tenantId, folder, confirmed)` lookups used by `findPrivateUpload`.

## [2026-09-27 18:55] Services-modules stream — final summary
- FIXED (all 9 audit findings + 3 security handoffs):
  1. notify.ts: never throws, 8 s timeout, per-lead-type templates (application/booking/lead), WhatsApp reply links, absolute admin links, `safeSubject` header-injection guard, structured logging. API stable for commerce.
  2. leads: bounded/validated `extra`, tenant-verified property/plan/service ids, PRIVATE+confirmed files only, duplicate guard, bilingual messages, audit on delete.
  3. recruiting: state machine, CV mime/folder/ownership checks, 24 h idempotent duplicate guard, orphan CV cleanup, admin UI disables illegal transitions.
  4. travel: booking state machine, departure/past-date validation, nights<=days, duplicate guard, per-person total in form and email.
  5. realestate: Google-Maps-only embed allowlist, https-only video/map URLs, sandboxed iframes, min/max swap, sanitised text.
  6. gym: toggle field validation + audits, trainer overlap check, labelled trial form.
  7. shared: rich text sanitised on every write, safe image/social URLs, scheduled posts hidden until publishedAt, audits on every toggle/move, reserved slugs.
  8. forms a11y: every public form (contact, quote, inquiry, employer, apply, consultation, booking, trial) has real labels, `role=alert` errors linked by aria-describedby/aria-invalid, status/alert banners, stable `useId` ids.
  9. module 404s: `module-gate.ts`; 7 public routes + 13 admin routes 404 for foreign categories; all module admin actions and public apply/booking actions refuse foreign categories.
  10. security handoffs: `revokeSessions` on role change / deactivation / reset / self change (with session re-issue), `passwordPolicy(pw, { username })`, CR/LF-safe subjects.
- VERIFICATION: `npx eslint` on every owned changed path: 0 errors, 0 warnings (no `console`). `npx tsc --noEmit`: 0 errors in owned files; the 8 remaining repo errors are tenant-site's uncommitted `src/components/site/*` (missing i18n keys), see Handoffs. Uncommitted from this stream: `src/components/admin/uploader.tsx` (role=alert) + docs; everything else landed in checkpoint 3 (bfde950).
- REMAINING RISKS:
  1. No automated tests for module actions (state machines, duplicate guards, module gates, `safeSubject`) — pure helpers (`canTransitionApplication`, `canTransitionBooking`, `googleMapsEmbedUrl`, `sanitizeRichText`, `parseExtraFields`, `safeSubject`, `hasModule`) are test-ready; platform-dx should add vitest cases.
  2. Stored XSS via RichText links depends on tenant-site's renderer fix (sanitise-on-write is in place for new rows; old rows unaffected until re-saved).
  3. Duplicate guards are time-window based (24 h / 2 min) using phone; a determined visitor with many numbers can still flood — rate limiting is per IP and fails open when Postgres is down.
  4. Email delivery is best-effort (Resend, fire-and-forget); there is no retry/outbox, so a lead is stored but the owner may not be notified if Resend is down. Admin list + WhatsApp are the fallback.
  5. `changeOwnPassword` re-issues a session via `createSession` inside a server action; if cookie writing fails mid-way the user is signed out (safe failure, but abrupt).
  6. DB was not reachable: all reasoning is from code; Prisma queries (e.g. `data: { path: [...] }` JSON filters, `publicPostsWhere`) were type-checked, not executed.
  7. `user-forms.tsx` still says min 8 client-side until admin-ux updates it (server rejects correctly).
- READINESS SCORE: **84/100**. Server-side validation, tenant isolation, state machines, sanitisation, module gating and accessibility of public forms are production-grade and consistent across the six service modules. Deductions: no automated tests for the new logic (-6), notification path without retry (-3), duplicate/rate limits are heuristic (-3), pending cross-stream items (renderer allow-list, client min-length) (-4).
- NEXT: none for this stream (done). Orchestrator: commit `src/components/admin/uploader.tsx` + docs; route the Handoffs above.

## Wave 4 follow-ups

## [2026-09-27 20:05] IN PROGRESS: wave-4 handoffs (users-actions unlock, logging check, footer/nav/carousel a11y, uploader, revalidation, metadata + JSON-LD)
- VERIFIED at start (HEAD cfc86f3): `passwordPolicy(pw, { username })` already passed in createTenantUser / resetTenantUserPassword (target) / changeOwnPassword (ctx.user.username) — handoff #1a is a no-op; `src/modules/shared/media.ts` + `public-form.ts` already use `log` (no `console.*` in any owned path) — handoff #2 is a no-op.
- Plan: (1) `unlockTenantUser` owner-only action + trivial "Unlock" ActionButton in users/page.tsx (admin-ux page, one-line, noted below); (3) `PoweredBy` in site-footer, localized nav aria-labels, carousel/gallery `lang` prop + aria-live + localized controls; (4) uploader aria-labels + 40px targets + optional alt-text; (5) drop `/admin/…` revalidatePath in recruiting/travel/leads; (6) `tenantPageMetadata` + `<JsonLd>` on all 22 owned `(site)` pages via new `src/modules/shared/jsonld.ts`.
