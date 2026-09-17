"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hero image + thumbnails, with a full-screen lightbox. Handles 0..n images. */
export function PropertyGallery({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const [i, setI] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const n = images.length;
  const go = React.useCallback((d: number) => setI((x) => (n ? (x + d + n) % n : 0)), [n]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go]);

  if (n === 0) {
    return (
      <div className={cn("flex aspect-[16/10] items-center justify-center rounded-[var(--t-radius)] bg-t-muted text-t-muted-fg", className)}>
        <ImageIcon className="size-10 opacity-40" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <button type="button" onClick={() => setOpen(true)} className="group relative aspect-[16/10] overflow-hidden rounded-[var(--t-radius)] bg-t-muted" aria-label="Open photo gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[i]} alt={`${alt} — ${i + 1} / ${n}`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
            {i + 1} / {n}
          </span>
        </button>
        {n > 1 ? (
          <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:grid-rows-2">
            {images.slice(0, 4).map((src, k) => (
              <button
                key={src + k}
                type="button"
                onClick={() => {
                  setI(k);
                  if (k === 3 && n > 4) setOpen(true);
                }}
                aria-label={`Show image ${k + 1}`}
                aria-pressed={k === i}
                className={cn("relative aspect-[4/3] overflow-hidden rounded-[var(--t-radius)] border-2 md:aspect-auto", k === i ? "border-t-primary" : "border-transparent")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {k === 3 && n > 4 ? <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">+{n - 4}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={`${alt} photos`}>
          <div className="flex items-center justify-between p-3">
            <span className="text-sm">
              {i + 1} / {n}
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
              <X className="size-6" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[i]} alt={`${alt} — ${i + 1} / ${n}`} className="max-h-full max-w-full object-contain" />
            {n > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20">
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
            {images.map((src, k) => (
              <button key={src + k} type="button" onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} className={cn("h-14 w-20 shrink-0 overflow-hidden rounded border-2", k === i ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
