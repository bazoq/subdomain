"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Img } from "@/templates/ui";
import { cn } from "@/lib/utils";

/** Main image + thumbnail strip with keyboard-accessible prev/next. */
export function ProductGallery({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const list = React.useMemo(() => Array.from(new Set(images.filter(Boolean))), [images]);
  const [index, setIndex] = React.useState(0);
  const safeIndex = Math.min(index, Math.max(0, list.length - 1));
  const current = list[safeIndex];

  const go = (dir: -1 | 1) => setIndex((i) => (list.length ? (i + dir + list.length) % list.length : 0));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-muted">
        <Img src={current} alt={alt} className="aspect-square w-full object-contain" loading="eager" />
        {list.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-t-card/90 p-2 shadow hover:bg-t-card"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-t-card/90 p-2 shadow hover:bg-t-card">
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
      {list.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Product images">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-[var(--t-radius)] border-2 bg-t-muted transition sm:size-20",
                i === safeIndex ? "border-t-primary" : "border-transparent hover:border-t-border",
              )}
            >
              <Img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
