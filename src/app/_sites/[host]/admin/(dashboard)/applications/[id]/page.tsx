import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { ApplicationStatusForm } from "@/components/admin/recruiting/application-status-form";
import { deleteApplication } from "@/modules/recruiting/actions";
import type { ApplicationStatusKey } from "@/modules/recruiting/constants";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const a = await db.application.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { job: { select: { id: true, title: true, slug: true, company: true, location: true } } } });
  if (!a) notFound();
  const jobTitle = a.job ? (a.job.title as LocalizedString).en : ((a.data as { jobTitle?: string } | null)?.jobTitle ?? "Job removed");
  const waText = `Assalam o Alaikum ${a.name}, this is ${ctx.tenant.name} regarding your application for "${jobTitle}".`;

  return (
    <>
      <PageHeader
        title={a.name}
        backHref="/admin/applications"
        description={`Applied ${formatDate(a.createdAt, true)} for ${jobTitle}`}
        actions={
          <>
            {a.cvMediaId ? (
              <a href={`/api/media/${a.cvMediaId}`} target="_blank" rel="noreferrer">
                <Button>
                  <Download /> Download CV
                </Button>
              </a>
            ) : null}
            <ActionButton variant="ghost" className="text-red-600" confirm="Delete this application permanently?" action={() => deleteApplication(a.id)} redirectTo="/admin/applications">
              <Trash2 /> Delete
            </ActionButton>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Pipeline</CardTitle>
              <StatusBadge status={a.status} />
            </CardHeader>
            <CardContent>
              <ApplicationStatusForm id={a.id} status={a.status as ApplicationStatusKey} notes={a.notes ?? ""} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cover letter</CardTitle>
            </CardHeader>
            <CardContent>
              {a.coverLetter ? <p className="whitespace-pre-wrap text-sm text-slate-700">{a.coverLetter}</p> : <p className="text-sm text-slate-400">No cover letter provided.</p>}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Phone" value={a.phone} />
              <Row label="Email" value={a.email ?? "—"} />
              <Row label="City" value={a.city ?? "—"} />
              <Row label="Experience" value={a.experience ?? "—"} />
              <Row label="CV" value={a.cvMediaId ? "Uploaded (private)" : "Not uploaded"} />
              <div className="flex flex-wrap gap-2 pt-2">
                <a href={whatsappLink(a.phone, waText)} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="success">
                    <MessageCircle /> WhatsApp
                  </Button>
                </a>
                <a href={`tel:${a.phone}`}>
                  <Button size="sm" variant="outline">
                    <Phone /> Call
                  </Button>
                </a>
                {a.email ? (
                  <a href={`mailto:${a.email}?subject=${encodeURIComponent(`Your application for ${jobTitle}`)}`}>
                    <Button size="sm" variant="outline">
                      <Mail /> Email
                    </Button>
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {a.job ? (
                <>
                  <Link href={`/admin/jobs/${a.job.id}`} className="font-medium text-brand-600 hover:underline">
                    {jobTitle}
                  </Link>
                  <p className="text-slate-500">
                    {a.job.company ? `${a.job.company} · ` : ""}
                    {a.job.location}
                  </p>
                  <a href={`/jobs/${a.job.slug}`} target="_blank" rel="noreferrer" className="text-xs text-slate-500 underline">
                    View public page
                  </a>
                </>
              ) : (
                <p className="text-slate-500">{jobTitle}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
