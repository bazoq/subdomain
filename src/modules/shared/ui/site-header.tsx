import * as React from "react";
import type { SiteContext } from "@/templates/types";
import { resolveHref } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { HeaderNav, type HeaderNavItem } from "@/modules/shared/ui/header-nav";

/**
 * Generic default header. Server wrapper that flattens SiteContext into serialisable
 * props for the client nav (logo/name, nav from ctx.nav, language switch, mobile drawer).
 */
export function SiteHeader({
  ctx,
  rightSlot,
  cta,
  variant = "light",
  sticky = true,
  className,
}: {
  ctx: SiteContext;
  /** e.g. cart button */
  rightSlot?: React.ReactNode;
  /** header button; defaults to hero primary CTA when present */
  cta?: { label: LocalizedString | string; href: string } | null;
  variant?: "light" | "dark" | "transparent";
  sticky?: boolean;
  className?: string;
}) {
  const items: HeaderNavItem[] = ctx.nav.map((n) => ({
    label: t(n.label, ctx.lang),
    href: n.href,
    children: n.children?.map((c) => ({ label: t(c.label, ctx.lang), href: c.href })),
  }));
  let ctaProp: { label: string; href: string; external?: boolean } | undefined;
  const src = cta === undefined ? ((ctx.sections.hero?.data as { primaryCta?: { label: LocalizedString; href: string } } | undefined)?.primaryCta ?? null) : cta;
  if (src) {
    const label = t(src.label, ctx.lang);
    if (label) {
      const r = resolveHref(src.href, ctx);
      ctaProp = { label, href: r.href, external: r.external };
    }
  }
  return (
    <HeaderNav
      items={items}
      brand={{ name: ctx.tenant.name, logoUrl: ctx.settings.branding.logoUrl || undefined }}
      cta={ctaProp}
      rightSlot={rightSlot}
      lang={ctx.lang}
      urduEnabled={ctx.settings.languages.urduEnabled}
      variant={variant}
      sticky={sticky}
      className={className}
    />
  );
}
