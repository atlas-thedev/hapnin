import { sql } from "@/lib/db";
import { json, requireAdmin } from "@/lib/http";

export const dynamic = "force-dynamic";

type Row = {
  code: string;
  name: string;
  email: string;
  phone: string | null;
  school: string | null;
  grade: string | null;
  role: string;
  seats: number;
  checked_in_at: string | null;
  created_at: string;
  event_title: string;
  event_slug: string;
};

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const p = new URL(req.url).searchParams;
  const slug = p.get("event");
  const rows = await sql<Row>(
    `select r.code, r.name, r.email, r.phone, r.school, r.grade, r.role, r.seats, r.checked_in_at, r.created_at,
            e.title as event_title, e.slug as event_slug
     from registrations r join events e on e.id = r.event_id
     ${slug ? "where e.slug = $1" : ""}
     order by r.created_at desc limit 2000`,
    slug ? [slug] : [],
  );

  if (p.get("format") === "csv") {
    const cols = ["code", "name", "email", "phone", "school", "grade", "role", "seats", "checked_in_at", "created_at", "event_title"] as const;
    const body = [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registrations${slug ? "-" + slug : ""}.csv"`,
      },
    });
  }
  return json({ registrations: rows });
}
