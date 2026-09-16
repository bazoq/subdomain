import { brand } from "@/config/brand";
import { rootUrl } from "@/config/site";

export default function TenantNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">{brand.name}</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">This site is not set up yet</h1>
          <p className="mt-4 max-w-md text-slate-400">
            No website is connected to this address. If you own this domain, ask your {brand.name} administrator to
            assign a template to it.
          </p>
          <a href={rootUrl()} className="mt-8 rounded-full bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400">
            Visit {brand.name}
          </a>
        </main>
      </body>
    </html>
  );
}
