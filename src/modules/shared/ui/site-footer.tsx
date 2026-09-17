import Link from "next/link";
import type { SiteContext } from "@/templates/types";
import { footerSection } from "@/templates/shared/sections";
import { Container, SmartLink } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";
import { ContactInfo } from "@/modules/shared/ui/contact-info";
import { HoursTable } from "@/modules/shared/ui/hours-table";
import { SocialLinks } from "@/modules/shared/ui/social-links";
import { sectionData } from "@/modules/shared/ui/section-blocks";
import type { FooterData } from "@/modules/shared/ui/section-types";

/** Generic default footer: about + link columns (footer section) + contact + hours + powered-by. */
export function SiteFooter({
  ctx,
  variant = "dark",
  showHours = true,
  showNav = true,
  className,
}: {
  ctx: SiteContext;
  variant?: "dark" | "light" | "primary";
  showHours?: boolean;
  /** add main navigation as a column when the footer section defines no columns */
  showNav?: boolean;
  className?: string;
}) {
  const d = sectionData<FooterData>(ctx, footerSection) ?? (footerSection.defaults as unknown as FooterData);
  const light = variant !== "light";
  const about = t(d.about, ctx.lang);
  const columns = d.columns?.length ? d.columns : showNav ? [{ title: { en: "Quick links", ur: "فوری لنکس" }, links: ctx.nav.map((n) => ({ label: n.label, href: n.href })) }] : [];
  const year = new Date().getFullYear();
  const muted = light ? "text-t-dark-fg/65" : "text-t-muted-fg";
  const heading = cn("font-heading mb-4 text-sm font-bold uppercase tracking-[0.15em]", light ? "text-t-dark-fg" : "text-t-fg");

  return (
    <footer
      className={cn(
        variant === "dark" && "bg-t-dark text-t-dark-fg",
        variant === "primary" && "bg-t-secondary text-t-secondary-fg",
        variant === "light" && "border-t border-t-border bg-t-muted text-t-fg",
        className,
      )}
    >
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2">
            {ctx.settings.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className={cn("h-10 w-auto max-w-[180px] object-contain", light && "brightness-0 invert")} />
            ) : (
              <span className="font-heading text-2xl font-extrabold">{ctx.tenant.name}</span>
            )}
          </Link>
          {about ? <p className={cn("mt-4 max-w-xs text-sm leading-relaxed", muted)}>{about}</p> : null}
          <SocialLinks social={ctx.settings.social} light={light} className="mt-5" variant="outline" />
        </div>

        {columns.slice(0, 2).map((col, i) => (
          <nav key={i} aria-label={t(col.title, ctx.lang)}>
            <h3 className={heading}>{t(col.title, ctx.lang)}</h3>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l, j) => (
                <li key={j}>
                  <SmartLink href={l.href} ctx={ctx} className={cn("transition hover:underline", muted, light ? "hover:text-t-dark-fg" : "hover:text-t-fg")}>
                    {t(l.label, ctx.lang)}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className={cn(columns.length < 2 && "lg:col-start-4")}>
          <h3 className={heading}>{t(ui.contact, ctx.lang)}</h3>
          <ContactInfo ctx={ctx} light={light} iconStyle="plain" className="space-y-3 text-sm [&_span.block:first-child]:hidden" />
          {showHours && ctx.settings.hours.length ? (
            <div className="mt-6">
              <h3 className={heading}>{ctx.lang === "ur" ? "اوقات کار" : "Opening hours"}</h3>
              <HoursTable ctx={ctx} light={light} compact showStatus={false} />
            </div>
          ) : null}
        </div>
      </Container>
      <div className={cn("border-t", light ? "border-white/10" : "border-t-border")}>
        <Container className={cn("flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row", muted)}>
          <p>
            © {year} {ctx.tenant.name}. {t(ui.allRightsReserved, ctx.lang)}
            {d.bottomNote ? ` ${d.bottomNote}` : ""}
          </p>
          <p>
            {t(ui.poweredBy, ctx.lang)}{" "}
            <a href={`https://${brand.name.toLowerCase().replace(/\s+/g, "")}.pk`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
              {brand.name}
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
