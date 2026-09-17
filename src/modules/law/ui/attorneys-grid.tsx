import type { SiteContext } from "@/templates/types";
import type { LocalizedString } from "@/lib/i18n";
import { TeamBlock } from "@/modules/shared/ui/team-block";

/** Attorneys = TeamMember rows; specialties shown as chips. */
export function AttorneysGrid({
  ctx,
  variant = "card",
  columns = 3,
  take = 8,
  light,
  className,
  bare,
  heading,
}: {
  ctx: SiteContext;
  variant?: "card" | "circle" | "wide";
  columns?: 2 | 3 | 4;
  take?: number;
  light?: boolean;
  className?: string;
  bare?: boolean;
  heading?: { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };
}) {
  return (
    <TeamBlock
      ctx={ctx}
      id="attorneys"
      variant={variant}
      columns={columns}
      take={take}
      light={light}
      className={className}
      bare={bare}
      showSpecialties
      heading={heading ?? { eyebrow: ctx.lang === "ur" ? "ٹیم" : "Our team", title: { en: "Our attorneys", ur: "ہمارے وکلاء" } }}
    />
  );
}
