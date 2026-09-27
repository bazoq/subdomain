import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin, resolveActor } from "@/server/api-auth";
import { MediaError, deleteMedia, signedDownloadUrl } from "@/server/storage/media";
import { log, errorFields } from "@/lib/log";

const ID_RE = /^[a-z0-9]{1,64}$/i;

/**
 * GET /api/media/[id]?name=cv.pdf -> 302 to a 60 s signed URL (private files: CVs, prescriptions,
 * quote files). Only signed-in tenant staff / super admins; the optional `name` becomes the
 * download filename after sanitisation.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actor = await resolveActor();
  if (!actor || actor.kind === "PUBLIC") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const name = req.nextUrl.searchParams.get("name")?.slice(0, 150) || undefined;
    const url = await signedDownloadUrl(actor, id, name);
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: e.status });
    log.error("media.download.failed", errorFields(e));
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cross = assertSameOrigin(req);
  if (cross) return cross;
  const { id } = await params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actor = await resolveActor();
  if (!actor || actor.kind === "PUBLIC") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteMedia(actor, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: e.status });
    log.error("media.delete.failed", errorFields(e));
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
