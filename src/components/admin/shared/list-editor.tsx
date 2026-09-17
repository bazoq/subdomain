"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Help } from "@/components/ui/input";
import type { LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Ordered list of localized one-line strings (plan features, service bullet points). */
export function LocalizedListEditor({
  label,
  value,
  onChange,
  urduEnabled,
  max = 20,
  placeholder = "e.g. Free parking",
  help,
  addLabel = "Add item",
}: {
  label: string;
  value: LocalizedString[];
  onChange: (v: LocalizedString[]) => void;
  urduEnabled: boolean;
  max?: number;
  placeholder?: string;
  help?: string;
  addLabel?: string;
}) {
  const items = value ?? [];
  const set = (i: number, v: LocalizedString) => onChange(items.map((it, k) => (k === i ? v : it)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <Label className="mb-0">
          {label} <span className="text-xs font-normal text-slate-400">({items.length}/{max})</span>
        </Label>
        <Button type="button" size="sm" variant="outline" disabled={items.length >= max} onClick={() => onChange([...items, { en: "" }])}>
          <Plus /> {addLabel}
        </Button>
      </div>
      {help ? <Help>{help}</Help> : null}
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className={cn("grid items-center gap-2", urduEnabled ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-[1fr_auto]")}>
            <Input value={it.en} placeholder={placeholder} onChange={(e) => set(i, { ...it, en: e.target.value })} aria-label={`${label} ${i + 1}`} />
            {urduEnabled ? <Input dir="rtl" className="font-urdu" value={it.ur ?? ""} placeholder="اردو" onChange={(e) => set(i, { ...it, ur: e.target.value })} aria-label={`${label} ${i + 1} (Urdu)`} /> : null}
            <div className="flex items-center">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Move up" aria-label="Move up">
                <ChevronUp className="size-4" />
              </button>
              <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Move down" aria-label="Move down">
                <ChevronDown className="size-4" />
              </button>
              <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} className="rounded p-1 text-red-500 hover:bg-red-50" title="Remove" aria-label="Remove">
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 ? <li className="py-2 text-center text-xs text-slate-400">No items yet.</li> : null}
      </ul>
    </div>
  );
}

/** Tag / chip input: type and press Enter or comma. */
export function ChipsInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter",
  max = 20,
  help,
  suggestions,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
  help?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = React.useState("");
  const id = React.useId();
  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(new Set([...value, ...parts])).slice(0, max);
    onChange(next);
    setDraft("");
  };
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500">
        {value.map((chip) => (
          <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
            {chip}
            <button type="button" onClick={() => onChange(value.filter((c) => c !== chip))} className="rounded-full hover:bg-brand-100" aria-label={`Remove ${chip}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
          list={suggestions?.length ? `${id}-list` : undefined}
        />
        {suggestions?.length ? (
          <datalist id={`${id}-list`}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
      {help ? <Help>{help}</Help> : null}
    </div>
  );
}
