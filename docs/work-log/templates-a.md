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
- (agent cut off by tooling error: tw-check import error + eslint native crash while running concurrently with other
  agents; rerun tools one at a time.)

## [2026-09-27 18:05] [resume] state reconciled (git diff 9a2d796 --stat: 39 owned files changed, HEAD 47afb7f)
- VERIFIED in tree (Batch C, previous agent): Urdu added to every `{ en }`-only override in owned blueprints —
  shoes-02 hero title, gifts-01 collections title + 4 occasion items (title/subtitle), gifts-02 banner (title/text/cta),
  sports-05 banner (title/text/cta), electronics-03 banner (title/text/cta), printing-02 + printing-04 hero titles.
  Template-specific `features` (3-4 bullets each) present on all 35 owned blueprints (31 in ecommerce.ts + printing-01..04).
- NEXT: confirm eyebrow field type (plain string vs LocalizedStrings), tsc/eslint one at a time → Batch C DONE →
  final sweep (360px, h1, landmarks, alt, RTL, defensive defaults, PKR formatter, i18n) → summary + score.
- DONE: `eyebrow` is a plain `f.text` field (not LocalizedString) in shared sections — English eyebrows in overrides are
  correct by type; nothing further to localise in catalog. tsc: 0 errors under src/templates (remaining errors are
  src/server/notify.ts + src/components/site/* — commerce / tenant-site streams' WIP). eslint (owned + catalog) clean.

## [2026-09-27 18:20] Batch C DONE: catalog Urdu overrides + template-specific features (all 35 owned blueprints)
- NEXT: final sweep — 360px, one h1, landmarks, alt, RTL, defensive defaults, PKR formatter, i18n, distinctiveness.

## [2026-09-27 18:20] Final sweep IN PROGRESS (35 templates)
- DONE (sweep results, owned dirs):
  · h1: exactly 1 per template (35/35). `<main id="main">`: exactly 1 per template; header + footer present in all.
  · 360px: no `w-[Npx]`/`min-w-[…px]` left; only fixed widths are `hidden w-72 lg:flex` (electronics/01 search, hidden
    on mobile) and a decorative `w-[28rem]` blob inside an `overflow-hidden` hero (printing/03). Base grid columns ≤ 2
    everywhere except gifts/03 hero tiles `grid-cols-3` (6 square thumbnails, ~100px each — fits). Added `break-words`
    to the 7 heroes whose base h1 is ≥48px uppercase/heavy (printing/03, blades/03, sports/01, sports/02, shoes/01,
    gifts/04, clothing/02) so a long single word cannot overflow the 328px column.
  · alt text: every `<Img>` carries `alt` (decorative → `alt=""`; logos → tenant name). No raw `<img>`.
  · icons: lucide-react 1.46 renders `aria-hidden="true"` by default (verified in dist buildLucideIconNode) — the 127
    icons without an explicit attribute are fine. No icon-only buttons without `aria-label`; every `<nav>` labelled.
  · RTL: 0 physical `left-/right-/ml-/mr-/pl-/pr-/text-left/text-right` classes (only a comment + a border-radius
    arbitrary value matched); 0 `space-x`/`divide-x` without `rtl:*-reverse`; all ArrowRight/ChevronRight carry
    `rtl:rotate-180`. Fixed: phone numbers now `dir="ltr"` in electronics/01, electronics/03 (header + banner),
    medical/01, sports/04 (kitchen/02 already had it).
  · defensive defaults: scripted scan of every `x.y.map(` — all guarded within 8 lines by `?.length`/`?? []`
    (clothing/04 guard is at fn top, verified manually); `ctx.nav` is a required array. `sectionData` returns null
    for disabled sections and every renderer returns null on `!d` → all-sections-disabled renders hero + footer only.
  · PKR: no `Rs`/`PKR`/`toLocaleString` literals; all prices go through shared `PriceTag`/`minPrice`/`salePercent`
    or `formatPKR` (electronics/01 "from" price).
  · i18n: 0 single-arg `ls("…")` in owned dirs (18 two-arg EN/UR pairs); 0 English `aria-label="…"`, `placeholder=`,
    `title=` literals; 0 bare English JSX text nodes (heuristic grep).
  · performance: hero (LCP) image now `priority` (eager + fetchPriority=high) in all 35 templates — 34 replacements
    (slider/tile heroes mark only the first frame: clothing/01, electronics/01, gifts/03).
  · distinctiveness: unchanged from audit — each category's templates differ in hero composition, product card
    treatment, section chrome and header (documented in each file header).
- NEXT: tsc / eslint / gen-registry, then summary + score.

## [2026-09-27 18:30] Final sweep DONE — stream complete
- Verification: `npx tsc --noEmit` → 0 errors under src/templates (remaining errors are other streams' WIP:
  src/server/notify.ts, src/components/site/*); `npx eslint` (9 owned dirs + catalog) → clean;
  `node scripts/gen-registry.mjs` → "Registry generated with 84 templates."
- Per-category summary (35 templates, all: 1 h1, main/header/footer landmarks, alt on every image, logical RTL classes,
  guarded sections, shared PriceTag/formatPKR, EN/UR strings, hero `priority`, template `features` + Urdu overrides):
  · kitchen 01-04 — editorial split / retail category-bar header (custom, localized a11y) / transparent-on-scroll
    masonry / playful pastel tiles. Fixes: header `<img>`→Img, contrast tokens, main landmark, hero priority.
  · printing 01-04 — CMYK grid / letterpress craft (Urdu hero title) / urgent estimator (break-words h1) / dark
    wide-format signage (Urdu hero title). Fixes: hero bg `<img>`→Img, tokens, features.
  · clothing 01-04 — scroll-snap slider (custom header, localized nav labels, dark-fg tokens) / brutalist ticker
    (mobile-safe h1, keyboard QUICK ADD) / soft bubbles / bento block-print. Fixes: `#ffffff` remap → token.
  · shoes 01-04 — sneaker drop (break-words h1) / handmade leather (Urdu hero title) / speed gradient (2 hero imgs
    priority) / gold couture. Fixes: text-white → theme tokens throughout.
  · gifts 01-04 — occasions grid (Urdu items) / corporate hampers (Urdu banner) / personalise steps / dark botanical
    (focus-within price row). Fixes: tokens, features, hero priority.
  · blades 01-04 — forge timeline / catalogue exhibits (masthead logo Img) / rugged specs (break-words h1) /
    comparison grid. Fixes: cart hover token, features.
  · electronics 01-03 — spec retail (slider first frame priority, phone dir=ltr) / neon gaming / solar lead banner
    (Urdu banner, phone dir=ltr ×2). medical 01-03 — clinical steps (phone dir=ltr) / wellness pastel / app-style
    chips (variant order fixed). sports 01-05 — cricket (loadProducts fallback, localized categories nav, break-words
    h1) / heavy-metal (break-words h1) / kids blobs / outdoor (phone dir=ltr) / team kits (Urdu banner).
- Remaining issues (accepted / out of boundary):
  · `text-white` kept intentionally in clothing/01 collection cards + clothing/02 collection tiles: copy sits over a
    hard-coded `from-black` photo gradient, so white is the correct fixed contrast pair (not a theme surface).
  · Hero `eyebrow`, section `eyebrow` defaults ("Welcome", "Reviews", …) are plain-text fields in shared sections →
    cannot carry Urdu; see Handoffs.
  · No runtime/visual test harness exists; 360px and RTL checks were static (class sweeps), not screenshot-verified.
- SCORE: 88/100. Contract, a11y (landmarks, single h1, alt, labelled nav, keyboard-reachable hover controls),
  theming (no hard-coded colours on themed surfaces), i18n (all owned strings EN/UR, catalog overrides bilingual),
  RTL (logical classes, mirrored arrows, LTR phone numbers), defensive data handling and LCP hints are all verified
  by grep/script across 35/35 templates. Points withheld: no screenshot/visual regression run (−6), eyebrow fields
  not localizable at the contract level (−3), distinctiveness judged by reading rather than rendered side-by-side (−3).

## Handoffs (appended)
- tenant-site / shared: `f.text("eyebrow")` in `src/templates/shared/sections.ts` (hero, about, features, testimonials,
  faq, gallery, contact, team, process) is a plain string → Urdu visitors see English eyebrows/defaults. Consider
  `f.localized("eyebrow")` + `ls()` defaults (templates render via `h.eyebrow` directly; `t()` already accepts strings,
  so switching the field type is backwards compatible if renderers wrap with `t(x, lang)`).
- shared/packs: category pack hero titles/subtitles are single-arg `ls("…")` (English only) — e.g.
  "Everything your kitchen needs", "Shoes made for Pakistani roads". Add Urdu second args.
- commerce: `src/server/notify.ts` currently fails tsc (unterminated regex, lines 25-27) — blocks a clean repo-wide tsc.
- tenant-site: `src/components/site/{preview-banner,suspended,unknown-host}.tsx` reference `ui.*` keys that do not
  exist yet (previewTitle, openAdmin, unavailableEyebrow, siteNotSetUp*) — tsc errors.
