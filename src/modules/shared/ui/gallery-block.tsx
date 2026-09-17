import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getGallery } from "@/modules/shared/queries";
import { GalleryGrid, type GalleryImage } from "@/modules/shared/ui/gallery-grid";

type HeadingData = { eyebrow?: string; title?: LocalizedString; album?: string };

export async function GalleryBlock({
  ctx,
  album,
  variant = "grid",
  columns = 3,
  take = 12,
  heading,
  light,
  className,
  id = "gallery",
  bare,
}: {
  ctx: SiteContext;
  /** defaults to the album configured in the gallery section, then "general"; "all" = every album */
  album?: string;
  variant?: "grid" | "masonry" | "strip";
  columns?: 2 | 3 | 4;
  take?: number;
  heading?: HeadingData;
  light?: boolean;
  className?: string;
  id?: string;
  bare?: boolean;
}) {
  const sec = (ctx.sections.gallery?.data as HeadingData | undefined) ?? {};
  const rows = await getGallery(ctx.tenant.id, album ?? sec.album ?? "general", take);
  if (!rows.length) return null;
  const h = heading ?? sec;
  const items: GalleryImage[] = rows.map((r) => ({ id: r.id, src: r.imageUrl, caption: t(r.caption as LocalizedString, ctx.lang) }));
  const body = <GalleryGrid items={items} variant={variant} columns={columns} />;
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={h.eyebrow} title={h.title} lang={ctx.lang} light={light} />
        {body}
      </Container>
    </section>
  );
}
