import { json } from "@/lib/http";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({ user: await currentUser() });
}
