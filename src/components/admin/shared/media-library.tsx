"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, FileImage, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

export type MediaRow = { id: string; url: string; mime: string; size: number; folder: string; alt: string | null; createdAt: string };

const FOLDERS = ["general", "sections", "products", "menu", "gallery", "team", "services", "posts", "testimonials", "branding"];

function fmtBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export function MediaLibrary({ rows, folders, current, storageUsed, storageQuota, nextCursor }: { rows: MediaRow[]; folders: { name: string; count: number }[]; current: string; storageUsed: number; storageQuota: number; nextCursor?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState(0);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [folder, setFolder] = React.useState(current === "all" ? "general" : current);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pct = storageQuota > 0 ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0;

  async function handleFiles(files: FileList | File[]) {
    let ok = 0;
    for (const f of Array.from(files)) {
      setBusy((b) => b + 1);
      try {
        await uploadFile(f, { folder, visibility: "PUBLIC" });
        ok++;
      } catch (e) {
        toast.push("error", `${f.name}: ${(e as Error).message}`);
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (ok) {
      toast.push("success", `${ok} file(s) uploaded.`);
      router.refresh();
    }
  }

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.push("error", "Could not copy. Long-press the image to copy its address.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this file? Anywhere it is used on your website will show a broken image.")) return;
    setDeleting(id);
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      toast.push("success", "Deleted.");
      router.refresh();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.push("error", j.error ?? "Delete failed");
    }
  }

  const chip = (name: string, label: string, count?: number) => (
    <Link key={name} href={name === "all" ? "/admin/media" : `/admin/media?folder=${encodeURIComponent(name)}`} className={cn("rounded-full border px-3 py-1 text-sm", current === name ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>
      {label} {count != null ? <span className="opacity-70">({count})</span> : null}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          {busy ? <Loader2 className="size-6 animate-spin text-brand-600" /> : <Upload className="size-6 text-slate-400" />}
          <p>{busy ? `Uploading ${busy} file(s)…` : "Drag & drop images here, or"}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <select value={folder} onChange={(e) => setFolder(e.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm" aria-label="Upload to folder">
              {Array.from(new Set([...FOLDERS, ...folders.map((f) => f.name)])).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy > 0}>
              <FileImage /> Choose images
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-slate-400">JPG, PNG, WebP, GIF, SVG, AVIF · up to 8 MB each</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Storage used</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBytes(storageUsed)}</p>
          <p className="text-xs text-slate-500">of {fmtBytes(storageQuota)}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-brand-600")} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{pct}% used</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chip("all", "All", folders.reduce((n, f) => n + f.count, 0))}
        {folders.map((f) => chip(f.name, f.name, f.count))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center text-sm text-slate-500">No images here yet.</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {rows.map((m) => (
            <li key={m.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-square bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-contain" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button type="button" onClick={() => copy(m.url, m.id)} className="rounded bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white" title="Copy URL" aria-label="Copy URL">
                    {copied === m.id ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </button>
                  <button type="button" onClick={() => remove(m.id)} disabled={deleting === m.id} className="rounded bg-white/90 p-1.5 text-red-600 shadow hover:bg-white disabled:opacity-50" title="Delete" aria-label="Delete">
                    {deleting === m.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="px-2 py-1.5 text-[11px] text-slate-500">
                <p className="truncate">
                  {m.mime.replace("image/", "").toUpperCase()} · {fmtBytes(m.size)}
                </p>
                <p className="truncate">{m.folder}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {nextCursor ? (
        <div className="text-center">
          <Link href={`/admin/media?${current !== "all" ? `folder=${encodeURIComponent(current)}&` : ""}cursor=${nextCursor}`} className="text-sm font-medium text-brand-600 hover:underline">
            Load more
          </Link>
        </div>
      ) : null}
    </div>
  );
}
