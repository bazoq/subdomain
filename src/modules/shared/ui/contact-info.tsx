import * as React from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { cn, whatsappLink } from "@/lib/utils";

type Item = { icon: React.ReactNode; label: string; value: string; href: string; external?: boolean };

export function contactItems(ctx: SiteContext): Item[] {
  const c = ctx.settings.contact;
  const ur = ctx.lang === "ur";
  const items: Item[] = [];
  if (c.phone) items.push({ icon: <Phone />, label: ur ? "فون" : "Phone", value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, "")}` });
  if (c.phone2) items.push({ icon: <Phone />, label: ur ? "فون ۲" : "Phone 2", value: c.phone2, href: `tel:${c.phone2.replace(/[^\d+]/g, "")}` });
  if (c.whatsapp) items.push({ icon: <MessageCircle />, label: ur ? "واٹس ایپ" : "WhatsApp", value: c.whatsapp, href: whatsappLink(c.whatsapp), external: true });
  if (c.email) items.push({ icon: <Mail />, label: ur ? "ای میل" : "Email", value: c.email, href: `mailto:${c.email}` });
  const addr = [c.address, c.city].filter(Boolean).join(", ");
  if (addr) items.push({ icon: <MapPin />, label: ur ? "پتہ" : "Address", value: addr, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, external: true });
  return items;
}

/** Phone / WhatsApp / email / address with icons and clickable links. */
export function ContactInfo({
  ctx,
  variant = "list",
  light,
  className,
  iconStyle = "tile",
}: {
  ctx: SiteContext;
  variant?: "list" | "inline" | "cards";
  light?: boolean;
  className?: string;
  iconStyle?: "tile" | "plain";
}) {
  const items = contactItems(ctx);
  if (!items.length) return null;
  const iconCls = cn(
    "shrink-0 [&_svg]:size-5",
    iconStyle === "tile"
      ? cn("flex size-11 items-center justify-center rounded-[var(--t-radius)]", light ? "bg-white/10 text-t-dark-fg" : "bg-t-primary/10 text-t-primary")
      : light
        ? "text-t-dark-fg/80"
        : "text-t-primary",
  );
  if (variant === "inline") {
    return (
      <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-sm", className)}>
        {items.map((it) => (
          <li key={it.label}>
            <a href={it.href} target={it.external ? "_blank" : undefined} rel="noreferrer" className={cn("inline-flex items-center gap-2 hover:underline", light ? "text-t-dark-fg/85" : "text-t-fg")}>
              <span className={cn("[&_svg]:size-4", light ? "text-t-dark-fg/70" : "text-t-primary")}>{it.icon}</span>
              <span dir="ltr">{it.value}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }
  if (variant === "cards") {
    return (
      <ul className={cn("grid gap-4 sm:grid-cols-2", className)}>
        {items.map((it) => (
          <li key={it.label} className="t-card p-5">
            <a href={it.href} target={it.external ? "_blank" : undefined} rel="noreferrer" className="flex items-start gap-4">
              <span className={iconCls}>{it.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-t-muted-fg">{it.label}</span>
                <span className="mt-0.5 block break-words font-medium text-t-fg" dir="ltr">
                  {it.value}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((it) => (
        <li key={it.label}>
          <a href={it.href} target={it.external ? "_blank" : undefined} rel="noreferrer" className="group flex items-start gap-4">
            <span className={iconCls}>{it.icon}</span>
            <span className="min-w-0">
              <span className={cn("block text-xs font-semibold uppercase tracking-wide", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{it.label}</span>
              <span className={cn("mt-0.5 block break-words font-medium group-hover:underline", light ? "text-t-dark-fg" : "text-t-fg")} dir="ltr">
                {it.value}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
