"use client";

import type * as React from "react";
import { ImageIcon, Plus } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { rs } from "../strings";
import { itemStartingPrice, type MenuItemDto, type RestaurantCtx } from "../types";
import { TagBadges } from "./tag-badges";

export type MenuLayout = "cards" | "list" | "compact";

export function needsCustomizer(item: MenuItemDto): boolean {
  return item.sizes.length > 1 || item.modifierGroups.length > 0;
}

/**
 * One menu item. `onSelect` opens the customizer; `onQuickAdd` adds the default configuration.
 * When neither is provided (e.g. on a home page without a provider) the card links to /menu#item-<slug>.
 */
export function MenuItemCard({
  item,
  ctx,
  layout = "cards",
  onSelect,
  onQuickAdd,
  className,
}: {
  item: MenuItemDto;
  ctx: RestaurantCtx;
  layout?: MenuLayout;
  onSelect?: (item: MenuItemDto) => void;
  onQuickAdd?: (item: MenuItemDto) => void;
  className?: string;
}) {
  const lang = ctx.lang;
  const name = t(item.name, lang);
  const desc = t(item.description, lang);
  const from = itemStartingPrice(item);
  const hasSizes = item.sizes.length > 1;
  const interactive = !!onSelect;
  const canAdd = interactive || !!onQuickAdd;
  const href = `/menu#item-${item.slug}`;

  const handleAdd = () => {
    if (needsCustomizer(item) || !onQuickAdd) onSelect?.(item);
    else onQuickAdd(item);
  };

  /** Clickable region: opens the customizer when interactive, otherwise links to the menu page. */
  const wrap = (cls: string, children: React.ReactNode) =>
    interactive ? (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(item);
          }
        }}
        className={cls}
      >
        {children}
      </div>
    ) : (
      <a href={href} className={cls}>
        {children}
      </a>
    );

  const price = (
    <span className="whitespace-nowrap font-semibold text-t-primary">
      {hasSizes ? <span className="me-1 text-xs font-normal text-t-muted-fg">{t(rs.from, lang)}</span> : null}
      {formatPKR(from)}
    </span>
  );

  const addButton = canAdd ? (
    <button
      type="button"
      onClick={handleAdd}
      className={cn("t-btn t-btn-primary inline-flex h-9 items-center gap-1 px-3 text-sm", layout === "compact" && "size-9 rounded-full p-0")}
      aria-label={`${t(rs.add, lang)} ${name}`}
    >
      <Plus className="size-4" />
      {layout === "compact" ? null : t(rs.add, lang)}
    </button>
  ) : (
    <a href={href} className="t-btn t-btn-outline h-9 px-3 text-sm">
      {t(rs.customize, lang)}
    </a>
  );

  const image = item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-t-muted text-t-muted-fg">
      <ImageIcon className="size-8 opacity-40" />
    </div>
  );

  if (layout === "compact") {
    return (
      <div id={`item-${item.slug}`} className={cn("flex items-center justify-between gap-3 border-b border-t-border py-3", className)}>
        {wrap(
          "min-w-0 flex-1 cursor-pointer",
          <>
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{name}</p>
              <TagBadges tags={item.tags} lang={lang} compact />
            </div>
            {desc ? <p className="line-clamp-1 text-xs text-t-muted-fg">{desc}</p> : null}
          </>,
        )}
        <div className="flex shrink-0 items-center gap-3">
          {price}
          {addButton}
        </div>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div id={`item-${item.slug}`} className={cn("t-card group flex gap-3 overflow-hidden p-3 sm:gap-4", className)}>
        {wrap("relative size-24 shrink-0 cursor-pointer overflow-hidden rounded-[var(--t-radius)] sm:size-28", image)}
        <div className="flex min-w-0 flex-1 flex-col">
          {wrap(
            "cursor-pointer",
            <>
              <TagBadges tags={item.tags} lang={lang} className="mb-1" />
              <h3 className="font-heading text-base font-semibold leading-snug">{name}</h3>
              {desc ? <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{desc}</p> : null}
            </>,
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            {price}
            {addButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={`item-${item.slug}`} className={cn("t-card group flex flex-col overflow-hidden", className)}>
      {wrap(
        "relative block aspect-[4/3] cursor-pointer overflow-hidden",
        <>
          {image}
          <TagBadges tags={item.tags} lang={lang} className="absolute start-2 top-2" />
        </>,
      )}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {wrap(
          "cursor-pointer",
          <>
            <h3 className="font-heading text-base font-semibold leading-snug">{name}</h3>
            {desc ? <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{desc}</p> : null}
          </>,
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {price}
          {addButton}
        </div>
      </div>
    </div>
  );
}
