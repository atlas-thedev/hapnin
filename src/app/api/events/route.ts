import { sql } from "@/lib/db";
import { fail, json, requireAdmin, zodFail } from "@/lib/http";
import { listEvents } from "@/lib/queries";
import { eventSchema, slugify } from "@/lib/schemas";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const when = p.get("when");
  const events = await listEvents({
    category: p.get("category") || undefined,
    q: p.get("q")?.slice(0, 60) || undefined,
    when: when === "upcoming" || when === "past" || when === "live" ? when : "all",
    from: p.get("from") ? new Date(p.get("from")!) : undefined,
    to: p.get("to") ? new Date(p.get("to")!) : undefined,
    limit: Number(p.get("limit")) || 50,
    offset: Number(p.get("offset")) || 0,
    includeDrafts: p.get("drafts") === "1" && (await isAdmin()),
  });
  return json({ events });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = eventSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const e = parsed.data;
  const slug = e.slug || slugify(e.title);

  try {
    const [row] = await sql<{ slug: string }>(
      `insert into events (slug, title, tagline, description, category, venue, organizer, starts_at, ends_at, cover, capacity, price, featured, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning slug`,
      [slug, e.title, e.tagline, e.description, e.category, e.venue, e.organizer, e.starts_at, e.ends_at, e.cover, e.capacity, e.price, e.featured, e.status],
    );
    return json({ slug: row.slug }, 201);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return fail("An event with that slug already exists", 409);
    throw err;
  }
}
