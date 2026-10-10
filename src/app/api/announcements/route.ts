import { publish } from "@/lib/bus";
import { sql } from "@/lib/db";
import { json, requireAdmin, zodFail } from "@/lib/http";
import { listAnnouncements } from "@/lib/queries";
import { announcementSchema } from "@/lib/schemas";
import type { Announcement } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({ announcements: await listAnnouncements() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = announcementSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const a = parsed.data;

  const [row] = await sql<Announcement>(
    `insert into announcements (title, body, priority, pinned, event_id) values ($1,$2,$3,$4,$5) returning *`,
    [a.title, a.body, a.priority, a.pinned, a.event_id ?? null],
  );
  publish({ type: "announcement", payload: row });
  return json({ announcement: row }, 201);
}
