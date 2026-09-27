import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { TeamMember } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Container, Img, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getTeam } from "@/modules/shared/queries";
import { asSocials } from "@/modules/shared/content-types";
import { SocialLinks } from "@/modules/shared/ui/social-links";

type HeadingData = { eyebrow?: LocalizedString | string; title?: LocalizedString; subtitle?: LocalizedString };

export function TeamCard({
  ctx,
  member,
  variant = "card",
  showSpecialties = true,
  showSocials = true,
  light,
  className,
}: {
  ctx: SiteContext;
  member: TeamMember;
  variant?: "card" | "circle" | "wide";
  showSpecialties?: boolean;
  showSocials?: boolean;
  light?: boolean;
  className?: string;
}) {
  const href = `/team/${member.slug}`;
  const role = t(member.role as LocalizedString, ctx.lang);
  const bio = t(member.bio as LocalizedString, ctx.lang);
  const socials = asSocials(member.socials);
  const chips = showSpecialties && member.specialties.length ? (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {member.specialties.slice(0, 4).map((s) => (
        <li key={s} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", light ? "bg-white/10 text-t-dark-fg/80" : "bg-t-muted text-t-muted-fg")}>
          {s}
        </li>
      ))}
    </ul>
  ) : null;

  if (variant === "circle") {
    return (
      <div className={cn("text-center", className)}>
        <Link href={href} className="group block">
          <Img src={member.imageUrl ?? ""} alt={member.name} className="mx-auto size-36 rounded-full object-cover ring-4 ring-t-primary/10 transition group-hover:ring-t-primary/40 sm:size-40" />
          <h3 className={cn("font-heading mt-4 text-lg font-bold", light ? "text-t-dark-fg" : "text-t-fg group-hover:text-t-primary")}>{member.name}</h3>
        </Link>
        {role ? <p className="text-sm text-t-primary">{role}</p> : null}
        {showSocials ? <SocialLinks social={socials} size="sm" light={light} className="mt-2 justify-center" /> : null}
      </div>
    );
  }
  if (variant === "wide") {
    return (
      <article className={cn("t-card flex flex-col gap-5 overflow-hidden sm:flex-row", light && "border-white/10 bg-white/5", className)}>
        <Link href={href} className="block sm:w-56 sm:shrink-0">
          <Img src={member.imageUrl ?? ""} alt={member.name} className="aspect-[4/5] h-full w-full object-cover" />
        </Link>
        <div className="flex flex-1 flex-col p-5 sm:ps-0">
          <h3 className={cn("font-heading text-xl font-bold", light ? "text-t-dark-fg" : "text-t-fg")}>
            <Link href={href} className="hover:text-t-primary">
              {member.name}
            </Link>
          </h3>
          {role ? <p className="text-sm font-medium text-t-primary">{role}</p> : null}
          {bio ? <p className={cn("mt-3 line-clamp-3 text-sm", light ? "text-t-dark-fg/75" : "text-t-muted-fg")}>{bio}</p> : null}
          {chips}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm">
            {member.phone ? (
              <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1.5 hover:text-t-primary" dir="ltr">
                <Phone className="size-4" /> {member.phone}
              </a>
            ) : null}
            {member.email ? (
              <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1.5 hover:text-t-primary">
                <Mail className="size-4" /> {member.email}
              </a>
            ) : null}
            {showSocials ? <SocialLinks social={socials} size="sm" light={light} className="ms-auto" /> : null}
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className={cn("t-card group flex h-full flex-col overflow-hidden", light && "border-white/10 bg-white/5", className)}>
      <Link href={href} className="block overflow-hidden">
        <Img src={member.imageUrl ?? ""} alt={member.name} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={cn("font-heading text-lg font-bold", light ? "text-t-dark-fg" : "text-t-fg")}>
          <Link href={href} className="hover:text-t-primary">
            {member.name}
          </Link>
        </h3>
        {role ? <p className="text-sm font-medium text-t-primary">{role}</p> : null}
        {chips}
        {showSocials ? <SocialLinks social={socials} size="sm" light={light} className="mt-auto pt-3" /> : null}
      </div>
    </article>
  );
}

export async function TeamBlock({
  ctx,
  variant = "card",
  columns = 3,
  take = 8,
  heading,
  light,
  className,
  id = "team",
  bare,
  showSpecialties,
}: {
  ctx: SiteContext;
  variant?: "card" | "circle" | "wide";
  columns?: 2 | 3 | 4;
  take?: number;
  heading?: HeadingData;
  light?: boolean;
  className?: string;
  id?: string;
  bare?: boolean;
  showSpecialties?: boolean;
}) {
  const rows = await getTeam(ctx.tenant.id, take);
  if (!rows.length) return null;
  const h = heading ?? ((ctx.sections.team?.data as HeadingData | undefined) ?? {});
  const cols =
    variant === "wide"
      ? "lg:grid-cols-2"
      : columns === 2
        ? "sm:grid-cols-2"
        : columns === 4
          ? "grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-2 lg:grid-cols-3";
  const body = (
    <div className={cn("grid gap-6", cols)}>
      {rows.map((m) => (
        <TeamCard key={m.id} ctx={ctx} member={m} variant={variant} light={light} showSpecialties={showSpecialties} />
      ))}
    </div>
  );
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} lang={ctx.lang} light={light} />
        {body}
      </Container>
    </section>
  );
}
