import { publish } from "@/lib/bus";
import { clientIp, fail, json, rateLimit, zodFail } from "@/lib/http";
import { register, RegistrationError } from "@/lib/queries";
import { registrationSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`reg:${clientIp(req)}`, 8)) return fail("Slow down a little and try again in a minute", 429);

  const parsed = registrationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const { code, eventId, taken } = await register((await params).slug, parsed.data);
    publish({ type: "seats", eventId, payload: { taken } });
    return json({ code }, 201);
  } catch (err) {
    if (err instanceof RegistrationError) return fail(err.message, err.status);
    throw err;
  }
}
