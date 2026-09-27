import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getTestimonials } from "@/modules/shared/queries";
import { TestimonialCard, TestimonialsCarousel, type TestimonialItem } from "@/modules/shared/ui/testimonials-carousel";

type HeadingData = { eyebrow?: LocalizedString | string; title?: LocalizedString; subtitle?: LocalizedString };

/**
 * Testimonials section. Fetches active reviews; heading comes from the `testimonials`
 * section data (or the `heading` prop). Renders nothing when there are no reviews.
 */
export async function TestimonialsBlock({
  ctx,
  variant = "grid",
  light,
  take = 12,
  heading,
  columns = 3,
  className,
  id = "testimonials",
  bare,
}: {
  ctx: SiteContext;
  variant?: "grid" | "carousel" | "masonry" | "single";
  light?: boolean;
  take?: number;
  heading?: HeadingData;
  columns?: 2 | 3 | 4;
  className?: string;
  id?: string;
  /** render only the list (no section wrapper / heading) */
  bare?: boolean;
}) {
  const rows = await getTestimonials(ctx.tenant.id, take);
  if (!rows.length) return null;
  const h = heading ?? ((ctx.sections.testimonials?.data as HeadingData | undefined) ?? {});
  const items: TestimonialItem[] = rows.map((r) => ({ id: r.id, name: r.name, role: r.role, text: t(r.text as LocalizedString, ctx.lang), rating: r.rating, imageUrl: r.imageUrl }));
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";

  let body: React.ReactNode;
  if (variant === "carousel") body = <TestimonialsCarousel items={items} light={light} lang={ctx.lang} />;
  else if (variant === "single") {
    const it = items[0];
    body = (
      <figure className="mx-auto max-w-3xl text-center">
        <p className={cn("font-heading text-2xl leading-snug sm:text-3xl", light ? "text-t-dark-fg" : "text-t-fg")}>“{it.text}”</p>
        <figcaption className="mt-6 flex items-center justify-center gap-3">
          {it.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={it.imageUrl} alt="" className="size-12 rounded-full object-cover" loading="lazy" />
          ) : null}
          <span className="text-start">
            <span className="block font-semibold">{it.name}</span>
            {it.role ? <span className={cn("block text-sm", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{it.role}</span> : null}
          </span>
        </figcaption>
      </figure>
    );
  } else if (variant === "masonry") {
    body = (
      <div className={cn("columns-1 gap-5 space-y-5", columns === 2 ? "sm:columns-2" : columns === 4 ? "sm:columns-2 lg:columns-4" : "sm:columns-2 lg:columns-3")}>
        {items.map((it) => (
          <div key={it.id} className="break-inside-avoid">
            <TestimonialCard item={it} light={light} />
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className={cn("grid gap-5", cols)}>
        {items.map((it) => (
          <TestimonialCard key={it.id} item={it} light={light} />
        ))}
      </div>
    );
  }

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
