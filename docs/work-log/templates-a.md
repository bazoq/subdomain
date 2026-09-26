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
