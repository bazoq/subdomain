"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Simple list of localized one-liners (inclusions, exclusions, feature bullets). */
export function LocalizedListEditor({
  label,
  value,
  onChange,
  urduEnabled,
  placeholder,
  max = 40,
  suggestions,
}: {
  label: string;
  value: LocalizedString[];
  onChange: (v: LocalizedString[]) => void;
  urduEnabled: boolean;
  placeholder?: string;
  max?: number;
  /** quick-add chips */
  suggestions?: string[];
}) {
  const update = (i: number, patch: Partial<LocalizedString>) => onChange(value.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const remaining = suggestions?.filter((s) => !value.some((v) => v.en.trim().toLowerCase() === s.toLowerCase())) ?? [];
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <Label className="mb-0">
          {label} <span className="text-xs font-normal text-slate-400">({value.length})</span>
        </Label>
        <Button type="button" size="sm" variant="outline" disabled={value.length >= max} onClick={() => onChange([...value, { en: "" }])}>
          <Plus /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className={cn("grid gap-2", urduEnabled ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]")}>
            <Input value={item.en} placeholder={placeholder} onChange={(e) => update(i, { en: e.target.value })} />
            {urduEnabled ? <Input dir="rtl" className="font-urdu" value={item.ur ?? ""} placeholder="اردو" onChange={(e) => update(i, { ur: e.target.value })} /> : null}
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded p-2 text-red-500 hover:bg-red-50" title="Remove" aria-label="Remove">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {value.length === 0 ? <p className="py-2 text-center text-xs text-slate-400">Nothing added yet.</p> : null}
      </div>
      {remaining.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {remaining.slice(0, 12).map((s) => (
            <button key={s} type="button" disabled={value.length >= max} onClick={() => onChange([...value, { en: s }])} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-brand-500 hover:text-brand-700 disabled:opacity-40">
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
