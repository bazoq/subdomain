import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/log";

/**
 * POST /api/csp-report — sink for the report-only CSP emitted by proxy.ts.
 *
 * Browsers POST here without cookies and with `Origin: null`, so there is deliberately no
 * same-origin check and no auth. The body is bounded, parsed defensively and written to the
 * server log as a single compact line (visible in Vercel logs). No database is touched, so a
 * flood of reports cannot exhaust connections; browsers also throttle reports client-side.
 */

const MAX_BODY = 16 * 1024;
const KEEP = [
  "document-uri",
  "documentURL",
  "violated-directive",
  "effective-directive",
  "effectiveDirective",
  "blocked-uri",
  "blockedURL",
  "source-file",
  "sourceFile",
  "line-number",
  "lineNumber",
  "disposition",
] as const;

type Report = Record<string, unknown>;

function compact(r: Report): Report {
  const out: Report = {};
  for (const k of KEEP) {
    const v = r[k];
    if (typeof v === "string") out[k] = v.slice(0, 300);
    else if (typeof v === "number") out[k] = v;
  }
  const sample = r["script-sample"] ?? r.sample;
  if (typeof sample === "string") out.sample = sample.slice(0, 80);
  return out;
}

function extract(json: unknown): Report[] {
  if (Array.isArray(json)) {
    // Reporting API: [{ type: "csp-violation", body: {...} }, ...]
    return json
      .filter((e): e is Report => typeof e === "object" && e !== null)
      .map((e) => (typeof e.body === "object" && e.body !== null ? (e.body as Report) : e));
  }
  if (typeof json === "object" && json !== null) {
    const legacy = (json as Report)["csp-report"];
    if (typeof legacy === "object" && legacy !== null) return [legacy as Report];
    return [json as Report];
  }
  return [];
}

export async function POST(req: NextRequest) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return new NextResponse(null, { status: 413 });
  let text = "";
  try {
    text = (await req.text()).slice(0, MAX_BODY);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const host = req.headers.get("x-request-host") ?? req.headers.get("host") ?? "";
  for (const r of extract(json).slice(0, 5)) {
    log.warn("csp.violation", { host: host.slice(0, 120), ...compact(r) });
  }
  return new NextResponse(null, { status: 204 });
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
