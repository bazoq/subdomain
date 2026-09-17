import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { TemplateMeta } from "@/templates/types";
import { hostUrl, subdomainHost } from "@/config/site";
import { cn } from "@/lib/utils";

export function demoUrl(templateId: string) {
  return hostUrl(subdomainHost(`demo-${templateId}`));
}

/** CSS-only miniature of a template's look (palette + fonts), used until screenshots exist. */
export function TemplateMini({ meta, className }: { meta: TemplateMeta; className?: string }) {
  const c = meta.theme.colors;
  const dark = meta.theme.dark ?? c.secondary;
  const isDark = meta.style.includes("dark") || meta.style.includes("neon") || meta.style.includes("night");
  const bg = c.bg;
  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden", className)} style={{ background: bg, fontFamily: `"${meta.theme.fonts.body}", sans-serif` }} aria-hidden="true">
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(meta.theme.fonts.heading).replace(/%20/g, "+")}:wght@700&display=swap`} />
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: isDark ? dark : c.card, borderBottom: `1px solid ${c.border}` }}>
        <span className="text-[9px] font-bold" style={{ color: isDark ? c.primary : c.fg, fontFamily: `"${meta.theme.fonts.heading}", serif` }}>
          {meta.name}
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-4 rounded-full" style={{ background: isDark ? "#ffffff55" : c.mutedFg + "66" }} />
          ))}
          <span className="h-2.5 w-6 rounded-full" style={{ background: c.primary }} />
        </div>
      </div>
      {/* hero */}
      <div className="grid grid-cols-5 gap-2 px-3 py-3">
        <div className="col-span-3 space-y-1.5">
          <span className="block h-1 w-8 rounded" style={{ background: c.accent }} />
          <span className="block text-[11px] font-bold leading-tight" style={{ color: c.fg, fontFamily: `"${meta.theme.fonts.heading}", serif` }}>
            {meta.tagline}
          </span>
          <span className="block h-1 w-full rounded" style={{ background: c.mutedFg + "55" }} />
          <span className="block h-1 w-3/4 rounded" style={{ background: c.mutedFg + "55" }} />
          <div className="flex gap-1 pt-1">
            <span className="h-3 w-9 rounded" style={{ background: c.primary, borderRadius: meta.theme.radius === "full" ? 9999 : 3 }} />
            <span className="h-3 w-9 rounded border" style={{ borderColor: c.fg + "55" }} />
          </div>
        </div>
        <div className="col-span-2 rounded" style={{ background: `linear-gradient(135deg, ${c.primary}66, ${c.accent}99)`, borderRadius: meta.theme.radius === "none" ? 0 : 6 }} />
      </div>
      {/* cards */}
      <div className="grid grid-cols-4 gap-1.5 px-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: meta.theme.radius === "none" ? 0 : 4 }}>
            <div className="h-6" style={{ background: c.muted }} />
            <div className="space-y-1 p-1">
              <span className="block h-1 w-full rounded" style={{ background: c.mutedFg + "66" }} />
              <span className="block h-1 w-1/2 rounded" style={{ background: c.primary }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: dark }} />
    </div>
  );
}

export function TemplateCard({ meta, categoryName }: { meta: TemplateMeta; categoryName?: string }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/templates/${meta.category}/${meta.id}`} className="block">
        <TemplateMini meta={meta} />
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/templates/${meta.category}/${meta.id}`} className="font-heading text-base font-bold text-slate-900 hover:text-brand-700">
              <span className="mr-1.5 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">#{meta.code}</span>
              {meta.name}
            </Link>
            <p className="text-xs text-slate-500">{categoryName ?? meta.category}</p>
          </div>
          <div className="flex gap-1">
            {Object.values(meta.theme.colors)
              .slice(0, 1)
              .concat([meta.theme.colors.accent, meta.theme.colors.secondary])
              .map((col, i) => (
                <span key={i} className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: col }} />
              ))}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{meta.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {meta.style.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Link href={`/templates/${meta.category}/${meta.id}`} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800">
            Details
          </Link>
          <a href={demoUrl(meta.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Live demo <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
