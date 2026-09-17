/**
 * Pure tenant-provisioning helpers shared by the super admin actions and the
 * database seed. This file must stay free of "server-only" / Next.js imports so
 * `tsx prisma/seed.ts` can import it.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { getTemplateMeta } from "@/templates/registry";
import type { TemplateMeta } from "@/templates/types";
import { tenantSettingsSchema, type TenantSettings } from "@/lib/tenant-settings";

/** Minimal client shape accepted by the helpers (works for the root client and `$transaction` clients). */
export type ProvisionDb = Pick<PrismaClient | Prisma.TransactionClient, "siteSection">;

function asJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export interface SectionRowInput {
  key: string;
  sortOrder: number;
  enabled: boolean;
  data: Prisma.InputJsonValue;
}

/** SiteSection rows a fresh tenant needs for a template: one row per section with the template's default content. */
export function sectionRowsForTemplate(meta: TemplateMeta): SectionRowInput[] {
  return meta.sections.map((s, i) => ({ key: s.key, sortOrder: i, enabled: true, data: asJson(s.defaults) }));
}

/** Insert default SiteSection rows for a template (idempotent: existing keys are left untouched). */
export async function provisionTenantSections(db: ProvisionDb, tenantId: string, templateId: string): Promise<number> {
  const meta = getTemplateMeta(templateId);
  if (!meta) throw new Error(`Unknown template "${templateId}". Run \`npm run gen:templates\` first.`);
  const rows = sectionRowsForTemplate(meta);
  if (rows.length === 0) return 0;
  const res = await db.siteSection.createMany({
    data: rows.map((r) => ({ tenantId, ...r })),
    skipDuplicates: true,
  });
  return res.count;
}

/**
 * Switch a tenant to another template. Rows whose keys also exist in the new
 * template are kept (content survives), rows for unknown keys are deleted, and
 * defaults are inserted for keys the tenant does not have yet.
 */
export async function migrateTenantSections(db: ProvisionDb, tenantId: string, newTemplateId: string): Promise<{ kept: number; removed: number; added: number }> {
  const meta = getTemplateMeta(newTemplateId);
  if (!meta) throw new Error(`Unknown template "${newTemplateId}".`);
  const validKeys = new Set(meta.sections.map((s) => s.key));
  const existing = await db.siteSection.findMany({ where: { tenantId }, select: { key: true } });
  const existingKeys = new Set(existing.map((r) => r.key));
  const toRemove = existing.filter((r) => !validKeys.has(r.key)).map((r) => r.key);
  const toAdd = sectionRowsForTemplate(meta).filter((r) => !existingKeys.has(r.key));

  if (toRemove.length) await db.siteSection.deleteMany({ where: { tenantId, key: { in: toRemove } } });
  // Re-align sort order with the new template so kept sections render in the template's order.
  for (const [i, s] of meta.sections.entries()) {
    if (existingKeys.has(s.key)) await db.siteSection.updateMany({ where: { tenantId, key: s.key }, data: { sortOrder: i } });
  }
  if (toAdd.length) await db.siteSection.createMany({ data: toAdd.map((r) => ({ tenantId, ...r })), skipDuplicates: true });
  return { kept: existing.length - toRemove.length, removed: toRemove.length, added: toAdd.length };
}

export interface ContactInput {
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  mapEmbedUrl?: string;
}

/** Build a validated TenantSettings object: schema defaults <- template defaults <- contact + language. */
export function buildTenantSettings(meta: TemplateMeta | undefined, input: { contact: ContactInput; urduEnabled: boolean; hours?: TenantSettings["hours"]; seo?: TenantSettings["seo"] }): TenantSettings {
  const base = tenantSettingsSchema.parse(meta?.defaultSettings ?? {});
  const contact = Object.fromEntries(Object.entries(input.contact).filter(([, v]) => v !== undefined && v !== "")) as ContactInput;
  return tenantSettingsSchema.parse({
    ...base,
    contact: { ...base.contact, ...contact },
    languages: { ...base.languages, urduEnabled: input.urduEnabled },
    ...(input.hours ? { hours: input.hours } : {}),
    ...(input.seo ? { seo: { ...base.seo, ...input.seo } } : {}),
  });
}

/* ---------- hostnames ---------- */

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Validate a fully-qualified hostname for a tenant. Returns the normalised
 * hostname or an error message. Rejects the platform root and www.root.
 */
export function validateHostname(raw: string, rootDomain: string): { ok: true; hostname: string } | { ok: false; error: string } {
  const hostname = raw.trim().toLowerCase().replace(/\.$/, "");
  if (!hostname) return { ok: false, error: "Hostname is required." };
  if (/^[a-z]+:\/\//.test(hostname) || hostname.includes("/")) return { ok: false, error: "Enter a hostname only (no http:// or paths)." };
  if (hostname.includes(":")) return { ok: false, error: "Hostname must not include a port." };
  if (hostname.length > 253) return { ok: false, error: "Hostname is too long." };
  const labels = hostname.split(".");
  if (labels.length < 2) return { ok: false, error: "Enter a full hostname, e.g. shop.example.pk." };
  for (const l of labels) if (!LABEL.test(l)) return { ok: false, error: `"${l}" is not a valid DNS label (letters, digits and hyphens only).` };
  const root = rootDomain.toLowerCase();
  if (hostname === root || hostname === `www.${root}`) return { ok: false, error: "That hostname is reserved for the platform itself." };
  if (hostname.endsWith(".vercel.app")) return { ok: false, error: "*.vercel.app hosts are reserved." };
  return { ok: true, hostname };
}

/** Validate a single subdomain label (the part before .ROOT_DOMAIN). */
export function validateSubdomain(raw: string): { ok: true; label: string } | { ok: false; error: string } {
  const label = raw.trim().toLowerCase();
  if (!label) return { ok: false, error: "Subdomain is required." };
  if (!LABEL.test(label)) return { ok: false, error: "Use letters, digits and hyphens only." };
  if (["www", "api", "admin", "super", "mail", "ftp", "app"].includes(label)) return { ok: false, error: `"${label}" is reserved.` };
  return { ok: true, label };
}

export function isValidSlug(slug: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/.test(slug);
}
