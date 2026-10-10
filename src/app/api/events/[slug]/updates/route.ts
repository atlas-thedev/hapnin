import { publish } from "@/lib/bus";
import { sql } from "@/lib/db";
import { fail, json, requireAdmin, zodFail } from "@/lib/http";
import { getEvent, listUpdates } from "@/lib/queries";
import { updateSchema } from "@/lib/schemas";
import type { LiveUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const event = await getEvent((await params).slug);
  if (!event) return fail("Event not found", 404);
  return json({ updates: await listUpdates(event.id) });
}

export async function POST(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const event = await getEvent((await params).slug);
  if (!event) return fail("Event not found", 404);

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const [row] = await sql<LiveUpdate>(
    `insert into updates (event_id, kind, body, image) values ($1,$2,$3,$4) returning *`,
    [event.id, parsed.data.kind, parsed.data.body, parsed.data.image || null],
  );
  const update = { ...row, event_slug: event.slug, event_title: event.title };
  publish({ type: "update", eventId: event.id, payload: update });
  return json({ update }, 201);
}
