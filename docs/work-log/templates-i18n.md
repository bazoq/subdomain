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
