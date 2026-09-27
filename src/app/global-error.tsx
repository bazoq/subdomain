"use client";

import { useEffect } from "react";
import { brand } from "@/config/brand";

/**
 * Last-resort error UI, used when a root layout itself throws (tenant or platform). It replaces the whole
 * document, so it renders its own <html>/<body> and carries its own inline styles — no globals, no fonts,
 * nothing that could fail again. Bilingual because we cannot know the tenant's language here.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // The structured logger is not guaranteed to load here; a plain console line still reaches Vercel logs.
    // eslint-disable-next-line no-console
    console.error("global-error", error.digest ?? "", error.message);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Something went wrong</title>
      </head>
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f172a", color: "#f8fafc", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", padding: "1.5rem" }}>
        <main id="main" role="alert" style={{ textAlign: "center", maxWidth: "32rem" }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#a5b4fc", margin: 0 }}>{brand.name}</p>
          <h1 style={{ fontSize: "2rem", lineHeight: 1.2, margin: "1rem 0 0.5rem" }}>Something went wrong</h1>
          <p lang="ur" dir="rtl" style={{ fontSize: "1.25rem", lineHeight: 2, margin: 0 }}>
            کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔
          </p>
          <p style={{ color: "#94a3b8", margin: "1rem 0 0" }}>We could not load this page. Please try again in a moment.</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{ background: "#6366f1", color: "#fff", border: 0, borderRadius: "9999px", padding: "0.75rem 1.5rem", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
            >
              Try again · دوبارہ کوشش کریں
            </button>
            <a href="/" style={{ color: "#f8fafc", border: "2px solid #475569", borderRadius: "9999px", padding: "0.65rem 1.5rem", fontWeight: 600, textDecoration: "none" }}>
              Home · ہوم
            </a>
          </div>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2rem" }}>
              Error reference: <code dir="ltr">{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
