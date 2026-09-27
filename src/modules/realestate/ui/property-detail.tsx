import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, Building2, CalendarDays, Check, ExternalLink, MapPin, Phone, PlayCircle, Ruler, Share2, Tag } from "lucide-react";
import type { Property, TeamMember } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Img, RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatDate, whatsappLink } from "@/lib/utils";
import { areaText, mapEmbedUrl, propertyPrice, purposeLabel, safeExternalUrl, typeLabel, videoEmbedUrl } from "../helpers";
import { getAgent } from "../queries";
import { rs } from "../strings";
import { PropertyGallery } from "./gallery";
import { InquiryForm } from "./inquiry-form";

/**
 * Full listing page body. Server component; resolves the agent (TeamMember) from `property.agentId`
 * unless an `agent` is passed explicitly (pass `null` to skip the lookup).
 */
export async function PropertyDetail({ property: p, ctx, agent, className }: { property: Property; ctx: SiteContext; agent?: TeamMember | null; className?: string }) {
  const lang = ctx.lang;
  const title = t(p.title as LocalizedString, lang);
  const description = p.description as LocalizedString;
  const resolvedAgent = agent === undefined && p.agentId ? await getAgent(ctx.tenant.id, p.agentId) : (agent ?? null);
  const area = areaText(p, lang);
  const map = mapEmbedUrl(p.mapUrl);
  const video = videoEmbedUrl(p.videoUrl);
  const mapLink = safeExternalUrl(p.mapUrl);
  const videoLink = safeExternalUrl(p.videoUrl);
  const url = `https://${ctx.host}/properties/${p.slug}`;
  const officeWa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  const agentWa = resolvedAgent?.phone || officeWa;
  const waText = `Assalam o Alaikum, I am interested in "${title}" — ${p.location}, ${p.city} (${url})`;

  return (
    <div className={cn("grid gap-8 lg:grid-cols-[1fr_360px]", className)}>
      <div className="min-w-0">
        <Link href="/properties" className="inline-flex items-center gap-1 text-sm text-t-muted-fg hover:text-t-primary">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t(rs.backToListings, lang)}
        </Link>
        <header className="mt-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <span className={cn("rounded-full px-2 py-0.5", p.purpose === "RENT" ? "bg-t-secondary text-t-secondary-fg" : "bg-t-primary text-t-primary-fg")}>{purposeLabel(p.purpose, lang)}</span>
              <span className="rounded-full bg-t-muted px-2 py-0.5 text-t-muted-fg">{typeLabel(p.type, lang)}</span>
              {p.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-t-accent-fg">{t(ui.featured, lang)}</span> : null}
            </div>
            <h1 className="font-heading mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-t-muted-fg">
              <MapPin className="size-4" aria-hidden="true" />
              {p.location}, {p.city}
            </p>
          </div>
          <p className="font-heading shrink-0 text-3xl font-bold text-t-primary">{propertyPrice(p, lang)}</p>
        </header>

        <PropertyGallery images={p.images} alt={title} />

        <section className="mt-8">
          <h2 className="font-heading text-xl font-bold">{t(rs.keyFacts, lang)}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Fact icon={<Tag className="size-4" />} label={t(rs.purpose, lang)} value={purposeLabel(p.purpose, lang)} />
            <Fact icon={<Building2 className="size-4" />} label={t(rs.type, lang)} value={typeLabel(p.type, lang)} />
            {area ? <Fact icon={<Ruler className="size-4" />} label={t(rs.area, lang)} value={area} /> : null}
            {p.bedrooms != null ? <Fact icon={<BedDouble className="size-4" />} label={t(rs.bedrooms, lang)} value={String(p.bedrooms)} /> : null}
            {p.bathrooms != null ? <Fact icon={<Bath className="size-4" />} label={t(rs.bathrooms, lang)} value={String(p.bathrooms)} /> : null}
            <Fact icon={<MapPin className="size-4" />} label={t(rs.city, lang)} value={p.city} />
            <Fact icon={<CalendarDays className="size-4" />} label={t(rs.listed, lang)} value={formatDate(p.createdAt)} />
          </dl>
        </section>

        {t(description, lang) ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(rs.description, lang)}</h2>
            <RichText value={description} lang={lang} className="mt-3" />
          </section>
        ) : null}

        {p.features.length ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(rs.features, lang)}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {p.features.map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {video ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(rs.video, lang)}</h2>
            <div className="mt-3 aspect-video overflow-hidden rounded-[var(--t-radius)] bg-t-muted">
              <iframe
                src={video}
                title={`${title} — video`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
              />
            </div>
          </section>
        ) : videoLink ? (
          <a href={videoLink} target="_blank" rel="noreferrer noopener" className="t-btn t-btn-outline mt-8 text-sm">
            <PlayCircle className="size-4" aria-hidden="true" />
            {t(rs.watchVideo, lang)}
          </a>
        ) : null}

        {map ? (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold">{t(rs.map, lang)}</h2>
            <div className="mt-3 aspect-[16/9] overflow-hidden rounded-[var(--t-radius)] bg-t-muted">
              <iframe src={map} title={`${title} — map`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups" />
            </div>
          </section>
        ) : mapLink ? (
          <a href={mapLink} target="_blank" rel="noreferrer noopener" className="t-btn t-btn-outline mt-4 text-sm">
            <MapPin className="size-4" aria-hidden="true" />
            {t(rs.openMap, lang)}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {resolvedAgent ? (
          <div className="t-card p-5">
            <p className="text-[11px] uppercase tracking-wide text-t-muted-fg">{t(rs.agent, lang)}</p>
            <div className="mt-2 flex items-center gap-3">
              <Img src={resolvedAgent.imageUrl ?? undefined} alt={resolvedAgent.name} className="size-14 shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="font-heading font-semibold">{resolvedAgent.name}</p>
                <p className="truncate text-sm text-t-muted-fg">{t(resolvedAgent.role as LocalizedString, lang)}</p>
              </div>
            </div>
            {resolvedAgent.phone ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`tel:${resolvedAgent.phone}`} className="t-btn t-btn-outline text-sm">
                  <Phone className="size-4" aria-hidden="true" />
                  {t(rs.callAgent, lang)}
                </a>
                <a href={whatsappLink(resolvedAgent.phone, waText)} target="_blank" rel="noreferrer" className="t-btn t-btn-primary text-sm">
                  {t(rs.whatsappAgent, lang)}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        <div id="inquire" className="t-card scroll-mt-24 p-5 shadow-lg">
          <h2 className="font-heading text-lg font-bold">{t(rs.inquire, lang)}</h2>
          <InquiryForm ctx={ctx} property={{ id: p.id, title, slug: p.slug }} className="mt-3" compact />
          {!resolvedAgent && agentWa ? (
            <a href={whatsappLink(agentWa, waText)} target="_blank" rel="noreferrer" className="t-btn t-btn-outline mt-3 w-full text-sm">
              {t(rs.whatsappAgent, lang)}
            </a>
          ) : null}
        </div>
        <a href={whatsappLink("", `${title} — ${propertyPrice(p, lang)}\n${p.location}, ${p.city}\n${url}`)} target="_blank" rel="noreferrer" className="t-btn t-btn-ghost w-full text-sm">
          <Share2 className="size-4" aria-hidden="true" />
          {t(rs.share, lang)}
        </a>
      </aside>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="t-card flex items-start gap-2.5 p-3">
      <span className="mt-0.5 shrink-0 text-t-primary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-t-muted-fg">{label}</dt>
        <dd className="truncate text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}
