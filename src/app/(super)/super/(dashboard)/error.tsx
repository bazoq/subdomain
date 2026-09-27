"use client";

import * as React from "react";
import Link from "next/link";
import { log } from "@/lib/log";
import { Button } from "@/components/ui/button";

/** Error boundary for super-admin pages (inside the AdminShell). */
export default function SuperAdminError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  React.useEffect(() => {
    log.error("super-admin.pageError", { digest: error.digest, message: error.message });
  }, [error]);
  const again = retry ?? reset;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6" role="alert">
      <h2 className="text-lg font-semibold text-red-900">This page failed to load</h2>
      <p className="mt-1 text-sm text-red-800">{error.message || "Unexpected error."}</p>
      {error.digest ? <p className="mt-1 font-mono text-xs text-red-700/70">Reference: {error.digest}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {again ? (
          <Button onClick={() => again()} variant="danger">
            Try again
          </Button>
        ) : null}
        <Link href="/super">
          <Button variant="outline">Back to overview</Button>
        </Link>
      </div>
    </div>
  );
}
