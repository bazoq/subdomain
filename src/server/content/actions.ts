"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { getTemplateMeta } from "@/templates/registry";
import { fieldsSchema } from "@/templates/fields";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

/** Save a section's data (JSON produced by the schema-driven editor). */
export async function saveSection(key: string, data: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const meta = getTemplateMeta(ctx.tenant.templateId);
    const def = meta?.sections.find((s) => s.key === key);
    if (!def) return fail("Unknown section.");
    const parsed = fieldsSchema(def.fields).safeParse(data);
    if (!parsed.success) return fromZod(parsed.error);
    const idx = meta!.sections.findIndex((s) => s.key === key);
    await db.siteSection.upsert({
      where: { tenantId_key: { tenantId: ctx.tenant.id, key } },
      create: { tenantId: ctx.tenant.id, key, data: json(parsed.data), sortOrder: idx },
      update: { data: json(parsed.data) },
    });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "section.save", entity: "SiteSection", entityId: key });
    revalidatePath("/", "layout");
    return success("Section saved.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleSection(key: string, enabled: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const meta = getTemplateMeta(ctx.tenant.templateId);
    const def = meta?.sections.find((s) => s.key === key);
    if (!def) return fail("Unknown section.");
    if (def.canDisable === false && !enabled) return fail("This section cannot be disabled.");
    const idx = meta!.sections.findIndex((s) => s.key === key);
    await db.siteSection.upsert({
      where: { tenantId_key: { tenantId: ctx.tenant.id, key } },
      create: { tenantId: ctx.tenant.id, key, enabled, sortOrder: idx, data: json(def.defaults) },
      update: { enabled },
    });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: enabled ? "section.enable" : "section.disable", entity: "SiteSection", entityId: key });
    revalidatePath("/", "layout");
    return success(enabled ? "Section enabled." : "Section disabled.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

const orderSchema = z.array(z.string()).max(100);

export async function reorderSections(keys: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = orderSchema.safeParse(keys);
    if (!parsed.success) return fail("Invalid order.");
    const meta = getTemplateMeta(ctx.tenant.templateId);
    if (!meta) return fail("Template not found.");
    const valid = new Set(meta.sections.map((s) => s.key));
    const ops = parsed.data
      .filter((k) => valid.has(k))
      .map((key, i) => {
        const def = meta.sections.find((s) => s.key === key)!;
        return db.siteSection.upsert({
          where: { tenantId_key: { tenantId: ctx.tenant.id, key } },
          create: { tenantId: ctx.tenant.id, key, sortOrder: i, data: json(def.defaults) },
          update: { sortOrder: i },
        });
      });
    await db.$transaction(ops);
    revalidatePath("/", "layout");
    return success("Order updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function resetSection(key: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    await db.siteSection.deleteMany({ where: { tenantId: ctx.tenant.id, key } });
    revalidatePath("/", "layout");
    return success("Section reset to template defaults.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
