# SiteForge — Multi-Tenant Business Website Platform

> Brand name "SiteForge" is a placeholder. Change it in `src/config/brand.ts`.

## 1. What we are building

One Next.js application, deployed once on Vercel, that serves:

| Surface | Host | Path | Who uses it |
|---|---|---|---|
| Super website | `ROOT_DOMAIN` (e.g. `siteforge.pk`, dev: `localhost:3000`) | `/` | Business owners browsing templates, demos and blogs |
| Super admin | `ROOT_DOMAIN` | `/super` | Platform owner |
| Tenant website | any domain / subdomain mapped to a tenant (`pizza.siteforge.pk`, `karachipizza.com`, dev: `pizza1.localhost:3000`) | `/` | Public visitors / customers |
| Tenant admin | same tenant host | `/admin` | Business owner / staff |

A **tenant** = one business = one hostname (or several) + one template + its own content, media, products, orders, users.

## 2. Mandated stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript, Tailwind v4). Server Components + Server Actions. Turbopack.
- **Hosting:** Vercel only. Wildcard + custom domains attached to the Vercel project; DNS handled manually by the owner.
- **Database:** Supabase Postgres via Prisma (pooled `DATABASE_URL` at runtime, `DIRECT_URL` for migrations).
- **Storage:** Cloudflare R2 via S3 API (`@aws-sdk/client-s3`), presigned uploads.
- **Auth:** custom (bcrypt + signed httpOnly cookie sessions via `jose`). No third-party auth provider.
- **Notifications:** order & lead notifications via Resend (optional env) and WhatsApp deep links.
- **Validation:** zod everywhere (forms, server actions, section schemas).

## 3. Multi-tenancy & routing

`src/proxy.ts` (Next 16 name for middleware):

1. Read `host` header, strip port, lowercase.
2. If host is `ROOT_DOMAIN` (or `localhost` / `www.ROOT_DOMAIN`) → super site; `/super/*` = super admin.
3. Else → tenant. Rewrite `/{path}` → `/_sites/{host}/{path}`; `/admin/*` → `/_sites/{host}/admin/*`.
4. Tenant lookup is done in the layout (`getTenantByHost`) with `unstable_cache` keyed by host, tag `tenant:{id}`; unknown host → branded 404 page.
5. Suspended tenants → "site suspended" page (admin still reachable for owner).

Dev: Chrome/Edge resolve `*.localhost` automatically, so demo tenants are `demo-pizza-01.localhost:3000` etc. No hosts-file edits needed.

## 4. Data model (Prisma, Supabase Postgres)

Core: `Tenant`, `Domain`, `TenantUser`, `SuperUser`, `Session`, `SiteSection`, `SitePage`, `Media`, `Lead`, `AuditLog`, `TemplateSetting`, `BlogPost`, `SuperLead`.

Modules (all rows carry `tenantId`, every query is scoped by it):

| Module | Tables | Used by |
|---|---|---|
| ecommerce | `ProductCategory`, `Product`, `ProductVariant`, `Order`, `OrderItem`, `Customer`, `Coupon`, `ShippingZone` | kitchen, clothing, shoes, gifts, swords & knives, electronics, sports, medical |
| restaurant | `MenuCategory`, `MenuItem`, `ModifierGroup`, `Modifier`, `FoodOrder`, `FoodOrderItem`, `DeliveryZone`, `Reservation`, `OpeningHours` | pizza, bakery |
| medical (extends ecommerce) | `Product.requiresPrescription/genericName/manufacturer/dosageForm/strength`, `Prescription` (private R2 file), `Order.prescriptionId` | medical stores |
| recruiting | `Job`, `Application` (private CV), `EmployerRequest` | recruiting |
| travel | `TravelPackage`, `Booking` | travel |
| realestate | `Property`, `PropertyInquiry` | real estate |
| gym | `MembershipPlan`, `ClassSchedule`, `Trainer` (TeamMember) | gyms |
| law | `PracticeArea` (Service), `Attorney` (TeamMember), `Consultation` (Lead) | law firms |
| printing | `Service`, `QuoteRequest` (files) | printing |
| shared | `TeamMember`, `Service`, `Testimonial`, `FaqItem`, `GalleryItem`, `Lead` | all |

Localised text is stored as JSON `{ "en": "...", "ur": "..." }` (`LocalizedString`). Money is PKR integer rupees (`Int`).

## 5. Template system

A template is **code**, registered in `src/templates/registry.ts`:

```ts
interface TemplateDefinition {
  id: 'pizza-01'; category: 'pizza'; name; tagline; description;
  features: string[];              // shown on super site + blog
  palette: { primary, secondary, accent, bg, fg }; fonts: { heading, body };
  sections: SectionDefinition[];   // key, label, zod schema, default content (PK-specific), canDisable
  pages: PageDefinition[];         // extra routes the template ships (/menu, /shop, /jobs ...)
  Render: React component (server) receiving { tenant, content, module data }
}
```

- Tenant content = one `SiteSection` row per section key (`data` JSON validated by the section's zod schema, `enabled`, `sortOrder`).
- Tenant admin auto-generates edit forms from the zod schema (field registry: text, localizedText, richText, image, imageList, link, number, boolean, select, color, repeater).
- Enabling/disabling a section = flipping `enabled`. Templates render only enabled sections in `sortOrder`.
- Each category has shared **module UI kits** (product grid/cart/checkout, menu/order tracker, job board, property search…) that are themed through CSS variables so each template keeps a unique look while the business logic stays single-sourced.

### Template inventory (84)

| Category | Key | Count | Type |
|---|---|---|---|
| Kitchen accessories | `kitchen` | 4 | ecommerce |
| Printing shops | `printing` | 4 | service + quote/file upload |
| Clothing brands | `clothing` | 4 | ecommerce (size/colour variants) |
| Shoes brands | `shoes` | 4 | ecommerce (size variants) |
| Gift shops | `gifts` | 4 | ecommerce (gift wrap / message) |
| Swords & knives | `blades` | 4 | ecommerce (age confirmation, custom orders) |
| Recruiting agencies | `recruiting` | 10 | job board + applications + employer requests |
| Travel agencies | `travel` | 10 | packages + booking + visa services |
| Pizza shops | `pizza` | 10 | restaurant ordering + management |
| Sports | `sports` | 5 | ecommerce (sports goods) |
| Gyms | `gym` | 5 | plans + classes + trainers + join |
| Bakeries | `bakery` | 5 | restaurant ordering + custom cake orders |
| Law firms | `law` | 6 | practice areas + attorneys + consultation |
| Electronics | `electronics` | 3 | ecommerce (specs, warranty) |
| Medical stores | `medical` | 3 | ecommerce + prescription upload |
| Real estate agents | `realestate` | 3 | listings + inquiries |

## 6. Storage & tenant isolation (Cloudflare R2)

- One bucket. Key layout: `t/{tenantId}/{public|private}/{yyyy}/{mm}/{uuid}.{ext}`; super-site assets under `s/...`.
- Uploads: client asks `/api/media/presign` → server verifies session + tenant, validates mime/size, generates key **itself** (client never chooses keys), returns presigned PUT (5 min). Client PUTs directly to R2. Client then calls `confirm` → server `HEAD`s the object, records `Media` row.
- Reads: public files served from the R2 public/custom domain by URL stored in `Media`. Private files (CVs, prescriptions, quote files) served **only** through `/api/media/[id]/download` which checks `media.tenantId === session.tenantId` (or super admin) and returns a 60-second presigned GET.
- Deletes: only by `Media.id` with ownership check; never by raw key.
- Bucket CORS restricted to `ROOT_DOMAIN` + tenant hosts; R2 credentials only on the server (never `NEXT_PUBLIC_`).
- Per-tenant storage quota tracked in `Tenant.storageUsed`.

## 7. Security checklist (applied everywhere)

- Every DB query scoped by `tenantId` from the **session/host**, never from the request body.
- Server Actions validate with zod, check session, check tenant match, rate-limited (in-DB sliding window for login & public forms).
- Passwords bcrypt(12); login lockout after 5 failures / 15 min; sessions rotate on login; logout revokes.
- Cookies: `httpOnly`, `secure` in prod, `sameSite=lax`, scoped per host automatically; super admin cookie name distinct.
- CSRF: server actions (origin-checked by Next) + `sameSite`; API routes require same-origin header check.
- Headers: CSP, HSTS, X-Frame-Options DENY for admin, Referrer-Policy.
- Audit log for super admin & tenant admin mutations.
- Public forms: honeypot + rate limit + size limits.

## 8. Super website

Pages: Home (hero, categories, how-it-works, featured templates, testimonials, CTA), `/templates` (filter by category), `/templates/[category]`, `/templates/[category]/[id]` (details, features, live demo link, screenshots), `/blog` and `/blog/[category]` (one blog per business category describing features), `/blog/[category]/[slug]`, `/pricing`, `/contact`, `/about`. Every template has a live demo tenant (`demo-{id}.ROOT_DOMAIN`) seeded with realistic Pakistani content, and the demo admin is viewable with a read-only demo login.

## 9. Super admin `/super`

Dashboard, Tenants (create: name, category, template, hostnames, admin username/password, status; edit; suspend; open admin), Domains, Templates (enable/disable, featured), Blog editor per category, Leads, Super users, Audit log, Settings.

## 10. Tenant admin `/admin`

Dashboard (category-specific KPIs), Content (sections list with enable/disable, order, edit forms; pages), Module screens (Products/Orders/Customers, Menu/Orders board/Reservations, Jobs/Applications, Packages/Bookings, Properties/Inquiries, Plans/Classes/Trainers, Practice areas/Attorneys/Consultations, Services/Quotes), Leads, Media library, Settings (branding, contact, WhatsApp, social, languages EN/UR, currency, SEO, opening hours), Users (owner can add staff), Activity.

## 11. Build phases (all inside Phase 1 of the product)

1. **Foundation** — scaffold, Prisma schema, proxy routing, auth, R2 service, admin UI kit, section-form generator, template contract + registry, super site shell.
2. **Modules** — ecommerce (catalog, cart, COD checkout, orders, stock, coupons, shipping), restaurant (menu, modifiers, cart, order types, live order board, reservations, hours), medical (prescriptions), recruiting, travel, real estate, gym, law, printing, shared blocks.
3. **Templates** — 84 templates, each with unique palette/typography/layout and Pakistan-specific default content; every one gets a seeded demo tenant.
4. **Super site & blogs** — polished marketing site, per-category blogs, template gallery with screenshots.
5. **QA** — type-check, lint, build, seed, manual walk-through of every template's public + admin flows, security review.

## 12. Environment variables

```
ROOT_DOMAIN=localhost            # prod: siteforge.pk
NEXT_PUBLIC_ROOT_DOMAIN=localhost
DATABASE_URL=postgresql://...pooler...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
SESSION_SECRET=<32+ random bytes>
R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_BUCKET= R2_PUBLIC_URL=https://media.siteforge.pk
RESEND_API_KEY= (optional)
```
