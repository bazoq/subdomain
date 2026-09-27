"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSuperAction, requireSuperRole } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { getTemplateMeta } from "@/templates/registry";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const schema = z.object({
  enabled: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).optional(),
});
export type TemplateSettingInput = z.infer<typeof schema>;

/** Create or update the super-admin override row for a code template (SUPERADMIN only — it changes the public gallery). */
export async function upsertTemplateSetting(templateId: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSuperAction();
    requireSuperRole(user, ["SUPERADMIN"]);
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    if (!getTemplateMeta(templateId)) return fail("Template not found in the registry.");
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
    await db.templateSetting.upsert({
      where: { templateId },
      create: { templateId, ...data },
      update: data,
    });
    await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "template.setting", entity: "TemplateSetting", entityId: templateId, meta: data });
    revalidatePath("/", "layout");
    return success("Template updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
