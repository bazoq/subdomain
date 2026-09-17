"use client";

/** Modal: size, modifier groups (min/max/required), quantity, note, live price → add to order. */
import * as React from "react";
import { Minus, Plus, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { rs } from "../strings";
import type { CartLineInput, MenuItemDto, MenuModifierGroupDto, RestaurantCtx } from "../types";
import { TagBadges } from "./tag-badges";

export function buildCartLine(item: MenuItemDto, opts: { sizeName?: string; modifierIds?: string[]; qty?: number; note?: string }, lang: RestaurantCtx["lang"]): CartLineInput {
  const size = item.sizes.length ? (item.sizes.find((s) => s.name === opts.sizeName) ?? item.sizes[0]) : null;
  const base = size ? size.price : item.price;
  const chosen = item.modifierGroups.flatMap((g) => g.modifiers.filter((m) => opts.modifierIds?.includes(m.id)));
  const extras = chosen.reduce((s, m) => s + m.price, 0);
  return {
    menuItemId: item.id,
    slug: item.slug,
    name: t(item.name, lang),
    sizeName: size?.name,
    unitPrice: base + extras,
    modifiers: chosen.map((m) => ({ id: m.id, name: t(m.name, lang), price: m.price })),
    qty: Math.max(1, opts.qty ?? 1),
    note: opts.note?.trim() || undefined,
    imageUrl: item.imageUrl ?? undefined,
  };
}

function groupMin(g: MenuModifierGroupDto) {
  return g.required ? Math.max(1, g.minSelect) : g.minSelect;
}

/**
 * Item customizer modal. State is initialised from `item`; the parent should pass a fresh
 * `key` each time it opens (e.g. `${item.id}:${n}`) so selections reset per opening.
 */
export function ItemCustomizer({
  item,
  ctx,
  open,
  onClose,
  onAdd,
}: {
  item: MenuItemDto | null;
  ctx: RestaurantCtx;
  open: boolean;
  onClose: () => void;
  onAdd: (line: CartLineInput) => void;
}) {
  const lang = ctx.lang;
  const [sizeName, setSizeName] = React.useState<string | undefined>(() => item?.sizes[0]?.name);
  const [selected, setSelected] = React.useState<Record<string, string[]>>({});
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const modifierIds = Object.values(selected).flat();
  const line = buildCartLine(item, { sizeName, modifierIds, qty, note }, lang);
  const total = line.unitPrice * qty;

  const invalidGroups = item.modifierGroups.filter((g) => {
    const n = selected[g.id]?.length ?? 0;
    return n < groupMin(g) || n > g.maxSelect;
  });

  function toggle(g: MenuModifierGroupDto, id: string) {
    setSelected((prev) => {
      const cur = prev[g.id] ?? [];
      if (g.maxSelect === 1) return { ...prev, [g.id]: cur[0] === id && !g.required ? [] : [id] };
      if (cur.includes(id)) return { ...prev, [g.id]: cur.filter((x) => x !== id) };
      if (cur.length >= g.maxSelect) return prev;
      return { ...prev, [g.id]: [...cur, id] };
    });
  }

  function submit() {
    setTouched(true);
    if (invalidGroups.length) return;
    onAdd(line);
    onClose();
  }

  const name = t(item.name, lang);
  const desc = t(item.description, lang);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={name} dir={ctx.dir}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-t-card text-t-fg shadow-2xl sm:rounded-[var(--t-radius)]">
        {item.imageUrl ? (
          <div className="relative h-44 w-full shrink-0 sm:h-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={name} className="h-full w-full object-cover" />
            <TagBadges tags={item.tags} lang={lang} className="absolute start-3 top-3" />
          </div>
        ) : null}
        <button type="button" onClick={onClose} aria-label="Close" className="absolute end-3 top-3 z-20 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">
          <X className="size-4" />
        </button>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h2 className="font-heading text-xl font-bold">{name}</h2>
          {desc ? <p className="mt-1 text-sm text-t-muted-fg">{desc}</p> : null}
          {!item.imageUrl ? <TagBadges tags={item.tags} lang={lang} className="mt-2" /> : null}

          {item.sizes.length > 0 ? (
            <fieldset className="mt-5">
              <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
                {t(rs.size, lang)}
                <span className="rounded-full bg-t-muted px-2 py-0.5 text-[10px] font-medium uppercase text-t-muted-fg">{t(rs.required, lang)}</span>
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {item.sizes.map((s) => {
                  const active = s.name === sizeName;
                  return (
                    <label
                      key={s.name}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-[var(--t-radius)] border px-2 py-2 text-center text-sm transition",
                        active ? "border-t-primary bg-t-primary/10 font-semibold text-t-primary" : "border-t-border hover:border-t-primary/50",
                      )}
                    >
                      <input type="radio" name="size" className="sr-only" checked={active} onChange={() => setSizeName(s.name)} />
                      <span>{s.name}</span>
                      <span className="text-xs text-t-muted-fg">{formatPKR(s.price)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {item.modifierGroups.map((g) => {
            const cur = selected[g.id] ?? [];
            const min = groupMin(g);
            const invalid = touched && (cur.length < min || cur.length > g.maxSelect);
            const single = g.maxSelect === 1;
            return (
              <fieldset key={g.id} className="mt-5">
                <legend className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {t(g.name, lang)}
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", min > 0 ? "bg-t-primary/10 text-t-primary" : "bg-t-muted text-t-muted-fg")}>
                    {min > 0 ? t(rs.required, lang) : t(rs.optional, lang)}
                  </span>
                  <span className="text-xs font-normal text-t-muted-fg">
                    {min > 1 ? `${t(rs.chooseAtLeast, lang)} ${min} · ` : ""}
                    {g.maxSelect > 1 ? `${t(rs.chooseUpTo, lang)} ${g.maxSelect}` : ""}
                  </span>
                </legend>
                <div className={cn("divide-y divide-t-border rounded-[var(--t-radius)] border", invalid ? "border-red-500" : "border-t-border")}>
                  {g.modifiers.map((m) => {
                    const checked = cur.includes(m.id);
                    const disabled = !checked && !single && cur.length >= g.maxSelect;
                    return (
                      <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm", disabled && "cursor-not-allowed opacity-50")}>
                        <input
                          type={single ? "radio" : "checkbox"}
                          name={`g-${g.id}`}
                          className="size-4 accent-[var(--t-primary)]"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggle(g, m.id)}
                          onClick={single && checked && !g.required ? () => toggle(g, m.id) : undefined}
                        />
                        <span className="flex-1">{t(m.name, lang)}</span>
                        {m.price > 0 ? <span className="text-xs text-t-muted-fg">+{formatPKR(m.price)}</span> : null}
                      </label>
                    );
                  })}
                </div>
                {invalid ? <p className="mt-1 text-xs text-red-600">{t(rs.tooFewSelected, lang)}</p> : null}
              </fieldset>
            );
          })}

          <div className="mt-5">
            <label className="mb-1 block text-sm font-semibold">{t(rs.specialNote, lang)}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} rows={2} className="t-input" placeholder={lang === "ur" ? "مثلاً: کم مرچ" : "e.g. less spicy, no onions"} />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-t-border px-5 py-3">
          <div className="flex items-center rounded-[var(--t-radius)] border border-t-border">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-10 items-center justify-center hover:bg-t-muted" aria-label="Decrease">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="flex size-10 items-center justify-center hover:bg-t-muted" aria-label="Increase">
              <Plus className="size-4" />
            </button>
          </div>
          <button type="button" onClick={submit} className="t-btn t-btn-primary h-11 flex-1 justify-between px-4 text-sm">
            <span>{t(rs.addToOrder, lang)}</span>
            <span className="font-bold">{formatPKR(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
