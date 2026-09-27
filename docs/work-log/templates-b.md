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

## [2026-09-27 15:00] [resume] state reconciled
- DONE: verified sweep batch 1 is committed in 7fba460 (53 files, main landmark / Img / RTL / logo caps); no uncommitted
  edits in owned dirs. Resuming per-template deep review at recruiting 04-10.
- NEXT: recruiting 04-10 deep review (IN PROGRESS), then travel 01-10, pizza 01-10, bakery 01-05, gym 01-05, law 01-06, realestate 01-03.

## [2026-09-27 15:40] recruiting 04-10 deep review DONE; travel IN PROGRESS
- DONE (recruiting): 04-10 read in full. All 10 distinct (charcoal/orange blue-collar, teal clinical stepper, dark gold
  executive rows, green community big-type, coral photo collage, dark terminal/mono pipeline, warm story cards).
  Contract OK: hero always renders, every pack key has a renderer, section() guards + `?.length` on arrays, no crash paths.
  Fixes: 08 photo tiles `text-white` -> `text-t-dark-fg`; 05 employers icon `bg-white/15` -> `bg-t-primary-fg/15`;
  07 header hover/active `bg-white/15` -> `bg-t-primary-fg/15`; 09 header `bg-white/5` -> `bg-t-dark-fg/5`.
  Verified job.type is free text ("Full-time") so raw display in 06/09 rows is correct.
- DONE (sweep, all 49): hero `<Img src={h.image}>` visible at all breakpoints now `loading="eager" fetchPriority="high"`
  (34 files); 4 heroes hidden on mobile intentionally left lazy (recruiting/07, pizza/05, bakery/05, gym/05).
- DONE (travel 01-04): 01 top-bar phone `dir="ltr"`, badge chip token; 02 tier chips `bg-t-dark-fg/5`; 03 departures chip
  tokens; 04 hero overlays -> `t-primary-fg/x`, custom Services now honours section `count`.
- FOUND (not yet fixed, other batches): recruiting/01+03 `text-white/80`, `text-white` on gradient hero (fix in pass 2);
  law/01 unlocalized "Call the chambers" + placeholder phone; pizza/03 solid `bg-white` button; pizza/09 `text-white` CTA.
- NEXT: travel 05-10 read + fix, then pizza 01-10.

## [2026-09-27 16:10] travel 01-10 DONE; pizza IN PROGRESS
- DONE (travel): 05-10 read in full. All 10 distinct (photo+search card, emerald/gold Umrah with departures strip,
  full-screen mountain w/ transparent header, purple ticket-mask cards, black/gold editorial, teal blobs/bubbles,
  sunset skyline postcards, navy visa checklist cards + stamp process, magazine masonry, corporate table rows).
  Fixes: 07 PackageTabs + postcard stamp/label white -> `t-primary-fg`/`t-accent-fg` tokens; 08 + 10 custom Services
  honour section `count`; 09 hero `min-h-[560px]` -> `min-h-[35rem]`, added mobile "view all packages" button
  (desktop-only link previously); 10 corporate-desk card no longer renders `tel:` link with e-mail text (phone -> tel,
  else email -> mailto, else hidden), `dir="ltr"` on phone.
- DONE (recruiting pass 2): 01 + 03 hero `text-white/80`, `text-white`, `bg-white/10`, `ring-white/10` -> `t-primary-fg/x`.
- Remaining decorative `bg-white/N` (recruiting/02 gold chips, 03 employers, pizza/01 dark card, law/04 + realestate/03
  gap-px grid backgrounds) are on `bg-t-dark`/`bg-t-secondary` surfaces — to be tokenised as each file is reviewed.
- NEXT: pizza 01-10 read + fix (restaurant kit: OrderProvider/CartBar/FeaturedItems/DealsStrip/OpenBadge), then bakery.

## [2026-09-27 16:50] pizza 01-10 DONE; bakery IN PROGRESS
- NOTE: the 16:10 entry's multi-line edits (travel/09 mobile CTA, travel/10 desk card, recruiting/01+03 whites) had NOT
  applied (python missing on host); re-applied via Node in this batch and verified by grep.
- DONE (pizza): 01-10 read in full. All 10 distinct (cream ticket deals, dark wood-fired full-screen, orange app chrome +
  bottom order bar, tricolore printed menu w/ dotted leaders, neon marquee, family combo rows, monochrome type-first list,
  truck-art borders, corporate slider + branch cards, cartoon blobs + coupon cards). Module integration OK in all:
  OrderProvider/CartBar/CartDrawer/CartCountLink, OpenBadge, HoursTable, delivery zones (fee/min/eta with settings
  fallback), /menu#item-slug deep links, /reserve when reservations enabled (04).
  Fixes: 01 dead `export type { SiteContext }` + unreachable FeaturedItems fallback removed, dark hours panel tokens;
  02 transparent-header cart chip + hero outline hover tokens; 03 header CTA/chips/blobs/hours button `bg-white` ->
  `t-primary-fg`, WhatsApp float lifted above the mobile order bar (was overlapping); 05 hero Img eager;
  06 BUG: `Math.min()` over empty price list rendered "Rs Infinity" badge -> guarded; header chips tokens;
  08 WhatsApp chip token; 09 slider outline CTA + dots `text-white` -> `t-dark-fg`, first slide eager;
  10 `text-t-fg` on primary surfaces -> `text-t-primary-fg` (3 places).
- DONE (bakery 01-02 read): 02 frame offset now `rtl:-translate-x-3`; footer strip no longer prints "Call us:" with an
  empty number (tel link, else tenant name). bakery/05 + gym/05 multi-line hero Img -> eager.
- NEXT: bakery 03-05, then gym 01-05 (kit: PlansGrid/ClassTimetable/BmiCalculator/TrialForm/TransformationsGallery).

## [2026-09-27 17:10] bakery 01-05 DONE; gym IN PROGRESS
- DONE (bakery): 03-05 read in full. All 5 distinct (pastel scallops + circular cake frame, kraft chalkboard with dotted
  leaders, bold black/pink 3-photo grid, maroon/gold ornaments + bulk-gifting reframe, sage cafe-sign hours).
  Contract/module OK: OrderProvider chain, custom-cake CTA -> /custom-cake, /menu#item deep links, hours guarded by
  `settings.hours.length`, delivery zones with address fallback. Fix: 03 first hero grid image eager.
- JUDGEMENT (left as is, brief-mandated): bakery/05 "Pairs with · Flat white/Karak chai" pairing chips are decorative
  copy cycled by position (not tenant-editable). Flag for tenant-site/product if they want a per-item field.
- NEXT: gym 01-05 read + fix, then law 01-06, realestate 01-03, then final tsc/eslint/gen-registry + summary.

## [2026-09-27 17:30] gym 01-05 DONE; law IN PROGRESS
- DONE (gym): 01-05 read in full. All 5 distinct (black/red skewed band + dark plans, teal/coral rounded collage + BMI,
  sage serif single-CTA + hours/BMI panel, concrete/hazard-tape stencil tickets, plum arched portrait + women-only pill +
  trial form). Module kit used everywhere: PlansGrid/ClassTimetable/BmiCalculator/TrialForm/TransformationsGallery
  (or GalleryBlock album=transformations), /join CTAs, hours guarded.
  Fixes: 01 hours phone `dir="ltr"`; 02 first hero collage image eager; 04 frame offset `rtl:-translate-x-3`,
  hero secondary hover uses `text-t-secondary-fg` (was accent-fg), hours phone chip now a guarded tel: link (no empty chip).
- NEXT: law 01-06 read + fix (01 already read: unlocalized "Call the chambers" + placeholder phone), then realestate 01-03.

## [2026-09-27 17:50] law 01-06 + realestate 01-03 DONE
- DONE (law): 01-06 read. All distinct (navy/gold split, minimal numbered list, warm plain-language cards + confidential
  badge, slate/teal table cards + compliance steps, dark gold numerals, solo-advocate portrait + credentials timeline).
  Fixes: 01 "Call the chambers" localized, placeholder phone "+92 300 0000000" removed (card hidden when no phone),
  `dir="ltr"`; 04 compliance grid gap `bg-white/10` -> `bg-t-dark-fg/10`; 05 hero fetchPriority.
- DONE (realestate): 01-03 read. Distinct (navy/gold skyline + PropertySearch, minimal search-first + area counts,
  map-grid societies + big stats). Fixes: 01 outline CTA whites -> `t-dark-fg`, hero fetchPriority; 03 stats grid gap
  + grid-line overlay -> `t-dark-fg` tokens. 0 hard-coded white/black classes left in owned dirs (only #25D366 WhatsApp brand).
- NEXT: catalog polish (Urdu on `{ en }`-only overrides in recruiting/travel/restaurant/services.ts), then final
  tsc / eslint / gen-registry, summary + score.

## [2026-09-27 18:05] [resume] state reconciled
- DONE: `git diff 9a2d796 --stat` over owned dirs = 53 template files + catalog; working tree clean. Verified in tree: law/01
  localized "Call the chambers" + phone card guarded + `dir="ltr"`; law/04 `bg-t-dark-fg/10`; law/05 + realestate/01-03
  `fetchPriority="high"`; realestate/03 grid tokens. Law + realestate are fully applied.
- CORRECTION to 17:50 claim "0 hard-coded white/black": grep still finds recruiting/02 (`hover:bg-white/10`, `bg-white/5`),
  recruiting/03 (`ring-black/5`, `bg-white/5`) and 3 mobile-drawer scrims `bg-black/40-60` (recruiting 05/07/09 headers).
  Scrims are intentional overlays; 02/03 will be tokenised in the final sweep.
- NEXT: catalog Urdu polish (IN PROGRESS) — recruiting.ts, travel.ts, restaurant.ts (pizza block), services.ts
  (bakery/gym/law/realestate blocks only; printing is templates-a's).
