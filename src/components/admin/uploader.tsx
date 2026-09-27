"use client";

import * as React from "react";
import { ImagePlus, Loader2, Paperclip, Trash2, X } from "lucide-react";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

/** Single public image. Value is the public URL. */
export function ImageField({
  value,
  onChange,
  folder = "general",
  className,
  tenantId,
  aspect = "aspect-video",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  tenantId?: string;
  aspect?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setBusy(true);
    setError(null);
    try {
      const res = await uploadFile(file, { folder, visibility: "PUBLIC", tenantId });
      if (res.url) onChange(res.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500",
          aspect,
          "max-h-56",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handle(f);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-1 p-4 text-sm">
            <ImagePlus className="size-6" />
            Click or drop an image
          </button>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-brand-600" />
          </div>
        ) : null}
        {value ? (
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-md bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white" title="Replace">
              <ImagePlus className="size-4" />
            </button>
            <button type="button" onClick={() => onChange("")} className="rounded-md bg-white/90 p-1.5 text-red-600 shadow hover:bg-white" title="Remove">
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <button type="button" className="underline" onClick={() => setManual((m) => !m)}>
          {manual ? "Hide URL" : "Paste image URL"}
        </button>
        {error ? <span className="text-red-600">{error}</span> : null}
      </div>
      {manual ? (
        <input
          className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

/** Multiple public images (gallery / product images). */
export function ImagesField({
  value,
  onChange,
  folder = "general",
  max = 12,
  tenantId,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
  tenantId?: string;
}) {
  const [busy, setBusy] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    setError(null);
    let current = value;
    for (const f of list) {
      setBusy((b) => b + 1);
      try {
        const res = await uploadFile(f, { folder, visibility: "PUBLIC", tenantId });
        if (res.url) {
          current = [...current, res.url];
          onChange(current);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {value.map((url, i) => (
          <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 px-1.5 text-xs">
                ←
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-red-600">
                <X className="size-3" />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 px-1.5 text-xs">
                →
              </button>
            </div>
            {i === 0 ? <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 text-[10px] font-semibold text-white">Main</span> : null}
          </div>
        ))}
        {value.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 hover:bg-slate-100"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            Add
          </button>
        ) : null}
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
      {error ? <p className="mt-1 text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}

/** Private document upload (CV, prescription, print file). Value is the Media id. */
export function FileField({
  value,
  onChange,
  folder = "documents",
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  label = "Choose file",
  name,
}: {
  value: string;
  onChange: (mediaId: string, fileName: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
  name?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [pct, setPct] = React.useState(0);
  const [fileName, setFileName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setBusy(true);
    setError(null);
    setPct(0);
    try {
      const res = await uploadFile(file, { folder, visibility: "PRIVATE", onProgress: setPct });
      setFileName(file.name);
      onChange(res.id, file.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="t-input flex items-center gap-2 text-left"
        disabled={busy}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        <span className="flex-1 truncate">{busy ? `Uploading… ${pct}%` : fileName || label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      {error ? <p className="mt-1 text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
