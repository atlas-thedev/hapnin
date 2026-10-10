import QRCode from "qrcode";
import { getTicket } from "@/lib/queries";

export const dynamic = "force-dynamic";

// PNG version of the ticket QR, mainly for emails (most clients block inline SVG).
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticket = await getTicket(code);
  if (!ticket) return new Response("Not found", { status: 404 });
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const png = await QRCode.toBuffer(`${site}/tickets/${ticket.code}`, { width: 360, margin: 1, color: { dark: "#0f0e0c", light: "#f3eee3" } });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
}
