# templates-b — stream log

Ownership: `src/templates/{recruiting,travel,pizza,bakery,gym,law,realestate}/**` (49 templates) and the
matching entries in `src/templates/catalog/{recruiting,travel,restaurant,services}.ts`.
Out of scope (handoffs only): `src/templates/{shared,ui,types,fields,theme,registry,metas}.*`, `src/modules/**`, routes.

## Handoffs
(see bottom of file)

## [2026-09-27 10:00] Audit started
- DONE: read protocol, TEMPLATE-GUIDE, CONVENTIONS, contract (types/fields/theme), shared sections/packs/render, ui kit,
  catalog blueprints for all 7 categories, module kit signatures, reference law-01.
- FOUND (sweep, not yet fixed):
  - No template wraps `children` in a `<main>` landmark (49/49).
  - Raw `<img>` + `eslint-disable no-img-element` in 11 files (recruiting 02/03/05/07/08/09 header+hero, travel 05/08/09 headers, law/05, realestate/01).
  - Physical direction classes: law/01 (`-left-4`, `-right-6`), recruiting/05 (`left-1/2` — centred, OK).
  - Fixed px logo widths in 7 custom headers (`max-w-[140-160px]`) — acceptable as max-w cap, will convert to rem.
  - No `any`, no console.*, no TODO, no `href="#"`, no hard-coded hex (except WhatsApp brand green in shared ui).
- NEXT: read recruiting 01-10 fully, fix per template, log.

## [2026-09-27 10:40] Sweep batch 1 (all 49 templates)
- DONE: `<main id="main">` landmark around `{children}` in every Layout (49 files).
- DONE: raw `<img>` + `eslint-disable no-img-element` replaced with `Img` from `@/templates/ui` in
  recruiting/02, /03/header, /05/header, /07/header, /08, /09/header, travel/05, /08, /09, law/05, realestate/01
  (hero backgrounds get `loading="eager"` for LCP). 0 eslint-disable left in owned dirs.
- DONE: law/01 hero `-left-4`/`-right-6` → `-start-4`/`-end-6` (RTL-safe).
- DONE: fixed-px logo caps `max-w-[140/150/160px]` → `max-w-36/40` (7 headers).
- Verified: `npx tsc --noEmit` clean; eslint on all 7 category dirs clean.
- NEXT: read recruiting 04-10 (already read 01-03: solid, no crash risks), then travel.
