"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Main image + thumbnail strip with keyboard arrows. Works with 0..n images. */
export function PackageGallery({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const [i, setI] = React.useState(0);
  const n = images.length;
  const go = (d: number) => setI((x) => (n ? (x + d + n) % n : 0));
  if (n === 0) {
    return (
      <div className={cn("flex aspect-[16/9] items-center justify-center rounded-[var(--t-radius)] bg-t-muted text-t-muted-fg", className)}>
        <ImageIcon className="size-10 opacity-40" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className={className}>
      <div
        className="group relative aspect-[16/9] overflow-hidden rounded-[var(--t-radius)] bg-t-muted"
        tabIndex={0}
        role="region"
        aria-label={`${alt} gallery`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`${alt} — ${i + 1} / ${n}`} className="h-full w-full object-cover" />
        {n > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {i + 1} / {n}
            </span>
          </>
        ) : null}
      </div>
      {n > 1 ? (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {images.map((src, k) => (
            <button
              key={src + k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Show image ${k + 1}`}
              aria-pressed={k === i}
              className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-[var(--t-radius)] border-2 transition", k === i ? "border-t-primary" : "border-transparent opacity-70 hover:opacity-100")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
