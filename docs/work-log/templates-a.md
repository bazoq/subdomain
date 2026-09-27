# templates-a — stream log

**Owner boundary:** `src/templates/{kitchen,printing,clothing,shoes,gifts,blades,electronics,medical,sports}/**`
plus the matching blueprint entries in `src/templates/catalog/ecommerce.ts` (kitchen, clothing, shoes, gifts, blades,
sports, electronics, medical) and `src/templates/catalog/services.ts` (printing-01..04 only).
Do NOT edit: `src/templates/{shared,ui,types,fields,theme,registry,metas}.*`, `src/modules/**`, `src/app/**`, `globals.css`.

Templates (35): kitchen 01-04 · printing 01-04 · clothing 01-04 · shoes 01-04 · gifts 01-04 · blades 01-04 ·
electronics 01-03 · medical 01-03 · sports 01-05.

## Handoffs
(see bottom — appended as found)

---

## [2026-09-27 10:00] Audit pass: all 35 templates read end-to-end + grep sweeps
- DONE: read AGENTS.md, TEMPLATE-GUIDE.md, CONVENTIONS.md, template contract (types/fields/theme/registry), shared
  packs/sections/render/ui, catalog (ecommerce.ts + printing entries of services.ts), reference law/01, ecommerce +
  shared + printing UI kits; then every owned `index.tsx`/`header.tsx`.
- Sweeps (owned dirs): `any` 0 · `console.` 0 · `TODO` 0 · `href="#"` 0 · `<Img>` without alt 0 · hard-coded
  `left-/right-` 1 (gifts/03 centring transform, direction-neutral) · `<img>` + `eslint-disable` 5 (logo images in
  kitchen/02 header, clothing/01 header, blades/02 masthead; hero backgrounds in printing/03, printing/04) ·
  fixed px widths 3 (`max-w-[150px|200px|220px]` on logos) · hard-coded `text-white` on themed surfaces in
  shoes/01, shoes/03, shoes/04, clothing/03, clothing/04 (breaks when a tenant overrides primary/secondary colours).
- FOUND (contract): every template exports `{ Layout, Home }`, renders hero + `renderOrdered` with a renderer for
  every pack key (incl. `craft`, `prescriptionCta`, `brands`, `gallery` where applicable), guards `null` section data,
  arrays via `?? []` / `?.length`. Ecommerce layouts wrap in `EcommerceProviders` + `CartDrawer`; medical headers
  carry the prescription upload CTA; printing layouts carry the quote CTA. meta.ts are one-line `buildMeta()`.
- FOUND (distinctiveness): each category's templates differ in hero composition, product presentation, section
  chrome and header (documented per file header). No near-duplicates needing redesign.
- FOUND (bugs): sports/01 `loadProducts` has no fallback when the tenant has no featured products (all other 34 do);
  clothing/04 remaps `--t-dark-fg` to a literal `#ffffff`; clothing/02 hover-only QUICK ADD and gifts/04 hover-only
  price row are invisible to keyboard users; kitchen/02 + clothing/01 custom headers use English-only aria labels;
  medical/03 uses `[&>div]:lg:h-16` variant order (others use `lg:[&>div]:…`).
- FOUND (localisation): catalog `overrides` for gifts-01/02, sports-05, electronics-03, shoes-02, printing-02/04 are
  English-only LocalizedStrings; blueprints ship no template-specific `features` (only category features).
- NEXT: apply fixes in batches (img/eslint-disable → contrast tokens → a11y/i18n → sports-01 → catalog), then tsc/eslint.

## [2026-09-27 03:52] [resume] state reconciled (git diff 9a2d796 vs working tree, 29 owned files changed)
- DONE (previous agent, verified in tree): img/eslint-disable → `Img` (kitchen/02 header, clothing/01 header, blades/02,
  printing/03, printing/04) with rem logo widths (max-w-36/48/56) · contrast tokens (shoes/01/02/03/04, clothing/02/03/04,
  blades/01/03, gifts/02, kitchen/02/04, medical/01/02/03, electronics/01/03, printing/01, sports/01/03/04/05) ·
  clothing/04 `--t-dark-fg` → `var(--t-primary-fg)` · clothing/02 QUICK ADD `focus-visible:opacity-100` ·
  gifts/04 price row `group-focus-within` · kitchen/02 + clothing/01 header A11Y labels localized (ls) · slide dots
  localized · medical/03 variant order `lg:[&>div]:h-16` · sports/01 loadProducts fallback to getProducts.
- PENDING: residual `white` on themed surfaces (blades/03 cart hover, clothing/01 hero+banner) · aria-label="Main"
  (clothing/01 header) and "Categories" (sports/01) still English · clothing/02 h1 `text-6xl` at 360px ·
  `<main id="main">` wrap in all 35 layouts (none have it; templates-b pattern is
  `<main id="main" className="flex-1">{children}</main>`) · catalog Urdu overrides + template `features` (untouched).
- Verified: every section-array `.map` in owned templates is guarded (`?.length`) within its component; no
  `<main>` rendered by shared/ui/modules (safe to add landmark); no raw `<img>`, no px arbitrary widths left.
- NEXT: Batch A (residual contrast + aria + clothing/02 h1) → Batch B (main landmark) → Batch C (catalog) → tsc/eslint/registry.

## [2026-09-27 03:52] Batch A IN PROGRESS: residual contrast tokens, aria labels, clothing/02 mobile h1
- DONE: blades/03 cart hover `bg-t-dark-fg/10`; clothing/01 hero + banner copy/CTA → `t-dark-fg` tokens (surface is
  `bg-t-dark` + black photo overlay; collection cards over hard-coded `from-black` gradients keep `text-white` by design);
  clothing/01 header desktop nav `aria-label={t(A11Y.main)}` (EN/UR); sports/01 hero category nav `CATEGORIES` ls();
  clothing/02 h1 `text-5xl sm:text-7xl lg:text-[8rem]` (60px uppercase overflowed at 360px).
- tsc: owned dirs clean (only error is src/modules/travel/ui/package-detail.tsx — travel stream WIP, not ours). eslint clean.
- NEXT: Batch B — `<main id="main">` landmark in all 35 layouts.

## [2026-09-27 03:54] Batch B IN PROGRESS: main landmark in 35 layouts
- DONE: all 35 layouts now render `<main id="main" className="flex-1…">{children}</main>` (gifts/04 keeps its
  `pt-16 lg:pt-20` offset for the fixed header). Verified exactly one `<main>` per template; shared/ui/modules render none.
- eslint (owned dirs) clean; tsc has 0 errors under src/templates.
- NEXT: Batch C — catalog Urdu overrides (gifts-01/02, sports-05, electronics-03, shoes-02, printing-02/04) + `features`
  on all 35 owned blueprints.

## [2026-09-27 03:56] Batch C IN PROGRESS: catalog Urdu overrides + template-specific features
