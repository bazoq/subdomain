/**
 * Database seed. Run with `npm run db:seed` (= `tsx prisma/seed.ts`) after `prisma migrate deploy`.
 *
 *  1. Upserts the first super admin (SEED_SUPER_USERNAME / SEED_SUPER_EMAIL / SEED_SUPER_PASSWORD).
 *  2. Upserts a TemplateSetting row for every registered template.
 *  3. Creates / refreshes one demo tenant per template (`demo-<templateId>.<ROOT_DOMAIN>`),
 *     with owner login demo / demo1234, template default sections and realistic sample data.
 *
 * Safe to re-run: every step is idempotent.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { TEMPLATES } from "@/templates/registry";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { DEFAULT_HOURS } from "@/lib/tenant-settings";
import { buildTenantSettings } from "@/server/super/provision";
import { provisionTenantSections } from "./seed/sections";
import { seedCategoryData } from "./seed/demo-data";

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();
const DEMO_PASSWORD = "demo1234";

function createClient() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL (or DIRECT_URL) is not set");
  const adapter = new PrismaPg({ connectionString, max: 3, idleTimeoutMillis: 10_000 });
  return new PrismaClient({ adapter, log: ["error"] });
}

function randomPassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, length - 2)}a7`;
}

const json = <T,>(v: T) => v as unknown as Prisma.InputJsonValue;

/* ---------------- 1. super admin ---------------- */
async function seedSuperAdmin(db: PrismaClient) {
  const username = (process.env.SEED_SUPER_USERNAME ?? "admin").toLowerCase();
  const email = (process.env.SEED_SUPER_EMAIL ?? "admin@example.com").toLowerCase();
  const existing = await db.superUser.findUnique({ where: { username } });
  let password = process.env.SEED_SUPER_PASSWORD;
  let generated = false;
  if (!password && !existing) {
    password = randomPassword();
    generated = true;
  }
  if (existing) {
    await db.superUser.update({
      where: { id: existing.id },
      data: { email, isActive: true, role: "SUPERADMIN", ...(password ? { passwordHash: await bcrypt.hash(password, 12), failedLogins: 0, lockedUntil: null } : {}) },
    });
    console.log(`✔ Super admin "${username}" already exists${password ? " (password updated from SEED_SUPER_PASSWORD)" : ""}.`);
  } else {
    await db.superUser.create({ data: { username, email, name: "Platform Owner", role: "SUPERADMIN", passwordHash: await bcrypt.hash(password!, 12) } });
    console.log(`✔ Super admin created: username "${username}"`);
    if (generated) {
      console.log("");
      console.log("  ┌──────────────────────────────────────────────────────┐");
      console.log(`  │  SUPER ADMIN PASSWORD:  ${password!.padEnd(28)}│`);
      console.log("  │  Shown once. Change it at /super/users/password.     │");
      console.log("  └──────────────────────────────────────────────────────┘");
      console.log("");
    }
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

async function seedDemoTenants(db: PrismaClient) {
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let created = 0;
  let refreshed = 0;
  for (const [i, meta] of TEMPLATES.entries()) {
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
      contact: {
        phone,
        whatsapp: phone,
        email: `hello@${slug}.pk`,
        address: `Main Boulevard, ${city}`,
        city,
        mapEmbedUrl: mapEmbed(city),
      },
      urduEnabled: true,
      hours: DEFAULT_HOURS,
      seo: { title: `${meta.demo.name} – ${category.name} in ${city}`, description: `${meta.demo.name}: ${category.description}` },
    });

    const existing = await db.tenant.findUnique({ where: { slug } });
    const tenant = existing
      ? await db.tenant.update({ where: { id: existing.id }, data: { name: meta.demo.name, category: meta.category, templateId: meta.id, isDemo: true, status: "ACTIVE", settings: json(settings) } })
      : await db.tenant.create({ data: { slug, name: meta.demo.name, category: meta.category, templateId: meta.id, isDemo: true, status: "ACTIVE", settings: json(settings) } });
    if (existing) refreshed++;
    else created++;

    // hostname (re-point if another tenant somehow owns it)
    const domain = await db.domain.findUnique({ where: { hostname } });
    if (!domain) await db.domain.create({ data: { tenantId: tenant.id, hostname, isPrimary: true } });
    else if (domain.tenantId !== tenant.id) await db.domain.update({ where: { id: domain.id }, data: { tenantId: tenant.id, isPrimary: true } });

    // owner
    await db.tenantUser.upsert({
      where: { tenantId_username: { tenantId: tenant.id, username: "demo" } },
      create: { tenantId: tenant.id, username: "demo", name: "Demo Owner", email: `owner@${slug}.pk`, role: "OWNER", passwordHash: demoHash },
      update: { passwordHash: demoHash, isActive: true, failedLogins: 0, lockedUntil: null },
    });

    // sections + sample data
    await provisionTenantSections(db, tenant.id, meta.id);
    await seedCategoryData(db, tenant.id, meta.category);
    console.log(`  • ${existing ? "refreshed" : "created "} ${hostname}  (${meta.name}, ${category.name})`);
  }
  console.log(`✔ Demo tenants: ${created} created, ${refreshed} refreshed. Owner login: demo / ${DEMO_PASSWORD}`);
}

/* ---------------- main ---------------- */
async function main() {
  const db = createClient();
  try {
    console.log(`Seeding (ROOT_DOMAIN=${ROOT_DOMAIN}, ${TEMPLATES.length} templates, ${CATEGORIES.length} categories)…`);
    await seedSuperAdmin(db);
    await seedTemplateSettings(db);
    if (TEMPLATES.length === 0) {
      console.log("ℹ No templates registered — run `npm run gen:templates` and seed again to create demo websites.");
    } else {
      await seedDemoTenants(db);
    }
    console.log("Done.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
