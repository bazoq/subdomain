"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FolderInput, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ImagesField } from "@/components/admin/uploader";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { addGalleryImages, deleteGalleryItems, moveGalleryItems, reorderGallery, updateGalleryItem } from "@/modules/shared/gallery-actions";
import type { LocalizedString } from "@/lib/i18n";
import { cn, slugify } from "@/lib/utils";

export type GalleryRow = { id: string; imageUrl: string; caption: LocalizedString; album: string; sortOrder: number };

const albumSlug = (s: string) => slugify(s).replace(/-+/g, "-").slice(0, 40) || "general";

export function GalleryManager({ rows, albums, current, urduEnabled }: { rows: GalleryRow[]; albums: { name: string; count: number }[]; current: string; urduEnabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GalleryRow | null>(null);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function run(p: Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    const res = await p;
    setBusy(false);
    if (res.ok) {
      if (res.message) toast.push("success", res.message);
      setSelected(new Set());
      router.refresh();
      return true;
    }
    toast.push("error", res.message ?? "Failed");
    return false;
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const ids = rows.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await run(reorderGallery(ids));
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => setUploadOpen(true)}>
          <Upload /> Upload images
        </Button>
        {current !== "all" ? (
          <Button variant="outline" onClick={() => setRenameOpen(true)}>
            <Pencil /> Rename album
          </Button>
        ) : null}
        {selected.size ? (
          <>
            <span className="ms-2 text-sm text-slate-500">{selected.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
              <FolderInput /> Move to album
            </Button>
            <Button variant="danger" size="sm" loading={busy} onClick={() => window.confirm(`Delete ${selected.size} image(s)?`) && run(deleteGalleryItems(Array.from(selected)))}>
              <Trash2 /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center text-sm text-slate-500">No images in this album yet. Upload a few photos of your shop, products or work.</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {rows.map((r, i) => {
            const sel = selected.has(r.id);
            return (
              <li key={r.id} className={cn("group relative overflow-hidden rounded-lg border bg-white shadow-sm", sel ? "border-brand-500 ring-2 ring-brand-500" : "border-slate-200")}>
                <label className="absolute left-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded bg-white/90 shadow">
                  <input type="checkbox" checked={sel} onChange={() => toggle(r.id)} className="size-3.5 accent-brand-600" aria-label="Select image" />
                </label>
                <button type="button" onClick={() => setEditing(r)} className="block aspect-square w-full bg-slate-100" title="Edit caption">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imageUrl} alt={r.caption.en} className="h-full w-full object-cover" loading="lazy" />
                </button>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <p className="min-w-0 flex-1 truncate text-xs text-slate-600">{r.caption.en || <span className="text-slate-400">No caption</span>}</p>
                  {current === "all" ? <span className="rounded bg-slate-100 px-1.5 text-[10px] text-slate-500">{r.album}</span> : null}
                </div>
                {current !== "all" ? (
                  <div className="absolute inset-x-0 bottom-8 flex justify-between px-1 opacity-0 transition group-hover:opacity-100">
                    <button type="button" disabled={i === 0 || busy} onClick={() => move(i, -1)} className="rounded bg-white/90 p-1 shadow disabled:opacity-30" aria-label="Move earlier">
                      <ChevronLeft className="size-4" />
                    </button>
                    <button type="button" disabled={i === rows.length - 1 || busy} onClick={() => move(i, 1)} className="rounded bg-white/90 p-1 shadow disabled:opacity-30" aria-label="Move later">
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <UploadDialog key={`upload-${current}`} open={uploadOpen} onClose={() => setUploadOpen(false)} albums={albums.map((a) => a.name)} defaultAlbum={current === "all" ? "general" : current} onDone={() => router.refresh()} />
      {editing ? <EditDialog row={editing} albums={albums.map((a) => a.name)} urduEnabled={urduEnabled} onClose={() => setEditing(null)} onSaved={() => router.refresh()} /> : null}
      <AlbumDialog
        key={`move-${moveOpen}`}
        open={moveOpen}
        title={`Move ${selected.size} image(s) to album`}
        albums={albums.map((a) => a.name)}
        onClose={() => setMoveOpen(false)}
        onSubmit={async (album) => (await run(moveGalleryItems({ ids: Array.from(selected), toAlbum: album }))) && setMoveOpen(false)}
      />
      <AlbumDialog
        key={`rename-${current}-${renameOpen}`}
        open={renameOpen}
        title={`Rename album "${current}"`}
        albums={[]}
        initial={current}
        onClose={() => setRenameOpen(false)}
        onSubmit={async (album) => {
          const ok = await run(moveGalleryItems({ fromAlbum: current, toAlbum: album }));
          if (ok) {
            setRenameOpen(false);
            router.push(`/admin/gallery?album=${encodeURIComponent(album)}`);
          }
        }}
      />
    </>
  );
}

function UploadDialog({ open, onClose, albums, defaultAlbum, onDone }: { open: boolean; onClose: () => void; albums: string[]; defaultAlbum: string; onDone: () => void }) {
  const [urls, setUrls] = React.useState<string[]>([]);
  const [album, setAlbum] = React.useState(defaultAlbum);
  const [newAlbum, setNewAlbum] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const target = album === "__new" ? albumSlug(newAlbum) : album;

  async function save() {
    setSaving(true);
    const res = await addGalleryImages({ album: target, urls });
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Added");
      setUrls([]);
      onClose();
      onDone();
    } else toast.push("error", res.message);
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Upload images"
      description="Images are added to the gallery as soon as you save. You can add captions afterwards."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!urls.length || (album === "__new" && !newAlbum.trim())}>
            Add {urls.length ? `${urls.length} image(s)` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Album">
            <Select value={album} onChange={(e) => setAlbum(e.target.value)}>
              {!albums.includes("general") ? <option value="general">general</option> : null}
              {albums.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              <option value="__new">+ New album…</option>
            </Select>
          </Field>
          {album === "__new" ? (
            <Field label="New album name" help={newAlbum ? `Saved as "${albumSlug(newAlbum)}"` : "e.g. shop, products, events, transformations"}>
              <Input value={newAlbum} onChange={(e) => setNewAlbum(e.target.value)} />
            </Field>
          ) : null}
        </div>
        <ImagesField value={urls} onChange={setUrls} folder="gallery" max={40} />
      </div>
    </Dialog>
  );
}

function EditDialog({ row, albums, urduEnabled, onClose, onSaved }: { row: GalleryRow; albums: string[]; urduEnabled: boolean; onClose: () => void; onSaved: () => void }) {
  const [caption, setCaption] = React.useState<LocalizedString>(row.caption);
  const [album, setAlbum] = React.useState(row.album);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  async function save() {
    setSaving(true);
    const res = await updateGalleryItem(row.id, { caption, album: albumSlug(album) });
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      onClose();
      onSaved();
    } else toast.push("error", res.message);
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit image"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.imageUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
        <div className="space-y-4">
          <LocalizedInput label="Caption" value={caption} onChange={setCaption} urduEnabled={urduEnabled} placeholder="e.g. Our Gulberg branch" />
          <Field label="Album">
            <Input value={album} list="gallery-albums" onChange={(e) => setAlbum(e.target.value)} />
            <datalist id="gallery-albums">
              {albums.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function AlbumDialog({ open, title, albums, initial = "", onClose, onSubmit }: { open: boolean; title: string; albums: string[]; initial?: string; onClose: () => void; onSubmit: (album: string) => Promise<unknown> }) {
  const [value, setValue] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            disabled={!value.trim()}
            onClick={async () => {
              setSaving(true);
              await onSubmit(albumSlug(value));
              setSaving(false);
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <Field label="Album name" help={value ? `Saved as "${albumSlug(value)}"` : "Letters, numbers and dashes"}>
        <Input value={value} list="album-dialog-list" onChange={(e) => setValue(e.target.value)} autoFocus />
        <datalist id="album-dialog-list">
          {albums.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </Field>
    </Dialog>
  );
}
