"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { TemplateCard, type TemplateCardData } from "@/components/super-site/template-card";
import { cn } from "@/lib/utils";

export interface GalleryCategory {
  key: string;
  name: string;
  count: number;
}

/**
 * Filterable template gallery: text search (name, code, tagline, style), industry chips and style chips.
 * Filtering is instant on the client; the URL is kept in sync (replaceState) so a filtered view can be
 * shared or bookmarked, and the server renders the same view on first load from the same params.
 */
export function TemplateGallery({
  templates,
  categories,
  styles,
  initial,
}: {
  templates: TemplateCardData[];
  categories: GalleryCategory[];
  styles: string[];
  initial: { category?: string; style?: string; q?: string };
}) {
  const [category, setCategory] = React.useState(initial.category ?? "all");
  const [style, setStyle] = React.useState(initial.style ?? "");
  const [q, setQ] = React.useState(initial.q ?? "");
  const searchId = React.useId();
  const chipsRef = React.useRef<HTMLDivElement>(null);

  // On small screens the chip row scrolls; bring the pre-selected industry into view on first load.
  React.useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>("[aria-pressed=true]");
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (style) params.set("style", style);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [category, style, q]);

  const nameOf = React.useMemo(() => new Map(categories.map((c) => [c.key, c.name])), [categories]);
  const needle = q.trim().toLowerCase().replace(/^#/, "");
  const filtered = templates.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (style && !t.style.includes(style)) return false;
    if (!needle) return true;
    return [t.name, String(t.code), t.tagline, nameOf.get(t.category) ?? "", ...t.style].join(" ").toLowerCase().includes(needle);
  });
  const grouped = category === "all" && !style && !needle;
  const clear = () => {
    setCategory("all");
    setStyle("");
    setQ("");
  };

  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
      active ? "border-gold-400/60 bg-gold-400/15 text-gold-200" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-100",
    );

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-y border-white/[0.06] bg-ink-950/85 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-80">
            <label htmlFor={searchId} className="sr-only">
              Search templates
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, number or style…"
              className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
          <div ref={chipsRef} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-1" role="group" aria-label="Filter by industry">
            <button type="button" className={chip(category === "all")} aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              All <span className="opacity-60">{templates.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.key} type="button" className={chip(category === c.key)} aria-pressed={category === c.key} onClick={() => setCategory(category === c.key ? "all" : c.key)}>
                {c.name} <span className="opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Filter by style">
          <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-zinc-600">Style</span>
          {styles.map((s) => (
            <button key={s} type="button" className={cn(chip(style === s), "px-3 py-1 text-xs capitalize")} aria-pressed={style === s} onClick={() => setStyle(style === s ? "" : s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 flex items-center gap-3 text-sm text-zinc-500" role="status" aria-live="polite">
        {filtered.length} template{filtered.length === 1 ? "" : "s"}
        {!grouped ? (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-zinc-300 hover:border-white/25">
            <X className="size-3" aria-hidden /> Clear filters
          </button>
        ) : null}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-white/10 p-14 text-center">
          <p className="font-display text-3xl text-white">No templates match</p>
          <p className="mt-2 text-sm text-zinc-500">Try another word, or clear the filters.</p>
          <button type="button" onClick={clear} className="mt-6 rounded-full bg-white/[0.06] px-5 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/[0.12]">
            Show all templates
          </button>
        </div>
      ) : grouped ? (
        categories.map((c) => {
          const list = filtered.filter((t) => t.category === c.key);
          if (!list.length) return null;
          return (
            <section key={c.key} id={c.key} className="mt-16 scroll-mt-44" aria-labelledby={`cat-${c.key}`}>
              <div className="flex items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
                <h2 id={`cat-${c.key}`} className="font-display text-3xl text-white sm:text-4xl">
                  {c.name}
                </h2>
                <Link href={`/templates/${c.key}`} className="shrink-0 text-sm font-semibold text-gold-300 hover:text-gold-200">
                  View all {c.count}
                  <span className="sr-only"> {c.name} templates</span> →
                </Link>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((t) => (
                  <TemplateCard key={t.id} meta={t} categoryName={c.name} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <TemplateCard key={t.id} meta={t} categoryName={nameOf.get(t.category)} />
          ))}
        </div>
      )}
    </div>
  );
}
