import * as React from "react";
import type { SiteContext } from "@/templates/types";
import { Container } from "@/templates/ui";
import { cn } from "@/lib/utils";
import { Breadcrumbs, type Crumb } from "@/modules/shared/ui/breadcrumbs";

/** Hero for inner pages (services, team, blog …). */
export function PageHero({
  ctx,
  title,
  subtitle,
  image,
  breadcrumbs,
  variant = "simple",
  align = "left",
  className,
  children,
}: {
  ctx: SiteContext;
  title: string;
  subtitle?: string;
  image?: string;
  breadcrumbs?: Crumb[];
  variant?: "simple" | "image" | "gradient";
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}) {
  const v = image ? "image" : variant;
  const light = v !== "simple";
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        v === "simple" && "border-b border-t-border bg-t-muted",
        v === "gradient" && "bg-gradient-to-br from-t-primary via-t-primary to-t-secondary text-t-primary-fg",
        v === "image" && "bg-t-dark text-t-dark-fg",
        className,
      )}
    >
      {v === "image" && image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </>
      ) : null}
      {v === "gradient" ? <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" /> : null}
      <Container className={cn("relative py-12 sm:py-16 lg:py-20", align === "center" && "text-center")}>
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} lang={ctx.lang} light={light} className={cn("mb-4", align === "center" && "justify-center [&_ol]:justify-center")} /> : null}
        <h1 className={cn("font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl", light ? "text-inherit" : "text-t-fg")}>{title}</h1>
        {subtitle ? <p className={cn("mt-3 max-w-2xl text-base sm:text-lg", align === "center" && "mx-auto", light ? "opacity-85" : "text-t-muted-fg")}>{subtitle}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </section>
  );
}
