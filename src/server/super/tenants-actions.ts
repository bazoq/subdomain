"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireSuperAction, requireSuperRole } from "@/server/auth/guards";
import { hashPassword, passwordPolicy, PASSWORD_MAX, PASSWORD_MIN } from "@/server/auth/password";
import { revokeSessions } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { deleteObject } from "@/server/storage/r2";
import { r2Configured } from "@/config/env";
import { ROOT_DOMAIN } from "@/config/site";
import { getCategory } from "@/lib/categories";
import { getTemplateMeta } from "@/templates/registry";
import { parseSettings, tenantSettingsSchema } from "@/lib/tenant-settings";
import { log, errorFields } from "@/lib/log";
import { normalizePkPhone } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { buildTenantSettings, isValidSlug, migrateTenantSections, sectionRowsForTemplate, validateHostname, validateSubdomain } from "@/server/super/provision";
import type { SuperUser } from "@/generated/prisma/client";

/* ---------------- schemas ---------------- */

const hostnameEntry = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("subdomain"), value: z.string().trim().max(63) }),
  z.object({ kind: z.literal("custom"), value: z.string().trim().max(253) }),
]);
export type HostnameEntry = z.infer<typeof hostnameEntry>;

const contactSchema = z.object({
  phone: z.string().trim().max(30).default(""),
  whatsapp: z.string().trim().max(30).default(""),
  email: z.string().trim().max(120).default(""),
  city: z.string().trim().max(60).default(""),
  address: z.string().trim().max(200).default(""),
});

const createTenantSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(80),
  slug: z.string().trim().min(3, "Slug must be at least 3 characters").max(64),
  category: z.string().min(1, "Choose a category"),
  templateId: z.string().min(1, "Choose a template"),
  hostnames: z.array(hostnameEntry).min(1, "Add at least one hostname").max(10),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
  owner: z.object({
    name: z.string().trim().min(2, "Owner name is required").max(80),
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(40),
    password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`).max(PASSWORD_MAX),
    email: z.string().trim().max(120).optional().or(z.literal("")),
  }),
  contact: contactSchema.default({ phone: "", whatsapp: "", email: "", city: "", address: "" }),
  urduEnabled: z.boolean().default(false),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

const updateBasicsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED"]),
  isDemo: z.boolean().default(false),
  urduEnabled: z.boolean().default(false),
  contact: contactSchema,
});
export type UpdateTenantBasicsInput = z.infer<typeof updateBasicsSchema>;

/* ---------------- helpers ---------------- */

function superAudit(user: SuperUser, input: { tenantId?: string | null; action: string; entity?: string; entityId?: string; meta?: Record<string, unknown> }) {
  return audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, ...input });
}

function resolveHostname(entry: HostnameEntry): { ok: true; hostname: string } | { ok: false; error: string } {
  if (entry.kind === "subdomain") {
    const r = validateSubdomain(entry.value);
    if (!r.ok) return r;
    return validateHostname(`${r.label}.${ROOT_DOMAIN}`, ROOT_DOMAIN);
  }
  return validateHostname(entry.value, ROOT_DOMAIN);
}

function normalisePhones<T extends { phone: string; whatsapp: string }>(c: T): T {
  return {
    ...c,
    phone: c.phone ? (normalizePkPhone(c.phone) ?? c.phone) : "",
    whatsapp: c.whatsapp ? (normalizePkPhone(c.whatsapp) ?? c.whatsapp) : "",
  };
}

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,39}$/;

/* ---------------- create ---------------- */

export async function createTenant(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireTenantManager();
    const parsed = createTenantSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;

    const slug = d.slug.toLowerCase();
    if (!isValidSlug(slug)) return fail("Invalid slug.", { slug: "Use lowercase letters, digits and hyphens." });
    if (!getCategory(d.category)) return fail("Unknown category.", { category: "Unknown category." });
    const meta = getTemplateMeta(d.templateId);
    if (!meta) return fail("Unknown template.", { templateId: "Template not found in the registry." });
    if (meta.category !== d.category) return fail("Template does not belong to the selected category.", { templateId: "Choose a template from this category." });

    const username = d.owner.username.toLowerCase();
    if (!USERNAME.test(username)) return fail("Invalid username.", { "owner.username": "Use lowercase letters, digits, dots, dashes or underscores." });
    const pw = passwordPolicy(d.owner.password, { username });
    if (pw) return fail(pw, { "owner.password": pw });

    const hostnames: string[] = [];
    for (const [i, entry] of d.hostnames.entries()) {
      const r = resolveHostname(entry);
      if (!r.ok) return fail(r.error, { [`hostnames.${i}`]: r.error });
      if (hostnames.includes(r.hostname)) return fail("Duplicate hostname.", { [`hostnames.${i}`]: "This hostname is listed twice." });
      hostnames.push(r.hostname);
    }

    const [slugTaken, domainTaken] = await Promise.all([
      db.tenant.findUnique({ where: { slug }, select: { id: true } }),
      db.domain.findFirst({ where: { hostname: { in: hostnames } }, select: { hostname: true } }),
    ]);
    if (slugTaken) return fail("Slug already in use.", { slug: "This slug is already taken." });
    if (domainTaken) {
      const idx = hostnames.indexOf(domainTaken.hostname);
      return fail(`${domainTaken.hostname} is already assigned to another website.`, { [`hostnames.${idx}`]: "Already in use." });
    }

    const settings = buildTenantSettings(meta, { contact: normalisePhones(d.contact), urduEnabled: d.urduEnabled });
    const passwordHash = await hashPassword(d.owner.password);

    const tenant = await db.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: { slug, name: d.name, category: d.category, templateId: meta.id, status: d.status, settings: json(settings) },
      });
      await tx.domain.createMany({ data: hostnames.map((hostname, i) => ({ tenantId: t.id, hostname, isPrimary: i === 0 })) });
      await tx.tenantUser.create({
        data: { tenantId: t.id, username, passwordHash, name: d.owner.name, email: d.owner.email || null, role: "OWNER" },
      });
      const rows = sectionRowsForTemplate(meta);
      if (rows.length) await tx.siteSection.createMany({ data: rows.map((r) => ({ tenantId: t.id, ...r })) });
      return t;
    });

    await superAudit(user, { tenantId: tenant.id, action: "tenant.create", entity: "Tenant", entityId: tenant.id, meta: { slug, templateId: meta.id, hostnames } });
    revalidatePath("/super/tenants");
    return success("Website created.", { id: tenant.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ---------------- basics / status ---------------- */

export async function updateTenantBasics(id: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const parsed = updateBasicsSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const tenant = await db.tenant.findUnique({ where: { id } });
    if (!tenant) return fail("Website not found.");
    const current = parseSettings(tenant.settings);
    const contact = normalisePhones(parsed.data.contact);
    const settings = tenantSettingsSchema.parse({
      ...current,
      contact: { ...current.contact, ...contact },
      languages: { ...current.languages, urduEnabled: parsed.data.urduEnabled },
    });
    await db.tenant.update({
      where: { id },
      data: { name: parsed.data.name, status: parsed.data.status, isDemo: parsed.data.isDemo, settings: json(settings) },
    });
    await superAudit(user, { tenantId: id, action: "tenant.update", entity: "Tenant", entityId: id, meta: { status: parsed.data.status } });
    revalidatePath("/", "layout");
    return success("Website updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function setTenantStatus(id: string, status: "DRAFT" | "ACTIVE" | "SUSPENDED"): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    if (!["DRAFT", "ACTIVE", "SUSPENDED"].includes(status)) return fail("Invalid status.");
    const { count } = await db.tenant.updateMany({ where: { id }, data: { status } });
    if (!count) return fail("Website not found.");
    await superAudit(user, { tenantId: id, action: `tenant.status.${status.toLowerCase()}`, entity: "Tenant", entityId: id });
    revalidatePath("/", "layout");
    return success(`Website is now ${status.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ---------------- domains ---------------- */

export async function addDomain(tenantId: string, entry: unknown): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const parsed = hostnameEntry.safeParse(entry);
    if (!parsed.success) return fromZod(parsed.error);
    const r = resolveHostname(parsed.data);
    if (!r.ok) return fail(r.error, { value: r.error });
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true, _count: { select: { domains: true } } } });
    if (!tenant) return fail("Website not found.");
    const taken = await db.domain.findUnique({ where: { hostname: r.hostname }, select: { tenantId: true } });
    if (taken) return fail(taken.tenantId === tenantId ? "This hostname is already attached." : "Hostname is assigned to another website.", { value: "Already in use." });
    await db.domain.create({ data: { tenantId, hostname: r.hostname, isPrimary: tenant._count.domains === 0 } });
    await superAudit(user, { tenantId, action: "domain.add", entity: "Domain", entityId: r.hostname });
    revalidatePath("/", "layout");
    return success(`${r.hostname} added.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function removeDomain(tenantId: string, domainId: string): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const domains = await db.domain.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } });
    const target = domains.find((d) => d.id === domainId);
    if (!target) return fail("Domain not found.");
    if (domains.length <= 1) return fail("A website must keep at least one hostname.");
    await db.$transaction(async (tx) => {
      await tx.domain.delete({ where: { id: domainId } });
      if (target.isPrimary) {
        const next = domains.find((d) => d.id !== domainId)!;
        await tx.domain.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    });
    await superAudit(user, { tenantId, action: "domain.remove", entity: "Domain", entityId: target.hostname });
    revalidatePath("/", "layout");
    return success(`${target.hostname} removed.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function setPrimaryDomain(tenantId: string, domainId: string): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const target = await db.domain.findFirst({ where: { id: domainId, tenantId } });
    if (!target) return fail("Domain not found.");
    await db.$transaction([
      db.domain.updateMany({ where: { tenantId }, data: { isPrimary: false } }),
      db.domain.update({ where: { id: domainId }, data: { isPrimary: true } }),
    ]);
    await superAudit(user, { tenantId, action: "domain.primary", entity: "Domain", entityId: target.hostname });
    revalidatePath("/", "layout");
    return success(`${target.hostname} is now the primary hostname.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ---------------- template ---------------- */

export async function changeTemplate(tenantId: string, templateId: string): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return fail("Website not found.");
    const meta = getTemplateMeta(templateId);
    if (!meta) return fail("Template not found.");
    if (meta.category !== tenant.category) return fail("Only templates from the same category can be applied.");
    if (meta.id === tenant.templateId) return fail("This template is already active.");
    const result = await db.$transaction(async (tx) => {
      await tx.tenant.update({ where: { id: tenantId }, data: { templateId: meta.id } });
      return migrateTenantSections(tx, tenantId, meta.id);
    });
    await superAudit(user, { tenantId, action: "tenant.template", entity: "Tenant", entityId: tenantId, meta: { from: tenant.templateId, to: meta.id, ...result } });
    revalidatePath("/", "layout");
    return success(`Template changed to ${meta.name}. Kept ${result.kept}, added ${result.added}, removed ${result.removed} section(s).`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ---------------- users ---------------- */

const addUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(40),
  email: z.string().trim().max(120).optional().or(z.literal("")),
  password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`).max(PASSWORD_MAX),
  role: z.enum(["OWNER", "ADMIN", "STAFF"]).default("ADMIN"),
});
export type AddTenantUserInput = z.infer<typeof addUserSchema>;

export async function addTenantUser(tenantId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireTenantManager();
    const parsed = addUserSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const username = parsed.data.username.toLowerCase();
    if (!USERNAME.test(username)) return fail("Invalid username.", { username: "Use lowercase letters, digits, dots, dashes or underscores." });
    const pw = passwordPolicy(parsed.data.password, { username });
    if (pw) return fail(pw, { password: pw });
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) return fail("Website not found.");
    const exists = await db.tenantUser.findUnique({ where: { tenantId_username: { tenantId, username } }, select: { id: true } });
    if (exists) return fail("Username already exists for this website.", { username: "Already taken." });
    const row = await db.tenantUser.create({
      data: { tenantId, username, name: parsed.data.name, email: parsed.data.email || null, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
    });
    await superAudit(user, { tenantId, action: "tenantUser.create", entity: "TenantUser", entityId: row.id, meta: { username, role: row.role } });
    return success("User added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function resetTenantUserPassword(tenantId: string, userId: string, password: string): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const pw = passwordPolicy(password ?? "");
    if (pw) return fail(pw);
    const target = await db.tenantUser.findFirst({ where: { id: userId, tenantId } });
    if (!target) return fail("User not found.");
    await db.$transaction([
      db.tenantUser.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } }),
      db.session.deleteMany({ where: { tenantUserId: userId } }),
    ]);
    await superAudit(user, { tenantId, action: "tenantUser.resetPassword", entity: "TenantUser", entityId: userId });
    return success(`Password reset for ${target.username}. Existing sessions were signed out.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleTenantUser(tenantId: string, userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const target = await db.tenantUser.findFirst({ where: { id: userId, tenantId } });
    if (!target) return fail("User not found.");
    if (!isActive && target.role === "OWNER" && target.isActive) {
      const owners = await db.tenantUser.count({ where: { tenantId, role: "OWNER", isActive: true } });
      if (owners <= 1) return fail("Cannot deactivate the last active owner.");
    }
    await db.$transaction([
      db.tenantUser.update({ where: { id: userId }, data: { isActive } }),
      ...(isActive ? [] : [db.session.deleteMany({ where: { tenantUserId: userId } })]),
    ]);
    await superAudit(user, { tenantId, action: isActive ? "tenantUser.activate" : "tenantUser.deactivate", entity: "TenantUser", entityId: userId });
    return success(isActive ? "User activated." : "User deactivated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ---------------- delete ---------------- */

export async function deleteTenant(id: string, confirmName: string): Promise<ActionResult> {
  try {
    const user = await requireTenantManager();
    const tenant = await db.tenant.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
    if (!tenant) return fail("Website not found.");
    if ((confirmName ?? "").trim() !== tenant.name) return fail("Type the website name exactly to confirm.");

    // Best-effort removal of R2 objects; DB rows cascade via Prisma.
    let objectsDeleted = 0;
    if (r2Configured) {
      const media = await db.media.findMany({ where: { tenantId: id }, select: { key: true } });
      for (const m of media) {
        try {
          await deleteObject(m.key);
          objectsDeleted++;
        } catch (err) {
          log.warn("tenant.delete.r2Failed", { key: m.key, ...errorFields(err) });
        }
      }
    }
    await db.tenant.delete({ where: { id } });
    await superAudit(user, { tenantId: null, action: "tenant.delete", entity: "Tenant", entityId: id, meta: { slug: tenant.slug, name: tenant.name, objectsDeleted } });
    revalidatePath("/super/tenants");
    return success(`"${tenant.name}" was deleted.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}
