"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Help, Input, Label } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

/** List of ISO dates (departures). Sorted, de-duplicated. */
export function DateListEditor({ label, value, onChange, max = 40, help }: { label: string; value: string[]; onChange: (v: string[]) => void; max?: number; help?: string }) {
  const [draft, setDraft] = React.useState("");
  const today = new Date().toISOString().slice(0, 10);
  function add() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft) || value.includes(draft) || value.length >= max) return;
    onChange([...value, draft].sort());
    setDraft("");
  }
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <Label>
        {label} <span className="text-xs font-normal text-slate-400">({value.length})</span>
      </Label>
      <div className="flex gap-2">
        <Input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="max-w-[200px]"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft || value.length >= max}>
          <Plus /> Add date
        </Button>
      </div>
      {help ? <Help>{help}</Help> : null}
      {value.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {value.map((d) => (
            <li key={d} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${d < today ? "border-slate-200 bg-slate-50 text-slate-400 line-through" : "border-slate-300 bg-white text-slate-700"}`}>
              {formatDate(d)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== d))} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600" aria-label={`Remove ${d}`}>
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
