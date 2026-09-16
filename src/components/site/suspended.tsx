export function SuspendedSite({ name }: { name: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center text-slate-800">
      <div className="rounded-2xl border border-amber-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">Temporarily unavailable</p>
        <h1 className="mt-3 text-3xl font-bold">{name}</h1>
        <p className="mt-3 max-w-sm text-slate-500">
          This website is currently suspended. Please check back soon or contact the business directly.
        </p>
      </div>
    </main>
  );
}
