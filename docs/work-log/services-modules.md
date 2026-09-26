# Stream: services-modules

**Owner:** services-modules agent
**Ownership (only edit):** `src/modules/{recruiting,travel,realestate,gym,law,printing,leads,shared}/**`,
`src/components/admin/{recruiting,realestate,travel,shared}/**`, `src/components/admin/{testimonial-form.tsx,uploader.tsx}`,
`src/app/_sites/[host]/(site)/{jobs,employers,packages,properties,classes,plans,join,consultation,quote,upload-prescription,services,team,gallery,faq,contact,custom-cake,p,blog}/**`,
`src/app/_sites/[host]/admin/(dashboard)/{applications,jobs,packages,bookings,properties,classes,plans,services,team,gallery,faq,testimonials,leads,prescriptions,pages,posts}/**`,
`src/server/notify.ts`.
**Rules:** never `git commit`; DB not reachable (reason from code); tsc + eslint clean before every entry.

## [2026-09-27 10:00] Audit complete (read-only pass)
- DONE: read AGENTS.md, PLAN.md, CONVENTIONS.md, schema (recruiting/travel/realestate/gym/shared/Lead/Media/RateLimit), all owned module code, admin components, public + admin routes, rate-limit/notify/site-content/storage infra.
- FOUND (to fix, in ownership):
  1. `notify.ts`: `sendEmail` can reject (network) - callers rely on `.catch`; no timeout; no WhatsApp builder; no per-lead-type templates; admin links are relative (useless in email).
  2. `leads/actions.ts submitLead`: `extra` JSON accepted unvalidated (any shape); `fileIds` not restricted to PRIVATE; no duplicate-submit guard; rate-limit message EN only; `deleteLead` has no audit; property/plan/service ids inside `extra` never verified against tenant.
  3. Recruiting: application status is any->any (no state machine); CV media not checked for document mime; no duplicate application guard; deleting an application orphans the private CV object; rate-limit message EN only.
  4. Travel: booking `date` not validated against departures/past; no duplicate guard; booking status any->any; `nights` may exceed `days`; no per-person total shown.
  5. Real estate: `mapEmbedUrl` accepts any URL containing `output=embed` (iframe to arbitrary host); `videoUrl`/`mapUrl` zod `.url()` accepts `javascript:`; detail-page map iframe has no sandbox; min/max price not swapped when inverted.
  6. Gym: `togglePlan` does not validate `field`; toggles lack audit; no trainer overlap check for classes; trial form text inputs lack labels.
  7. Shared: RichText link renderer (templates/ui, NOT mine) allows `[x](javascript:...)` - mitigate on write by sanitising rich text in every admin action; image URL fields accept any string; testimonial `text.en` may be empty; team social URLs unrestricted; `getPosts/getPost` and blog pages show posts whose `publishedAt` is in the future; toggles lack audit.
  8. Public forms a11y: ContactForm / QuoteForm inputs have no labels (placeholder only), message boxes lack `role`.
  9. Module pages (/jobs, /employers, /packages, /properties) do not 404 for tenants without that module.
- NEXT: create shared validation + public-form helpers, rewrite notify.ts, then fix modules in order leads -> recruiting -> travel -> realestate -> gym -> shared -> pages.

## Handoffs
- **templates stream (`src/templates/ui/index.tsx` RichText.inline):** markdown link renderer emits `<a href>` for any scheme, so `[x](javascript:alert(1))` in any rich-text field is stored XSS (tenant staff -> visitors). Needs an `http(s)|mailto|tel|/|#` allowlist. This stream sanitises on write as defence-in-depth, but existing rows are unaffected until the renderer is fixed.
