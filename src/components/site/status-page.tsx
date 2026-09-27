import * as React from "react";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Body-level shell for site status screens (coming soon, suspended, 404, error). Uses the tenant theme
 * tokens set on <html> by the tenant root layout, so it matches the brand without loading a template.
 * Renders one `<main>` landmark and an `<h1>`; pass `id="main"` consumers can target with a skip link.
 */
export function StatusPage({
  eyebrow,
  title,
  text,
  lang = "en",
  tone = "neutral",
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  lang?: Lang;
  tone?: "neutral" | "warning" | "danger";
  children?: React.ReactNode;
  className?: string;
}) {
  const toneClass = tone === "warning" ? "text-amber-600" : tone === "danger" ? "text-red-600" : "text-t-primary";
  return (
    <main
      id="main"
      lang={lang === "ur" ? "ur-PK" : "en-PK"}
      dir={lang === "ur" ? "rtl" : "ltr"}
      className={cn("flex min-h-screen flex-col items-center justify-center bg-t-bg px-4 py-16 text-center text-t-fg", className)}
    >
      <div className="t-card w-full max-w-lg p-8 shadow-sm sm:p-12">
        {eyebrow ? <p className={cn("text-xs font-semibold uppercase tracking-[0.2em] rtl:tracking-normal", toneClass)}>{eyebrow}</p> : null}
        <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {text ? <p className="mt-4 text-base text-pretty text-t-muted-fg sm:text-lg">{text}</p> : null}
        {children ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
      </div>
    </main>
  );
}
