import { sql } from "@/lib/db";
import { fail, json, requireAdmin } from "@/lib/http";
import { getTicket } from "@/lib/queries";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { code } = await req.json().catch(() => ({ code: "" }));
  const clean = String(code || "").trim().toUpperCase().replace(/^.*\/TICKETS\//, "");
  const ticket = await getTicket(clean);
  if (!ticket) return fail("No ticket with that code", 404);
  if (ticket.checked_in_at) return json({ ticket, already: true });

  await sql(`update registrations set checked_in_at = now() where code = $1`, [clean]);
  return json({ ticket: { ...ticket, checked_in_at: new Date().toISOString() }, already: false });
}
