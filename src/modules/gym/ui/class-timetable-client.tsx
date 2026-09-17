"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimetableClass = {
  id: string;
  name: string;
  day: number;
  start: string;
  end: string;
  level: string | null;
  capacity: number | null;
  trainer: { name: string; slug: string; imageUrl: string | null } | null;
};

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

function to12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m ?? 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function ClassTimetableClient({ classes, lang, today, light, className }: { classes: TimetableClass[]; lang: "en" | "ur"; today: number; light?: boolean; className?: string }) {
  const days = lang === "ur" ? DAYS_UR : DAYS_EN;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const [day, setDay] = React.useState(today);
  const list = classes.filter((c) => c.day === day).sort((a, b) => a.start.localeCompare(b.start));
  const base = React.useId();
  return (
    <div className={className}>
      <div role="tablist" aria-label="Weekday" className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {order.map((d) => {
          const count = classes.filter((c) => c.day === d).length;
          const active = d === day;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              id={`${base}-tab-${d}`}
              aria-selected={active}
              aria-controls={`${base}-panel`}
              onClick={() => setDay(d)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-[var(--t-radius)] border px-4 py-2 text-sm font-semibold transition",
                active ? "border-t-primary bg-t-primary text-t-primary-fg" : light ? "border-white/15 text-t-dark-fg/80 hover:bg-white/10" : "border-t-border hover:bg-t-muted",
              )}
            >
              <span>{days[d]}</span>
              <span className={cn("text-[11px] font-normal", active ? "opacity-80" : light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>
                {d === today ? (lang === "ur" ? "آج" : "Today") : count ? `${count} ${lang === "ur" ? "کلاسز" : count === 1 ? "class" : "classes"}` : "—"}
              </span>
            </button>
          );
        })}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${day}`} className="mt-4">
        {list.length === 0 ? (
          <p className={cn("t-card px-5 py-10 text-center text-sm", light ? "border-white/10 bg-white/5 text-t-dark-fg/70" : "text-t-muted-fg")}>{lang === "ur" ? "اس دن کوئی کلاس نہیں ہے۔" : "No classes scheduled for this day."}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((c) => (
              <li key={c.id} className={cn("t-card flex items-center gap-4 p-4", light && "border-white/10 bg-white/5 text-t-dark-fg")}>
                <div className={cn("flex w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-[var(--t-radius)] py-2 text-center", light ? "bg-white/10" : "bg-t-primary/10 text-t-primary")} dir="ltr">
                  <span className="text-sm font-bold leading-tight">{to12h(c.start)}</span>
                  <span className="text-[10px] uppercase opacity-70">to</span>
                  <span className="text-xs font-semibold leading-tight">{to12h(c.end)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading truncate text-base font-bold">{c.name}</h3>
                  <p className={cn("mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", light ? "text-t-dark-fg/65" : "text-t-muted-fg")}>
                    {c.trainer ? (
                      <Link href={`/team/${c.trainer.slug}`} className="inline-flex items-center gap-1.5 hover:text-t-primary hover:underline">
                        {c.trainer.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.trainer.imageUrl} alt="" className="size-5 rounded-full object-cover" />
                        ) : null}
                        {c.trainer.name}
                      </Link>
                    ) : null}
                    {c.level ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {c.level}
                      </span>
                    ) : null}
                    {c.capacity ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" /> {c.capacity} {lang === "ur" ? "جگہیں" : "spots"}
                      </span>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
