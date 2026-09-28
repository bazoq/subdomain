"use client";

import * as React from "react";
import Link from "next/link";
import { log } from "@/lib/log";
import { brand } from "@/config/brand";

/**
 * Error boundary for the marketing pages (renders inside the header/footer layout). Next 16.3 passes
 * `retry()` (re-fetches and re-renders the segment); `reset()` is kept as a fallback for older runtimes.
 */
export default function SiteError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  React.useEffect(() => {
    // Surfaced to the browser console only; the server side is logged by Next/instrumentation.
    log.error("super-site.pageError", { digest: error.digest, message: error.message });
  }, [error]);
  const again = retry ?? reset;
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6" role="alert">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Something went wrong</p>
      <h1 className="font-display mt-3 text-3xl text-white">This page could not be loaded</h1>
      <p className="mt-3 text-zinc-400">A temporary problem stopped this page from loading. Please try again; if it keeps happening, WhatsApp us at {brand.supportPhone}.</p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-zinc-500">Reference: {error.digest}</p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {again ? (
          <button type="button" onClick={() => again()} className="rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:from-gold-200 hover:to-gold-400">
            Try again
          </button>
        ) : null}
        <Link href="/" className="rounded-full border border-white/15 bg-ink-850 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-ink-900">
          Back to home
        </Link>
      </div>
    </div>
  );
}
