import { notFound } from "next/navigation";
import { Download, Mail, MessageCircle, Phone } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LeadStatusForm } from "@/modules/leads/ui/lead-status-form";
import { asStringRecord, humanize } from "@/modules/shared/content-types";
import { formatDate, whatsappLink } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const lead = await db.lead.findFirst({ where: { id, tenantId: ctx.tenant.id } });
  if (!lead) notFound();
  const data = asStringRecord(lead.data);
  const files = lead.fileIds.length ? await db.media.findMany({ where: { id: { in: lead.fileIds }, tenantId: ctx.tenant.id }, select: { id: true, mime: true, size: true, key: true, createdAt: true } }) : [];
  const phoneDigits = lead.phone?.replace(/[^\d+]/g, "") ?? "";
  const btn = "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50";

  return (
    <>
      <PageHeader title={lead.name} backHref="/admin/leads" description={`${humanize(lead.formKey)} · ${formatDate(lead.createdAt, true)}`} actions={<StatusBadge status={lead.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
                  <dd className="font-medium" dir="ltr">
                    {lead.phone ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="break-all font-medium">{lead.email ?? "—"}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {phoneDigits ? (
                  <>
                    <a href={`tel:${phoneDigits}`} className={btn}>
                      <Phone className="size-4" /> Call
                    </a>
                    <a href={whatsappLink(phoneDigits, `Assalam o Alaikum ${lead.name}, this is ${ctx.tenant.name}. Thank you for contacting us.`)} target="_blank" rel="noreferrer" className={btn}>
                      <MessageCircle className="size-4 text-emerald-600" /> WhatsApp
                    </a>
                  </>
                ) : null}
                {lead.email ? (
                  <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: ${lead.subject ?? "your enquiry"} – ${ctx.tenant.name}`)}`} className={btn}>
                    <Mail className="size-4" /> Email
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{lead.subject || "Message"}</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.message ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{lead.message}</p> : <p className="text-sm text-slate-400">No message text.</p>}
            </CardContent>
          </Card>

          {Object.keys(data).length ? (
            <Card>
              <CardHeader>
                <CardTitle>Form details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(data).map(([k, v]) => (
                      <tr key={k}>
                        <th scope="row" className="w-44 bg-slate-50 px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {humanize(k)}
                        </th>
                        <td className="px-5 py-2.5 text-slate-800">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}

          {lead.fileIds.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Attached files</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span>
                        <span className="font-medium text-slate-800">{f.key.split("/").pop()}</span>
                        <span className="block text-xs text-slate-500">
                          {f.mime} · {(f.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </span>
                      <a href={`/api/media/${f.id}`} target="_blank" rel="noreferrer" className={btn}>
                        <Download className="size-4" /> Download
                      </a>
                    </li>
                  ))}
                  {files.length < lead.fileIds.length ? <li className="px-5 py-3 text-xs text-slate-400">{lead.fileIds.length - files.length} file(s) no longer available.</li> : null}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusForm id={lead.id} status={lead.status} notes={lead.notes ?? ""} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-xs text-slate-500">
              <p>Received: {formatDate(lead.createdAt, true)}</p>
              <p>Updated: {formatDate(lead.updatedAt, true)}</p>
              <p>Source: {lead.source ?? "website"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
