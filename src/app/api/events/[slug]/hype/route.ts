import { publish } from "@/lib/bus";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { bumpHype } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit(`hype:${clientIp(req)}:${slug}`, 30)) return fail("That's a lot of hype. Take a breath.", 429);

  const body = await req.json().catch(() => ({}));
  const by = Math.max(1, Math.min(10, Number(body.by) || 1));
  const row = await bumpHype(slug, by);
  if (!row) return fail("Event not found", 404);

  publish({ type: "hype", eventId: row.id, payload: { hype: row.hype } });
  return json({ hype: row.hype });
}
