import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin, resolveActor } from "@/server/api-auth";
import { MediaError, deleteMedia, signedDownloadUrl } from "@/server/storage/media";

/** GET /api/media/[id] -> 302 to a 60s signed URL (private files: CVs, prescriptions, quote files). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor || actor.kind === "PUBLIC") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = await signedDownloadUrl(actor, id);
    return NextResponse.redirect(url, 302);
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cross = assertSameOrigin(req);
  if (cross) return cross;
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor || actor.kind === "PUBLIC") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteMedia(actor, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
