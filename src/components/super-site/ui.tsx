import Link from "next/link";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Building blocks of the dark-premium marketing site. Everything is a plain server component so pages
 * stay static; colours come from the `ink-*` / `gold-*` tokens in globals.css.
 */

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400", className)}>
      <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold-400" aria-hidden />
      {children}
    </p>
  );
}

/** Section title: sans eyebrow + large display serif heading + muted lead. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  as: Tag = "h2",
  className,
}: {
  id?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow ? <Eyebrow className={align === "center" ? "justify-center" : undefined}>{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={cn("font-display mt-4 text-balance tracking-tight text-white", Tag === "h1" ? "text-5xl leading-[1.02] sm:text-6xl lg:text-7xl" : "text-4xl leading-[1.05] sm:text-5xl")}>
        {title}
      </Tag>
      {lead ? <p className="mt-5 text-pretty text-base leading-7 text-zinc-400 sm:text-lg">{lead}</p> : null}
    </div>
  );
}

type ButtonVariant = "gold" | "light" | "ghost";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const buttonClass: Record<ButtonVariant, string> = {
  gold: cn(buttonBase, "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-[0_8px_30px_-8px_rgba(226,187,114,0.55)] hover:from-gold-200 hover:to-gold-400"),
  light: cn(buttonBase, "bg-white text-ink-950 hover:bg-zinc-200"),
  ghost: cn(buttonBase, "border border-white/15 bg-white/[0.03] text-zinc-100 hover:border-white/30 hover:bg-white/[0.07]"),
};

export function ButtonLink({
  href,
  variant = "gold",
  external,
  className,
  children,
  ...rest
}: { href: string; variant?: ButtonVariant; external?: boolean; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(buttonClass[variant], className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(buttonClass[variant], className)} {...rest}>
      {children}
    </Link>
  );
}

/** Soft gold / violet light behind a hero or section. Decorative. */
export function Glow({ className, tone = "gold" }: { className?: string; tone?: "gold" | "violet" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-3xl",
        tone === "gold" ? "bg-[radial-gradient(closest-side,rgba(226,187,114,0.22),transparent)]" : "bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)]",
        className,
      )}
    />
  );
}

/** Faint grid texture for hero backgrounds. Decorative. */
export function GridTexture({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]",
        className,
      )}
    />
  );
}

/** Dark surface card with a hairline gradient border. */
export function Panel({ className, children, as: Tag = "div", ...rest }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "li" | "article" | "aside" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn("ring-hairline rounded-3xl bg-ink-850/80", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Lucide icon by name (category icons are stored as strings). */
export function IconByName({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>>)[name] ?? Icons.Store;
  return <Cmp className={className} aria-hidden />;
}

export { Wordmark } from "@/components/super-site/wordmark";
