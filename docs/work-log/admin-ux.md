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


## [2026-09-27 15:05] [resume] state reconciled
- Verified `git diff 9a2d796` for `src/components/ui/{button,dialog,input,toast}.tsx` (committed in WIP 7fba460). Changes are complete and consistent with call sites:
  - Button: `ref` prop (React 19 ref-as-prop), `aria-busy`; all callers pass children/variant only → OK.
  - Dialog: focus trap, focus restore, `aria-labelledby/describedby`, Esc, backdrop, safe-area, `initialFocus`; `ConfirmDialog` + `useConfirm()` + rewritten `ConfirmButton` (form-submit after confirm). No callers of `ConfirmButton` exist yet; all 20 `<Dialog>` callers use only `open/onClose/title/description/footer/className` → OK.
  - Input: `Field` auto-wires `id`/`aria-describedby`/`aria-invalid`/`aria-required` when its only child is Input/Select/Textarea; `Help`/`FieldError` accept `id`; `Switch` has `role=switch`, `aria-checked`, `description`; `passwordStrength()`/`PasswordStrength`/`PasswordInput` added. 28 files use `<Field>`; wrapped children (div) fall back to `htmlFor`/auto id → OK. `Switch` callers pass `checked/onChange/label/disabled` only → OK.
  - Toast: `push(kind, message, {duration})` returns id, `dismiss(id)`, pause on hover/focus, live regions. Callers use `toast.push(kind, msg)` → OK.
- FOUND: toast announces twice (persistent sr-only live regions AND `role=alert|status` per toast) → fix in UI-kit pass. `Skeleton`/`Alert` not yet added. `Table` mobile mode and `Pagination` nav not done.
- `window.confirm` still used in owned files: action-button.tsx, section-editor.tsx, media-library.tsx.
- NEXT: UI kit pass (toast dedupe, Skeleton, Alert, Table mobile cards, Pagination nav, Field+PasswordInput wiring).

## [2026-09-27 15:10] IN PROGRESS: UI kit pass
- Plan: toast dedupe (persistent live regions only), new `src/components/ui/skeleton.tsx` + `alert.tsx`, `Table` responsive card mode (context-driven, opt-in `<Table responsive>` + `<TD label>`), `Pagination` as `<nav aria-label>`, `Field` wiring for `PasswordInput`.

## [2026-09-27 15:25] DONE: UI kit pass
- DONE: `src/components/ui/toast.tsx` — single announcement (removed per-toast `role`, kept persistent assertive/polite live regions; container is `role=region "Notifications"`).
- DONE: new `src/components/ui/skeleton.tsx` (Skeleton, SkeletonRegion, SkeletonText, PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton, CardSkeleton, FormSkeleton) and `src/components/ui/alert.tsx` (Alert with tones, role alert/status, dismiss, actions).
- DONE: `src/components/ui/table.tsx` — opt-in `<Table responsive>` card mode on phones (context-driven; `<TD label="…">` shows the column name; header stays in a11y tree via `sr-only`); `TH scope=col`; `Pagination` is `<nav aria-label>` with disabled placeholders, `rel=prev/next`, 40px targets. File is now a client component (context); existing server-component callers are unaffected (props are plain).
- DONE: `src/components/ui/input.tsx` — `Field` also auto-wires `PasswordInput`.
- NOTE: `npx tsc --noEmit` reports one pre-existing error in `tests/unit/rate-limit.test.ts` (platform-dx stream; `retryAfterSec` not in `RateLimitResult`). `src/**` is clean.
- NEXT: shell pass (action-button useConfirm; admin-shell skip link, aria-current, drawer dialog + focus trap, aria-expanded, title bar/breadcrumbs, Urdu preview, view site).

## [2026-09-27 15:26] IN PROGRESS: shell pass
- Extracting `useFocusTrap` from dialog.tsx for reuse by the mobile drawer.

## [2026-09-27 15:50] DONE: shell pass
- DONE: `src/components/ui/dialog.tsx` — extracted `useFocusTrap(ref, active, {onEscape, initialFocus, lockScroll})` (callbacks via refs synced in an effect, so callers passing inline `onClose` no longer re-run the trap and steal focus on every keystroke — that was a latent bug in the WIP Dialog).
- DONE: `src/components/admin/action-button.tsx` — `confirm` now opens the accessible `ConfirmDialog` (`useConfirm`), accepts string or `ConfirmOptions`; action exceptions become error toasts; `onDone` callback.
- DONE: `src/components/admin/admin-shell.tsx` — skip link → `#main-content`; `aria-current=page`; mobile drawer is `role=dialog aria-modal` with focus trap/Esc/restore, closes on navigation (derived state, no effects); menu button `aria-expanded/aria-controls`; submenu toggles `aria-expanded/aria-controls` with descriptive labels; desktop title bar with `<nav aria-label=Breadcrumb>` derived from nav tree (`breadcrumbsFor`); mobile top bar shows current section + "View website"; EN | اردو website preview switch (`/api/lang?to=…&back=/`, new tab) when `urduEnabled`; sign-out button labelled; 40px touch targets.
- DONE: `(dashboard)/layout.tsx` passes `urduEnabled`.
- NOTE: tsc shows errors in `src/templates/ui/index.tsx` (missing `karachiNow/safeImageSrc/safeLinkHref` in `@/lib/utils`, `ui.skipToContent`) — templates stream mid-edit, not mine.
- NEXT: section editor (in progress), then sections list.

## [2026-09-27 15:51] IN PROGRESS: section editor + sections list
- New `src/components/admin/shared/media-picker.tsx` (provider + dialog + button; data supplied by owning pages via `listTenantMedia`).

## [2026-09-27 18:05] [resume] state reconciled
- Verified `git diff 9a2d796` for owned files. Section editor (586 lines changed) already has: `validateFields` (client zod, friendly messages, dotted paths), inline `error` on every Field, `focusFirstInvalid`, beforeunload while dirty, `useConfirm` reset, `MediaPickerButton` on image/images fields, repeater with stable keys/move/remove aria-labels, auto-open items with errors, RTL `dir="rtl" lang="ur"` on Urdu inputs. Sections list has aria-labelled buttons, sr-only live region, preview link, focus retention after move. `content/[key]/page.tsx` wraps editor in `MediaPickerProvider` (PUBLIC-only rows).
- FOUND: `media-picker.tsx` eslint error (setState in effect) + useMemo deps warning. FOUND: after "Reset to default" the editor keeps the old `value` state (router.refresh does not reset `useState(initial)`), so the form shows stale content until reload.
- tsc: clean. eslint on owned files: 1 error, 1 warning (media-picker).
- NEXT: fix media-picker, reset-state bug, then settings → users → media → activity → dashboard → loading/error.

## [2026-09-27 18:06] IN PROGRESS: section editor + sections list (finish)
- media-picker: move dialog state into an inner component mounted only while open (no effect); derive folders without useMemo.
- section-editor: `defaults` prop; reset → `setValue(defaults)`; repeater keys re-seeded when item count changes externally.

## [2026-09-27 18:20] DONE: section editor + sections list
- DONE: `src/components/admin/shared/media-picker.tsx` — dialog state moved into `PickerBody`, mounted only while open (eslint set-state-in-effect error and useMemo warning gone; state resets on close by unmount).
- DONE: `src/components/admin/section-editor.tsx` — new `defaults` prop; "Reset to default" now shows the template defaults immediately (`setValue(defaults)`), disables the bar while resetting, catches thrown action errors; repeater keys are tied to the items array they were computed for and fall back to stable index keys when the list is replaced externally (previously stale keys after reset).
- DONE: `content/[key]/page.tsx` passes `defaults={def.defaults}`.
- NOTE: `npx tsc` currently fails only in `src/server/notify.ts` (unterminated regex — another stream mid-edit, not mine). All owned files typecheck; eslint clean on changed files.
- NEXT: settings form (tablist, PK phone/email/colour/URL client validation with inline errors, beforeunload, Urdu RTL, focus first invalid).

## [2026-09-27 18:21] IN PROGRESS: settings form
