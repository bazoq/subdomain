/**
 * Instant loading state for every public page under the template layout (header/footer stay interactive).
 * Pure skeleton: no data access, so it can stream immediately. Announced once to screen readers.
 */
export default function SiteLoading() {
  return (
    <div className="t-container py-12 sm:py-16" aria-busy="true" aria-live="polite">
      <p className="sr-only">
        <span lang="en">Loading…</span> <span lang="ur">لوڈ ہو رہا ہے…</span>
      </p>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-24 rounded-full bg-t-muted" />
        <div className="mt-4 h-10 w-2/3 max-w-xl rounded-[var(--t-radius)] bg-t-muted" />
        <div className="mt-3 h-5 w-1/2 max-w-md rounded-[var(--t-radius)] bg-t-muted" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="t-card overflow-hidden">
              <div className="aspect-[4/3] w-full bg-t-muted" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 rounded-full bg-t-muted" />
                <div className="h-3 w-full rounded-full bg-t-muted" />
                <div className="h-3 w-5/6 rounded-full bg-t-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
