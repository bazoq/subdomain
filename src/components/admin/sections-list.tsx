"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, Lock, Pencil } from "lucide-react";
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

/**
 * Ordered list of template sections with enable/disable and move up/down. Every change is
 * optimistic, announced through a live region, and rolled back with a toast on failure.
 */
export function SectionsList({ rows: initial }: { rows: SectionRow[] }) {
  const [rows, setRows] = React.useState(initial);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("");
  const toast = useToast();
  const router = useRouter();
  const listId = React.useId();

  async function toggle(key: string, enabled: boolean) {
    const row = rows.find((r) => r.key === key);
    setRows((r) => r.map((x) => (x.key === key ? { ...x, enabled } : x)));
    setBusy(key);
    let res: Awaited<ReturnType<typeof toggleSection>>;
    try {
      res = await toggleSection(key, enabled);
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not update section." };
    }
    setBusy(null);
    if (!res.ok) {
      toast.push("error", res.message);
      setRows((r) => r.map((x) => (x.key === key ? { ...x, enabled: !enabled } : x)));
      setStatus(`Could not ${enabled ? "enable" : "disable"} ${row?.label ?? "section"}.`);
    } else {
      setStatus(`${row?.label ?? "Section"} ${enabled ? "is now shown on your website" : "is now hidden from your website"}.`);
      router.refresh();
    }
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const prev = rows;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    const moved = rows[i];
    setBusy(moved.key);
    let res: Awaited<ReturnType<typeof reorderSections>>;
    try {
      res = await reorderSections(next.map((r) => r.key));
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not reorder sections." };
    }
    setBusy(null);
    if (!res.ok) {
      toast.push("error", res.message);
      setRows(prev);
      setStatus(`Could not move ${moved.label}.`);
    } else {
      setStatus(`${moved.label} moved ${dir === -1 ? "up" : "down"} to position ${j + 1} of ${rows.length}.`);
      router.refresh();
      // keep keyboard focus on the same section's button after the rows re-render
      requestAnimationFrame(() => {
        document.getElementById(`${listId}-${moved.key}-${dir === -1 ? "up" : "down"}`)?.focus();
      });
    }
  }

  const iconBtn = "flex size-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Page sections in display order">
        {rows.map((r, i) => (
          <li key={r.key} className={cn("flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4", !r.enabled && "bg-slate-50/70")} aria-busy={busy === r.key || undefined}>
            <div className="flex flex-col">
              <button id={`${listId}-${r.key}-up`} type="button" disabled={i === 0 || busy !== null} onClick={() => move(i, -1)} className={iconBtn} aria-label={`Move ${r.label} up`}>
                <ChevronUp className="size-4" aria-hidden="true" />
              </button>
              <button id={`${listId}-${r.key}-down`} type="button" disabled={i === rows.length - 1 || busy !== null} onClick={() => move(i, 1)} className={iconBtn} aria-label={`Move ${r.label} down`}>
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", r.enabled ? "text-slate-900" : "text-slate-500")}>
                <span className="mr-1.5 text-xs text-slate-400" aria-hidden="true">
                  {i + 1}.
                </span>
                {r.label}
                {!r.enabled ? <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">Hidden</span> : null}
              </p>
              {r.description ? <p className="truncate text-xs text-slate-500">{r.description}</p> : null}
            </div>
            {r.canDisable ? (
              <Switch checked={r.enabled} disabled={busy === r.key} onChange={(v) => toggle(r.key, v)} label={r.enabled ? "Shown" : "Hidden"} description={undefined} />
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Lock className="size-3" aria-hidden="true" /> Always on
              </span>
            )}
            <div className="flex items-center gap-1">
              <a
                href={`/#${r.key}`}
                target="_blank"
                rel="noreferrer"
                className="hidden size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex"
                aria-label={`Preview ${r.label} on website (opens in a new tab)`}
                title="Preview on website"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
              <Link
                href={`/admin/content/${r.key}`}
                className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-300 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label={`Edit ${r.label}`}
              >
                <Pencil className="size-3.5" aria-hidden="true" /> Edit
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
