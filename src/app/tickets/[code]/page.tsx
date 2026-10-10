import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getTicket } from "@/lib/queries";
import { fmtDay, fmtTime } from "@/lib/time";
import { thumb } from "@/lib/categories";
import { TicketStub } from "@/components/TicketStub";
import { TLink } from "@/components/PageTransition";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ticket", robots: { index: false } };

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = await getTicket(code);
  if (!t) notFound();

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ss.playnative.fun";
  const qr = await QRCode.toString(`${site}/tickets/${t.code}`, { type: "svg", margin: 0, color: { dark: "#0f0e0c", light: "#00000000" } });

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-32">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.event_cover} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />
      <div className="relative flex flex-col items-center">
        <p className="eyebrow mb-6">Your ticket</p>
        <div className="animate-[ticket-in_1.2s_cubic-bezier(0.16,1,0.3,1)_both]">
          <TicketStub
            title={t.event_title}
            date={fmtDay(t.starts_at)}
            time={fmtTime(t.starts_at)}
            venue={t.event_venue}
            code={t.code}
            name={t.name}
            seats={t.seats}
            category={t.category}
            cover={thumb(t.event_cover)}
            qr={qr}
            qrIsSvg
            checkedIn={Boolean(t.checked_in_at)}
          />
        </div>
        <div className="mt-8 flex gap-3 print:hidden">
          <TLink href={`/events/${t.event_slug}`} className="rounded-full border border-line px-5 py-3 text-sm hover:border-paper/50">
            Event details
          </TLink>
          <PrintButton />
        </div>
      </div>
    </section>
  );
}