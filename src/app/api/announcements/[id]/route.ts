import { sql } from "@/lib/db";
import { fail, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const rows = await sql(`update announcements set pinned = $2 where id = $1 returning id`, [Number((await params).id), Boolean(body.pinned)]);
  return rows.length ? json({ ok: true }) : fail("Not found", 404);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await sql(`delete from announcements where id = $1 returning id`, [Number((await params).id)]);
  return rows.length ? json({ ok: true }) : fail("Not found", 404);
}
