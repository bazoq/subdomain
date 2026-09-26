# Commerce stream — work log

Owner: COMMERCE agent. Ownership boundary (only edit):
- src/modules/ecommerce/**, src/modules/restaurant/**
- src/components/admin/ecommerce/**, src/components/admin/restaurant/**
- src/app/_sites/[host]/(site)/{cart,checkout,shop,order,menu,reserve}/**
- src/app/_sites/[host]/admin/(dashboard)/{orders,products,coupons,shipping,customers,menu,food-orders,kitchen,reservations,delivery-zones}/**

Scope: COD-only, PKR integer rupees. Server-side pricing, stock, coupons, shipping, cart, checkout
validation, restaurant modifiers/zones/hours/state machine, admin CRUD consistency, notifications,
UX states, cache invalidation. DB not reachable: reasoned from code only.

## Handoffs
(cross-boundary findings go here)

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
