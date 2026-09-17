# Template implementation guide

Read `docs/CONVENTIONS.md` first. Reference implementation: `src/templates/law/01/index.tsx` (#1301).

## What a template is

- `src/templates/<category>/<nn>/meta.ts` — one line: `export const meta = buildMeta("<category>-<nn>")`. **Already generated for all 84.** Do not edit.
- `src/templates/<category>/<nn>/index.tsx` — the design. Exports `components: TemplateComponents = { Layout, Home }`.
- The blueprint (design brief, palette, fonts, section order/overrides, demo name) lives in `src/templates/catalog/*.ts`. Read your template's `brief` (header / hero / signature / layout / motion) and implement **exactly that** — this is what makes each template unique.
- Numeric code = category series + number (`meta.code`, e.g. pizza-01 → 901). Mention it in the file header comment.

## Rules

1. **Theme tokens only.** Never hard-code colours; use `bg-t-primary`, `text-t-fg`, `bg-t-muted`, `border-t-border`, `bg-t-dark text-t-dark-fg`, `bg-t-accent`, `font-heading`, `rounded-[var(--t-radius)]`, `.t-btn .t-btn-primary/.t-btn-accent/.t-btn-outline`, `.t-card`, `.t-input`, `.t-container`/`<Container>`, `.t-eyebrow`. The palette/fonts come from the blueprint via CSS variables set on `<html>`; tenant branding overrides them.
2. **Content only from `ctx`.** Text: `section(ctx, heroSection)` for typed access or `sectionData<T>(ctx, def)` from `@/modules/shared/ui`. Never invent copy in JSX except tiny UI labels (use `ui.*` from `@/lib/i18n` + `t(value, ctx.lang)`); every visible sentence must be editable through a section field. Support Urdu (`ctx.lang`, `ctx.dir`) — avoid `left/right` classes when `start/end` exist; use `rtl:` variants where needed.
3. **Honour admin ordering/visibility.** Home renders the hero (always) then `renderOrdered(ctx, { key: () => <Block/> })` from `@/templates/shared/render`. A section switched off in the admin must disappear; nothing else may break.
4. **Reuse module kits** for business logic. Shared blocks: `@/modules/shared/ui` (SiteHeader, SiteFooter, AnnouncementBar, StatsBlock, FeaturesBlock, ProcessBlock, CtaBlock, AboutBlock, BrandsMarquee, PromoStrip, TestimonialsBlock, FaqBlock, GalleryBlock, TeamBlock, ServicesBlock, PostsBlock, ContactBlock, HoursTable, PageHero…). Category kits: `@/modules/ecommerce/ui`, `@/modules/restaurant/ui`, `@/modules/recruiting/ui`, `@/modules/travel/ui`, `@/modules/realestate/ui`, `@/modules/gym/ui`, `@/modules/law/ui`, `@/modules/printing/ui`. Compose them with different `variant`/`columns`/`light`/`className` props and wrap them in your own section shells. Write your own **hero**, and your own **signature** element(s) from the brief; you may also write custom versions of any block when the brief calls for a distinct look (e.g. deals as ticket cards), still reading the same section data.
5. **Header/footer.** Use `SiteHeader`/`SiteFooter` with variants when the brief allows; otherwise build a custom header (client component with mobile drawer) — it must show `ctx.nav`, `LangSwitch`, and, for ecommerce/restaurant categories, the cart button from the module kit (`CartButton` / `CartBar` + providers). Ecommerce/restaurant Layouts must wrap children in the module's provider (`CartProvider host={ctx.host}` / `OrderProvider`) so inner pages share the cart.
6. **Performance/quality.** Server components by default; `"use client"` only for interactivity (sliders, tabs, drawers). Images through `<Img>` from `@/templates/ui` (handles empty). No external scripts. Mobile-first; test mentally at 375px and 1440px. Accessible: alt text, focus styles, aria on toggles.
7. **Inner pages** (`/shop`, `/menu`, `/jobs`, `/contact`, …) are shared route files that render inside your `Layout`; you don't write them. Make sure your `Layout` looks right around a plain `PageHero` + content (padding, background).
8. **No new deps, no edits outside your template folder.** `npm run gen:templates` then `npx tsc --noEmit` and `npx eslint src/templates/<category>` must be clean.

## Section keys per category (see `src/templates/shared/packs.ts`)

- ecommerce (kitchen, clothing, shoes, gifts, blades, sports, electronics, medical): hero, promo, collections, featuredProducts, [prescriptionCta | craft], banner, features, about, [brands | gallery], stats, testimonials, faq, cta, footer, seo
- pizza / bakery: hero, [deals | customCake], featuredMenu, process, about, gallery, deliveryAreas, hours, testimonials, faq, cta, footer, seo
- recruiting: hero, stats, featuredJobs, industries, services, process, employersCta, about, team, testimonials, faq, cta, contact, footer, seo
- travel: hero, featuredPackages, destinations, umrah, services, features, process, stats, about, gallery, testimonials, faq, cta, contact, footer, seo
- realestate: hero, featuredProperties, areas, services, features, stats, process, about, team, testimonials, faq, cta, contact, footer, seo
- gym: hero, stats, features, plans, classes, team, transformations, about, hours, testimonials, faq, cta, contact, footer, seo
- law: hero, practiceAreas, about, stats, team, process, features, testimonials, faq, cta, contact, footer, seo
- printing: hero, services, process, portfolio, features, stats, about, brands, testimonials, faq, cta, contact, footer, seo

Each of these keys needs a renderer in `renderOrdered` (custom or kit-based). `footer` data is consumed by `SiteFooter`; `seo` by the page metadata.
