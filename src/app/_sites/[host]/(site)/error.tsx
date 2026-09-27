"use client";

import { useEffect, useState } from "react";
import { t, ui, type Lang } from "@/lib/i18n";
import { log } from "@/lib/log";

/**
 * Error boundary for public pages: renders inside the template layout, so the header/footer keep working.
 * Server-side error details never reach the client (Next replaces the message); the digest is shown so a
 * customer can quote it to support.
 */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(document.documentElement.lang.toLowerCase().startsWith("ur") ? "ur" : "en");
  }, []);

  useEffect(() => {
    log.error("site segment error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <section className="t-container py-20 text-center sm:py-28" role="alert" aria-live="assertive">
      <p className="t-eyebrow">500</p>
      <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t(ui.errorTitle, lang)}</h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-t-muted-fg">{t(ui.errorText, lang)}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => retry()} className="t-btn t-btn-primary">
          {t(ui.tryAgain, lang)}
        </button>
        <a href="/" className="t-btn t-btn-outline text-t-fg">
          {t(ui.backHome, lang)}
        </a>
      </div>
      {error.digest ? (
        <p className="mt-8 text-xs text-t-muted-fg">
          {t(ui.errorCode, lang)}: <code dir="ltr" className="font-mono">{error.digest}</code>
        </p>
      ) : null}
    </section>
  );
}
