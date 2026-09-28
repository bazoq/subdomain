/** Skeleton shown while a marketing page streams in. Announced once via aria-busy; no text to translate. */
export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="max-w-2xl space-y-3" aria-hidden>
        <div className="h-3 w-24 rounded bg-white/[0.08]" />
        <div className="h-9 w-3/4 rounded bg-white/[0.08]" />
        <div className="h-4 w-full rounded bg-white/[0.06]" />
        <div className="h-4 w-5/6 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-ink-850">
            <div className="aspect-[16/10] w-full bg-white/[0.04]" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 rounded bg-white/[0.08]" />
              <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
              <div className="h-3 w-full rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
