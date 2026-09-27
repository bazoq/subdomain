"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Paperclip, Trash2, X } from "lucide-react";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

/**
 * Admin upload fields. a11y: every icon-only control has an `aria-label` and a >= 40px hit area, the native
 * file inputs are hidden from the accessibility tree (the visible buttons open them), errors are `role="alert"`
 * and linked to their trigger with `aria-describedby`, and the hover-only overlays also show on focus.
 */

/** 40px square icon button. */
const iconBtn = "inline-flex size-10 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";

/** Single public image. Value is the public URL. */
export function ImageField({
  value,
  onChange,
  folder = "general",
  className,
  tenantId,
  aspect = "aspect-video",
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  tenantId?: string;
  aspect?: string;
  /** Used in the control labels ("Replace image", "Remove image"). */
  label?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  const errorId = `${id}-error`;
  const urlId = `${id}-url`;
  const lower = label.toLowerCase();
  const noun = lower === "image" ? "an image" : `the ${lower}`;

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
        aria-busy={busy || undefined}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-10 flex-col items-center gap-1 p-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-describedby={error ? errorId : undefined}
            disabled={busy}
          >
            <ImagePlus className="size-6" aria-hidden="true" />
            Click or drop {noun}
          </button>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70" role="status" aria-live="polite">
            <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden="true" />
            <span className="sr-only">Uploading…</span>
          </div>
        ) : null}
        {value ? (
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" onClick={() => inputRef.current?.click()} className={cn(iconBtn, "bg-white/90 text-slate-700 shadow hover:bg-white")} aria-label={`Replace ${lower}`} title={`Replace ${lower}`} disabled={busy}>
              <ImagePlus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onChange("")} className={cn(iconBtn, "bg-white/90 text-red-600 shadow hover:bg-white")} aria-label={`Remove ${lower}`} title={`Remove ${lower}`} disabled={busy}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <button type="button" className="min-h-10 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600" onClick={() => setManual((m) => !m)} aria-expanded={manual} aria-controls={urlId}>
          {manual ? "Hide URL" : `Paste ${lower} URL`}
        </button>
        {error ? (
          <span id={errorId} className="text-red-600" role="alert">
            {error}
          </span>
        ) : null}
      </div>
      {manual ? (
        <input
          id={urlId}
          type="url"
          inputMode="url"
          className="mt-1 h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
          placeholder="https://…"
          aria-label={`${label} URL`}
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
  label = "Images",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
  tenantId?: string;
  /** Plural noun used in the control labels ("Add product images", "Remove product image 2"). */
  label?: string;
}) {
  const [busy, setBusy] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  const errorId = `${id}-error`;

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

  const overlayBtn = cn(iconBtn, "bg-white/90 text-slate-800 shadow hover:bg-white disabled:opacity-40");
  const plural = label.toLowerCase();
  const singular = plural.replace(/s$/, "");

  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" aria-label={label}>
        {value.map((url, i) => (
          <li key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Image ${i + 1} of ${value.length}${i === 0 ? " (main)" : ""}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/30 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <div className="flex justify-end">
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className={cn(overlayBtn, "text-red-600")} aria-label={`Remove ${singular} ${i + 1}`} title="Remove">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => move(i, -1)} className={overlayBtn} aria-label={`Move ${singular} ${i + 1} earlier`} title="Move earlier" disabled={i === 0}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, 1)} className={overlayBtn} aria-label={`Move ${singular} ${i + 1} later`} title="Move later" disabled={i === value.length - 1}>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {i === 0 ? (
              <span className="pointer-events-none absolute left-1 top-1 rounded bg-brand-600 px-1.5 text-[10px] font-semibold text-white" aria-hidden="true">
                Main
              </span>
            ) : null}
          </li>
        ))}
        {value.length < max ? (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square min-h-10 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              aria-label={busy ? `Uploading ${busy} ${busy === 1 ? singular : plural}…` : `Add ${plural} (${value.length} of ${max})`}
              aria-describedby={error ? errorId : undefined}
              aria-busy={busy > 0 || undefined}
            >
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-5" aria-hidden="true" />}
              {busy ? `${busy}…` : "Add"}
            </button>
          </li>
        ) : null}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
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
  const id = React.useId();
  const errorId = `${id}-error`;
  const statusId = `${id}-status`;

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

  const describedBy = [error ? errorId : null, fileName || busy ? statusId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="t-input flex min-h-10 items-center gap-2 text-left"
        disabled={busy}
        aria-label={fileName ? `${label}: ${fileName} selected. Choose a different file` : label}
        aria-describedby={describedBy}
        aria-busy={busy || undefined}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Paperclip className="size-4" aria-hidden="true" />}
        <span className="flex-1 truncate" aria-hidden="true">
          {busy ? `Uploading… ${pct}%` : fileName || label}
        </span>
      </button>
      <span id={statusId} className="sr-only" role="status" aria-live="polite">
        {busy ? `Uploading ${pct}%` : fileName ? `${fileName} uploaded` : ""}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
