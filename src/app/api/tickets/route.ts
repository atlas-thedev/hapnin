import { fail, json } from "@/lib/http";
import { ticketsByEmail } from "@/lib/queries";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Used to take ?email=, which meant anyone could list anyone's tickets. Now you sign in first.
export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Sign in to see your tickets", 401);
  return json({ user, tickets: await ticketsByEmail(user.email) });
}
