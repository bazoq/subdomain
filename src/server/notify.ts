import "server-only";
import { env } from "@/config/env";
import { brand } from "@/config/brand";
import type { TenantContext } from "@/server/tenant";

/**
 * Best-effort email notification to the tenant owner (Resend HTTP API, no SDK).
 * Silently does nothing when RESEND_API_KEY or the tenant's notification email is missing.
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  if (!env.RESEND_API_KEY || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.NOTIFY_FROM_EMAIL ?? `${brand.name} <no-reply@${env.ROOT_DOMAIN}>`,
      to: [to],
      subject,
      text,
      html: html ?? `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
    }),
  });
  return res.ok;
}

export async function notifyTenant(tc: TenantContext, msg: { subject: string; text: string; html?: string }) {
  const to = tc.settings.notifications.emailTo || tc.settings.contact.email;
  if (!to) return false;
  return sendEmail(to, `[${tc.tenant.name}] ${msg.subject}`, msg.text, msg.html);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
