"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Error boundary for every tenant admin page (the shell/nav keeps working). Shows a plain message
 * plus the error digest so support can find it in the logs; never leaks stack traces or SQL.
 */
export default function AdminError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);
  const again = retry ?? reset;
  return (
    <div role="alert" className="mx-auto mt-10 max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">This page could not be loaded</h1>
      <p className="mt-1 text-sm text-slate-600">Something went wrong on our side. Your data is safe — try again in a moment. If it keeps happening, contact support and quote the reference below.</p>
      {error.digest ? (
        <p className="mt-3 text-xs text-slate-400">
          Reference: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {again ? (
          <Button type="button" onClick={() => again()}>
            <RefreshCw /> Try again
          </Button>
        ) : null}
        <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
