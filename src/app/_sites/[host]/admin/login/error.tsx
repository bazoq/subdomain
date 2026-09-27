"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error boundary for the sign-in page: keeps the message generic and offers a retry. */
export default function LoginError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  const again = retry ?? reset;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div role="alert" className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">Sign-in is temporarily unavailable</h1>
        <p className="mt-1 text-sm text-slate-600">Please try again in a moment. If the problem continues, contact support{error.digest ? ` and quote reference ${error.digest}` : ""}.</p>
        {again ? (
          <Button type="button" className="mt-5" onClick={() => again()}>
            <RefreshCw /> Try again
          </Button>
        ) : null}
      </div>
    </main>
  );
}
