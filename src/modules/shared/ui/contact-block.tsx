import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import type { LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ContactForm } from "@/modules/leads/ui/contact-form";
import { ContactInfo } from "@/modules/shared/ui/contact-info";
import { MapEmbed } from "@/modules/shared/ui/map-embed";
import { HoursTable } from "@/modules/shared/ui/hours-table";
import { SocialLinks } from "@/modules/shared/ui/social-links";

type ContactData = { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString; showForm?: boolean; showMap?: boolean };

/** Heading from the `contact` section + ContactInfo + ContactForm + MapEmbed. */
export function ContactBlock({
  ctx,
  layout = "split",
  light,
  className,
  id = "contact",
  formKey = "contact",
  subjectOptions,
  showHours = true,
  showSocial = true,
  heading,
  bare,
}: {
  ctx: SiteContext;
  layout?: "split" | "stacked";
  light?: boolean;
  className?: string;
  id?: string;
  formKey?: string;
  subjectOptions?: string[];
  showHours?: boolean;
  showSocial?: boolean;
  heading?: ContactData;
  bare?: boolean;
}) {
  const d = heading ?? ((ctx.sections.contact?.data as ContactData | undefined) ?? {});
  const showForm = d.showForm !== false;
  const showMap = d.showMap !== false;
  const mapUrl = ctx.settings.contact.mapEmbedUrl;
  const info = (
    <div className="space-y-8">
      <ContactInfo ctx={ctx} light={light} />
      {showSocial ? <SocialLinks social={ctx.settings.social} light={light} variant="outline" /> : null}
      {showHours && ctx.settings.hours.length ? <HoursTable ctx={ctx} light={light} compact title={ctx.lang === "ur" ? "اوقات کار" : "Opening hours"} /> : null}
    </div>
  );
  const form = showForm ? (
    <div className={cn("t-card p-6 sm:p-8", light && "border-white/10 bg-white/5")}>
      <ContactForm lang={ctx.lang} formKey={formKey} subjectOptions={subjectOptions} />
    </div>
  ) : null;
  const map = showMap ? <MapEmbed url={mapUrl} title={`${ctx.tenant.name} map`} aspect={layout === "split" ? "aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-64" : "aspect-[21/9]"} /> : null;

  const body =
    layout === "split" ? (
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">{info}</div>
        <div className="space-y-6 lg:col-span-3">
          {form}
          {map}
        </div>
      </div>
    ) : (
      <div className="space-y-10">
        <div className="grid gap-10 md:grid-cols-2">
          {info}
          {form}
        </div>
        {map}
      </div>
    );

  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={ctx.lang} light={light} />
        {body}
      </Container>
    </section>
  );
}
