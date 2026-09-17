"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const faqSchema = z.object({
  question: localizedString.refine((v) => v.en.trim().length > 0, "Question is required"),
  answer: localizedString.refine((v) => v.en.trim().length > 0, "Answer is required"),
  isActive: z.boolean().default(true),
});
export type FaqInput = z.infer<typeof faqSchema>;

export async function upsertFaq(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = faqSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const data = { question: json(parsed.data.question), answer: json(parsed.data.answer), isActive: parsed.data.isActive };
    let row;
    if (id) {
      const existing = await db.faqItem.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.faqItem.update({ where: { id }, data });
    } else {
      const count = await db.faqItem.count({ where: { tenantId: ctx.tenant.id } });
      row = await db.faqItem.create({ data: { ...data, tenantId: ctx.tenant.id, sortOrder: count } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "faq.update" : "faq.create", entity: "FaqItem", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Question updated." : "Question added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.faqItem.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "faq.delete", entity: "FaqItem", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleFaq(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.faqItem.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { isActive } });
    if (!count) return fail("Not found.");
    revalidatePath("/", "layout");
    return success(isActive ? "Shown on website." : "Hidden from website.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** Move one FAQ up (-1) or down (+1) by swapping sortOrder with its neighbour. */
export async function moveFaq(id: string, dir: -1 | 1): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const rows = await db.faqItem.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
    const i = rows.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0) return fail("Not found.");
    if (j < 0 || j >= rows.length) return success();
    const order = rows.map((r) => r.id);
    [order[i], order[j]] = [order[j], order[i]];
    await db.$transaction(order.map((rid, k) => db.faqItem.updateMany({ where: { id: rid, tenantId: ctx.tenant.id }, data: { sortOrder: k } })));
    revalidatePath("/", "layout");
    return success();
  } catch (e) {
    return fail((e as Error).message);
  }
}
