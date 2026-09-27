"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { ls, t, ui, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; src: string; caption: string };

const gs = {
  openImage: ls("Open image", "تصویر کھولیں"),
  viewer: ls("Image viewer", "تصویر دیکھیں"),
  close: ls("Close", "بند کریں"),
  previous: ls("Previous image", "پچھلی تصویر"),
  next: ls("Next image", "اگلی تصویر"),
  ofN: ls("of", "از"),
  photos: ls("Photos", "تصاویر"),
} as const;

/**
 * Image grid with a dependency-free lightbox (keyboard: Esc / arrows).
 * a11y: every tile is a labelled button, the lightbox is a modal dialog that takes focus on open and gives it
 * back on close, the "n of N" counter is `aria-live="polite"`, and the `strip` variant is announced as a carousel.
 */
export function GalleryGrid({
  items,
  variant = "grid",
  columns = 3,
  lang = "en",
  className,
  rounded = true,
}: {
  items: GalleryImage[];
  variant?: "grid" | "masonry" | "strip";
  columns?: 2 | 3 | 4;
  lang?: Lang;
  className?: string;
  rounded?: boolean;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);
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
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      openerRef.current?.focus();
    };
  }, [active, close, step]);

  if (!items.length) return null;
  const r = rounded ? "rounded-[var(--t-radius)]" : "";
  const colCls = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";
  const tile = (img: GalleryImage, i: number, extra?: string) => (
    <button
      key={img.id}
      type="button"
      onClick={(e) => {
        openerRef.current = e.currentTarget;
        setActive(i);
      }}
      className={cn("group relative block w-full overflow-hidden bg-t-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-t-primary", r, extra)}
      aria-label={img.caption || `${t(gs.openImage, lang)} ${i + 1}`}
      aria-haspopup="dialog"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.src} alt="" loading="lazy" className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-105", variant === "masonry" ? "h-auto" : "")} />
      <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
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
        <div className={cn("flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]", className)} role="region" aria-roledescription="carousel" aria-label={t(ui.gallery, lang)}>
          {items.map((img, i) => (
            <div key={img.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} ${t(gs.ofN, lang)} ${items.length}`} className="shrink-0 snap-start">
              {tile(img, i, "aspect-[4/3] w-64 sm:w-80")}
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-3", colCls, className)}>{items.map((img, i) => tile(img, i, "aspect-square"))}</div>
      )}

      {active != null ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={t(gs.viewer, lang)} onClick={close}>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm opacity-80" aria-live="polite" aria-atomic="true">
              {active + 1} {t(gs.ofN, lang)} {items.length}
              {items[active].caption ? <span className="sr-only">: {items[active].caption}</span> : null}
            </span>
            <button ref={closeRef} type="button" onClick={close} className="flex size-11 items-center justify-center rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={t(gs.close, lang)}>
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => step(-1)}
                className="absolute left-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
                aria-label={t(gs.previous, lang)}
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
            ) : null}
            <figure className="flex max-h-full max-w-5xl flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={items[active].src} alt={items[active].caption} className="max-h-[75vh] w-auto max-w-full object-contain" />
              {items[active].caption ? <figcaption className="mt-3 text-center text-sm opacity-90">{items[active].caption}</figcaption> : null}
            </figure>
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => step(1)}
                className="absolute right-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
                aria-label={t(gs.next, lang)}
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
