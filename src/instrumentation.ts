import type { Instrumentation } from "next";
import { errorFields, log } from "@/lib/log";

/**
 * Next.js instrumentation hook (see node_modules/next/dist/docs/01-app/02-guides/instrumentation.md).
 *
 * - `register()` runs once per server instance before it accepts requests.
 * - `onRequestError()` receives every uncaught server error (render, route handler, server
 *   action, proxy) and is the single place to forward errors to an external collector.
 *
 * Sentry / OpenTelemetry are intentionally NOT dependencies yet. To enable Sentry later:
 *   1. `npm i @sentry/nextjs` and set `SENTRY_DSN` in Vercel.
 *   2. In `register()` call `Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 })`
 *      (guarded by `process.env.NEXT_RUNTIME === "nodejs"`), and in `onRequestError`
 *      call `Sentry.captureRequestError(err, request, context)`.
 * Nothing else in the app needs to change.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  log.info("server.start", {
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    region: process.env.VERCEL_REGION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    rootDomain: process.env.ROOT_DOMAIN,
    errorReporting: process.env.SENTRY_DSN ? "sentry-dsn-present-but-sdk-not-installed" : "logs-only",
  });
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  log.error("request.error", {
    ...errorFields(err),
    method: request.method,
    path: request.path,
    host: headerValue(request.headers["x-forwarded-host"]) ?? headerValue(request.headers.host),
    tenantHost: headerValue(request.headers["x-tenant-host"]),
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  });
};

function headerValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
