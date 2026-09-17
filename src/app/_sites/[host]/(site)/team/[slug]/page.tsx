import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getSiteContext } from "@/server/site";
import { Container, Img, RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils";
import { getTeam, getTeamMember } from "@/modules/shared/queries";
import { asSocials } from "@/modules/shared/content-types";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { SocialLinks } from "@/modules/shared/ui/social-links";
import { TeamCard } from "@/modules/shared/ui/team-block";
import { ContactForm } from "@/modules/leads/ui/contact-form";
import { db } from "@/server/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const m = await getTeamMember(ctx.tenant.id, slug);
  if (!m) return {};
  return { title: `${m.name} · ${ctx.tenant.name}`, description: t(m.role as LocalizedString, ctx.lang) || undefined, openGraph: m.imageUrl ? { images: [m.imageUrl] } : undefined };
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const m = await getTeamMember(ctx.tenant.id, slug);
  if (!m) notFound();
  const role = t(m.role as LocalizedString, ctx.lang);
  const listLabel = ctx.category.key === "law" ? t(ui.attorneys, ctx.lang) : ctx.category.key === "gym" ? t(ui.trainers, ctx.lang) : t(ui.team, ctx.lang);
  const others = (await getTeam(ctx.tenant.id, 5)).filter((x) => x.id !== m.id).slice(0, 4);
  const isGym = ctx.category.key === "gym";
  const classes = isGym ? await db.classSchedule.findMany({ where: { tenantId: ctx.tenant.id, trainerId: m.id, isActive: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }) : [];
  const days = ctx.lang === "ur" ? ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const wa = m.phone || ctx.settings.contact.whatsapp || ctx.settings.contact.phone;

  return (
    <>
      <PageHero ctx={ctx} title={m.name} subtitle={role} variant="gradient" breadcrumbs={[{ label: listLabel, href: "/team" }, { label: m.name }]} />
      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-3">
          <aside className="space-y-6">
            <div className="t-card overflow-hidden">
              <Img src={m.imageUrl ?? ""} alt={m.name} className="aspect-[4/5] w-full object-cover" />
              <div className="space-y-3 p-5 text-sm">
                {m.phone ? (
                  <a href={`tel:${m.phone}`} className="flex items-center gap-2 hover:text-t-primary" dir="ltr">
                    <Phone className="size-4 text-t-primary" /> {m.phone}
                  </a>
                ) : null}
                {m.email ? (
                  <a href={`mailto:${m.email}`} className="flex items-center gap-2 break-all hover:text-t-primary">
                    <Mail className="size-4 text-t-primary" /> {m.email}
                  </a>
                ) : null}
                <SocialLinks social={asSocials(m.socials)} size="sm" variant="outline" />
                {wa ? (
                  <a href={whatsappLink(wa, `Hi ${m.name}, I found you on ${ctx.tenant.name}'s website.`)} target="_blank" rel="noreferrer" className="t-btn t-btn-primary w-full">
                    <MessageCircle className="size-4" /> {t(ui.whatsapp, ctx.lang)}
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
          <div className="lg:col-span-2">
            {m.specialties.length ? (
              <ul className="mb-6 flex flex-wrap gap-2">
                {m.specialties.map((s) => (
                  <li key={s} className="rounded-full bg-t-primary/10 px-3 py-1 text-sm font-medium text-t-primary">
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
            <RichText value={m.bio as LocalizedString} lang={ctx.lang} className="text-base leading-relaxed" />
            {classes.length ? (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold">{ctx.lang === "ur" ? "کلاسز" : "Classes"}</h2>
                <ul className="mt-4 divide-y divide-t-border overflow-hidden rounded-[var(--t-radius)] border border-t-border">
                  {classes.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <span className="font-semibold">{t(c.name as LocalizedString, ctx.lang)}</span>
                      <span className="text-t-muted-fg" dir="ltr">
                        {days[c.dayOfWeek]} · {c.startTime}–{c.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/classes" className="mt-3 inline-block text-sm font-semibold text-t-primary hover:underline">
                  {ctx.lang === "ur" ? "پورا ٹائم ٹیبل دیکھیں" : "See the full timetable"} →
                </Link>
              </div>
            ) : null}
            <div className="mt-10 rounded-[var(--t-radius)] bg-t-muted p-6 sm:p-8">
              <h2 className="font-heading text-xl font-bold">{ctx.lang === "ur" ? `${m.name} سے رابطہ کریں` : `Contact ${m.name.split(" ")[0]}`}</h2>
              <ContactForm lang={ctx.lang} formKey="contact" subjectOptions={[`For ${m.name}`]} className="mt-5" />
            </div>
          </div>
        </Container>
      </section>
      {others.length ? (
        <section className="border-t border-t-border py-14">
          <Container>
            <h2 className="font-heading mb-6 text-2xl font-bold">{ctx.lang === "ur" ? "ٹیم کے دیگر افراد" : `More from our ${listLabel.toLowerCase()}`}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((o) => (
                <TeamCard key={o.id} ctx={ctx} member={o} variant="card" showSpecialties={false} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
