# polish-w5 — Wave 5 polish (owner: polish-w5 agent)

Ownership: whole repo, but ONLY for the five tasks below (no refactors beyond them).
1. `submitLead` custom_cake gate (src/modules/leads/actions.ts)
2. Super leads UI `source` badge + `?source=` filter (src/app/(super)/super/(dashboard)/leads/page.tsx, src/server/super/leads-actions.ts)
3. tests/unit/jsonld.test.ts for src/modules/shared/jsonld.ts
4. `eyebrow` / `heading` prop widening to `LocalizedString | string` (section-types + module kits)
5. `ImageField` / `ImagesField` `label` prop at call sites (src/components/admin/uploader.tsx callers)

Baseline: HEAD 1c3162e — tsc clean, eslint clean, 362 tests green. A production build runs concurrently; do not run `npm run build`.

## [2026-09-27 23:05] Stream opened
- IN PROGRESS: reading files for tasks 1-5.
- NEXT: task 1 (submitLead custom_cake gate).

## [2026-09-27 23:10] Task 1 — submitLead custom_cake gate
- IN PROGRESS: refuse formKey "custom_cake" unless restaurant module + category "bakery" (mirrors custom-cake/page.tsx requireBakery).
- DONE: src/modules/leads/actions.ts — `submitLead` returns `fail(t(publicMessages.unavailable, lang))` for `formKey === "custom_cake"` unless `hasModule(tc, "restaurant") && tc.category.key === "bakery"` (import from `@/modules/shared/module-gate`). tsc + eslint clean.
- NEXT: task 2 (super leads `source` badge + `?source=` filter).

## [2026-09-27 23:14] Task 2 — super leads UI source column + filter
- IN PROGRESS: page.tsx column + Badge + `?source=` filter (distinct sources select), where extended; no server-function change needed (page queries db directly, as before).
- DONE: src/app/(super)/super/(dashboard)/leads/page.tsx — new "Source" column (Badge; `template:901` → `#901`, brand tone; `contact:starter` → `contact · starter`; em dash when null), `?source=` filter (token-validated, exact match in `where`), Select populated from a `distinct: ["source"]` query (take 200), carried through `hrefFor` pagination. leads-actions.ts and lead-actions.tsx unchanged (page already queried db directly). tsc + eslint clean.
- NEXT: task 3 (tests/unit/jsonld.test.ts).

## [2026-09-27 23:20] Task 3 — tests/unit/jsonld.test.ts
- IN PROGRESS: pure-builder tests for src/modules/shared/jsonld.ts (mock @/server/db since site-seo imports it).
- DONE: tests/unit/jsonld.test.ts (12 tests): compactJsonLd empties, plainText, absoluteImages (relative/data:/javascript:/null rejected), JobPosting employmentType map + TELECOMMUTE + salary/deadline omission, property sale vs rent (UnitPriceSpecification MON, LeaseOut), PLACE_TYPE fallback, FAQPage null when no complete rows. `@/server/db` mocked (site-seo imports it).
- NEXT: task 4 (eyebrow / heading type widening).

## [2026-09-27 23:30] Task 4 — eyebrow `LocalizedString | string`
- IN PROGRESS: section-types.ts HeadingData/GalleryHeadingData/HeroData; module kits FeaturedProducts/FeaturedJobs/FeaturedPackages/FeaturedProperties `eyebrow`; gym/law/printing `heading` props; shared/ui blocks' local HeadingData (they receive those headings). SectionHeading already resolves via t().
- DONE: `eyebrow?: string` → `eyebrow?: LocalizedString | string` in src/modules/shared/ui/section-types.ts (HeadingData, GalleryHeadingData, HeroData); FeaturedProducts / FeaturedJobs / FeaturedPackages / FeaturedProperties props; gym (class-timetable, plans-grid, transformations-gallery), law (attorneys-grid, practice-areas-grid), printing (print-services-grid) `heading` props incl. the inline section-data casts; and the shared blocks they feed (contact/faq/gallery/posts/services/team/testimonials-block local HeadingData). All render via `SectionHeading`, which already resolves `t(eyebrow, lang)`. tsc 0, eslint clean.
- NEXT: task 5 (ImageField/ImagesField labels).

## [2026-09-27 23:36] Task 5 — uploader labels
- IN PROGRESS: add `label` prop to ImagesField (list aria-label, add/remove/move button labels); pass labels at all 18 call sites.
- DONE: src/components/admin/uploader.tsx — `ImagesField` gained `label?: string` (default "Images"): list `aria-label`, "Add <plural> (n of max)" / "Uploading n <noun>…", "Remove/Move <singular> i". Labels passed at all 18 call sites: Logo, Favicon, Social share image (settings-form); Cover image (post-form, super blog-form); Photo (team-form, testimonial-form); Item photo (menu-item-form); Category image (ecommerce category-form, restaurant category-manager); Service image (service-form); `Variant {i+1} image` + Product images (product-form); Property photos; Package photos; Gallery images; section-editor passes the field's own `f.label` to both ImageField and ImagesField.
- NEXT: final gates.

## [2026-09-27 23:45] Final — all five tasks done
- DONE: `npx tsc --noEmit` 0 errors · `npx eslint src tests` clean · `npx vitest run` 27 files / 374 tests green (362 + 12 jsonld).
- Changed files: src/modules/leads/actions.ts · src/app/(super)/super/(dashboard)/leads/page.tsx · tests/unit/jsonld.test.ts (new) · src/modules/shared/ui/section-types.ts · src/modules/{ecommerce/featured-products,recruiting/featured-jobs,travel/featured-packages,realestate/featured-properties}.tsx · src/modules/gym/ui/{class-timetable,plans-grid,transformations-gallery}.tsx · src/modules/law/ui/{attorneys-grid,practice-areas-grid}.tsx · src/modules/printing/ui/print-services-grid.tsx · src/modules/shared/ui/{contact,faq,gallery,posts,services,team,testimonials}-block.tsx · src/components/admin/uploader.tsx + 14 admin form call sites · docs/work-log/{polish-w5,STATUS}.md.
- Not done / notes: no dependencies added; no server function added to leads-actions.ts (page already queries db directly, consistent with before). `npm run build` not run (concurrent build in progress). Nothing committed.

## Handoffs
- (none)
