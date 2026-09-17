import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFaqs } from "@/modules/shared/queries";
import { FaqAccordion, type FaqEntry } from "@/modules/shared/ui/faq-accordion";

type HeadingData = { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };

export async function FaqBlock({
  ctx,
  variant = "accordion",
  light,
  heading,
  className,
  id = "faq",
  bare,
  take,
}: {
  ctx: SiteContext;
  variant?: "accordion" | "two-column";
  light?: boolean;
  heading?: HeadingData;
  className?: string;
  id?: string;
  bare?: boolean;
  take?: number;
}) {
  const rows = await getFaqs(ctx.tenant.id);
  const list = take ? rows.slice(0, take) : rows;
  if (!list.length) return null;
  const h = heading ?? ((ctx.sections.faq?.data as HeadingData | undefined) ?? {});
  const items: FaqEntry[] = list.map((r) => ({ id: r.id, q: t(r.question as LocalizedString, ctx.lang), a: t(r.answer as LocalizedString, ctx.lang) }));

  const body =
    variant === "two-column" ? (
      <div className="grid gap-x-10 lg:grid-cols-2">
        <FaqAccordion items={items.filter((_, i) => i % 2 === 0)} light={light} />
        <FaqAccordion items={items.filter((_, i) => i % 2 === 1)} light={light} defaultOpen={null} />
      </div>
    ) : (
      <FaqAccordion items={items} light={light} className="mx-auto max-w-3xl" />
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
