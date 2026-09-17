import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { asLocalizedList } from "@/modules/shared/content-types";
import { getPlans } from "@/modules/gym/queries";

export function periodLabel(period: string, lang: "en" | "ur"): string {
  const map: Record<string, [string, string]> = {
    DAY: ["/ day", "/ دن"],
    MONTH: ["/ month", "/ ماہ"],
    QUARTER: ["/ 3 months", "/ ۳ ماہ"],
    YEAR: ["/ year", "/ سال"],
  };
  const m = map[period] ?? [`/ ${period.toLowerCase()}`, `/ ${period.toLowerCase()}`];
  return lang === "ur" ? m[1] : m[0];
}

export function PlanCard({ ctx, plan, ctaHref = "/join", light, className }: { ctx: SiteContext; plan: MembershipPlan; ctaHref?: string; light?: boolean; className?: string }) {
  const name = t(plan.name as LocalizedString, ctx.lang);
  const features = asLocalizedList(plan.features);
  const popular = plan.isPopular;
  return (
    <article
      className={cn(
        "t-card relative flex h-full flex-col p-6 sm:p-7",
        popular ? "border-2 border-t-primary shadow-xl lg:-translate-y-2" : "",
        light && !popular && "border-white/10 bg-white/5",
        light && popular && "bg-t-card text-t-fg",
        className,
      )}
    >
      {popular ? (
        <span className="absolute -top-3.5 start-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-t-primary-fg rtl:translate-x-1/2">
          <Sparkles className="size-3.5" /> {ctx.lang === "ur" ? "مقبول ترین" : "Most popular"}
        </span>
      ) : null}
      <h3 className={cn("font-heading text-xl font-bold", light && !popular ? "text-t-dark-fg" : "text-t-fg")}>{name}</h3>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="font-heading text-4xl font-extrabold tracking-tight text-t-primary">{formatPKR(plan.price)}</span>
        <span className={cn("text-sm", light && !popular ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{periodLabel(plan.period, ctx.lang)}</span>
      </p>
      {features.length ? (
        <ul className="mt-6 flex-1 space-y-2.5 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
                <Check className="size-3.5" />
              </span>
              {t(f, ctx.lang)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}
      <Link href={`${ctaHref}?plan=${encodeURIComponent(plan.id)}`} className={cn("t-btn mt-7 w-full", popular ? "t-btn-primary" : light ? "t-btn-outline text-t-dark-fg" : "t-btn-outline text-t-primary")}>
        {ctx.lang === "ur" ? "ابھی شامل ہوں" : "Join now"}
      </Link>
    </article>
  );
}

/** Membership plans pricing grid. Fetches active plans; highlights `isPopular`. */
export async function PlansGrid({
  ctx,
  heading,
  ctaHref = "/join",
  light,
  className,
  id = "plans",
  bare,
  columns,
}: {
  ctx: SiteContext;
  heading?: { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };
  ctaHref?: string;
  light?: boolean;
  className?: string;
  id?: string;
  bare?: boolean;
  columns?: 2 | 3 | 4;
}) {
  const plans = await getPlans(ctx.tenant.id);
  if (!plans.length) return null;
  const h = heading ?? ((ctx.sections.plans?.data as { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString } | undefined) ?? { eyebrow: "Pricing", title: { en: "Membership plans", ur: "ممبرشپ پلانز" } });
  const n = columns ?? (plans.length >= 4 ? 4 : plans.length === 2 ? 2 : 3);
  const cols = n === 2 ? "sm:grid-cols-2 lg:max-w-4xl lg:mx-auto" : n === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const body = (
    <div className={cn("grid items-stretch gap-6 pt-4", cols)}>
      {plans.map((p) => (
        <PlanCard key={p.id} ctx={ctx} plan={p} ctaHref={ctaHref} light={light} />
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
