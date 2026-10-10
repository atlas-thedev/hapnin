import { getEvent } from "@/lib/queries";

export const dynamic = "force-dynamic";

const stamp = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (s: string) => s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  if (!e) return new Response("Not found", { status: 404 });

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ss.playnative.fun";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hapnin//Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.slug}@hapnin`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.starts_at)}`,
    `DTEND:${stamp(e.ends_at)}`,
    `SUMMARY:${escape(e.title)}`,
    `DESCRIPTION:${escape(`${e.tagline}\n${site}/events/${e.slug}`)}`,
    `LOCATION:${escape(e.venue)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
