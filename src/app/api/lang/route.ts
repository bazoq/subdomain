import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "sf_lang";

/** GET /api/lang?to=ur&back=/shop — sets the language cookie for this host and redirects back. */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "ur" ? "ur" : "en";
  const backRaw = req.nextUrl.searchParams.get("back") ?? "/";
  // only allow same-origin relative paths
  const back = backRaw.startsWith("/") && !backRaw.startsWith("//") ? backRaw : "/";
  const res = NextResponse.redirect(new URL(back, req.url), 303);
  res.cookies.set(COOKIE, to, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
