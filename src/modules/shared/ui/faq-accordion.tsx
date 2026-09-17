"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqEntry = { id: string; q: string; a: string };

export function FaqAccordion({ items, light, className, defaultOpen = 0 }: { items: FaqEntry[]; light?: boolean; className?: string; defaultOpen?: number | null }) {
  const [open, setOpen] = React.useState<string | null>(defaultOpen != null ? (items[defaultOpen]?.id ?? null) : null);
  const base = React.useId();
  return (
    <div className={cn("divide-y", light ? "divide-white/10" : "divide-t-border", className)}>
      {items.map((it) => {
        const isOpen = open === it.id;
        const pid = `${base}-${it.id}`;
        return (
          <div key={it.id}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={pid}
                onClick={() => setOpen(isOpen ? null : it.id)}
                className={cn("flex w-full items-center justify-between gap-4 py-4 text-start font-semibold transition", light ? "text-t-dark-fg" : "text-t-fg hover:text-t-primary")}
              >
                <span>{it.q}</span>
                <Plus className={cn("size-5 shrink-0 transition-transform", isOpen && "rotate-45", light ? "text-t-accent" : "text-t-primary")} aria-hidden="true" />
              </button>
            </h3>
            <div id={pid} role="region" hidden={!isOpen} className={cn("pb-5 pe-8 text-sm leading-relaxed sm:text-base", light ? "text-t-dark-fg/75" : "text-t-muted-fg")}>
              {it.a.split(/\n+/).map((p, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
