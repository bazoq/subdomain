import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getClasses } from "@/modules/gym/queries";
import { ClassTimetableClient, type TimetableClass } from "@/modules/gym/ui/class-timetable-client";

function todayKarachi() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })).getDay();
}

/** Weekly class timetable with a tab per day (today selected by default, Asia/Karachi). */
export async function ClassTimetable({
  ctx,
  heading,
  light,
  className,
  id = "classes",
  bare,
}: {
  ctx: SiteContext;
  heading?: { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };
  light?: boolean;
  className?: string;
  id?: string;
  bare?: boolean;
}) {
  const rows = await getClasses(ctx.tenant.id);
  if (!rows.length) return null;
  const h = heading ?? ((ctx.sections.classes?.data as { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString } | undefined) ?? { eyebrow: "Timetable", title: { en: "Weekly class schedule", ur: "ہفتہ وار کلاس شیڈول" } });
  const classes: TimetableClass[] = rows.map((r) => ({
    id: r.id,
    name: t(r.name as LocalizedString, ctx.lang),
    day: r.dayOfWeek,
    start: r.startTime,
    end: r.endTime,
    level: r.level,
    capacity: r.capacity,
    trainer: r.trainer ? { name: r.trainer.name, slug: r.trainer.slug, imageUrl: r.trainer.imageUrl } : null,
  }));
  const body = <ClassTimetableClient classes={classes} lang={ctx.lang} today={todayKarachi()} light={light} />;
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
