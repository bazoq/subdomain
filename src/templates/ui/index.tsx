import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import * as Icons from "lucide-react";
import type { SiteContext } from "@/templates/types";
import type { Lang, LocalizedString } from "@/lib/i18n";
import { t, ui } from "@/lib/i18n";
import { cn, karachiNow, normalizePkPhone, safeImageSrc, safeLinkHref, whatsappLink } from "@/lib/utils";
import { brand } from "@/config/brand";
import { rootUrl } from "@/config/site";

/**
 * Shared, theme-agnostic UI primitives used by every template and module kit.
 *
 * Security notes (this file renders tenant-editable content):
 *  - Every href that comes from the database goes through `safeLinkHref()` (scheme allowlist),
 *    so `[x](javascript:…)` in rich text or a CTA field can never become an executable link.
 *  - Every image src goes through `safeImageSrc()`.
 *  - Icon names are looked up with a strict pattern so a stored name cannot resolve to a
 *    non-icon export of lucide-react.
 *  - Rich text is rendered as React elements (never `dangerouslySetInnerHTML`).
 *
 * RTL notes: use logical utilities (`start-*`, `end-*`, `ps-*`, `pe-*`, `text-start`) and
 * `rtl:-scale-x-100` (or `<Icon flipRtl>`) for directional icons.
 */

/* ---------- icons by name (lucide) ---------- */
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/** Icons whose meaning depends on reading direction — mirrored automatically under `dir="rtl"`. */
export const DIRECTIONAL_ICONS: ReadonlySet<string> = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowUpRight",
  "ArrowUpLeft",
  "ArrowDownRight",
  "ArrowDownLeft",
  "ArrowRightCircle",
  "ArrowLeftCircle",
  "ArrowRightToLine",
  "ArrowLeftToLine",
  "CircleArrowRight",
  "CircleArrowLeft",
  "CircleChevronRight",
  "CircleChevronLeft",
  "SquareArrowRight",
  "SquareArrowLeft",
  "ChevronRight",
  "ChevronLeft",
  "ChevronsRight",
  "ChevronsLeft",
  "MoveRight",
  "MoveLeft",
  "CornerDownRight",
  "CornerDownLeft",
  "CornerUpRight",
  "CornerUpLeft",
  "Undo",
  "Undo2",
  "Redo",
  "Redo2",
  "Reply",
  "ReplyAll",
  "Forward",
  "LogIn",
  "LogOut",
  "Send",
  "SendHorizontal",
  "SkipForward",
  "SkipBack",
  "StepForward",
  "StepBack",
  "List",
  "ListOrdered",
  "AlignLeft",
  "AlignRight",
  "PanelLeft",
  "PanelRight",
  "ExternalLink",
]);

const ICON_NAME_RE = /^[A-Z][A-Za-z0-9]{1,60}$/;
const NOT_ICONS = new Set(["Icon", "LucideIcon", "createLucideIcon"]);

/** Resolve a lucide icon by (tenant-supplied) name. Returns null for anything that is not an icon component. */
export function lookupIcon(name?: string | null): IconComponent | null {
  if (!name || !ICON_NAME_RE.test(name) || NOT_ICONS.has(name)) return null;
  const cmp = (Icons as unknown as Record<string, unknown>)[name];
  if (typeof cmp === "function") return cmp as IconComponent;
  if (typeof cmp === "object" && cmp !== null && "$$typeof" in cmp) return cmp as IconComponent;
  return null;
}

/** Class that mirrors an element under RTL when the icon is directional. */
export function dirIconClass(name?: string | null): string | undefined {
  return name && DIRECTIONAL_ICONS.has(name) ? "rtl:-scale-x-100" : undefined;
}

export function Icon({
  name,
  className,
  label,
  flipRtl,
  fallback = "Sparkles",
}: {
  name?: string;
  className?: string;
  /** accessible name; omit for decorative icons (default: decorative, aria-hidden) */
  label?: string;
  /** force / suppress RTL mirroring (defaults to the DIRECTIONAL_ICONS list) */
  flipRtl?: boolean;
  /** icon used when `name` is unknown */
  fallback?: string;
}) {
  const flip = flipRtl ?? (name ? DIRECTIONAL_ICONS.has(name) : false);
  // Looked up (not created) per render: lucide icon components are module-level singletons.
  return React.createElement(lookupIcon(name) ?? lookupIcon(fallback) ?? Icons.Sparkles, {
    className: cn(flip && "rtl:-scale-x-100", className),
    "aria-hidden": label ? undefined : true,
    "aria-label": label,
    role: label ? "img" : undefined,
    focusable: "false",
  });
}

/* ---------- link resolution (whatsapp / tel / relative / absolute) ---------- */
/** Business phone for WhatsApp deep links: prefers the WhatsApp number, normalised to +92…; null when none is set. */
export function whatsappNumber(ctx: Pick<SiteContext, "settings">): string | null {
  const raw = (ctx.settings.contact.whatsapp || ctx.settings.contact.phone || "").trim();
  if (!raw) return null;
  const normalised = normalizePkPhone(raw) ?? raw;
  const digits = normalised.replace(/\D/g, "");
  return digits.length >= 8 ? normalised : null;
}

/**
 * Resolve a link field value. Special values: "whatsapp" | "tel" | "email" use the tenant's
 * contact settings. Anything else is validated by `safeLinkHref` (unknown schemes → "#").
 */
export function resolveHref(href: string, ctx: SiteContext): { href: string; external: boolean } {
  const v = (href ?? "").trim();
  if (!v) return { href: "#", external: false };
  if (v === "whatsapp") {
    const num = whatsappNumber(ctx);
    return num ? { href: whatsappLink(num), external: true } : { href: "/contact", external: false };
  }
  if (v === "tel") {
    const phone = normalizePkPhone(ctx.settings.contact.phone) ?? ctx.settings.contact.phone.replace(/[^\d+]/g, "");
    return phone ? { href: `tel:${phone}`, external: true } : { href: "/contact", external: false };
  }
  if (v === "email") {
    const email = ctx.settings.contact.email.trim();
    return email && !/[\s<>"]/.test(email) ? { href: `mailto:${email}`, external: true } : { href: "/contact", external: false };
  }
  return safeLinkHref(v) ?? { href: "#", external: false };
}

/** True for links that should open in a new tab (http(s) only — tel:/mailto: must stay in-tab). */
export function opensNewTab(href: string) {
  return /^https?:\/\//i.test(href);
}

export function SmartLink({
  href,
  ctx,
  className,
  children,
  ...rest
}: { href: string; ctx: SiteContext; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const r = resolveHref(href, ctx);
  if (r.external) {
    const blank = opensNewTab(r.href);
    return (
      <a href={r.href} className={className} target={blank ? "_blank" : undefined} rel={blank ? "noopener noreferrer" : undefined} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={r.href as Route} className={className} {...rest}>
      {children}
    </Link>
  );
}

/** Button from a link field value. Renders nothing if label is empty. */
export function CtaButton({
  value,
  ctx,
  className = "t-btn t-btn-primary",
  icon,
}: {
  value: { label: LocalizedString; href: string } | undefined;
  ctx: SiteContext;
  className?: string;
  icon?: React.ReactNode;
}) {
  const label = t(value?.label, ctx.lang);
  if (!value || !label) return null;
  return (
    <SmartLink href={value.href || "#"} ctx={ctx} className={className}>
      {label}
      {icon}
    </SmartLink>
  );
}

/* ---------- section heading ---------- */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  lang,
  light,
  level = 2,
  id,
}: {
  eyebrow?: string;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  align?: "left" | "center";
  className?: string;
  lang: Lang;
  light?: boolean;
  /** heading level (default h2; use 1 on standalone pages) */
  level?: 1 | 2 | 3;
  id?: string;
}) {
  const ttl = t(title, lang);
  const sub = t(subtitle, lang);
  if (!ttl && !eyebrow) return null;
  const H = (`h${level}`) as "h1" | "h2" | "h3";
  return (
    <div className={cn("mb-10 max-w-2xl", align === "center" ? "mx-auto text-center" : "text-start", className)}>
      {eyebrow ? <span className={cn("t-eyebrow", light && "text-t-accent")}>{eyebrow}</span> : null}
      {ttl ? (
        <H id={id} className={cn("font-heading mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl", light && "text-t-dark-fg")}>
          {ttl}
        </H>
      ) : null}
      {sub ? <p className={cn("mt-3 text-base text-pretty sm:text-lg", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{sub}</p> : null}
    </div>
  );
}

/* ---------- lightweight rich text (plain / simple markdown) ---------- */
/**
 * Renders a small markdown subset as React elements: paragraphs (blank line), line breaks,
 * `## h2` / `### h3`, `- ` / `* ` bullet lists, `1. ` numbered lists, `**bold**`, `*italic*`
 * and `[label](href)`. Links use the scheme allowlist; unsafe hrefs render as plain text.
 */
export function RichText({ value, lang, className }: { value: LocalizedString | string | null | undefined; lang: Lang; className?: string }) {
  const text = t(value, lang).replace(/\r\n?/g, "\n");
  if (!text.trim()) return null;
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className={cn("t-prose", className)}>
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-*•] /.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*•] /, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lines.length && lines.every((l) => /^\s*\d+[.)] /.test(l))) {
          return (
            <ol key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*\d+[.)] /, ""))}</li>
              ))}
            </ol>
          );
        }
        if (/^### /.test(b)) return <h3 key={i}>{inline(b.slice(4))}</h3>;
        if (/^## /.test(b)) return <h2 key={i}>{inline(b.slice(3))}</h2>;
        if (/^> /.test(b)) return <blockquote key={i}>{inline(b.replace(/^> ?/gm, ""))}</blockquote>;
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <React.Fragment key={j}>
                {inline(l)}
                {j < lines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const INLINE_RE = /(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))/g;

function inline(s: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++}>{m[1].slice(2, -2)}</strong>);
    else if (m[2]) parts.push(<em key={k++}>{m[2].slice(1, -1)}</em>);
    else if (m[3]) {
      const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(m[3]);
      const label = mm?.[1] ?? m[3];
      const safe = mm ? safeLinkHref(mm[2]) : null;
      if (!safe) parts.push(<React.Fragment key={k++}>{label}</React.Fragment>);
      else {
        const blank = safe.external && opensNewTab(safe.href);
        parts.push(
          <a key={k++} href={safe.href} target={blank ? "_blank" : undefined} rel={blank ? "noopener noreferrer" : undefined}>
            {label}
          </a>,
        );
      }
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

/* ---------- WhatsApp floating button ---------- */
export function WhatsAppFloat({ ctx, message, className }: { ctx: SiteContext; message?: string; className?: string }) {
  const num = whatsappNumber(ctx);
  if (!num) return null;
  const ur = ctx.lang === "ur";
  const label = ur ? "واٹس ایپ پر بات کریں" : "Chat on WhatsApp";
  const text = message ?? (ur ? `السلام علیکم ${ctx.tenant.name}، مجھے کچھ معلومات چاہئیں۔` : `Hi ${ctx.tenant.name}, I have a question.`);
  return (
    <a
      href={whatsappLink(num, text)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "t-fab fixed end-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 motion-reduce:transition-none print:hidden",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 2 6.5L4 29l7.7-2c1.8 1 3.9 1.5 6 1.5 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-1.9 0-3.7-.5-5.2-1.5l-.4-.2-4.6 1.2 1.2-4.4-.3-.4C5.6 18.2 5 16.6 5 15 5 9 10 4 16 4s11 5 11 11-5 10-11 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
      </svg>
    </a>
  );
}

/* ---------- language switch ---------- */
/** Href that switches the language cookie and returns to `back` (same-origin path only). */
export function langSwitchHref(to: Lang, back = "/") {
  const safeBack = back.startsWith("/") && !back.startsWith("//") ? back : "/";
  return `/api/lang?to=${to}&back=${encodeURIComponent(safeBack)}`;
}

export function LangSwitch({ ctx, className, currentPath = "/" }: { ctx: SiteContext; className?: string; currentPath?: string }) {
  if (!ctx.settings.languages.urduEnabled) return null;
  const other: Lang = ctx.lang === "ur" ? "en" : "ur";
  const label = other === "ur" ? "اردو" : "English";
  const title = other === "ur" ? "Switch to Urdu" : "انگریزی میں دیکھیں";
  return (
    <a
      href={langSwitchHref(other, currentPath)}
      hrefLang={other}
      lang={other}
      aria-label={title}
      title={title}
      className={cn("inline-flex items-center gap-1 text-sm font-medium", className)}
    >
      <Icons.Languages className="size-4" aria-hidden="true" focusable="false" />
      {label}
    </a>
  );
}

/* ---------- image with graceful fallback ---------- */
/**
 * Plain `<img>` with validated src, lazy loading by default and an empty-state box when no
 * image is set. Pass `priority` for above-the-fold images (hero) and `sizes` for responsive
 * candidates when `srcSet` is supplied.
 */
export function Img({
  src,
  alt = "",
  className,
  fallback,
  priority = false,
  loading,
  decoding,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: React.ReactNode; priority?: boolean }) {
  const safe = safeImageSrc(typeof src === "string" ? src : undefined);
  if (!safe) {
    return (
      <div
        className={cn("flex items-center justify-center bg-t-muted text-t-muted-fg", className)}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        {fallback ?? <Icons.ImageIcon className="size-8 opacity-40" aria-hidden="true" focusable="false" />}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safe}
      alt={alt}
      className={className}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding ?? (priority ? "sync" : "async")}
      fetchPriority={priority ? "high" : undefined}
      {...rest}
    />
  );
}

/* ---------- star rating ---------- */
export function Stars({ n, className, lang = "en" }: { n: number; className?: string; lang?: Lang }) {
  const v = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className={cn("inline-flex text-t-accent", className)} role="img" aria-label={lang === "ur" ? `${v} از 5 ستارے` : `${v} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icons.Star key={i} className={cn("size-4", i < v ? "fill-current" : "opacity-30")} aria-hidden="true" focusable="false" />
      ))}
    </span>
  );
}

/* ---------- opening hours helper ---------- */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
export function dayName(d: number, lang: Lang) {
  const i = ((d % 7) + 7) % 7;
  return lang === "ur" ? DAYS_UR[i] : DAYS[i];
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

/** Open right now in Pakistan time. null = no hours configured or unparsable. */
export function isOpenNow(hours: { day: number; open: string; close: string; closed: boolean }[]): boolean | null {
  if (!hours.length) return null;
  const now = karachiNow();
  const h = hours.find((x) => x.day === now.day);
  if (!h || h.closed) return false;
  const o = toMinutes(h.open);
  const c = toMinutes(h.close);
  if (o == null || c == null) return null;
  const cur = now.minutes;
  return c > o ? cur >= o && cur < c : cur >= o || cur < c; // overnight
}

/* ---------- layout primitives ---------- */
export function Container({ className, children, as: Tag = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "nav" | "header" | "footer" }) {
  return <Tag className={cn("t-container", className)}>{children}</Tag>;
}

/** "Skip to content" link. Every template Layout renders `<main id="main">`, which is the default target. */
export function SkipLink({ lang = "en", target = "main" }: { lang?: Lang; target?: string }) {
  return (
    <a href={`#${target}`} className="t-skip">
      {t(ui.skipToContent, lang)}
    </a>
  );
}

/** True when the tenant has opted out of the platform credit (requires `branding.hidePoweredBy` in settings). */
export function hidePoweredBy(settings: SiteContext["settings"]): boolean {
  const b = settings.branding as { hidePoweredBy?: unknown };
  return b.hidePoweredBy === true;
}

/** "Powered by <brand>" footer credit — respects the tenant's white-label toggle. */
export function PoweredBy({ ctx, className }: { ctx: SiteContext; className?: string }) {
  if (hidePoweredBy(ctx.settings)) return null;
  return (
    <p className={className}>
      {t(ui.poweredBy, ctx.lang)}{" "}
      <a href={rootUrl()} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
        {brand.name}
      </a>
    </p>
  );
}

/** Visually hidden text for screen readers. */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
