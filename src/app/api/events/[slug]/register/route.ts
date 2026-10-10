import { publish } from "@/lib/bus";
import { sql } from "@/lib/db";
import { clientIp, fail, json, rateLimit, zodFail } from "@/lib/http";
import { sendMail, ticketMail } from "@/lib/mail";
import { getEvent, register, RegistrationError } from "@/lib/queries";
import { registrationSchema } from "@/lib/schemas";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`reg:${clientIp(req)}`, 8)) return fail("Slow down a little and try again in a minute", 429);

  const parsed = registrationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const { slug } = await params;
  const user = await currentUser();
  // Signed-in people always book under their verified email.
  const input = user ? { ...parsed.data, email: user.email } : parsed.data;

  try {
    const { code, eventId, taken } = await register(slug, input);
    publish({ type: "seats", eventId, payload: { taken } });

    if (user && !user.name) sql(`update users set name = $2 where id = $1`, [user.id, input.name]).catch(() => {});

    // The ticket email is a nice-to-have; don't make the person wait for it.
    getEvent(slug)
      .then((e) => e && sendMail({ to: input.email, ...ticketMail({ code, name: input.name, seats: input.seats, title: e.title, venue: e.venue, starts_at: e.starts_at, slug }) }))
      .catch((err) => console.error("ticket mail failed", err));

    return json({ code, emailed: true }, 201);
  } catch (err) {
    if (err instanceof RegistrationError) return fail(err.message, err.status);
    throw err;
  }
}
