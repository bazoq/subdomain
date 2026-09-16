import * as React from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { SiteContext } from "@/templates/types";
import type { LocalizedString } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn, whatsappLink } from "@/lib/utils";

/* ---------- icons by name (lucide) ---------- */
export function Icon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]) || Icons.Sparkles;
  return <Cmp className={className} />;
}

/* ---------- link resolution (whatsapp / tel / relative / absolute) ---------- */
export function resolveHref(href: string, ctx: SiteContext): { href: string; external: boolean } {
  if (!href) return { href: "#", external: false };
  if (href === "whatsapp") return { href: whatsappLink(ctx.settings.contact.whatsapp || ctx.settings.contact.phone), external: true };
  if (href === "tel") return { href: `tel:${ctx.settings.contact.phone}`, external: true };
  if (href === "email") return { href: `mailto:${ctx.settings.contact.email}`, external: true };
  if (/^(https?:|mailto:|tel:)/.test(href)) return { href, external: true };
  return { href, external: false };
}

export function SmartLink({
  href,
  ctx,
  className,
  children,
  ...rest
}: { href: string; ctx: SiteContext; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const r = resolveHref(href, ctx);
  if (r.external)
    return (
      <a href={r.href} className={className} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  return (
    <Link href={r.href} className={className} {...rest}>
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
}: {
  eyebrow?: string;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  align?: "left" | "center";
  className?: string;
  lang: "en" | "ur";
  light?: boolean;
}) {
  const ttl = t(title, lang);
  const sub = t(subtitle, lang);
  if (!ttl && !eyebrow) return null;
  return (
    <div className={cn("mb-10 max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <span className={cn("t-eyebrow", light && "text-t-accent")}>{eyebrow}</span> : null}
      {ttl ? <h2 className={cn("font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl", light && "text-t-dark-fg")}>{ttl}</h2> : null}
      {sub ? <p className={cn("mt-3 text-base sm:text-lg", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{sub}</p> : null}
    </div>
  );
}

/* ---------- lightweight rich text (plain / simple markdown) ---------- */
export function RichText({ value, lang, className }: { value: LocalizedString | string | null | undefined; lang: "en" | "ur"; className?: string }) {
  const text = t(value, lang);
  if (!text) return null;
  const blocks = text.split(/\n{2,}/);
  return (
    <div className={cn("t-prose", className)}>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*] /, ""))}</li>
              ))}
            </ul>
          );
        }
        if (/^### /.test(b)) return <h3 key={i}>{inline(b.slice(4))}</h3>;
        if (/^## /.test(b)) return <h2 key={i}>{inline(b.slice(3))}</h2>;
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

function inline(s: string): React.ReactNode {
  // **bold** and [text](url)
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++}>{m[1].slice(2, -2)}</strong>);
    else if (m[2]) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(m[2])!;
      parts.push(
        <a key={k++} href={mm[2]} target={mm[2].startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {mm[1]}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

/* ---------- WhatsApp floating button ---------- */
export function WhatsAppFloat({ ctx, message }: { ctx: SiteContext; message?: string }) {
  const num = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  if (!num) return null;
  return (
    <a
      href={whatsappLink(num, message ?? `Hi ${ctx.tenant.name}, I have a question.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 rtl:left-5 rtl:right-auto"
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="currentColor" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 2 6.5L4 29l7.7-2c1.8 1 3.9 1.5 6 1.5 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-1.9 0-3.7-.5-5.2-1.5l-.4-.2-4.6 1.2 1.2-4.4-.3-.4C5.6 18.2 5 16.6 5 15 5 9 10 4 16 4s11 5 11 11-5 10-11 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
      </svg>
    </a>
  );
}

/* ---------- language switch ---------- */
export function LangSwitch({ ctx, className, currentPath = "/" }: { ctx: SiteContext; className?: string; currentPath?: string }) {
  if (!ctx.settings.languages.urduEnabled) return null;
  const other = ctx.lang === "ur" ? "en" : "ur";
  return (
    <a href={`/api/lang?to=${other}&back=${encodeURIComponent(currentPath)}`} className={cn("inline-flex items-center gap-1 text-sm font-medium", className)} title="Switch language">
      <Icons.Languages className="size-4" />
      {other === "ur" ? "اردو" : "English"}
    </a>
  );
}

/* ---------- image with graceful fallback ---------- */
export function Img({
  src,
  alt = "",
  className,
  fallback,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: React.ReactNode }) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-t-muted text-t-muted-fg", className)}>
        {fallback ?? <Icons.ImageIcon className="size-8 opacity-40" />}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" {...rest} />;
}

/* ---------- star rating ---------- */
export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("inline-flex text-t-accent", className)} aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icons.Star key={i} className={cn("size-4", i < n ? "fill-current" : "opacity-30")} />
      ))}
    </span>
  );
}

/* ---------- opening hours helper ---------- */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
export function dayName(d: number, lang: "en" | "ur") {
  return lang === "ur" ? DAYS_UR[d] : DAYS[d];
}

export function isOpenNow(hours: { day: number; open: string; close: string; closed: boolean }[]): boolean | null {
  if (!hours.length) return null;
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const h = hours.find((x) => x.day === now.getDay());
  if (!h || h.closed) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = h.open.split(":").map(Number);
  const [ch, cm] = h.close.split(":").map(Number);
  const o = oh * 60 + om;
  const c = ch * 60 + cm;
  return c > o ? cur >= o && cur < c : cur >= o || cur < c; // overnight
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("t-container", className)}>{children}</div>;
}
