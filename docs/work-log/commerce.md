# Commerce stream — work log

Owner: COMMERCE agent. Ownership boundary (only edit):
- src/modules/ecommerce/**, src/modules/restaurant/**
- src/components/admin/ecommerce/**, src/components/admin/restaurant/**
- src/app/_sites/[host]/(site)/{cart,checkout,shop,order,menu,reserve,upload-prescription,custom-cake}/**
- src/app/_sites/[host]/admin/(dashboard)/{orders,products,coupons,shipping,customers,menu,food-orders,kitchen,reservations,delivery-zones,prescriptions}/**

Scope: COD-only, PKR integer rupees. Server-side pricing, stock, coupons, shipping, cart, checkout
validation, restaurant modifiers/zones/hours/state machine, admin CRUD consistency, notifications,
UX states, cache invalidation. DB not reachable: reasoned from code only.

## Handoffs
- [services-modules] `src/server/notify.ts` line 25 (`safeSubject`) has literal U+2028/U+2029 bytes (E2 80 A8 / E2 80 A9) inside the regex character class after `\u007f`. JS treats them as line terminators → `TS1161 Unterminated regular expression literal` (3 errors, whole build fails). Replace with the escapes `\u2028\u2029`. Found 18:20 while running tsc; not in commerce ownership, not touched.
- [security] Commerce public actions now check `tc.tenant.status === "SUSPENDED"` inline (8 actions, after the honeypot, before rate limits/DB). `publicFormGuard` was not adopted because its honeypot branch returns `success` with no data and commerce clients need `{number:0, token:""}`; if the guard grows a `honeypotData` option we can switch.
- [platform-dx / tenant-site] `formatDate` in `src/lib/utils.ts` formats in the server TZ (UTC on Vercel); admin pages and invoices show times 5h early for PK. Add `timeZone: "Asia/Karachi"` (owned pages cannot change the helper). Reservation admin page already works around it locally.
- [platform-dx] `revalidatePath("/admin/orders")` etc. (pre-existing pattern everywhere) targets the public path while the route lives under `/_sites/[host]/…` via rewrite — please verify it invalidates the intended segment in Next 16 or switch the codebase to `revalidateTag`. Commerce relies on it for storefront stock badges after cancellations.
- [data-layer] No schema change needed for this wave (tokens are HMAC-derived, idempotency uses the RateLimit table). Nice-to-have later: `Order.idempotencyKey String?` + `@@unique([tenantId, idempotencyKey])` and same on FoodOrder, which would let idempotency survive RateLimit cleanup and remove the lock rows.
- [security] The `RateLimit` table doubles as the idempotency lock store (`idem:*` buckets, 24h windowEnd). `purgeExpiredRateLimits` must keep honouring `windowEnd` (it does) — do not add a shorter global TTL.

## Entries

## [2026-09-27 00:00] Stream started
- DONE: created this log. Reading schema + modules.
- NEXT: full audit of src/modules/ecommerce/** and src/modules/restaurant/**

## [2026-09-27 00:40] Audit complete (read: schema, both modules, all UI kits, all owned pages/components)
- FOUND (fix queue, priority order):
  1. Public order pages `/order/[n]?p=<last4>` and `/menu/order/[n]?p=<last4>` gate on last-4 phone digits:
     10k guesses, page render is not rate-limited -> leaks name/phone/address/items. Replace with HMAC token.
  2. No idempotency key on `placeOrder` / `placeFoodOrder` -> double-tap / retry creates duplicate orders.
  3. `updateOrderStatus` (ecommerce) has NO state machine: DELIVERED->PENDING allowed; re-activating a
     CANCELLED order decrements stock unguarded (can go negative).
  4. Coupon `usedCount` increment is unguarded -> maxUses can be exceeded under concurrency.
  5. Coupon expiry set with `setHours(23,59,59)` in server TZ (UTC on Vercel) -> expires 5h early for PK.
  6. `deleteProduct` hard-deletes (OrderItem keeps snapshot + SetNull so history survives, but the admin
     link/product report breaks) -> archive when referenced by orders.
  7. Restaurant: scheduled orders not checked against opening hours; reservation time not checked against
     hours / past time for today; reservation status has no transitions; food-order status update not
     guarded against concurrent change.
  8. Checkout error messages are English-only (restaurant partly UR). Checkout rate limit 5/10min per IP is
     too tight for Pakistani CGNAT mobile networks.
  9. Cart localStorage validation is loose (qty/maxQty not clamped on read).
  10. Honeypot in restaurant returns number 0 -> client redirects to /menu/order/0 (404).
  11. `upsertProduct` slug race (P2002) surfaces as raw Prisma message.
- OK (verified, no change needed): all queries tenant-scoped; server re-prices every line from DB; variant
  required when product has active variants; stock decrement is `updateMany where stock >= qty` inside the
  transaction; stock restored on CANCELLED/RETURNED; order number unique per tenant with P2002 retry;
  coupon lookup case-insensitive per tenant; shipping zone city match case-insensitive with free-above;
  modifier min/max/required validated server-side with inactive modifiers rejected; delivery zone fee/min;
  order type toggles honoured; PK phone normalised; honeypot + rate limit on all public actions; admin
  actions all go through `requireTenantAdminAction`; audit on mutations; revalidatePath after writes.
- NEXT: implement fixes 1-11 (shared helpers first: order-token.ts, idempotency.ts, messages).

## [2026-09-27 13:05] [resume] state reconciled
- Previous agent was cut off mid-implementation (after the audit entry). Reconciled from `git diff 9a2d796` + new files.
- DONE by previous agent (verified present, tsc clean): `src/modules/ecommerce/order-token.ts` (HMAC over kind:tenantId:number with
  SESSION_SECRET — no schema column needed), `idempotency.ts` (lock rows in existing `RateLimit` table, bucket `idem:<scope>:<key>` — no
  schema change), `messages.ts` (EN+UR checkout messages + `m()`), `schemas.ts` (`idempotencyKey`), `types.ts` (ORDER_TRANSITIONS,
  canTransitionOrder, STOCK_RELEASING_STATUSES), `actions.ts` placeOrder rewrite (idempotency claim/complete/release, localised messages,
  atomic coupon usedCount guard, returns `token`), validateCoupon + getOrderStatus localised, getOrderStatus returns token.
- Findings status: (4) coupon usedCount guard DONE. (1) token helper + server side DONE, pages/clients/restaurant PENDING.
  (2) ecommerce server DONE, client key + restaurant PENDING. (3) types DONE, updateOrderStatus wiring PENDING (unused imports
  canTransitionOrder/STOCK_RELEASING_STATUSES/OrderStatusValue are the eslint warnings). (8) ecommerce placeOrder/coupon/track DONE,
  submitPrescription + restaurant + per-phone limit PENDING. (5)(6)(7)(9)(10)(11) PENDING.
- Also noted: `export interface PlacedOrder` inside a "use server" file — type-only so it compiles, but moving to types.ts to be safe.
- NEXT: fix 3 (state machine + guarded stock) → 1 (order pages + clients) → 2 (client keys) → 5 → 6 → 11 → 9 → restaurant 7/8/10.

## [2026-09-27 13:10] Fix 3 — order status state machine + guarded stock — IN PROGRESS
- Plan: `updateOrderStatus` validates transition via `canTransitionOrder`, uses `order.updateMany where status = <read status>` as an
  optimistic concurrency guard, restores stock only on the first entry into CANCELLED/RETURNED (increment only — never decrements, so stock
  can never go negative from status changes; terminal statuses cannot be re-opened). Admin select limited to allowed transitions.

## [2026-09-27 13:20] Fix 3 — DONE
- DONE: `src/modules/ecommerce/actions.ts` updateOrderStatus: transition check (ORDER_TRANSITIONS), optimistic guard
  (`updateMany where status = read status` → "updated by someone else" on conflict), stock restored once on first entry into
  CANCELLED/RETURNED (increment only, `restoreStock`), noop/note-only path, audit meta {from,to,stockRestored}, storefront revalidate
  when stock restored. Removed the unguarded re-activation decrement (terminal statuses can't be re-opened).
  `src/components/admin/ecommerce/order-status-form.tsx`: select shows current + allowed next statuses only; terminal notice.
  `PlacedOrder` moved to `types.ts`. tsc + eslint clean.
- NEXT: Fix 1 — order pages + clients on HMAC token (ecommerce first, then restaurant).

## [2026-09-27 13:21] Fix 1 — HMAC order tokens on public order pages — IN PROGRESS
- Plan: `/order/[n]?t=` verified with verifyOrderToken("shop"); tracker navigates to token URL after phone verification; checkout
  redirects with token; admin detail shows the token link. Restaurant: `/menu/order/[n]?t=`, `getFoodOrderStatus(number, token)`,
  new `lookupFoodOrder(number, phone)` action + `OrderLookup` client for the unverified state; restaurant checkout redirects with token.

## [2026-09-27 14:05] Fix 1 — DONE (HMAC order tokens, both modules)
- DONE: `(site)/order/[number]/page.tsx` verifies `?t=` with `verifyOrderToken("shop")`; no data without a valid token (the old `?p=<last4>`
  is gone). `ui/order-tracker.tsx` navigates to the tokenised URL after full-phone verification (`getOrderStatus` returns the token).
  Restaurant: `(site)/menu/order/[number]/page.tsx` verifies `?t=` ("food"); unverified → new `ui/order-lookup.tsx` (order number + full
  phone → new action `lookupFoodOrder`, 20/10min per IP). `getFoodOrderStatus(number, token)` now token-gated (poll skips hidden tabs).
  Admin order + food-order detail pages show the tokenised tracking link and include it in the WhatsApp reply. Token = 144-bit HMAC
  (SESSION_SECRET) → no page-render rate limit needed; enumeration is infeasible.

## [2026-09-27 14:06] Fix 2 — DONE (idempotent placeOrder / placeFoodOrder)
- DONE: both checkout forms generate one `idempotencyKey` per mounted checkout (`useState(newIdempotencyKey)`), send it, and treat a
  rejected promise as "retry with the same key" (the server returns the original order if it went through). `placeFoodOrder` wired to
  `claimIdempotency/completeIdempotency/releaseIdempotency` (scope "food"); lock released on any failure. No schema change (RateLimit rows).

## [2026-09-27 14:07] Fix 5 — DONE (coupon expiry in Asia/Karachi)
- DONE: `upsertCoupon` uses `pkEndOfDay(YYYY-MM-DD)` → `T23:59:59.999+05:00`; malformed dates get a field error.

## [2026-09-27 14:08] Fix 6 — DONE (archive instead of hard-delete)
- DONE: `deleteProduct` archives (isActive=false, isFeatured=false, audit `product.archive`) when `_count.orderItems > 0`, deletes otherwise;
  message explains which happened. Product form confirm text updated.

## [2026-09-27 14:09] Fix 7 — DONE (restaurant: hours, reservations, transitions, concurrency)
- DONE: new `src/modules/restaurant/hours.ts` (`pkParts`, `isOpenAt` incl. overnight windows, `hoursForDate`, `pkDateTime`).
  `placeFoodOrder` rejects scheduled times when the kitchen is closed at that time (plus existing 15min/7day bounds).
  `createReservation`: date/time interpreted in PKT; rejects past dates, past/too-soon (<30 min) times, >60 days ahead, closed days and
  times outside that day's hours (message includes the day's hours). `RESERVATION_TRANSITIONS` + `canTransitionReservation` in types.ts;
  `updateReservationStatus` enforces them with an `updateMany where status=current` guard; admin select only offers allowed moves
  ("Final" for SEATED/CANCELLED). `updateFoodOrderStatus` guarded the same way (stale kitchen screen → "updated by someone else").
  Admin reservations page renders dates in Asia/Karachi (was off by one day on UTC servers).

## [2026-09-27 14:10] Fix 8 — DONE (EN+UR messages, CGNAT-aware limits)
- DONE: new `src/modules/restaurant/messages.ts` (`rm()`); every public restaurant action message is EN+UR (field errors too).
  `submitPrescription` localised. Limits: checkout 15/10min per IP + 10/hour per phone (shop and food), coupon 30/10min, tracker 20/10min,
  prescription 10/10min per IP + 5/hour per phone, reservation 10/10min per IP + 5/hour per phone. Rate limiter (security stream) now
  fails open with `degraded`; idempotency lock still fails closed (DB error → generic failure, no order).

## [2026-09-27 14:11] Fix 9 — DONE (cart clamp on read)
- DONE: `ecommerce/ui/cart-provider.tsx` `sanitizeCart`: qty→int 1..min(maxQty,99), price→non-negative int, invalid lines dropped, duplicate
  keys merged, 50-line cap. `restaurant/ui/order-provider.tsx` `sanitizeLine`: same treatment incl. modifier shape, 99 cap, 50 lines.

## [2026-09-27 14:12] Fix 10 — DONE (honeypot)
- DONE: both `placeOrder`/`placeFoodOrder` return a fake success `{number:0, token:""}`; both clients detect `number === 0` and go to
  /shop or /menu instead of `/…/order/0`. Reservation honeypot already returned fake success.

## [2026-09-27 14:13] Fix 11 — DONE (P2002 → friendly)
- DONE: upsertProduct / upsertCategory / upsertCoupon / upsertMenuItem / upsertMenuCategory catch P2002 and return a field error on
  slug/code instead of the raw Prisma message.

## [2026-09-27 14:14] Extras
- DONE: `console.error` → structured `log.error` (project rule) in both action files. Notifications: both order emails now carry the customer
  WhatsApp link, absolute admin URLs (`https://<host>/admin/…`) and, for food, the scheduled time in PKT; prescription email likewise.
  Print pages reviewed: A4 invoice and 80mm ticket render the right fields (COD amount, variants/modifiers/notes) — no change needed.
  Pending/empty states reviewed across owned forms and admin lists — present.

## [2026-09-27 18:05] [resume] state reconciled
- Third agent on this stream. Tree clean at HEAD 47afb7f. Verified against code (not the log): fixes 1–11 + extras from the 14:05–14:14
  entries are all present (`git diff 9a2d796 --stat` = 34 owned files; `hours.ts`, both `messages.ts`, `order-lookup.tsx`,
  `idempotency.ts`, `order-token.ts` exist and are wired). Leftover grep for `?p=` / `phoneKey` / `isCartItem` / last-4 gating: none.
  `npx tsc --noEmit` clean; `npx eslint` on every owned directory clean. STATUS row was stale (still said fix 1) — corrected.
- REMAINING (from security-stream handoff): no public commerce action checks `tc.tenant.status === "SUSPENDED"` (the `(site)` layout renders
  a suspended page, but server actions are callable directly, so a suspended store could still take orders/reservations/prescriptions).
  Also: emails use raw `whatsappLink(phone)`; switch to `replyWhatsAppLink` from `src/server/notify.ts` (services-modules API) with a
  pre-filled reply, and include the customer tracking link so staff can forward it.
- NEXT: Fix 12 — SUSPENDED guard on all 8 public actions (placeOrder, validateCoupon, getOrderStatus, submitPrescription,
  placeFoodOrder, getFoodOrderStatus, lookupFoodOrder, createReservation) + notify.ts WhatsApp API.

## [2026-09-27 18:08] Fix 12 — SUSPENDED guard on public actions + notify.ts WhatsApp API — IN PROGRESS
- Plan: `storeUnavailable` (EN+UR) in both message catalogs; `tc.tenant.status === "SUSPENDED"` → fail() in every public action, placed
  after the honeypot (bots still get the fake success) and before any rate-limit/DB work. Not routing through `publicFormGuard`: its
  honeypot path returns `success` without data, and commerce clients rely on `{number:0, token:""}`; the inline check is the same line.
  Emails: `replyWhatsAppLink(phone, "Assalam o Alaikum …")` from `src/server/notify.ts` + customer tracking URL (`/order/N?t=`).

## [2026-09-27 18:22] Fix 12 — DONE (SUSPENDED guard + notify.ts WhatsApp API)
- DONE: `storeUnavailable` (EN+UR) added to `src/modules/ecommerce/messages.ts` and `src/modules/restaurant/messages.ts`.
  `tc.tenant.status === "SUSPENDED"` → `fail(storeUnavailable)` in placeOrder, validateCoupon, getOrderStatus, submitPrescription
  (`src/modules/ecommerce/actions.ts`) and placeFoodOrder, getFoodOrderStatus, lookupFoodOrder, createReservation
  (`src/modules/restaurant/actions.ts`). Placed after the honeypot (bots still get the fake success) and before any rate-limit/DB call,
  so a suspended store cannot take orders, reservations or prescriptions even when the action is invoked directly (the `(site)` layout
  already renders the suspended page for normal navigation).
- DONE: owner emails use `replyWhatsAppLink(phone, "Assalam o Alaikum <name>, this is <tenant> regarding …")` from `src/server/notify.ts`
  (pre-filled reply, falls back to the bare phone when the number is unusable) instead of raw `whatsappLink(phone)`; `whatsappLink` import
  dropped from both action files. Shop and food order emails now also carry the customer's tokenised tracking URL
  (`https://<host>/order/N?t=…` / `/menu/order/N?t=…`) so staff can forward it on WhatsApp.
- VERIFY: `npx eslint` on the 4 changed files clean. `npx tsc --noEmit`: 0 errors in any file except `src/server/notify.ts` (3 errors,
  services-modules stream mid-edit — see Handoffs). tsc was fully clean at the start of this session before that edit landed.

## [2026-09-27 18:25] Stream complete — summary, remaining risks, readiness score
- FIXES SHIPPED (12): (1) HMAC order tokens on both public order pages + tracker/lookup flows; (2) idempotent placeOrder/placeFoodOrder
  (client key per mounted checkout, RateLimit-table lock, retry-safe); (3) ecommerce order state machine with optimistic guard and
  increment-only stock restore; (4) atomic coupon usedCount guard; (5) coupon expiry at Asia/Karachi end of day; (6) archive products
  referenced by orders instead of hard delete; (7) restaurant hours checks for scheduled orders and reservations, reservation state
  machine, concurrency guards on food-order/reservation status; (8) EN+UR messages everywhere public, CGNAT-aware per-IP limits plus
  per-phone limits; (9) cart/order localStorage sanitised on read; (10) honeypot fake success handled by clients; (11) P2002 slug/code
  races → friendly field errors; (12) SUSPENDED guard on all public actions + notify.ts WhatsApp reply links + tracking links in emails.
- REMAINING RISKS (not fixable inside this boundary or needing runtime):
  a. Nothing has run against a database this wave (DB unreachable) — all fixes are reasoned from code; the first deploy needs a smoke
     pass: place order → token page → cancel in admin → stock badge; coupon maxUses under two tabs; kitchen board stale-status conflict.
  b. Idempotency relies on `RateLimit` rows (24h windowEnd). A duplicate submit after purge or after a DB outage during `claim` can create
     a second order. Schema follow-up logged for data-layer (`Order.idempotencyKey` unique).
  c. `revalidatePath("/shop", "layout")` / admin paths may not invalidate the rewritten `/_sites/[host]/…` segment in Next 16 — storefront
     stock badges could be stale until ISR/next request. Handed to platform-dx.
  d. `formatDate` in `src/lib/utils.ts` uses server TZ → admin/invoice timestamps 5h early on Vercel (handoff, outside boundary).
  e. Build currently red because of `src/server/notify.ts` U+2028 bytes (services-modules; one-line fix, see Handoffs).
  f. No automated tests; the state machines and pricing are pure functions (types.ts, pricing.ts, hours.ts) and are the first candidates.
  g. Order emails are best-effort (no RESEND_API_KEY → silent no-op); there is no in-app notification fallback for new orders beyond the
     kitchen board polling, so an owner without email configured relies on the admin list.
- READINESS SCORE: 78/100. Justification: money-path invariants are now server-enforced and concurrency-safe by construction (pricing
  from DB, guarded stock, guarded coupons, idempotent submits, state machines with optimistic guards, tokenised public pages, suspended
  and paused stores refuse orders, bilingual messages, PK-timezone-correct expiry/hours). Deductions: −10 no runtime verification against
  a DB and no tests; −5 idempotency durability tied to RateLimit rows; −4 cache-invalidation path uncertainty (c); −3 admin timestamp TZ
  and notification fallbacks (d, g). Would be 85+ after the smoke pass and the `idempotencyKey` column.

## Wave 4 follow-ups

## [2026-09-27 19:05] Wave 4 follow-ups — started
- Fourth agent on this stream (HEAD cfc86f3, tree clean apart from tenant-site's global-error edit). Tasks from `_handoffs-consolidated.md`:
  (1) `Order.idempotencyKey` / `FoodOrder.idempotencyKey` adoption (data-layer), (2) replace no-op `revalidatePath("/admin/…")` calls
  (platform-dx), (3) `hasModule` gates on submitPrescription / custom-cake (services-modules), (4) `tenantPageMetadata` + JSON-LD on
  owned `(site)` pages (tenant-site), (5) tsc/eslint/vitest clean.
- NEXT: task 1 — `npx prisma generate`, rewrite `idempotency.ts`, wire placeOrder/placeFoodOrder.

## [2026-09-27 19:12] Task 1 — Order.idempotencyKey adoption — IN PROGRESS
- Plan: `idempotency.ts` drops the RateLimit lock rows; new `findOrderByIdempotencyKey(scope, tenantId, key)` (findUnique on
  `tenantId_idempotencyKey`). placeOrder/placeFoodOrder: fast path re-read before pricing; write `idempotencyKey` on create; on P2002
  inside the create loop re-read by key first (concurrent duplicate → return the winner's order), otherwise treat as the order-number
  race and retry. Phone mismatch on a found key → bilingual `alreadySubmitted` (no order data to a different phone). Local
  `isUniqueViolation` copies replaced by the shared one from `@/server/db`.

## [2026-09-27 21:05] [resume] state reconciled
- Fifth agent on this stream. HEAD e09cd5a, tree clean. Verified against code (`git diff cfc86f3` on owned paths, 8 files):
  Task 1 action side is COMPLETE — `idempotency.ts` rewritten (no RateLimit lock rows; `findOrderByIdempotencyKey` via
  `tenantId_idempotencyKey`, `isIdempotencyConflict`), `placeOrder`/`placeFoodOrder` write `idempotencyKey` on create, fast-path re-read
  before pricing, and on any P2002 in the create loop re-read by key first (phone mismatch → bilingual `alreadySubmitted`), local
  `isUniqueViolation` copies replaced by `@/server/db`'s. Schema + migration `20260927182500_order_idempotency_key` present.
  Task 2 action side COMPLETE — grep for `revalidatePath("/admin` / `"/shop` / template-literal paths in owned dirs: none; every mutating
  action calls `revalidatePath("/", "layout")` once. Task 3 action side COMPLETE — `hasModule(tc, …)` on all 8 public actions.
  `seo.ts` helpers exist in both modules (`productJsonLd`, `menuJsonLd`) but no owned page uses them yet; all 12 pages still build
  `"X · name"` titles by hand.
- DONE now: eslint warning — `import type { Prisma }` in `src/modules/ecommerce/actions.ts` (only used for `Prisma.TransactionClient`).
- NOTE: `duplicateInFlight` message keys are now unused in both catalogs (kept; harmless).
- NEXT: task 3 pages (`requireModulePage`) + task 4 (12 pages: tenantPageMetadata + JSON-LD), then verify.

## [2026-09-27 21:20] Task 1 — Order.idempotencyKey adoption — DONE
- DONE (verified, no further change needed): `src/modules/ecommerce/idempotency.ts` is column-based only (`findOrderByIdempotencyKey` via
  `tenantId_idempotencyKey`, `isIdempotencyConflict`), no RateLimit lock rows remain (`grep claimIdempotency|completeIdempotency|releaseIdempotency`
  → none). `placeOrder` / `placeFoodOrder`: fast-path re-read before pricing, `idempotencyKey: idem` written on create, on any P2002 in the
  create loop re-read by key first and hand back the winner's order (phone mismatch → `alreadySubmitted` EN+UR), otherwise treat as the
  order-number race and retry (max 3). Lint: `import type { Prisma }` in `src/modules/ecommerce/actions.ts` (eslint 0 warnings).
- Handoff item "RateLimit table doubles as the idempotency lock store" (security) is obsolete — struck below.

## [2026-09-27 21:21] Task 2 — revalidation per CONVENTIONS — DONE
- DONE (verified): no `revalidatePath("/admin/…")`, `"/shop"`, `"/menu"` or template-literal paths remain in owned dirs; every mutating
  action (public + admin, both modules) ends with exactly one `revalidatePath("/", "layout")`. No `unstable_cache` readers exist in
  ecommerce/restaurant, so no tags/`revalidate<Module>` helper is needed. Handoff item "revalidatePath('/admin/orders') pattern" is closed.

## [2026-09-27 21:22] Task 3 — module gates — DONE
- Actions (already in HEAD): `hasModule(tc, …)` on all 8 public actions (`ecommerce` ×3, `medical` on submitPrescription, `restaurant` ×4).
- Pages (this session): `requireModulePage(ctx, …)` from `@/modules/shared/module-gate` on all 12 owned `(site)` pages — `ecommerce` on
  cart/checkout/shop/shop/c/shop/[slug]/order; `restaurant` on menu/menu/checkout/menu/order/reserve; `medical` on upload-prescription;
  custom-cake = `restaurant` + `ctx.category.key === "bakery"` (`bakery` is a CategoryKey, not a ModuleKey — `hasModule(tc,"bakery")` does
  not type-check, so the category test stays). `shop/[slug]` medical-info block uses `hasModule(ctx, "medical")`.
- Custom-cake ACTION is `submitLead` (`src/modules/leads/actions.ts`, formKey `custom_cake`) — outside this boundary → Handoffs.

## [2026-09-27 21:35] Task 4 — tenantPageMetadata + JSON-LD on the 12 owned pages — DONE
- All 12 pages now call `tenantPageMetadata(tc, ctx.lang, { title: <bare>, path, … })` (`tc` from `requireTenant()`, cached per request
  like the home page does); no hand-built `"X · name"` titles remain (grep clean). `noIndex: true` on the transactional/private pages
  that are also in `TENANT_DISALLOW` (cart, checkout, order/[n], menu/checkout, menu/order/[n]); canonical paths never carry `?t=` tokens
  or shop query params (`/shop`, `/shop/c/<slug>` bare).
- JSON-LD via `<JsonLd>`: `shop/[slug]` → `productJsonLd` (Product, PKR Offer/AggregateOffer, availability, seller @id) + BreadcrumbList
  (Home › Shop › [Category] › Product), og image = first product/variant image; `shop`, `shop/c/[category]` (og image = category image),
  `reserve`, `upload-prescription`, `custom-cake` → BreadcrumbList; `menu` → BreadcrumbList + new `restaurantMenuLinkJsonLd`
  (`BUSINESS_TYPE[category]` node with the layout's business `@id` + `hasMenu`) + `menuJsonLd` (Menu › MenuSection › MenuItem with PKR
  offers), emitted only when at least one item exists. Private pages emit no JSON-LD.
- Files: `src/modules/restaurant/seo.ts` (+`restaurantMenuLinkJsonLd`), 12 × `src/app/_sites/[host]/(site)/{cart,checkout,custom-cake,
  menu,menu/checkout,menu/order/[number],order/[number],reserve,shop,shop/[slug],shop/c/[category],upload-prescription}/page.tsx`.

## [2026-09-27 21:40] Task 5 — verification — DONE (owned scope clean; tree has other streams' in-flight breakage)
- `npx tsc --noEmit`: 0 errors in owned paths. The tree currently has 11–40 errors (count changes between runs) in `src/templates/**`
  (`{en,ur}` LocalizedString passed where string/ReactNode expected) — templates-i18n stream is mid-edit on `src/templates/shared/sections.ts`.
- `npx eslint` on all 17 changed/owned files: clean (0 warnings).
- `npx vitest run`: 327 passed / 25 failed — all 25 in `tests/templates/registry.test.ts` (same in-flight sections change). At session
  start (HEAD e09cd5a + other streams' edits at that moment) the run was fully green, so none of the failures are commerce.

## [2026-09-27 21:42] Wave 4 follow-ups — complete: summary + remaining risks
- CHANGED THIS WAVE (both agents): idempotency moved from RateLimit lock rows to `Order/FoodOrder.idempotencyKey` (unique per tenant);
  revalidation normalised to one `revalidatePath("/", "layout")` per mutating action; module gates on 8 public actions + 12 pages;
  `tenantPageMetadata` + JSON-LD (Product/Offer, BreadcrumbList, Menu graph) on all owned public pages; `seo.ts` helpers in both modules.
- REMAINING RISKS: (a) migration `20260927182500_order_idempotency_key` has not run against a real DB (unreachable locally) — first deploy
  needs `prisma migrate deploy` before the new actions ship, otherwise every `placeOrder` fails on the unknown column; (b) two concurrent
  same-key submits roll back the loser's whole transaction (stock/coupon included) by design — the re-read returns the winner, but if the
  winner has not committed yet the loser returns a generic failure and the client retries with the same key (correct, but one extra
  round-trip); (c) `submitLead` accepts `formKey=custom_cake` for any category (handoff); (d) `restaurantMenuLinkJsonLd` re-declares the
  business node's `@type` — identical to the layout's `localBusinessJsonLd` type mapping, but if that mapping changes the two must stay
  in sync (both read `BUSINESS_TYPE`); (e) still no runtime smoke pass of checkout → token page → admin status change.

## Handoffs (wave 4)
- [services-modules / leads] `src/modules/leads/actions.ts` `submitLead`: `formKey === "custom_cake"` should be refused unless
  `tc.category.key === "bakery"` (page is gated; the action is not — a direct POST from any tenant host still creates the lead).
- [security] CLOSED: the "RateLimit table doubles as the idempotency lock store" note above is obsolete — idempotency no longer writes
  RateLimit rows; `purgeExpiredRateLimits` TTL is free to change.
- [platform-dx] CLOSED: the `revalidatePath("/admin/…")` handoff above — all commerce actions now follow CONVENTIONS.
- [data-layer] CLOSED: `Order.idempotencyKey` / `FoodOrder.idempotencyKey` adopted (this wave).
