import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, resolveActor } from "@/server/api-auth";
import { MediaError, requestUpload } from "@/server/storage/media";
import { clientIp, rateLimit } from "@/server/rate-limit";

const bodySchema = z.object({
  mime: z.string().min(3).max(100),
  size: z.number().int().positive(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  folder: z.string().regex(/^[a-z0-9_-]{1,32}$/).default("general"),
  alt: z.string().max(200).optional(),
  /** super admin may upload on behalf of a tenant */
  tenantId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const cross = assertSameOrigin(req);
  if (cross) return cross;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = await clientIp();
  const rl = await rateLimit({
    bucket: `upload:${actor.kind}:${ip}`,
    limit: actor.kind === "PUBLIC" ? 10 : 120,
    windowSec: 600,
    tenantId: "tenantId" in actor ? actor.tenantId : null,
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const result = await requestUpload(actor, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
