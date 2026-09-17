"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSuperAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { getCategory } from "@/lib/categories";
import { normalizePkPhone } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const LEAD_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"] as const;
type LeadStatusValue = (typeof LEAD_STATUSES)[number];

/* ---------------- super admin ---------------- */

export async function updateSuperLeadStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requireSuperAction();
    if (!LEAD_STATUSES.includes(status as LeadStatusValue)) return fail("Invalid status.");
    const { count } = await db.superLead.updateMany({ where: { id }, data: { status: status as LeadStatusValue } });
    if (!count) return fail("Lead not found.");
    await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "superLead.status", entity: "SuperLead", entityId: id, meta: { status } });
    revalidatePath("/super/leads");
    return success("Status updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteSuperLead(id: string): Promise<ActionResult> {
  try {
    const user = await requireSuperAction();
    const { count } = await db.superLead.deleteMany({ where: { id } });
    if (!count) return fail("Lead not found.");
    await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "superLead.delete", entity: "SuperLead", entityId: id });
    revalidatePath("/super/leads");
    return success("Lead deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ---------------- public (super website contact form) ---------------- */

const submitSchema = z.object({
  website: z.string().max(0, "Spam detected").optional().or(z.literal("")), // honeypot
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(7, "Please enter your mobile number").max(30),
  email: z.email("Enter a valid email").trim().max(120).optional().or(z.literal("")),
  business: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type SubmitSuperLeadInput = z.infer<typeof submitSchema>;

/**
 * Public action used by the super website's "Get your website" / contact forms.
 * Rate limited per IP, honeypot-protected, zod-validated.
 */
export async function submitSuperLead(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const raw = input instanceof FormData ? Object.fromEntries(input.entries()) : input;
    const parsed = submitSchema.safeParse(raw);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    if (d.website) return success("Thank you! We will contact you shortly."); // silently drop bots

    const ip = await clientIp();
    const rl = await rateLimit({ bucket: `form:superlead:${ip}`, limit: 5, windowSec: 600 });
    if (!rl.ok) return fail("Too many submissions. Please try again in a few minutes.");

    const phone = normalizePkPhone(d.phone) ?? d.phone;
    const category = d.category && getCategory(d.category) ? d.category : null;
    const row = await db.superLead.create({
      data: {
        name: d.name,
        phone,
        email: d.email || null,
        business: d.business || null,
        category,
        message: d.message || null,
      },
    });
    return success("Thank you! We will contact you shortly.", { id: row.id });
  } catch (e) {
    console.error("submitSuperLead", e);
    return fail("Something went wrong. Please try again.");
  }
}
