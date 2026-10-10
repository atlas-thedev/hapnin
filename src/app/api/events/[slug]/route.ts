import { sql } from "@/lib/db";
import { fail, json, requireAdmin, zodFail } from "@/lib/http";
import { getEvent } from "@/lib/queries";
import { eventSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const event = await getEvent((await params).slug);
  if (!event || event.status === "draft") return fail("Event not found", 404);
  return json({ event });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;

  const parsed = eventSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const e = parsed.data;

  const rows = await sql(
    `update events set title=$2, tagline=$3, description=$4, category=$5, venue=$6, organizer=$7,
       starts_at=$8, ends_at=$9, cover=$10, capacity=$11, price=$12, featured=$13, status=$14
     where slug = $1 returning slug`,
    [slug, e.title, e.tagline, e.description, e.category, e.venue, e.organizer, e.starts_at, e.ends_at, e.cover, e.capacity, e.price, e.featured, e.status],
  );
  if (!rows.length) return fail("Event not found", 404);
  return json({ slug });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await sql(`delete from events where slug = $1 returning id`, [(await params).slug]);
  if (!rows.length) return fail("Event not found", 404);
  return json({ ok: true });
}
