import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent, listEvents, listUpdates } from "@/lib/queries";
import { CATEGORIES } from "@/lib/categories";
import { phaseOf } from "@/lib/time";
import { ParallaxCover } from "@/components/ParallaxCover";
import { EventAside } from "@/components/EventAside";
import { LiveFeed } from "@/components/LiveFeed";
import { EventCard, CategoryChip } from "@/components/EventCard";
import { SplitReveal, FadeUp } from "@/components/Reveal";
import { TLink } from "@/components/PageTransition";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return { title: "Event not found" };
  return { title: e.title, description: e.tagline, openGraph: { images: [e.cover] } };
}

export default async function EventPage({ params }: { params: Params }) {
  const event = await getEvent((await params).slug);
  if (!event || event.status === "draft") notFound();

  const [updates, related] = await Promise.all([
    listUpdates(event.id),
    listEvents({ when: "upcoming", category: event.category, limit: 4 }),
  ]);
  const more = related.filter((e) => e.id !== event.id).slice(0, 3);
  const phase = phaseOf(event);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://hapnin.playnative.fun";

  return (
    <article>
      <section className="relative flex h-[92svh] min-h-[36rem] items-end overflow-hidden">
        <ParallaxCover src={event.cover} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-12 md:px-8">
          <TLink href="/events" className="eyebrow mb-6 inline-block hover:text-lime">
            ← All events
          </TLink>
          <div className="mb-6 flex flex-wrap gap-2">
            <CategoryChip category={event.category} />
            {phase === "live" && (
              <span className="chip border-transparent bg-[#ff4d4d]">
                <span className="live-dot !bg-paper" /> Live now
              </span>
            )}
            {event.status === "cancelled" && <span className="chip bg-ink/70 text-[#ff8a8a]">Cancelled</span>}
          </div>
          <SplitReveal as="h1" by="chars" trigger="load" delay={0.3} className="display max-w-[16ch] text-[clamp(3.2rem,9vw,10rem)] leading-[0.86]">
            {event.title}
          </SplitReveal>
          <p className="serif-i mt-4 max-w-2xl text-2xl text-paper/80 md:text-4xl">{event.tagline}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-12 px-4 py-20 md:px-8 lg:grid-cols-[1fr_26rem]">
        <div className="min-w-0">
          <FadeUp>
            <p className="eyebrow mb-6">About</p>
            <div className="max-w-2xl space-y-5 text-xl leading-relaxed text-paper/85">
              {event.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </FadeUp>

          <FadeUp className="mt-20">
            <div className="mb-6 flex items-center gap-3">
              {phase === "live" && <span className="live-dot" />}
              <p className="eyebrow">{phase === "live" ? "Live updates" : "Updates & highlights"}</p>
            </div>
            <LiveFeed initial={updates} eventId={event.id} />
          </FadeUp>

          <FadeUp className="mt-20 overflow-hidden rounded-[28px] border border-line">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="eyebrow">Venue</p>
                <p className="display mt-2 text-3xl">{event.venue}</p>
              </div>
              <span className="text-4xl">{CATEGORIES[event.category].emoji}</span>
            </div>
            <iframe
              title={`Map of ${event.venue}`}
              className="h-72 w-full grayscale invert-[0.92] hue-rotate-180"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(event.venue + ", Colombo")}&output=embed`}
            />
          </FadeUp>
        </div>

        <EventAside event={event} site={site} />
      </section>

      {more.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 pb-32 md:px-8">
          <SplitReveal as="h2" by="words" className="display mb-10 text-[clamp(2.4rem,5vw,5rem)]">
            More like this
          </SplitReveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
