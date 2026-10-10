import { ADMIN_COOKIE, checkPassword, createSession } from "@/lib/auth";
import { clientIp, fail, json, rateLimit } from "@/lib/http";

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 5)) return fail("Too many attempts. Wait a minute.", 429);
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !checkPassword(password)) return fail("Wrong password", 401);

  const session = createSession();
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
