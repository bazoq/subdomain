"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { ls, t, ui, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type TestimonialItem = { id: string; name: string; role: string | null; text: string; rating: number; imageUrl: string | null };

const cs = {
  previous: ls("Previous testimonial", "پچھلا تاثر"),
  next: ls("Next testimonial", "اگلا تاثر"),
  goTo: ls("Go to testimonial", "تاثر پر جائیں"),
  ofN: ls("of", "از"),
  rating: ls("out of 5", "5 میں سے"),
} as const;

/** True when the visitor's OS asks for reduced motion (false during SSR / first paint). */
export function usePrefersReducedMotion(): boolean {
  const subscribe = React.useCallback((cb: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);
  return React.useSyncExternalStore(
    subscribe,
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    () => false,
  );
}

export function TestimonialCard({ item, light, lang = "en", className }: { item: TestimonialItem; light?: boolean; lang?: Lang; className?: string }) {
  return (
    <figure className={cn("t-card flex h-full flex-col p-6", light && "border-white/10 bg-white/5 text-t-dark-fg", className)}>
      <Quote className={cn("size-7", light ? "text-t-accent" : "text-t-primary/40")} aria-hidden="true" />
      <span className="mt-3 inline-flex text-t-accent" role="img" aria-label={`${item.rating} ${t(cs.rating, lang)}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("size-4", i < item.rating ? "fill-current" : "opacity-30")} aria-hidden="true" />
        ))}
      </span>
      <blockquote className={cn("mt-3 flex-1 text-base leading-relaxed", light ? "text-t-dark-fg/85" : "text-t-fg")}>{item.text}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="size-11 rounded-full object-cover" loading="lazy" />
        ) : (
          <span className={cn("flex size-11 items-center justify-center rounded-full font-semibold", light ? "bg-white/10" : "bg-t-primary/10 text-t-primary")} aria-hidden="true">
            {item.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span>
          <span className="block font-semibold">{item.name}</span>
          {item.role ? <span className={cn("block text-xs", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{item.role}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Scroll-snap carousel with arrows, dots and auto-advance.
 * a11y: `aria-roledescription="carousel"`, slides labelled "n of N", the track is `aria-live="polite"` while
 * rotation is paused (hover / focus / reduced motion / single slide) and `off` while auto-advancing, so
 * screen readers are not interrupted every few seconds. `prefers-reduced-motion` disables auto-advance and
 * smooth scrolling.
 */
export function TestimonialsCarousel({ items, light, lang = "en", autoMs = 6000 }: { items: TestimonialItem[]; light?: boolean; lang?: Lang; autoMs?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const autoplay = !paused && !reducedMotion && items.length > 1 && autoMs > 0;

  const goTo = React.useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const n = items.length;
      const next = ((i % n) + n) % n;
      const child = el.children[next] as HTMLElement | undefined;
      if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: reducedMotion ? "auto" : "smooth" });
      setIndex(next);
    },
    [items.length, reducedMotion],
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
    if (!autoplay) return;
    const id = window.setInterval(() => goTo(index + 1), autoMs);
    return () => window.clearInterval(id);
  }, [autoplay, index, autoMs, goTo]);

  // Also pause while the tab is hidden so the visitor does not come back to a jumped carousel.
  React.useEffect(() => {
    const onVis = () => setPaused((p) => (document.visibilityState === "hidden" ? true : p));
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!items.length) return null;
  const arrow = cn("t-card flex size-10 items-center justify-center transition hover:bg-t-muted disabled:opacity-40", light && "border-white/20 bg-white/5 text-t-dark-fg hover:bg-white/10");
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div
        ref={ref}
        className={cn("flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", !reducedMotion && "scroll-smooth")}
        role="region"
        aria-roledescription="carousel"
        aria-label={t(ui.testimonials, lang)}
        aria-live={autoplay ? "off" : "polite"}
      >
        {items.map((it, i) => (
          <div
            key={it.id}
            className="w-[88%] shrink-0 snap-center sm:w-[60%] lg:w-[calc((100%-2.5rem)/3)]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} ${t(cs.ofN, lang)} ${items.length}`}
          >
            <TestimonialCard item={it} light={light} lang={lang} />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button type="button" onClick={() => goTo(index - 1)} className={arrow} aria-label={t(cs.previous, lang)}>
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label={t(ui.testimonials, lang)}>
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${t(cs.goTo, lang)} ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn("flex h-6 items-center", "before:block before:h-2 before:rounded-full before:transition-all", i === index ? "before:w-6 before:bg-t-primary" : cn("before:w-2", light ? "before:bg-white/30" : "before:bg-t-border"))}
              />
            ))}
          </div>
          <button type="button" onClick={() => goTo(index + 1)} className={arrow} aria-label={t(cs.next, lang)}>
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
