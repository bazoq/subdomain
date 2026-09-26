# Stream: admin-ux — tenant admin panel (UX, forms, UI kit, shell)

## Ownership
- `src/components/ui/**`
- `src/components/admin/{admin-shell,action-button,login-form,section-editor,sections-list}.tsx`
- `src/components/admin/shared/{form-shell,list-editor,localized-input,media-library,settings-form,user-forms}.tsx`
- `src/server/admin-nav.ts`
- `src/app/_sites/[host]/admin/login/**`
- `src/app/_sites/[host]/admin/(dashboard)/{layout.tsx,page.tsx,content/**,media/**,settings/**,users/**,activity/**}`
- `src/app/_sites/[host]/admin/**/{loading,error}.tsx` (new)

Everything else → `## Handoffs` at the bottom. Never `git commit`. DB not reachable → reason from code.

## Audit baseline (2026-09-27)
- UI kit: Dialog has no focus trap / focus restore / aria-labelledby; `ConfirmButton` uses `window.confirm`; toast has no `aria-live`; `Field` does not wire `id`/`aria-describedby`/`aria-invalid`; no Skeleton; Table has no mobile card mode; Pagination lacks `<nav aria-label>`.
- Shell: no skip link, no `aria-current`, drawer is not a dialog (no focus trap/Esc), nav expand button has no `aria-expanded`, no breadcrumbs/page title bar, no language preview toggle.
- Section editor: server zod errors only surface as a toast (never inline); no client-side validation; no beforeunload warning; no "choose from media library"; repeater buttons lack aria-labels; `key={i}` on repeater rows.
- Sections list: buttons have `title` only, no live-region feedback, no preview link.
- Settings: invalid PK phone silently saved as raw string (server falls back to raw); no client validation; tab nav not a `tablist`; no beforeunload.
- Users: no strength meter; reset dialog cannot submit with Enter; destructive actions use `window.confirm`.
- Media: no search, no alt-text editing, delete has no usage check, "Load more" is a full page nav.
- Activity: no date/actor filter, meta rendered as a truncated string.
- Dashboard: no "today" KPIs, no setup checklist, no quick actions.
- No `loading.tsx` / `error.tsx` anywhere under admin.

