import { sql } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sql("select 1");
    return json({ ok: true, db: "up", time: new Date().toISOString() });
  } catch {
    return json({ ok: false, db: "down" }, 503);
  }
}
