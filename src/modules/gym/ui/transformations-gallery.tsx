import type { SiteContext } from "@/templates/types";
import type { LocalizedString } from "@/lib/i18n";
import { GalleryBlock } from "@/modules/shared/ui/gallery-block";

/** Before/after gallery from the "transformations" album. */
export function TransformationsGallery({
  ctx,
  variant = "grid",
  columns = 4,
  take = 12,
  light,
  className,
  bare,
  heading,
}: {
  ctx: SiteContext;
  variant?: "grid" | "masonry" | "strip";
  columns?: 2 | 3 | 4;
  take?: number;
  light?: boolean;
  className?: string;
  bare?: boolean;
  heading?: { eyebrow?: LocalizedString | string; title?: LocalizedString };
}) {
  return (
    <GalleryBlock
      ctx={ctx}
      album="transformations"
      variant={variant}
      columns={columns}
      take={take}
      light={light}
      className={className}
      bare={bare}
      id="transformations"
      heading={heading ?? { eyebrow: ctx.lang === "ur" ? "نتائج" : "Results", title: { en: "Real member transformations", ur: "ہمارے ممبرز کی تبدیلیاں" } }}
    />
  );
}
