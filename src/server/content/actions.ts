"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, dbErrorMessage, json } from "@/server/db";
import { revalidateTenantContent } from "@/server/content/cache";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { getTemplateMeta } from "@/templates/registry";
import { fieldsSchema } from "@/templates/fields";
import type { TemplateMeta } from "@/templates/types";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

/**
 * Tenant-admin writes to `SiteSection`. Every write:
 *   1. is scoped by the session's tenant (never a tenantId from the client),
 *   2. is validated against the template's section schema (zod, unknown keys dropped),
 *   3. expires the tenant's content cache and the public layout,
 *   4. is audited.
 */

type Ctx = Awaited<ReturnType<typeof requireTenantAdminAction>>;

function resolveSection(ctx: Ctx, key: string): { meta: TemplateMeta; def: TemplateMeta["sections"][number]; index: number } | null {
  const meta = getTemplateMeta(ctx.tenant.templateId);
  if (!meta) return null;
  const index = meta.sections.findIndex((s) => s.key === key);
  if (index < 0) return null;
  return { meta, def: meta.sections[index], index };
}

function afterWrite(tenantId: string) {
  revalidateTenantContent(tenantId);
  revalidatePath("/", "layout");
}

const keySchema = z.string().min(1).max(64);

/** Save a section's data (JSON produced by the schema-driven editor). */
export async function saveSection(key: string, data: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!keySchema.safeParse(key).success) return fail("Unknown section.");
    const found = resolveSection(ctx, key);
    if (!found) return fail("Unknown section.");
    const parsed = fieldsSchema(found.def.fields).safeParse(data);
    if (!parsed.success) return fromZod(parsed.error);
    await db.siteSection.upsert({
      where: { tenantId_key: { tenantId: ctx.tenant.id, key } },
      create: { tenantId: ctx.tenant.id, key, data: json(parsed.data), sortOrder: found.index },
      update: { data: json(parsed.data) },
    });
    afterWrite(ctx.tenant.id);
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "section.save", entity: "SiteSection", entityId: key });
    return success("Section saved.");
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}

export async function toggleSection(key: string, enabled: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!keySchema.safeParse(key).success) return fail("Unknown section.");
    const found = resolveSection(ctx, key);
    if (!found) return fail("Unknown section.");
    if (found.def.canDisable === false && !enabled) return fail("This section cannot be disabled.");
    const on = Boolean(enabled);
    await db.siteSection.upsert({
      where: { tenantId_key: { tenantId: ctx.tenant.id, key } },
      create: { tenantId: ctx.tenant.id, key, enabled: on, sortOrder: found.index, data: json(found.def.defaults) },
      update: { enabled: on },
    });
    afterWrite(ctx.tenant.id);
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: on ? "section.enable" : "section.disable", entity: "SiteSection", entityId: key });
    return success(on ? "Section enabled." : "Section disabled.");
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}

const orderSchema = z.array(keySchema).min(1).max(100);

/**
 * Persist a new display order. The client sends the keys in the desired order; unknown keys are
 * ignored, duplicates rejected, and any template section the client omitted keeps its relative
 * position after the provided ones. All rows are written in one transaction.
 */
export async function reorderSections(keys: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = orderSchema.safeParse(keys);
    if (!parsed.success) return fail("Invalid order.");
    const meta = getTemplateMeta(ctx.tenant.templateId);
    if (!meta) return fail("Template not found.");
    const valid = new Set(meta.sections.map((s) => s.key));
    const requested = parsed.data.filter((k) => valid.has(k));
    if (new Set(requested).size !== requested.length) return fail("Invalid order (duplicate section).");
    const ordered = [...requested, ...meta.sections.map((s) => s.key).filter((k) => !requested.includes(k))];
    const defaults = new Map(meta.sections.map((s) => [s.key, s.defaults]));

    await db.$transaction(
      ordered.map((key, i) =>
        db.siteSection.upsert({
          where: { tenantId_key: { tenantId: ctx.tenant.id, key } },
          create: { tenantId: ctx.tenant.id, key, sortOrder: i, data: json(defaults.get(key) ?? {}) },
          update: { sortOrder: i },
        }),
      ),
    );
    afterWrite(ctx.tenant.id);
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "section.reorder", entity: "SiteSection", meta: { order: ordered } });
    return success("Order updated.");
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}

/** Drop the stored row so the section renders the template defaults again (keeps its position). */
export async function resetSection(key: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!keySchema.safeParse(key).success) return fail("Unknown section.");
    const found = resolveSection(ctx, key);
    if (!found) return fail("Unknown section.");
    // An empty blob means "template defaults" at read time (see normaliseSectionData), so the section
    // keeps following future template default changes instead of freezing a copy of them.
    await db.siteSection.updateMany({ where: { tenantId: ctx.tenant.id, key }, data: { data: json({}) } });
    afterWrite(ctx.tenant.id);
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "section.reset", entity: "SiteSection", entityId: key });
    return success("Section reset to template defaults.");
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}
