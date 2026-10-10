import { z } from "zod";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { loginCodeMail, sendMail } from "@/lib/mail";
import { codesSentRecently, createLoginCode } from "@/lib/session";

export const dynamic = "force-dynamic";

const body = z.object({ email: z.string().trim().toLowerCase().email("That email doesn't look right").max(120) });

export async function POST(req: Request) {
  if (!rateLimit(`auth-start:${clientIp(req)}`, 6)) return fail("Too many requests. Try again in a minute.", 429);
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { email } = parsed.data;

  if ((await codesSentRecently(email)) >= 4) return fail("We've sent a few codes already. Check your inbox (and spam) or wait 15 minutes.", 429);

  const code = await createLoginCode(email);
  try {
    await sendMail({ to: email, ...loginCodeMail(code) });
  } catch (err) {
    console.error("login mail failed", err);
    return fail("Couldn't send the email right now. Try again in a bit.", 502);
  }
  return json({ sent: true });
}
