import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { TemplateMeta } from "@/templates/types";
import { hostUrl, subdomainHost } from "@/config/site";
import { cn } from "@/lib/utils";

export function demoUrl(templateId: string) {
  return hostUrl(subdomainHost(`demo-${templateId}`));
}

export function templateHref(meta: Pick<TemplateMeta, "category" | "id">) {
  return `/templates/${meta.category}/${meta.id}`;
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
 * CSS-only miniature of a template's look (palette, type scale, radius), used until real screenshots
 * exist. Purely decorative: the parent link carries the accessible name. The template's fonts are
 * referenced by name so they render when installed, but nothing is downloaded for the thumbnail —
 * the gallery lists 84 of these and must not fire 84 stylesheet requests.
 */
export function TemplateMini({ meta, className }: { meta: TemplateMeta; className?: string }) {
  const c = meta.theme.colors;
  const dark = meta.theme.dark ?? c.secondary;
  const isDark = meta.style.some((s) => DARK_STYLES.includes(s));
  const heading = `"${meta.theme.fonts.heading}", ui-serif, Georgia, serif`;
  const body = `"${meta.theme.fonts.body}", ui-sans-serif, system-ui, sans-serif`;
  const radius = meta.theme.radius === "none" ? 0 : meta.theme.radius === "full" ? 9999 : 6;
  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden", className)} style={{ background: c.bg, fontFamily: body }} aria-hidden="true">
      {/* header */}
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
      {/* hero */}
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
      {/* cards */}
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

/** Gallery card. One accessible link to the detail page (name + numeric code) plus the live demo. */
export function TemplateCard({ meta, categoryName }: { meta: TemplateMeta; categoryName?: string }) {
  const href = templateHref(meta);
  const c = meta.theme.colors;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand-500">
      <Link href={href} className="block focus:outline-none" aria-label={`${meta.name} — template #${meta.code}${categoryName ? `, ${categoryName}` : ""}`} tabIndex={-1}>
        <TemplateMini meta={meta} />
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900">
              <Link href={href} className="hover:text-brand-700 focus:outline-none">
                <span className="mr-1.5 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white" aria-label={`Template code ${meta.code}`}>
                  #{meta.code}
                </span>
                {meta.name}
              </Link>
            </h3>
            <p className="text-xs text-slate-500">{categoryName ?? meta.category}</p>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {[c.primary, c.accent, c.secondary].map((col, i) => (
              <span key={i} className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: col }} />
            ))}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{meta.tagline}</p>
        <ul className="mt-3 flex flex-wrap gap-1" aria-label="Style">
          {meta.style.slice(0, 3).map((s) => (
            <li key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2">
          <Link href={href} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800" aria-label={`Details of ${meta.name} (#${meta.code})`}>
            Details
          </Link>
          <a
            href={demoUrl(meta.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            aria-label={`Open live demo of ${meta.name} (#${meta.code}) in a new tab`}
          >
            Live demo <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
