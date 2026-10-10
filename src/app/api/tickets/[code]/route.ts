import { fail, json } from "@/lib/http";
import { getTicket } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const ticket = await getTicket((await params).code);
  return ticket ? json({ ticket }) : fail("Ticket not found", 404);
}
