import "server-only";
import { requireTenant, currentLang } from "@/server/site";
import { clientIp, rateLimit } from "@/server/rate-limit";
import type { TenantContext } from "@/server/tenant";
import { ls, t, ui, type Lang } from "@/lib/i18n";
import { fail, success, type ActionResult } from "@/lib/action-result";

/**
 * Common guard for every public (visitor) server action:
 *   tenant from host -> honeypot -> per-IP rate limit (DB fixed window).
 * Returns the tenant context + language on success, or a ready-made ActionResult to return.
 */
export const publicMessages = {
  tooMany: ls("Too many submissions from this connection. Please try again in a few minutes.", "اس کنکشن سے بہت زیادہ درخواستیں موصول ہوئیں۔ براہ کرم چند منٹ بعد دوبارہ کوشش کریں۔"),
  fixFields: ls("Please fix the highlighted fields.", "براہ کرم نشان زد خانوں کو درست کریں۔"),
  invalidPhone: ls("Please enter a valid mobile number (03XX-XXXXXXX).", "براہ کرم درست موبائل نمبر درج کریں (03XX-XXXXXXX)۔"),
  unavailable: ls("This item is no longer available.", "یہ آئٹم اب دستیاب نہیں ہے۔"),
  uploadFailed: ls("The uploaded file could not be verified. Please upload it again.", "اپ لوڈ کی گئی فائل کی تصدیق نہیں ہو سکی۔ براہ کرم دوبارہ اپ لوڈ کریں۔"),
  serverError: ui.somethingWrong,
} as const;

export type PublicGuard = { ok: true; tc: TenantContext; lang: Lang; ip: string } | { ok: false; result: ActionResult<never> };

export async function publicFormGuard(opts: {
  /** rate-limit bucket key, e.g. "form:contact" or "apply" */
  bucket: string;
  /** honeypot field value from the submission (must be empty) */
  honeypot?: string | null;
  /** message returned to bots (pretend success) */
  honeypotMessage?: string;
  limit?: number;
  windowSec?: number;
}): Promise<PublicGuard> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (opts.honeypot) {
    // bot: pretend success without touching the DB
    return { ok: false, result: success(opts.honeypotMessage ?? t(ui.thankYou, lang)) as ActionResult<never> };
  }
  if (tc.tenant.status === "SUSPENDED") {
    return { ok: false, result: fail(t(publicMessages.unavailable, lang)) };
  }
  const ip = await clientIp();
  let rl: { ok: boolean };
  try {
    rl = await rateLimit({ bucket: `${opts.bucket}:${ip}`, limit: opts.limit ?? 5, windowSec: opts.windowSec ?? 600, tenantId: tc.tenant.id });
  } catch {
    // the limiter must never take the form down; fail open but log
    console.error("rateLimit unavailable for", opts.bucket);
    rl = { ok: true };
  }
  if (!rl.ok) return { ok: false, result: fail(t(publicMessages.tooMany, lang)) };
  return { ok: true, tc, lang, ip };
}

/** Wrap an unexpected error into a bilingual, non-leaking failure. */
export function publicFailure(lang: Lang, err: unknown): ActionResult<never> {
  console.error("public form action failed", err);
  return fail(t(publicMessages.serverError, lang));
}
