import { z } from "zod";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { startSession, verifyLoginCode } from "@/lib/session";

export const dynamic = "force-dynamic";

const body = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  code: z.string().trim().regex(/^\d{6}$/, "The code is 6 digits"),
});

export async function POST(req: Request) {
  if (!rateLimit(`auth-verify:${clientIp(req)}`, 15)) return fail("Too many tries. Wait a minute.", 429);
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  const result = await verifyLoginCode(parsed.data.email, parsed.data.code);
  if (!result.ok) return fail(result.reason, 401);

  await startSession(result.user.id);
  return json({ user: result.user });
}
