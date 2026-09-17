"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type TestimonialItem = { id: string; name: string; role: string | null; text: string; rating: number; imageUrl: string | null };

export function TestimonialCard({ item, light, className }: { item: TestimonialItem; light?: boolean; className?: string }) {
  return (
    <figure className={cn("t-card flex h-full flex-col p-6", light && "border-white/10 bg-white/5 text-t-dark-fg", className)}>
      <Quote className={cn("size-7", light ? "text-t-accent" : "text-t-primary/40")} aria-hidden="true" />
      <span className="mt-3 inline-flex text-t-accent" aria-label={`${item.rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("size-4", i < item.rating ? "fill-current" : "opacity-30")} />
        ))}
      </span>
      <blockquote className={cn("mt-3 flex-1 text-base leading-relaxed", light ? "text-t-dark-fg/85" : "text-t-fg")}>{item.text}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="size-11 rounded-full object-cover" loading="lazy" />
        ) : (
          <span className={cn("flex size-11 items-center justify-center rounded-full font-semibold", light ? "bg-white/10" : "bg-t-primary/10 text-t-primary")}>{item.name.charAt(0).toUpperCase()}</span>
        )}
        <span>
          <span className="block font-semibold">{item.name}</span>
          {item.role ? <span className={cn("block text-xs", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{item.role}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

/** Scroll-snap carousel with arrows, dots and auto-advance (paused on hover / reduced motion). */
export function TestimonialsCarousel({ items, light, autoMs = 6000 }: { items: TestimonialItem[]; light?: boolean; autoMs?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const goTo = React.useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const n = items.length;
      const next = ((i % n) + n) % n;
      const child = el.children[next] as HTMLElement | undefined;
      if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
      setIndex(next);
    },
    [items.length],
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      const pos = el.scrollLeft + el.clientWidth / 2;
      const i = kids.findIndex((k) => k.offsetLeft - el.offsetLeft <= pos && k.offsetLeft - el.offsetLeft + k.offsetWidth > pos);
      if (i >= 0) setIndex(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (paused || items.length < 2 || autoMs <= 0) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => goTo(index + 1), autoMs);
    return () => window.clearInterval(id);
  }, [paused, index, items.length, autoMs, goTo]);

  if (!items.length) return null;
  const arrow = cn("t-card flex size-10 items-center justify-center transition hover:bg-t-muted disabled:opacity-40", light && "border-white/20 bg-white/5 text-t-dark-fg hover:bg-white/10");
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label="Testimonials"
      >
        {items.map((it, i) => (
          <div key={it.id} className="w-[88%] shrink-0 snap-center sm:w-[60%] lg:w-[calc((100%-2.5rem)/3)]" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`}>
            <TestimonialCard item={it} light={light} />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button type="button" onClick={() => goTo(index - 1)} className={arrow} aria-label="Previous">
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </button>
          <div className="flex items-center gap-1.5" role="tablist">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-t-primary" : cn("w-2", light ? "bg-white/30" : "bg-t-border"))}
              />
            ))}
          </div>
          <button type="button" onClick={() => goTo(index + 1)} className={arrow} aria-label="Next">
            <ChevronRight className="size-5 rtl:rotate-180" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
