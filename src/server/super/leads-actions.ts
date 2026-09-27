"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSuperAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { getCategory } from "@/lib/categories";
import { log, errorFields } from "@/lib/log";
import { normalizePkPhone } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const LEAD_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"] as const;
type LeadStatusValue = (typeof LEAD_STATUSES)[number];

/* ---------------- super admin (SUPERADMIN + EDITOR) ---------------- */

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

const THANKS = "Thank you! We will contact you shortly.";

const submitSchema = z.object({
  /** Honeypot. Any value means a bot filled the hidden field; validated loosely so it never produces a field error. */
  website: z.string().max(500).optional().or(z.literal("")),
  name: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  phone: z.string().trim().min(7, "Please enter your mobile number").max(30, "Phone number is too long"),
  email: z.email("Enter a valid email").trim().max(120).optional().or(z.literal("")),
  business: z.string().trim().max(120, "Business name is too long").optional().or(z.literal("")),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000, "Message is too long (2000 characters max)").optional().or(z.literal("")),
  /** Page / template the form was shown on (client-set, informational only). */
  source: z.string().trim().max(80).optional().or(z.literal("")),
});
export type SubmitSuperLeadInput = z.infer<typeof submitSchema>;

/**
 * Public action used by the super website's "Get your website" / contact forms.
 * Honeypot-protected (silent success for bots), rate limited per IP, zod-validated.
 */
export async function submitSuperLead(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const raw = input instanceof FormData ? Object.fromEntries(input.entries()) : input;
    // Honeypot first: a filled hidden field is a bot, answer exactly like a success and store nothing.
    if (raw && typeof raw === "object" && typeof (raw as Record<string, unknown>).website === "string" && (raw as Record<string, string>).website.trim()) {
      log.info("superlead.honeypot", { ip: await clientIp().catch(() => "?") });
      return success(THANKS);
    }
    const parsed = submitSchema.safeParse(raw);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;

    const phone = normalizePkPhone(d.phone);
    if (!phone) return fail("Please check the mobile number.", { phone: "Enter a Pakistani mobile number, e.g. 0300 1234567." });

    const ip = await clientIp();
    const rl = await rateLimit({ bucket: `form:superlead:${ip}`, limit: 5, windowSec: 600 });
    if (!rl.ok) return fail("Too many submissions. Please try again in a few minutes.");

    const category = d.category && getCategory(d.category) ? d.category : null;
    // SuperLead has no `source` column yet; keep the page/template reference with the message so sales can see it.
    const source = d.source ? d.source.replace(/[^\w:/.-]/g, "") : "";
    const message = [d.message || "", source ? `(via ${source})` : ""].filter(Boolean).join("\n") || null;
    const row = await db.superLead.create({
      data: {
        name: d.name,
        phone,
        email: d.email || null,
        business: d.business || null,
        category,
        message,
      },
    });
    log.info("superlead.created", { id: row.id, category, source: source || undefined });
    return success(THANKS, { id: row.id });
  } catch (e) {
    log.error("superlead.failed", errorFields(e));
    return fail("Something went wrong. Please try again, or WhatsApp us directly.");
  }
}
