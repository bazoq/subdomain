"use client";

import * as React from "react";
import { Check, FolderOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Public image already in the tenant's media library (serialisable; passed from server pages). */
export type PickerMedia = { id: string; url: string; alt: string | null; folder: string; mime: string; size: number };

const Ctx = React.createContext<PickerMedia[] | null>(null);

/**
 * Makes the tenant's recent public images available to any nested `<MediaPickerButton>`
 * (section editor, settings) without prop-drilling. Pages that own the data fetch it
 * with `listTenantMedia` and pass the serialised rows here.
 */
export function MediaPickerProvider({ media, children }: { media: PickerMedia[]; children: React.ReactNode }) {
  return <Ctx.Provider value={media}>{children}</Ctx.Provider>;
}

export function useMediaPickerItems() {
  return React.useContext(Ctx);
}

function fmtBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export function MediaPickerDialog({
  open,
  onClose,
  onPick,
  multiple = false,
  max = 12,
  title = "Choose from media library",
  exclude = [],
}: {
  open: boolean;
  onClose: () => void;
  onPick: (urls: string[]) => void;
  multiple?: boolean;
  max?: number;
  title?: string;
  /** URLs already in use (shown as such, not selectable) */
  exclude?: string[];
}) {
  const items = React.useContext(Ctx) ?? [];
  const [q, setQ] = React.useState("");
  const [folder, setFolder] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<string[]>([]);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) {
      setSelected([]);
      setQ("");
    }
  }, [open]);

  const folders = React.useMemo(() => Array.from(new Set(items.map((m) => m.folder))).sort(), [items]);
  const needle = q.trim().toLowerCase();
  const visible = items.filter((m) => (folder === "all" || m.folder === folder) && (!needle || (m.alt ?? "").toLowerCase().includes(needle) || m.folder.includes(needle) || m.url.toLowerCase().includes(needle)));

  function toggle(url: string) {
    if (!multiple) {
      onPick([url]);
      onClose();
      return;
    }
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : s.length >= max ? s : [...s, url]));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={multiple ? `Select up to ${max} image${max === 1 ? "" : "s"}.` : "Tap an image to use it."}
      className="max-w-3xl"
      initialFocus={searchRef}
      footer={
        multiple ? (
          <>
            <span className="text-xs text-slate-500 sm:mr-auto" aria-live="polite">
              {selected.length} selected
            </span>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={selected.length === 0}
              onClick={() => {
                onPick(selected);
                onClose();
              }}
            >
              Use {selected.length ? `${selected.length} image${selected.length === 1 ? "" : "s"}` : "selected"}
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by description or folder…" className="pl-9" aria-label="Search images" aria-controls={listId} />
          </div>
          {folders.length > 1 ? (
            <select value={folder} onChange={(e) => setFolder(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm" aria-label="Folder">
              <option value="all">All folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            <FolderOpen className="size-6 text-slate-400" aria-hidden="true" />
            No images in your library yet. Upload one with the button next to this field.
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500" role="status">
            No images match “{q}”.
          </p>
        ) : (
          <ul id={listId} className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" aria-label="Images">
            {visible.map((m) => {
              const used = exclude.includes(m.url);
              const on = selected.includes(m.url);
              const label = m.alt || `${m.folder} image, ${fmtBytes(m.size)}`;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={used}
                    onClick={() => toggle(m.url)}
                    aria-pressed={multiple ? on : undefined}
                    aria-label={used ? `${label} (already added)` : label}
                    className={cn(
                      "group relative block aspect-square w-full overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
                      on ? "border-brand-600 ring-2 ring-brand-500" : "border-slate-200 hover:border-slate-400",
                      used && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    {on ? (
                      <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
                      {m.alt || m.folder}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

/**
 * Small "Choose from library" button with its dialog. Renders nothing when no
 * `<MediaPickerProvider>` is above it (e.g. forms that have not been wired yet).
 */
export function MediaPickerButton({
  onPick,
  multiple,
  max,
  exclude,
  className,
  children = "Choose from library",
}: {
  onPick: (urls: string[]) => void;
  multiple?: boolean;
  max?: number;
  exclude?: string[];
  className?: string;
  children?: React.ReactNode;
}) {
  const items = React.useContext(Ctx);
  const [open, setOpen] = React.useState(false);
  if (items === null) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        <FolderOpen /> {children}
      </Button>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onPick={onPick} multiple={multiple} max={max} exclude={exclude} />
    </>
  );
}
