"use client";

/**
 * Full menu: sticky category nav with scroll-spy, search, items per category,
 * item customizer modal. Must be rendered inside <OrderProvider>.
 */
import * as React from "react";
import { Search, X } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";
import type { MenuCategoryDto, MenuItemDto, RestaurantCtx } from "../types";
import { useOrder } from "./order-provider";
import { MenuItemCard, needsCustomizer, type MenuLayout } from "./menu-item-card";
import { ItemCustomizer, buildCartLine } from "./item-customizer";

export function MenuBrowser({
  ctx,
  categories,
  layout = "cards",
  columns = 3,
  showSearch = true,
  stickyTop = "0px",
  className,
}: {
  ctx: RestaurantCtx;
  categories: MenuCategoryDto[];
  layout?: MenuLayout;
  /** grid columns on desktop for the "cards" layout */
  columns?: 2 | 3 | 4;
  showSearch?: boolean;
  /** CSS offset for the sticky nav when the template header is sticky (e.g. "64px") */
  stickyTop?: string;
  className?: string;
}) {
  const lang = ctx.lang;
  const order = useOrder();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<string>(categories[0]?.id ?? "");
  const [selected, setSelected] = React.useState<{ item: MenuItemDto; session: number } | null>(null);
  const [open, setOpen] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);
  const suppressSpy = React.useRef(false);
  const suppressTimer = React.useRef<number | null>(null);

  const allItems = React.useMemo(() => categories.flatMap((c) => c.items), [categories]);

  const openItem = React.useCallback((item: MenuItemDto) => {
    setSelected((prev) => ({ item, session: (prev?.session ?? 0) + 1 }));
    setOpen(true);
  }, []);

  // deep link: /menu#item-<slug> opens the customizer (initial hash + hashchange)
  React.useEffect(() => {
    const check = () => {
      const m = /^#item-(.+)$/.exec(window.location.hash);
      if (!m) return;
      const item = allItems.find((i) => i.slug === decodeURIComponent(m[1]));
      if (item) openItem(item);
    };
    const id = window.setTimeout(check, 0);
    window.addEventListener("hashchange", check);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("hashchange", check);
    };
  }, [allItems, openItem]);

  // scroll-spy
  React.useEffect(() => {
    if (query) return;
    const sections = categories.map((c) => document.getElementById(`cat-${c.id}`)).filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (suppressSpy.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [categories, query]);

  // keep active pill in view
  React.useEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  const jump = (id: string) => {
    setActive(id);
    suppressSpy.current = true;
    if (suppressTimer.current) window.clearTimeout(suppressTimer.current);
    suppressTimer.current = window.setTimeout(() => {
      suppressSpy.current = false;
    }, 800);
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const offset = (navRef.current?.getBoundingClientRect().height ?? 0) + 8 + (parseInt(stickyTop, 10) || 0);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  };

  const quickAdd = (item: MenuItemDto) => {
    if (needsCustomizer(item)) return openItem(item);
    order.add(buildCartLine(item, {}, lang));
  };

  const q = query.trim().toLowerCase();
  const filtered: MenuCategoryDto[] = q
    ? categories
        .map((c) => ({
          ...c,
          items: c.items.filter((i) => `${t(i.name, "en")} ${t(i.name, "ur")} ${t(i.description, lang)} ${i.tags.join(" ")}`.toLowerCase().includes(q)),
        }))
        .filter((c) => c.items.length)
    : categories;

  const gridCls =
    layout === "cards"
      ? cn("grid gap-4 sm:grid-cols-2", columns === 2 ? "lg:grid-cols-2" : columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")
      : layout === "list"
        ? "grid gap-3 md:grid-cols-2"
        : "";

  return (
    <div className={cn("relative", className)} dir={ctx.dir}>
      {/* sticky nav + search */}
      <div ref={navRef} className="sticky z-30 -mx-4 border-b border-t-border bg-t-bg/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0" style={{ top: stickyTop }}>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                data-cat={c.id}
                onClick={() => jump(c.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active === c.id && !q ? "bg-t-primary text-t-primary-fg shadow" : "bg-t-muted text-t-fg hover:bg-t-primary/15",
                )}
              >
                {t(c.name, lang)}
              </button>
            ))}
          </div>
          {showSearch ? (
            <div className="relative w-36 shrink-0 sm:w-56">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(rs.searchMenu, lang)}
                aria-label={t(ui.search, lang)}
                className="t-input h-9 ps-8 pe-7 text-sm"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} className="absolute end-2 top-1/2 -translate-y-1/2 text-t-muted-fg" aria-label="Clear">
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? <p className="py-16 text-center text-t-muted-fg">{t(rs.noResults, lang)}</p> : null}

      {filtered.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-24 py-6 sm:py-8">
          <h2 className="font-heading mb-4 text-2xl font-bold">{t(c.name, lang)}</h2>
          <div className={gridCls}>
            {c.items.map((item) => (
              <MenuItemCard key={item.id} item={item} ctx={ctx} layout={layout} onSelect={openItem} onQuickAdd={quickAdd} />
            ))}
          </div>
        </section>
      ))}

      <ItemCustomizer
        key={selected ? `${selected.item.id}:${selected.session}` : "none"}
        item={selected?.item ?? null}
        ctx={ctx}
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(line) => order.add(line)}
      />
    </div>
  );
}
