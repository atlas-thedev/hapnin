import { Suspense } from "react";
import type { Metadata } from "next";
import { listEvents } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { EventsBrowser } from "@/components/EventsBrowser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events" };

type SP = Promise<{ category?: string; when?: string; q?: string }>;

export default async function EventsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const when = sp.when === "past" || sp.when === "live" || sp.when === "all" ? sp.when : "upcoming";
  const events = await listEvents({ category: sp.category, when, q: sp.q });

  return (
    <>
      <PageHeader index="E" eyebrow="Everything on" title="All the" accent="events.">
        Filter by what you&apos;re into, search by name or venue, and tap any card for details and tickets.
      </PageHeader>
      <div className="mx-auto max-w-[1600px] px-4 pb-32 md:px-8">
        <Suspense>
          <EventsBrowser initial={events} />
        </Suspense>
      </div>
    </>
  );
}
