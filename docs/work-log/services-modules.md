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
