"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; src: string; caption: string };

/** Image grid with a dependency-free lightbox (keyboard: Esc / arrows). */
export function GalleryGrid({
  items,
  variant = "grid",
  columns = 3,
  className,
  rounded = true,
}: {
  items: GalleryImage[];
  variant?: "grid" | "masonry" | "strip";
  columns?: 2 | 3 | 4;
  className?: string;
  rounded?: boolean;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const close = React.useCallback(() => setActive(null), []);
  const step = React.useCallback(
    (d: -1 | 1) => setActive((i) => (i == null ? i : (i + d + items.length) % items.length)),
    [items.length],
  );

  React.useEffect(() => {
    if (active == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, close, step]);

  if (!items.length) return null;
  const r = rounded ? "rounded-[var(--t-radius)]" : "";
  const colCls = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";
  const tile = (img: GalleryImage, i: number, extra?: string) => (
    <button
      key={img.id}
      type="button"
      onClick={() => setActive(i)}
      className={cn("group relative block w-full overflow-hidden bg-t-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-t-primary", r, extra)}
      aria-label={img.caption || `Open image ${i + 1}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.src} alt={img.caption} loading="lazy" className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-105", variant === "masonry" ? "h-auto" : "")} />
      <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
        <span className="flex w-full items-center justify-between text-xs font-medium text-white">
          <span className="line-clamp-1">{img.caption}</span>
          <ZoomIn className="size-4 shrink-0" />
        </span>
      </span>
    </button>
  );

  return (
    <>
      {variant === "masonry" ? (
        <div className={cn("gap-3 space-y-3", columns === 2 ? "columns-2" : columns === 4 ? "columns-2 md:columns-4" : "columns-2 md:columns-3", className)}>
          {items.map((img, i) => (
            <div key={img.id} className="break-inside-avoid">
              {tile(img, i)}
            </div>
          ))}
        </div>
      ) : variant === "strip" ? (
        <div className={cn("flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]", className)}>
          {items.map((img, i) => tile(img, i, "aspect-[4/3] w-64 shrink-0 snap-start sm:w-80"))}
        </div>
      ) : (
        <div className={cn("grid gap-3", colCls, className)}>{items.map((img, i) => tile(img, i, "aspect-square"))}</div>
      )}

      {active != null ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={close}>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm opacity-80">
              {active + 1} / {items.length}
            </span>
            <button type="button" onClick={close} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
              <X className="size-6" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {items.length > 1 ? (
              <button type="button" onClick={() => step(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:left-6" aria-label="Previous">
                <ChevronLeft className="size-6" />
              </button>
            ) : null}
            <figure className="flex max-h-full max-w-5xl flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={items[active].src} alt={items[active].caption} className="max-h-[75vh] w-auto max-w-full object-contain" />
              {items[active].caption ? <figcaption className="mt-3 text-center text-sm opacity-90">{items[active].caption}</figcaption> : null}
            </figure>
            {items.length > 1 ? (
              <button type="button" onClick={() => step(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:right-6" aria-label="Next">
                <ChevronRight className="size-6" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
