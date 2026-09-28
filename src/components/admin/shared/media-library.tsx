"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FileImage, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { uploadFile } from "@/lib/upload-client";
import { cn, formatDate } from "@/lib/utils";
import { deleteMediaAction, listMedia, updateMediaAlt, type MediaRow } from "@/app/%5Fsites/[host]/admin/(dashboard)/media/actions";

export type { MediaRow };

const FOLDERS = ["general", "sections", "products", "menu", "gallery", "team", "services", "posts", "testimonials", "branding"];

function fmtBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

type Filter = { folder: string; q: string };

/**
 * Tenant media library: upload, browse by folder, search by description, edit alt text, copy the
 * URL and delete. Listing/paging goes through server actions (no full-page navigation); only
 * confirmed PUBLIC files ever reach this component.
 */
export function MediaLibrary({
  rows: initialRows,
  folders,
  current,
  storageUsed,
  storageQuota,
  nextCursor: initialCursor,
}: {
  rows: MediaRow[];
  folders: { name: string; count: number }[];
  current: string;
  storageUsed: number;
  storageQuota: number;
  nextCursor?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = React.useState<Filter>({ folder: current, q: "" });
  const [rows, setRows] = React.useState<MediaRow[]>(initialRows);
  const [cursor, setCursor] = React.useState<string | undefined>(initialCursor);
  const [loading, setLoading] = React.useState<"none" | "list" | "more">("none");
  const [busy, setBusy] = React.useState(0);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = React.useState(current === "all" ? "general" : current);
  const [detail, setDetail] = React.useState<MediaRow | null>(null);
  const [status, setStatus] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const reqSeq = React.useRef(0);
  const pct = storageQuota > 0 ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0;
  const total = folders.reduce((n, f) => n + f.count, 0);
  const listId = React.useId();

  /** (Re)load the first page for a filter; stale responses are ignored. */
  const load = React.useCallback(
    async (f: Filter, mode: "list" | "more" = "list", after?: string) => {
      const seq = ++reqSeq.current;
      setLoading(mode);
      let res: Awaited<ReturnType<typeof listMedia>>;
      try {
        res = await listMedia({ folder: f.folder === "all" ? undefined : f.folder, q: f.q.trim() || undefined, cursor: after });
      } catch (e) {
        res = { ok: false, message: (e as Error).message || "Could not load images." };
      }
      if (seq !== reqSeq.current) return;
      setLoading("none");
      if (!res.ok || !res.data) {
        toast.push("error", res.ok ? "Could not load images." : res.message);
        return;
      }
      const data = res.data;
      setRows((prev) => (mode === "more" ? [...prev, ...data.rows.filter((r) => !prev.some((p) => p.id === r.id))] : data.rows));
      setCursor(data.nextCursor);
      const n = data.rows.length;
      setStatus(mode === "more" ? `${n} more image${n === 1 ? "" : "s"} loaded.` : f.q ? `${n}${data.nextCursor ? "+" : ""} image${n === 1 ? "" : "s"} match “${f.q}”.` : "");
    },
    [toast],
  );

  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyFilter(next: Partial<Filter>) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const f = { ...filter, ...next };
    setFilter(f);
    try {
      const u = new URL(window.location.href);
      if (f.folder === "all") u.searchParams.delete("folder");
      else u.searchParams.set("folder", f.folder);
      u.searchParams.delete("cursor");
      window.history.replaceState(window.history.state, "", u.toString());
    } catch {
      /* ignore */
    }
    void load(f);
  }

  function onSearch(q: string) {
    setFilter((f) => ({ ...f, q }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void load({ ...filter, q }), 300);
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.push("error", "Only image files can be uploaded here.");
      return;
    }
    let ok = 0;
    setProgress({ done: 0, total: list.length });
    for (const f of list) {
      setBusy((b) => b + 1);
      try {
        await uploadFile(f, { folder: uploadFolder, visibility: "PUBLIC" });
        ok++;
      } catch (e) {
        toast.push("error", `${f.name}: ${(e as Error).message}`);
      } finally {
        setBusy((b) => b - 1);
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    }
    setProgress(null);
    if (ok) {
      toast.push("success", `${ok} image${ok === 1 ? "" : "s"} uploaded to “${uploadFolder}”.`);
      // show the new files in the grid and refresh folder counts / storage from the server
      const f = filter.folder === "all" || filter.folder === uploadFolder ? filter : { ...filter, folder: uploadFolder };
      if (f !== filter) setFilter(f);
      await load(f);
      router.refresh();
    }
  }

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setStatus("Image address copied.");
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.push("error", "Could not copy. Select the address in the details panel instead.");
    }
  }

  const chip = (name: string, label: string, count?: number) => {
    const active = filter.folder === name;
    return (
      <button
        key={name}
        type="button"
        onClick={() => applyFilter({ folder: name })}
        aria-pressed={active}
        className={cn(
          "min-h-9 rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
          active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        )}
      >
        {label} {count != null ? <span className="opacity-70">({count})</span> : null}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFiles(e.dataTransfer.files);
          }}
        >
          {busy ? <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden="true" /> : <Upload className="size-6 text-slate-400" aria-hidden="true" />}
          <p aria-live="polite">{progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : "Drag & drop images here, or"}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>Folder</span>
              <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">
                {Array.from(new Set([...FOLDERS, ...folders.map((f) => f.name)])).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
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
            aria-label="Choose images to upload"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-slate-400">JPG, PNG, WebP, GIF, AVIF · up to 8 MB each</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Storage used</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBytes(storageUsed)}</p>
          <p className="text-xs text-slate-500">of {fmtBytes(storageQuota)}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct}% used`}>
            <div className={cn("h-full rounded-full", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-brand-600")} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{pct}% used</p>
          {pct > 90 ? <p className="mt-2 text-xs text-red-600">Almost full — delete unused images or ask support to raise your quota.</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Folders">
          {chip("all", "All", total)}
          {folders.map((f) => chip(f.name, f.name, f.count))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={filter.q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by description…"
            aria-label="Search images by description"
            aria-controls={listId}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm shadow-sm focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          {filter.q ? (
            <button type="button" onClick={() => applyFilter({ q: "" })} className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700" aria-label="Clear search">
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div aria-busy={loading === "list" || undefined} className={cn(loading === "list" && "opacity-60 transition-opacity")}>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center text-sm text-slate-500" role="status">
            {loading === "list" ? "Loading…" : filter.q ? `No images match “${filter.q}”.` : filter.folder === "all" ? "No images yet. Upload your first one above." : `No images in “${filter.folder}” yet.`}
          </div>
        ) : (
          <ul id={listId} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" aria-label="Images">
            {rows.map((m) => {
              const label = m.alt || `${m.folder} image, ${fmtBytes(m.size)}`;
              return (
                <li key={m.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-brand-500">
                  <button type="button" onClick={() => setDetail(m)} className="block w-full text-left focus-visible:outline-none" aria-label={`Open details for ${label}`}>
                    <div className="relative aspect-square bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" className="h-full w-full object-contain" loading="lazy" />
                    </div>
                    <div className="px-2 py-1.5 text-[11px] text-slate-500">
                      <p className="truncate text-slate-700">{m.alt || <span className="italic text-amber-700">No description</span>}</p>
                      <p className="truncate">
                        {m.folder} · {m.mime.replace("image/", "").toUpperCase()} · {fmtBytes(m.size)}
                      </p>
                    </div>
                  </button>
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
                    <button type="button" onClick={() => copy(m.url, m.id)} className="flex size-8 items-center justify-center rounded bg-white/90 text-slate-700 shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={copied === m.id ? "Copied" : `Copy address of ${label}`}>
                      {copied === m.id ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {cursor ? (
        <div className="text-center">
          <Button type="button" variant="outline" loading={loading === "more"} onClick={() => void load(filter, "more", cursor)}>
            Load more
          </Button>
        </div>
      ) : rows.length > 0 ? (
        <p className="text-center text-xs text-slate-400">
          Showing all {rows.length} image{rows.length === 1 ? "" : "s"}
          {filter.folder !== "all" ? ` in “${filter.folder}”` : ""}.
        </p>
      ) : null}

      <MediaDetailDialog
        media={detail}
        onClose={() => setDetail(null)}
        onCopy={(m) => copy(m.url, m.id)}
        onSaved={(m) => {
          setRows((r) => r.map((x) => (x.id === m.id ? m : x)));
          setDetail(m);
        }}
        onDeleted={(id) => {
          setRows((r) => r.filter((x) => x.id !== id));
          setDetail(null);
          setStatus("Image deleted.");
          router.refresh();
        }}
      />
    </div>
  );
}

/* ---------- details / alt text / delete ---------- */

function MediaDetailDialog({ media, onClose, onCopy, onSaved, onDeleted }: { media: MediaRow | null; onClose: () => void; onCopy: (m: MediaRow) => void; onSaved: (m: MediaRow) => void; onDeleted: (id: string) => void }) {
  if (!media) return null;
  return <MediaDetailBody key={media.id} media={media} onClose={onClose} onCopy={onCopy} onSaved={onSaved} onDeleted={onDeleted} />;
}

function MediaDetailBody({ media, onClose, onCopy, onSaved, onDeleted }: { media: MediaRow; onClose: () => void; onCopy: (m: MediaRow) => void; onSaved: (m: MediaRow) => void; onDeleted: (id: string) => void }) {
  const toast = useToast();
  const [alt, setAlt] = React.useState(media.alt ?? "");
  const [altError, setAltError] = React.useState<string | undefined>();
  const [saving, setSaving] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const formId = React.useId();
  const dirty = alt.trim() !== (media.alt ?? "");

  async function saveAlt() {
    if (!dirty) return;
    if (alt.trim().length > 200) {
      setAltError("Keep the description under 200 characters");
      return;
    }
    setSaving(true);
    let res: Awaited<ReturnType<typeof updateMediaAlt>>;
    try {
      res = await updateMediaAlt(media.id, alt);
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not save." };
    }
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      onSaved({ ...media, alt: res.data?.alt ?? (alt.trim() || null) });
    } else {
      setAltError(res.fieldErrors?.alt ?? res.message);
      toast.push("error", res.message);
    }
  }

  async function remove() {
    setDeleting(true);
    let res: Awaited<ReturnType<typeof deleteMediaAction>>;
    try {
      res = await deleteMediaAction(media.id);
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not delete." };
    }
    setDeleting(false);
    setConfirming(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Deleted");
      onDeleted(media.id);
    } else toast.push("error", res.message);
  }

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title="Image details"
        description={`${media.folder} · ${media.mime.replace("image/", "").toUpperCase()} · ${fmtBytes(media.size)} · uploaded ${formatDate(media.createdAt)}`}
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 sm:mr-auto" onClick={() => setConfirming(true)} disabled={saving}>
              <Trash2 /> Delete
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" form={formId} loading={saving} disabled={!dirty}>
              Save description
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.url} alt={media.alt ?? ""} className="h-full w-full object-contain" />
          </div>
          <form
            id={formId}
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveAlt();
            }}
          >
            <Field label="Description (alt text)" error={altError} help={`${alt.trim().length}/200 · Read aloud by screen readers and used by Google when the image cannot be shown. Describe what is in the picture, e.g. “Chicken tikka pizza on a wooden board”.`}>
              <Textarea
                value={alt}
                maxLength={200}
                className="min-h-[88px]"
                autoFocus
                onChange={(e) => {
                  setAlt(e.target.value);
                  setAltError(undefined);
                }}
              />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Image address</p>
              <div className="flex gap-2">
                <input readOnly value={media.url} onFocus={(e) => e.currentTarget.select()} aria-label="Image address" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 font-mono text-xs text-slate-700" />
                <Button type="button" variant="outline" onClick={() => onCopy(media)}>
                  <Copy /> Copy
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Paste this address anywhere an image URL is accepted.</p>
            </div>
            <Alert tone="warning" icon={null} className="text-xs">
              Deleting removes the file permanently. Anywhere it is still used — page sections, products, menu items, posts — will show a broken image, so replace it in those places first.
            </Alert>
          </form>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this image?"
        message="This cannot be undone. If the image is still used on your website (a section, product, menu item or post) it will appear broken there until you pick a different image."
        confirmLabel="Delete image"
      />
    </>
  );
}
