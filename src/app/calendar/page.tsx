import type { Metadata } from "next";
import { listEvents } from "@/lib/queries";
import { dayKey } from "@/lib/time";
import { PageHeader } from "@/components/PageHeader";
import { CalendarView } from "@/components/CalendarView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const now = Date.now();
  const events = await listEvents({ from: new Date(now - 120 * 864e5), to: new Date(now + 365 * 864e5), limit: 200 });

  return (
    <>
      <PageHeader index="C" eyebrow="Plan ahead" title="The" accent="calendar.">
        Every event on one grid. Tap a day to see what&apos;s on, or switch to agenda for a quick list.
      </PageHeader>
      <div className="mx-auto max-w-[1600px] px-4 pb-32 md:px-8">
        <CalendarView events={events} today={dayKey(new Date())} />
      </div>
    </>
  );
}