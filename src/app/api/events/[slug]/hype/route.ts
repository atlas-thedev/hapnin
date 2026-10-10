import crypto from "node:crypto";
import { cookies } from "next/headers";
import { publish } from "@/lib/bus";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { hypeState, toggleHype } from "@/lib/queries";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const COOKIE = "hapnin_device";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  const device = user ? `user:${user.id}` : ((await cookies()).get(COOKIE)?.value ?? null);
  const state = await hypeState(slug, device);
  if (!state) return fail("Event not found", 404);
  return json(state);
}

// One hype per person (signed in) or per device (not signed in). Tapping again takes it back.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit(`hype:${clientIp(req)}`, 40)) return fail("Slow down a little.", 429);

  const user = await currentUser();
  const jar = await cookies();
  let device = user ? `user:${user.id}` : jar.get(COOKIE)?.value;
  if (!device || (!user && !/^[a-f0-9]{32}$/.test(device))) {
    device = crypto.randomBytes(16).toString("hex");
    jar.set(COOKIE, device, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  const row = await toggleHype(slug, device);
  if (!row) return fail("Event not found", 404);

  publish({ type: "hype", eventId: row.id, payload: { hype: row.hype } });
  return json({ hype: row.hype, hyped: row.hyped });
}
