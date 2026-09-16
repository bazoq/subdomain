"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Lock, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { reorderSections, toggleSection } from "@/server/content/actions";
import { cn } from "@/lib/utils";

export interface SectionRow {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  canDisable: boolean;
}

export function SectionsList({ rows: initial }: { rows: SectionRow[] }) {
  const [rows, setRows] = React.useState(initial);
  const toast = useToast();
  const router = useRouter();

  async function toggle(key: string, enabled: boolean) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, enabled } : x)));
    const res = await toggleSection(key, enabled);
    if (!res.ok) {
      toast.push("error", res.message);
      setRows((r) => r.map((x) => (x.key === key ? { ...x, enabled: !enabled } : x)));
    } else router.refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    const res = await reorderSections(next.map((r) => r.key));
    if (!res.ok) toast.push("error", res.message);
    else router.refresh();
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      {rows.map((r, i) => (
        <li key={r.key} className={cn("flex items-center gap-3 px-4 py-3", !r.enabled && "bg-slate-50/70")}>
          <div className="flex flex-col">
            <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move up">
              <ChevronUp className="size-4" />
            </button>
            <button disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move down">
              <ChevronDown className="size-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium", r.enabled ? "text-slate-900" : "text-slate-500")}>{r.label}</p>
            {r.description ? <p className="truncate text-xs text-slate-500">{r.description}</p> : null}
          </div>
          {r.canDisable ? (
            <Switch checked={r.enabled} onChange={(v) => toggle(r.key, v)} />
          ) : (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Lock className="size-3" /> Always on
            </span>
          )}
          <Link href={`/admin/content/${r.key}`} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Pencil className="size-3.5" /> Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}
