"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { RichText } from "@/templates/ui";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "../schema";
import { ts } from "../strings";

/** Accessible day-by-day accordion. First day open by default. */
export function ItineraryAccordion({ items, lang, className }: { items: ItineraryItem[]; lang: Lang; className?: string }) {
  const [open, setOpen] = React.useState<number>(0);
  if (items.length === 0) return null;
  return (
    <ol className={cn("divide-y divide-t-border overflow-hidden rounded-[var(--t-radius)] border border-t-border", className)}>
      {items.map((it, i) => {
        const isOpen = open === i;
        const panelId = `itin-${i}`;
        const title = t(it.title, lang);
        const body = t(it.description, lang);
        return (
          <li key={i} className="bg-t-card">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left rtl:text-right"
              >
                <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-[var(--t-radius)] bg-t-primary text-t-primary-fg">
                  <span className="text-[9px] uppercase leading-none">{t(ts.day, lang)}</span>
                  <span className="text-sm font-bold leading-tight">{it.day}</span>
                </span>
                <span className="flex-1 font-heading font-semibold">{title || `${t(ts.day, lang)} ${it.day}`}</span>
                <ChevronDown className={cn("size-4 shrink-0 text-t-muted-fg transition", isOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} hidden={!isOpen} className="px-4 pb-4 pl-16 rtl:pl-4 rtl:pr-16">
              {body ? <RichText value={it.description} lang={lang} className="text-sm text-t-muted-fg" /> : <p className="text-sm text-t-muted-fg">—</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
