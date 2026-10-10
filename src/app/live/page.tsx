import type { Metadata } from "next";
import { listEvents, listUpdates } from "@/lib/queries";
import { fmtTime } from "@/lib/time";
import { PageHeader } from "@/components/PageHeader";
import { LiveFeed } from "@/components/LiveFeed";
import { EventCard } from "@/components/EventCard";
import { TLink } from "@/components/PageTransition";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live" };

export default async function LivePage() {
  const [live, updates, soon] = await Promise.all([listEvents({ when: "live" }), listUpdates(undefined, 30), listEvents({ when: "upcoming", limit: 4 })]);
  const next = soon.filter((e) => !live.some((l) => l.id === e.id)).slice(0, 3);

  return (
    <>
      <PageHeader index="L" eyebrow="Right now" title="Live" accent="& loud.">
        Scores, highlights and updates straight from organisers. New posts slide in on their own, no refreshing needed.
      </PageHeader>

      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 pb-32 md:px-8 lg:grid-cols-[1fr_28rem]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <span className="live-dot" />
            <p className="eyebrow">All live updates</p>
          </div>
          <LiveFeed initial={updates} showEvent limit={50} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{live.length ? `${live.length} happening now` : "Nothing live right now"}</p>
          {live.map((e) => (
            <FadeUp key={e.id}>
              <EventCard event={e} />
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-mute">Until {fmtTime(e.ends_at)}</p>
            </FadeUp>
          ))}
          {next.length > 0 && (
            <div className="rounded-[28px] border border-line p-5">
              <p className="eyebrow mb-4">Up next</p>
              <ul className="space-y-3">
                {next.map((e) => (
                  <li key={e.id}>
                    <TLink href={`/events/${e.slug}`} className="flex items-center justify-between gap-4 hover:text-lime">
                      <span className="display truncate text-xl">{e.title}</span>
                      <span className="shrink-0 font-mono text-[11px] text-mute">{fmtTime(e.starts_at)}</span>
                    </TLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}