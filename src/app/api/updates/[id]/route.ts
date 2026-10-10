import { sql } from "@/lib/db";
import { fail, json, requireAdmin } from "@/lib/http";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await sql(`delete from updates where id = $1 returning id`, [Number((await params).id)]);
  return rows.length ? json({ ok: true }) : fail("Not found", 404);
}
