import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { TemplateMeta, TemplateTheme } from "@/templates/types";
import { TEMPLATE_SHOTS } from "@/templates/shots";
import { hostUrl, subdomainHost } from "@/config/site";
import { cn } from "@/lib/utils";

export function demoUrl(templateId: string) {
  return hostUrl(subdomainHost(`demo-${templateId}`));
}

export function demoHost(templateId: string) {
  return subdomainHost(`demo-${templateId}`);
}

export function templateHref(meta: { category: string; id: string }) {
  return `/templates/${meta.category}/${meta.id}`;
}

/**
 * The slice of a template's meta the gallery needs. Full metas carry every section's defaults, far too
 * much to ship to the browser for 84 cards, so client components receive this instead.
 */
export interface TemplateCardData {
  id: string;
  code: number;
  name: string;
  tagline: string;
  category: string;
  style: string[];
  theme: Pick<TemplateTheme, "colors" | "fonts" | "radius" | "dark">;
}

export function toCardData(m: TemplateMeta): TemplateCardData {
  return { id: m.id, code: m.code, name: m.name, tagline: m.tagline, category: m.category, style: m.style, theme: { colors: m.theme.colors, fonts: m.theme.fonts, radius: m.theme.radius, dark: m.theme.dark } };
}

/**
 * Apply an alpha to a CSS hex colour, returning `rgba()`. Handles #rgb, #rgba, #rrggbb and #rrggbbaa
 * (the catalog uses all of them — string-concatenating "66" onto "#fff" produced invalid colours).
 * Non-hex input is returned unchanged.
 */
export function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec((hex ?? "").trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length <= 4) h = h.split("").map((ch) => ch + ch).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
}

const DARK_STYLES = ["dark", "neon", "night"];

/**
 * CSS-only miniature of a template's look (palette, type scale, radius). Fallback for templates that have
 * no real screenshot yet (`npm run shots`). Purely decorative: the parent link carries the accessible name.
 */
export function TemplateMini({ meta, className }: { meta: Pick<TemplateCardData, "name" | "tagline" | "style" | "theme">; className?: string }) {
  const c = meta.theme.colors;
  const dark = meta.theme.dark ?? c.secondary;
  const isDark = meta.style.some((s) => DARK_STYLES.includes(s));
  const heading = `"${meta.theme.fonts.heading}", ui-serif, Georgia, serif`;
  const body = `"${meta.theme.fonts.body}", ui-sans-serif, system-ui, sans-serif`;
  const radius = meta.theme.radius === "none" ? 0 : meta.theme.radius === "full" ? 9999 : 6;
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ background: c.bg, fontFamily: body }} aria-hidden="true">
      <div className="flex items-center justify-between px-3 py-2" style={{ background: isDark ? dark : c.card, borderBottom: `1px solid ${c.border}` }}>
        <span className="text-[9px] font-bold" style={{ color: isDark ? c.primary : c.fg, fontFamily: heading }}>
          {meta.name}
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-4 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.33)" : alpha(c.mutedFg, 0.4) }} />
          ))}
          <span className="h-2.5 w-6 rounded-full" style={{ background: c.primary }} />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 px-3 py-3">
        <div className="col-span-3 space-y-1.5">
          <span className="block h-1 w-8 rounded" style={{ background: c.accent }} />
          <span className="block text-[11px] font-bold leading-tight" style={{ color: c.fg, fontFamily: heading }}>
            {meta.tagline}
          </span>
          <span className="block h-1 w-full rounded" style={{ background: alpha(c.mutedFg, 0.33) }} />
          <span className="block h-1 w-3/4 rounded" style={{ background: alpha(c.mutedFg, 0.33) }} />
          <div className="flex gap-1 pt-1">
            <span className="h-3 w-9" style={{ background: c.primary, borderRadius: meta.theme.radius === "full" ? 9999 : 3 }} />
            <span className="h-3 w-9 border" style={{ borderColor: alpha(c.fg, 0.33), borderRadius: meta.theme.radius === "full" ? 9999 : 3 }} />
          </div>
        </div>
        <div className="col-span-2" style={{ background: `linear-gradient(135deg, ${alpha(c.primary, 0.4)}, ${alpha(c.accent, 0.6)})`, borderRadius: radius }} />
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: Math.min(radius, 4) }}>
            <div className="h-6" style={{ background: c.muted }} />
            <div className="space-y-1 p-1">
              <span className="block h-1 w-full rounded" style={{ background: alpha(c.mutedFg, 0.4) }} />
              <span className="block h-1 w-1/2 rounded" style={{ background: c.primary }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: dark }} />
    </div>
  );
}

/** Window ratios (height / width) used by the frames below. */
const RATIO = { desktop: 10 / 16, mobile: 19.5 / 9 };

/** True when `npm run shots` produced a screenshot for this template/device. */
export function hasShot(id: string, device: "desktop" | "mobile" = "desktop") {
  return Boolean(TEMPLATE_SHOTS[id]?.[device]);
}

/**
 * A real screenshot of the template's live demo, clipped to a fixed-ratio window. The image is the top of
 * the home page (several screens tall); hovering the surrounding `.group` glides it to the bottom
 * (see `.shot-scroll` in globals.css). Falls back to the CSS miniature when no screenshot exists.
 */
export function TemplateShot({
  meta,
  device = "desktop",
  sizes,
  priority,
  autoplay,
  className,
}: {
  meta: Pick<TemplateCardData, "id" | "name" | "tagline" | "style" | "theme">;
  device?: "desktop" | "mobile";
  sizes: string;
  priority?: boolean;
  /** scroll without hover (used by the hero showcase) */
  autoplay?: boolean;
  className?: string;
}) {
  const entry = TEMPLATE_SHOTS[meta.id];
  const shot = entry?.[device];
  if (!shot) return <TemplateMini meta={meta} className={className} />;
  // Fraction of the image height visible in the window; the rest is what the hover scroll travels.
  const visible = Math.min(1, (RATIO[device] * shot.width) / shot.height);
  const shift = `${(-(1 - visible) * 100).toFixed(2)}%`;
  const duration = `${Math.max(2.5, Math.min(9, (1 - visible) * 8)).toFixed(1)}s`;
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ink-800", autoplay && "shot-autoplay", className)}>
      <Image
        src={`/templates/${meta.id}-${device}.webp`}
        alt=""
        width={shot.width}
        height={shot.height}
        sizes={sizes}
        priority={priority}
        className="shot-scroll block h-auto w-full select-none"
        style={{ "--shot-shift": shift, "--shot-duration": duration } as React.CSSProperties}
        draggable={false}
      />
    </div>
  );
}

/** Minimal browser chrome (traffic lights + address pill) around a desktop screenshot. */
export function BrowserFrame({ host, className, children }: { host: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]", className)}>
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-850 px-3 py-2" aria-hidden>
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
        </span>
        <span className="flex-1 truncate rounded-md bg-white/[0.04] px-2.5 py-0.5 text-center text-[10px] text-zinc-500">{host}</span>
      </div>
      <div className="aspect-[16/10]">{children}</div>
    </div>
  );
}

/** Phone frame around a mobile screenshot. */
export function PhoneFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[2.2rem] border border-white/15 bg-ink-950 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]", className)}>
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.7rem]">
        {children}
      </div>
    </div>
  );
}

/** Gallery card: real screenshot (hover to scroll), name, code, palette and the two actions people want. */
export function TemplateCard({ meta, categoryName, priority }: { meta: TemplateCardData; categoryName?: string; priority?: boolean }) {
  const href = templateHref(meta);
  const c = meta.theme.colors;
  return (
    <article className="group ring-hairline flex h-full flex-col overflow-hidden rounded-2xl bg-ink-850 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(226,187,114,0.25)] focus-within:ring-2 focus-within:ring-gold-400">
      <Link href={href} className="block p-2.5 pb-0 focus:outline-none" tabIndex={-1} aria-hidden>
        <BrowserFrame host={demoHost(meta.id)} className="rounded-lg shadow-none">
          <TemplateShot meta={meta} sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" priority={priority} />
        </BrowserFrame>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display truncate text-2xl leading-tight text-white">
              <Link href={href} className="focus:outline-none">
                {meta.name}
                <span className="sr-only">, template #{meta.code}{categoryName ? `, ${categoryName}` : ""}</span>
              </Link>
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              <span className="font-mono text-gold-400">#{meta.code}</span>
              {categoryName ? <span> · {categoryName}</span> : null}
            </p>
          </div>
          <span className="mt-1 flex shrink-0 -space-x-1" aria-hidden>
            {[c.primary, c.accent, c.bg].map((col, i) => (
              <span key={i} className="size-4 rounded-full ring-2 ring-ink-850" style={{ background: col }} />
            ))}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{meta.tagline}</p>
        <div className="mt-auto flex items-center gap-2 pt-5">
          <Link href={href} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-white/[0.12]" aria-label={`Details of ${meta.name} (#${meta.code})`}>
            Details <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
          <a
            href={demoUrl(meta.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 transition hover:from-gold-200 hover:to-gold-400"
            aria-label={`Open live demo of ${meta.name} (#${meta.code}) in a new tab`}
          >
            Live demo <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
