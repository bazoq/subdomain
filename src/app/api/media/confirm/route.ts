import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, resolveActor } from "@/server/api-auth";
import { MediaError, confirmUpload } from "@/server/storage/media";
import { log, errorFields } from "@/lib/log";

const bodySchema = z.object({
  mediaId: z.string().regex(/^[a-z0-9]{1,64}$/i),
  /** confirm token returned by /api/media/presign (required for anonymous visitors) */
  token: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export async function POST(req: NextRequest) {
  const cross = assertSameOrigin(req);
  if (cross) return cross;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const media = await confirmUpload(actor, parsed.data.mediaId, parsed.data.token);
    return NextResponse.json({ id: media.id, url: media.url, visibility: media.visibility, mime: media.mime, size: media.size });
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: e.status });
    log.error("media.confirm.failed", errorFields(e));
    return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  }
}
