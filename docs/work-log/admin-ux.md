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

## [2026-09-27 18:40] DONE: settings form
- DONE: `src/components/admin/shared/settings-form.tsx` — real `tablist`/`tab`/`tabpanel` with roving tabindex + arrow/Home/End keys, `?tab=` kept in the URL via replaceState; `validateSection()` runs before save (PK phone via `normalizePkPhone` for phone/phone2/whatsapp/whatsappTo, email format, hex colours, social/announcement links, Google Maps embed src (also extracts src from a pasted iframe), GA/Pixel id shape, non-negative integers, order prefix, hours), inline errors clear on edit, first invalid control focused; phones reformatted to "0300 1234567" on blur; beforeunload while any section is dirty; save keeps other sections' unsaved edits after a successful save (previously overwritten by the server copy); Urdu announcement input has `lang="ur" dir="rtl"`; live-region status; safe-area padding on the sticky bar; Save disabled until the section changes.
- eslint clean; tsc clean for owned files (remaining errors are in `src/app/(super)/(site)/**` and `src/server/notify.ts`, other streams mid-edit).
- NEXT: users (password policy 10+, strength meter, Enter submits dialogs, last-owner explanations).

## [2026-09-27 18:41] IN PROGRESS: users forms + page

## [2026-09-27 19:00] DONE: users forms + page
- DONE: `src/components/ui/input.tsx` — `PASSWORD_MIN=10`, `passwordPolicyMessage(pw, {username})` (exact client mirror of server `passwordPolicy`: length, letters+digits, denylist, repeated char, username), `passwordStrength(pw, ctx)` now scores against the policy (backwards-compatible signature), `PasswordStrength` takes `username`/`id`, meter has `aria-valuetext`.
- DONE: `src/components/admin/shared/user-forms.tsx` — Add-user and Reset-password dialogs are real `<form>`s (Enter submits via `form=` on the footer button), client validation (name, username regex, email, password policy incl. username) with inline errors + focus first invalid, `PasswordInput` (show/hide) + strength meter with username context, help text says 10+ chars; `ChangePasswordForm` mirrors policy + confirm match before submit, clears fields on success inside the action wrapper (no setState-in-effect), server error in an `Alert`. Thrown action errors become messages.
- DONE: `users/page.tsx` — responsive table (`<TD label>`), role/deactivate/remove all confirm through the accessible dialog with consequences spelled out (no `window.confirm`), last-owner and "your account" explained inline + info alert when there is a single owner, Locked badge explains unlock time; `users/password/page.tsx` passes `username`.
- HANDOFF (security/users-actions): `createTenantUser`/`resetTenantUserPassword`/`changeOwnPassword` still call `passwordPolicy(password)` without `{ username }` — the UI now blocks username-containing passwords but the server does not.
- NEXT: media library (search, alt editing, delete via dialog with usage warning, load-more via server action, PUBLIC-only URLs).

## [2026-09-27 19:01] IN PROGRESS: media library

## [2026-09-27 19:30] DONE: media library
- DONE: new `admin/(dashboard)/media/actions.ts` (server actions, tenant-scoped, PUBLIC+confirmed+url-not-null only): `listMedia({folder,q,cursor})` (search alt/folder, keyset paging, 60/page), `updateMediaAlt(id, alt)` (≤200 chars, audited `media.alt`), `deleteMediaAction(id)` (reuses `deleteMedia`, audited `media.delete`).
- DONE: `src/components/admin/shared/media-library.tsx` — folder chips are `aria-pressed` buttons (URL kept via replaceState), debounced search, "Load more" appends via the action (no page navigation), stale responses ignored; each tile opens a details dialog (preview, alt-text form that submits on Enter, selectable/copyable address, delete through `ConfirmDialog` with explicit broken-image warning — `window.confirm` removed); upload progress "n of m", non-image files rejected client-side, grid refreshes + `router.refresh()` for counts/quota; storage bar is a `meter`; tiles show "No description" nudges; live-region status.
- DONE: `media/page.tsx` — first page comes from the same `listMedia` action (rows with null url never reach the client); folder counts/quota unchanged.
- NOTE: no usage index exists for media, so delete is "usage-safe" through messaging only. HANDOFF (data-layer): a `Media.usedIn` lookup (sections JSON / products / menu items) would let the UI block or warn precisely.
- NEXT: activity (date/actor filters, readable meta), dashboard (today KPIs, checklist, quick actions), loading/error files.

## [2026-09-27 19:31] IN PROGRESS: activity + dashboard + loading/error

## [2026-09-27 20:05] DONE: activity + dashboard + loading/error
- DONE: `activity/page.tsx` — filters: search, type (human names), person (`actorName` groupBy), from/to dates (Pakistan midnight, inclusive end); `humanAction()` turns `section.save` into "Page section saved" (code kept as a mono badge + item id); meta rendered as a `<dl>` of key/value chips (long values clipped with full text in `title`), responsive table, result count live region, distinct "nothing matches" empty state with Clear.
- DONE: `(dashboard)/page.tsx` — "Today (Pakistan time)" KPI row (orders/sales/applications/bookings/messages since PKT midnight, computed with `Intl` in `Asia/Karachi`), setup checklist with progress bar (logo, phone+WhatsApp, sections edited, first product/menu item/job/package/listing/service by module, opening hours, SEO title+description) hidden once complete, quick-action chips per module + sections/blog/media/settings/view site, PKT greeting, hints on pending/low-stock cards, links focus-visible. Read paths use the same Prisma count/aggregate calls the page already used (no module exposes stats helpers — see Handoffs).
- DONE: `(dashboard)/loading.tsx` (generic header+stats+table skeleton), `(dashboard)/error.tsx` (client boundary: generic copy, digest reference, Try again (`retry`, falls back to `reset`), Go to dashboard), tailored `loading.tsx` for `content/`, `content/[key]/`, `media/`, `settings/`, and `login/error.tsx`.
- eslint: 0 errors, 0 warnings across all owned files; tsc: clean for owned files (remaining project errors are in `src/server/notify.ts` and `src/app/(super)/(site)/**`, other streams mid-edit).
- NOTE: the orchestrator committed mid-stream; the last two `error.tsx` edits (console.error removed) are uncommitted.

## [2026-09-27 20:10] FINAL: summary, remaining risks, readiness score
### Fixes this stream (all waves)
- UI kit: accessible Dialog (focus trap/restore, Esc, labelled), `ConfirmDialog`/`useConfirm`, toast live regions (single announcement), `Field` auto-wiring of id/aria-describedby/aria-invalid, `Switch` role, `PasswordInput`/`PasswordStrength`/`passwordPolicyMessage` (10+ chars mirror), `Skeleton*`, `Alert`, responsive `Table`, `Pagination` nav.
- Shell: skip link, aria-current, drawer as dialog with focus trap, breadcrumbs/title bar, EN|اردو preview, sign-out label, 40px targets.
- Section editor: client zod validation with inline per-field errors, server `fieldErrors` mapped to fields, focus first invalid, beforeunload, media picker for image/images fields (PUBLIC files only), repeater stable keys/aria/reorder, Urdu RTL inputs, reset shows defaults immediately.
- Sections list: labelled buttons, live region, preview link, focus retention.
- Settings: tablist semantics + keyboard, PK phone/email/colour/URL/GA/Pixel/int validation, beforeunload, unsaved sections preserved after save.
- Users: policy mirror, strength meter, Enter submits dialogs, consequences in confirm dialogs, last-owner/self explanations.
- Media: search, alt editing, load-more/delete via server actions, delete warning, no private URLs.
- Activity: filters + readable actions/meta. Dashboard: today KPIs, checklist, quick actions. loading/error boundaries.
### Remaining risks (not fixable inside this stream's boundary)
1. Server-side validation is permissive where the client is strict: `tenantSettingsSchema` accepts any string for phones/emails/URLs (server falls back to the raw phone when `normalizePkPhone` fails) and `passwordPolicy` is called without `{ username }` in users-actions. A client bypass can still store bad data. → data-layer / security handoffs below.
2. No media usage index: deleting an image that a section/product still references leaves a broken image (UI warns, cannot block).
3. Locked accounts (`lockedUntil`) have no "Unlock now" action for the owner; only Activate on deactivated users clears the lock.
4. `ImageField`/`ImagesField` (uploader.tsx, not owned) still use `title`-only icon buttons and have no alt-text prompt at upload time.
5. The section editor validates with `fieldsSchema` on the client; templates with very large repeaters (50 items × nested) may feel slow on low-end phones (not measured; DB unreachable so no end-to-end run).
6. Nothing here was exercised against a live DB or in a browser — verified by tsc/eslint and code reading only. Recommend a manual pass on a phone (drawer, sticky save bars, media dialog) before launch.
### Admin readiness score: 78 / 100
- +: every owned screen now has inline validation, accessible dialogs (no `window.confirm`), keyboard/screen-reader semantics, loading and error states, Urdu RTL handling and PK-specific validation; server actions remain tenant-scoped and audited.
- −: server schemas do not yet enforce what the UI enforces (−8), no browser/DB verification possible in this environment (−8), media usage/unlock gaps and uploader a11y outside boundary (−6).

## Handoffs
- security / users-actions: pass `{ username }` to `passwordPolicy` in `createTenantUser`, `resetTenantUserPassword` (target user's username) and `changeOwnPassword` (ctx.user.username); UI already mirrors this.
- data-layer / settings: `tenantSettingsSchema` should validate `contact.phone/phone2/whatsapp` and `notifications.whatsappTo` with `normalizePkPhone` (reject instead of falling back to raw), `contact.email`/`notifications.emailTo` as email, `social.*`/`announcement.link` as safe URLs, `branding.*Color` as hex, `seo.title` ≤70 / `seo.description` ≤170.
- data-layer / media: add a usage lookup (sections JSON, products, menu items, posts) so the media library can block or precisely warn before delete.
- users-actions: an owner-facing "Unlock now" action (clear `lockedUntil`/`failedLogins`) for locked-but-active users.
- uploader.tsx (owner: whichever stream holds `src/components/admin/uploader.tsx`): give Replace/Remove buttons `aria-label`s and 40px targets; optionally prompt for alt text on upload.
- revokeSessions adoption for password reset/deactivate remains with security (already listed there).
