import { z } from "zod";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { ticketsByEmail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!rateLimit(`tickets:${clientIp(req)}`, 20)) return fail("Too many lookups, try again soon", 429);
  const email = z.string().email().safeParse(new URL(req.url).searchParams.get("email"));
  if (!email.success) return fail("Enter a valid email");
  return json({ tickets: await ticketsByEmail(email.data) });
}
