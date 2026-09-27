import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/server/auth/redirect";

const COOKIE = "sf_lang";

/**
 * GET /api/lang?to=ur&back=/shop — sets the language cookie for this host and redirects back.
 * `back` is restricted to a same-origin path (see safeRedirectPath), so this can never be used
 * as an open redirect. The cookie is not HttpOnly on purpose: the client toggle reads it.
 */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "ur" ? "ur" : "en";
  const back = safeRedirectPath(req.nextUrl.searchParams.get("back"), "/");
  const res = NextResponse.redirect(new URL(back, req.nextUrl.origin), 303);
  res.cookies.set(COOKIE, to, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
