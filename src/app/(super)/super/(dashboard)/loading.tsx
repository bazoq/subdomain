/** Skeleton for super-admin pages while data loads. */
export default function SuperAdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 space-y-2" aria-hidden>
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-xl border border-slate-200 bg-white" aria-hidden />
    </div>
  );
}
