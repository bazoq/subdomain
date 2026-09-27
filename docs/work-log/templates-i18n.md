# Stream: templates-i18n (wave-4 follow-up: eyebrow/note localisation + pack Urdu)

Owner area (only edit): `src/templates/**` (shared, ui, fields, types, theme, catalog, all 84 template folders),
`tests/unit/*templates*.test.ts` (new tests only). Everything else → `## Handoffs`.

Inputs: templates-a.md / templates-b.md Handoffs (eyebrow + destinations `note` are `f.text`; pack hero copy is
English-only `ls("…")`; price notes hard-code "Rs 45,000").

## Handoffs
(see bottom of file)

---

## [2026-09-27 21:05] IN PROGRESS — audit + plan
- DONE: read protocol/TEMPLATE-GUIDE/CONVENTIONS, fields.ts, sections.ts, packs.ts, types.ts, ui/index.tsx, law/01,
  site-content.ts (read-only), section-editor.tsx (read-only), catalog/index.ts.
- FOUND: `normaliseSectionData` falls back to the WHOLE section defaults when a stored blob fails zod → switching
  `eyebrow`/`note` to `localizedString` without a string→`{en}` preprocess would silently discard every tenant's saved
  hero/about/… content. Preprocess must live centrally in `fieldSchema` (localized + richtext).
- FOUND: 92 template files read `.eyebrow` (346 sites); 13 read destinations/areas `.note`; every one of them already
  imports `t` from `@/lib/i18n`. `SectionHeading` (templates/ui) takes `eyebrow?: string` — widening it to
  `LocalizedString | string` covers every module-kit call site without touching `src/modules`.
- FOUND: `{h.eyebrow ? <span>…{h.eyebrow}</span> : null}` truthiness would become always-true with an object value →
  the sweep must wrap the condition too (`t(h.eyebrow, lang) ? … : null`), not just the render.
- FOUND: 304 distinct single-arg `ls("…")` defaults across sections.ts + packs.ts; 52 plain-string eyebrow defaults;
  25 catalog `overrides` eyebrows are plain strings.
- NEXT: fields.ts preprocess → sections/packs field types + Urdu → SectionHeading → node sweep of 84 templates → catalog
  overrides → test → verify.

## [2026-09-27 22:10] [resume] state reconciled
- DONE (already at HEAD e09cd5a): `localizedOrString` preprocess in `src/templates/fields.ts` (localized + richtext + link
  label accept legacy plain string → `{ en }`); `SectionHeading.eyebrow` widened to `LocalizedString | string` and
  resolved via `t()` in `src/templates/ui/index.tsx`. Working tree clean, tsc/tests green.
- NEXT: sections.ts + packs.ts field types (`eyebrow`/`note` → `f.localized`) + Urdu defaults → template sweep.

## [2026-09-27 22:45] DONE — eyebrow/note localised end to end, Urdu defaults, renderer sweep, tests
- DONE `src/templates/shared/sections.ts` + `packs.ts`: every `f.text("eyebrow")` (26 sections) and the destinations/areas
  repeater `note` → `f.localized`; all 55 plain-string eyebrow defaults → `ls(en, ur)`; all 308 single-arg `ls("…")`
  defaults now carry natural Pakistani-business Urdu (only the intentionally empty `ls("")` subtitles stay single-arg);
  pizza/bakery about title split into two `ls(en, ur)` calls; new `fromPrice(en, ur, amount)` helper builds the four
  destination notes through `formatPKR` in both languages ("5 days from Rs 45,000" / "5 دن، 45,000 روپے سے").
- DONE `src/templates/catalog/{ecommerce,restaurant,recruiting,travel,services}.ts`: 25 override eyebrows → `{ en, ur }`;
  travel-03 destination notes → `fromPrice()` via `formatPKR` (local helper in travel.ts).
- DONE sweep of all 84 `src/templates/<cat>/<nn>/index.tsx` (scripted regex + scope heuristic, then tsc-driven review):
  `{h.eyebrow ? … {h.eyebrow} …}` → `{t(h.eyebrow, lang) ? … {t(h.eyebrow, lang)} …}` (truthiness AND render), same for
  `it.note`/`a.note`; kit props that still take a string (`FeaturedJobs/Packages/Properties/Products eyebrow=`,
  `heading={{ eyebrow }}`) resolved at the call site with `t(…, ctx.lang)`; `h.eyebrow.toLowerCase()` → `t(…).toLowerCase()`;
  per-template heading components widened to `eyebrow?: LocalizedString | string` (blades/02 PlaqueHeading, gifts/02
  FormalHeading, recruiting/09 MonoHeading, shoes/01 BlackHeading); gifts/01 `<Ribbon text=…>` and clothing/03 header
  tagline resolved with `t()`; realestate/01-03 `AreasData.note` typed `LocalizedString`. Grep review: no bare
  `.eyebrow`/`.note` reads remain outside `t()` or a `SectionHeading eyebrow={…}` attribute.
- DONE `tests/unit/templates-i18n.test.ts` (10 tests): 84 templates/16 categories; every section's defaults parse
  through its own schema; every `eyebrow` and destinations/areas `note` field is `localized`; every hero
  eyebrow/title/subtitle has non-empty, distinct en + ur; every non-empty localized default in every section of every
  template has Urdu; destination notes use `formatPKR` in both languages; legacy plain-string eyebrow / link label /
  richtext / repeater note rows coerce to `{ en }` without losing sibling fields; `localizedOrString` rejects bad shapes.
- VERIFIED: `npx tsc --noEmit` 0 errors; `npx eslint src/templates tests` clean; `node scripts/gen-registry.mjs` no churn
  (84 templates); `npx vitest run` 26 files / 362 tests green.
- RISKS (remaining):
  - Urdu copy is agent-authored (idiomatic Pakistani business register, Latin digits per `formatPKR` convention) but has
    not had a native-speaker review; a tenant can override any string from the admin.
  - Admin section editor now shows `eyebrow`/`note` as EN/UR inputs; legacy rows appear English-only until edited
    (expected — the preprocess keeps the saved text).
  - `src/modules` still types these fields as `string` (see Handoffs); runtime is safe because every path resolves via
    `SectionHeading`'s `t()` or the template-side `t()`, but the types under-describe the data.
- NEXT: none for this stream (done). Orchestrator: commit; pick up Handoffs in the modules stream.

## Handoffs
- `src/modules/shared/ui/section-types.ts`: `HeadingData`, `GalleryHeadingData`, `HeroData` declare `eyebrow?: string` —
  should be `eyebrow?: LocalizedString | string` now that the section field is localized (templates that reuse these
  aliases already resolve with `t()`, so this is type accuracy only).
- Module kit props `eyebrow?: string` on `FeaturedProducts` (ecommerce), `FeaturedJobs` (recruiting), `FeaturedPackages`
  (travel), `FeaturedProperties` (realestate) and the `heading?: { eyebrow?: string … }` props on gym/law/printing grids
  could accept `LocalizedString | string` and forward to `SectionHeading` directly; templates currently pass
  `t(x.eyebrow, ctx.lang)` which works but forces early resolution. Same for the `as { eyebrow?: string }` casts in
  `gym/ui/plans-grid.tsx`, `gym/ui/class-timetable.tsx`, `shared/ui/contact-block.tsx`, `shared/ui/faq-block.tsx`,
  `shared/ui/gallery-block.tsx` (runtime-safe: they forward to `SectionHeading`).
- Still `f.text` by design (out of this stream's scope, flagged for a later i18n pass): hero `badges[].text`,
  deals `badge`, stats `value`, brands `logos[].name`, footer `bottomNote`, `seo.title/description`, areas `name`.
