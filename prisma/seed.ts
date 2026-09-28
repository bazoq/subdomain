/**
 * Database seed. Run with `npx prisma db seed` (= `tsx --tsconfig tsconfig.seed.json prisma/seed.ts`,
 * see prisma.config.ts) after `npx prisma migrate deploy`. Uses DIRECT_URL (session/direct connection)
 * when set, otherwise DATABASE_URL.
 *
 *  1. Upserts the first super admin — SEED_SUPER_USERNAME / SEED_SUPER_EMAIL / SEED_SUPER_PASSWORD.
 *     Without SEED_SUPER_PASSWORD a random password is generated and printed ONCE (only on first create).
 *  2. Upserts a TemplateSetting row for every registered template.
 *  3. Creates / refreshes demo tenants (`demo-<templateId>.<ROOT_DOMAIN>`, owner login `demo`) with the
 *     template's default sections, realistic Pakistani sample data for every module and a week of inbound
 *     activity (leads, orders, applications …).
 *     - SEED_DEMO_PASSWORD: owner password for all demo sites (generated + printed once when unset).
 *     - SEED_DEMO_TEMPLATES: `all` (default) · `first` (first template of each category) · comma list of
 *       template ids and/or category keys, e.g. `pizza-01,law,travel-03`.
 *     - SEED_DEMO_TENANTS=0 skips demo tenants entirely (production platforms that do not want demos).
 *
 * Safe to re-run: every step is idempotent (upserts / skip-when-present). Passwords are hashed with the
 * app's own helper (`src/server/auth/password.ts`) so seed users are indistinguishable from real ones.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { TEMPLATES } from "@/templates/registry";
import type { TemplateMeta } from "@/templates/types";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { DEFAULT_HOURS } from "@/lib/tenant-settings";
import { hashPassword, generatePassword, passwordPolicy } from "@/server/auth/password";
import { buildTenantSettings } from "@/server/super/provision";
import { provisionTenantSections } from "./seed/sections";
import { fillDemoSectionImages, repairDemoMenuSizes, seedCategoryData } from "./seed/demo-data";
import { seedInboxData } from "./seed/inbox";

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();
const json = <T,>(v: T) => v as unknown as Prisma.InputJsonValue;

function createClient() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL (or DIRECT_URL) is not set — see .env.example");
  const adapter = new PrismaPg({ connectionString, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000 });
  return new PrismaClient({ adapter, log: ["error"] });
}

function envPassword(name: string): string | undefined {
  const v = process.env[name]?.trim();
  if (!v) return undefined;
  const problem = passwordPolicy(v);
  if (problem) throw new Error(`${name}: ${problem}`);
  return v;
}

function printSecret(label: string, value: string) {
  const line = `${label}: ${value}`;
  console.log("");
  console.log(`  ┌${"─".repeat(line.length + 4)}┐`);
  console.log(`  │  ${line}  │`);
  console.log(`  │  ${"Shown once — store it in a password manager.".padEnd(line.length)}  │`);
  console.log(`  └${"─".repeat(line.length + 4)}┘`);
  console.log("");
}

/* ---------------- 1. super admin ---------------- */
async function seedSuperAdmin(db: PrismaClient) {
  const username = (process.env.SEED_SUPER_USERNAME ?? "admin").trim().toLowerCase();
  const email = (process.env.SEED_SUPER_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const existing = await db.superUser.findUnique({ where: { username } });
  let password = envPassword("SEED_SUPER_PASSWORD");
  let generated = false;
  if (!password && !existing) {
    password = generatePassword(16);
    generated = true;
  }
  if (existing) {
    await db.superUser.update({
      where: { id: existing.id },
      data: { email, isActive: true, role: "SUPERADMIN", ...(password ? { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } : {}) },
    });
    console.log(`✔ Super admin "${username}" already exists${password ? " (password reset from SEED_SUPER_PASSWORD)" : ""}.`);
  } else {
    await db.superUser.create({ data: { username, email, name: "Platform Owner", role: "SUPERADMIN", passwordHash: await hashPassword(password!) } });
    console.log(`✔ Super admin created: username "${username}", email ${email}`);
    if (generated) printSecret("SUPER ADMIN PASSWORD", password!);
  }
}

/* ---------------- 2. template settings ---------------- */
async function seedTemplateSettings(db: PrismaClient) {
  for (const [i, t] of TEMPLATES.entries()) {
    await db.templateSetting.upsert({ where: { templateId: t.id }, create: { templateId: t.id, enabled: true, featured: i < 6, sortOrder: i }, update: {} });
  }
  console.log(`✔ Template settings ensured for ${TEMPLATES.length} template(s).`);
}

/* ---------------- 3. demo tenants ---------------- */
const DEMO_PHONES = ["+923001234567", "+923211234567", "+923331234567", "+923451234567", "+923121234567", "+923041234567"];

function mapEmbed(city: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${city}, Pakistan`)}&output=embed`;
}

/** Which templates get a demo site (SEED_DEMO_TEMPLATES). */
function selectDemoTemplates(): TemplateMeta[] {
  const raw = (process.env.SEED_DEMO_TEMPLATES ?? "all").trim().toLowerCase();
  if (raw === "all" || raw === "") return TEMPLATES;
  if (raw === "first") {
    const seen = new Set<string>();
    return TEMPLATES.filter((t) => (seen.has(t.category) ? false : (seen.add(t.category), true)));
  }
  const wanted = new Set(raw.split(/[,\s]+/).filter(Boolean));
  const picked = TEMPLATES.filter((t) => wanted.has(t.id.toLowerCase()) || wanted.has(t.category.toLowerCase()));
  const unknown = [...wanted].filter((w) => !TEMPLATES.some((t) => t.id.toLowerCase() === w || t.category.toLowerCase() === w));
  if (unknown.length) console.warn(`  ! SEED_DEMO_TEMPLATES: unknown template/category ${unknown.join(", ")} (ignored)`);
  return picked;
}

async function seedDemoTenants(db: PrismaClient) {
  const templates = selectDemoTemplates();
  if (templates.length === 0) {
    console.log("ℹ No demo templates selected.");
    return;
  }
  let demoPassword = envPassword("SEED_DEMO_PASSWORD");
  const generatedDemo = !demoPassword;
  if (!demoPassword) demoPassword = generatePassword(12);
  const demoHash = await hashPassword(demoPassword);

  let created = 0;
  let refreshed = 0;
  for (const [i, meta] of templates.entries()) {
    const category = getCategory(meta.category);
    if (!category) {
      console.warn(`  ! Template ${meta.id} has unknown category ${meta.category}, skipped.`);
      continue;
    }
    const slug = `demo-${meta.id}`;
    const hostname = `${slug}.${ROOT_DOMAIN}`;
    const city = meta.demo.city || "Lahore";
    const phone = DEMO_PHONES[i % DEMO_PHONES.length];
    const settings = buildTenantSettings(meta, {
      contact: { phone, whatsapp: phone, email: `hello@${slug}.pk`, address: `Main Boulevard, ${city}`, city, mapEmbedUrl: mapEmbed(city) },
      urduEnabled: true,
      hours: DEFAULT_HOURS,
      seo: { title: `${meta.demo.name} – ${category.name} in ${city}`, description: `${meta.demo.name}: ${category.description}` },
    });

    // tenant + hostname + owner in one transaction; content afterwards (idempotent, may be large)
    const { tenant, existed } = await db.$transaction(async (tx) => {
      const existing = await tx.tenant.findUnique({ where: { slug }, select: { id: true } });
      const t = existing
        ? await tx.tenant.update({ where: { id: existing.id }, data: { name: meta.demo.name, category: meta.category, templateId: meta.id, isDemo: true, status: "ACTIVE", settings: json(settings) } })
        : await tx.tenant.create({ data: { slug, name: meta.demo.name, category: meta.category, templateId: meta.id, isDemo: true, status: "ACTIVE", settings: json(settings) } });

      // hostname (re-point if another tenant somehow owns it)
      const domain = await tx.domain.findUnique({ where: { hostname } });
      if (!domain) await tx.domain.create({ data: { tenantId: t.id, hostname, isPrimary: true } });
      else if (domain.tenantId !== t.id) await tx.domain.update({ where: { id: domain.id }, data: { tenantId: t.id, isPrimary: true } });

      await tx.tenantUser.upsert({
        where: { tenantId_username: { tenantId: t.id, username: "demo" } },
        create: { tenantId: t.id, username: "demo", name: "Demo Owner", email: `owner@${slug}.pk`, role: "OWNER", passwordHash: demoHash },
        update: { passwordHash: demoHash, isActive: true, failedLogins: 0, lockedUntil: null },
      });
      return { tenant: t, existed: Boolean(existing) };
      // The seed runs from a developer machine against a remote database: each round trip can take
      // hundreds of ms, so Prisma's 5 s default for interactive transactions is far too tight.
    }, { maxWait: 30_000, timeout: 120_000 });
    if (existed) refreshed++;
    else created++;

    await provisionTenantSections(db, tenant.id, meta.id);
    await seedCategoryData(db, tenant.id, meta.category);
    await fillDemoSectionImages(db, tenant.id, meta.category, meta.sections, i);
    await repairDemoMenuSizes(db, tenant.id);
    await seedInboxData(db, tenant.id, meta.category, meta.demo.name, { dineIn: settings.restaurant.dineIn });
    console.log(`  • ${existed ? "refreshed" : "created "} ${hostname}  (${meta.name}, ${category.name})`);
  }
  console.log(`✔ Demo tenants: ${created} created, ${refreshed} refreshed. Owner username: demo`);
  if (generatedDemo) printSecret("DEMO OWNER PASSWORD (all demo sites)", demoPassword);
  else console.log("  Demo owner password: from SEED_DEMO_PASSWORD");
}

/* ---------------- main ---------------- */
async function main() {
  const db = createClient();
  const started = Date.now();
  try {
    console.log(`Seeding (ROOT_DOMAIN=${ROOT_DOMAIN}, ${TEMPLATES.length} templates, ${CATEGORIES.length} categories)…`);
    await seedSuperAdmin(db);
    await seedTemplateSettings(db);
    if (process.env.SEED_DEMO_TENANTS === "0") {
      console.log("ℹ SEED_DEMO_TENANTS=0 — demo websites skipped.");
    } else if (TEMPLATES.length === 0) {
      console.log("ℹ No templates registered — run `npm run gen:templates` and seed again to create demo websites.");
    } else {
      await seedDemoTenants(db);
    }
    console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
