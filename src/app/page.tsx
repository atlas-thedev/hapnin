import QRCode from "qrcode";
import { featuredEvents, listAnnouncements, listEvents, listUpdates, nextEvent, stats } from "@/lib/queries";
import { COVERS, thumb } from "@/lib/categories";
import { fmtDay, fmtTime } from "@/lib/time";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Takeover } from "@/components/Takeover";
import { Manifesto } from "@/components/Manifesto";
import { FeaturedRail } from "@/components/FeaturedRail";
import { UpcomingList } from "@/components/UpcomingList";
import { LiveFeed } from "@/components/LiveFeed";
import { AnnouncementList } from "@/components/AnnouncementList";
import { TicketFan } from "@/components/TicketFan";
import { TicketStub } from "@/components/TicketStub";
import { SplitReveal, FadeUp } from "@/components/Reveal";
import { ButtonLink, Arrow } from "@/components/Button";
import { TLink } from "@/components/PageTransition";

export const dynamic = "force-dynamic";

export default async function Home() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://hapnin.playnative.fun";
  const [featured, upcoming, next, live, announcements, updates, s] = await Promise.all([
    featuredEvents(),
    listEvents({ when: "upcoming", limit: 7 }),
    nextEvent(),
    listEvents({ when: "live", limit: 3 }),
    listAnnouncements(3),
    listUpdates(undefined, 4),
    stats(),
  ]);

  const sampleTickets = await Promise.all(
    featured.slice(0, 3).map(async (e, i) => ({
      e,
      qr: await QRCode.toString(`${site}/events/${e.slug}`, { type: "svg", margin: 0, color: { dark: "#0f0e0c", light: "#00000000" } }),
      code: ["HAP-K7Q2XM", "HAP-9RTB4P", "HAP-W3NZ8C"][i],
    })),
  );
  const liveEvent = live[0];

  return (
    <>
      <Hero next={next} covers={COVERS.slice(0, 6).map(thumb)} liveCount={live.length} />

      <Marquee items={["Debates", "Big matches", "Concerts", "Expos", "Drama", "Sports meets", "Quiz nights"]} />

      <Manifesto
        tokens={[
          "Hapnin is the noticeboard, calendar and box office for",
          { img: "/img/debate-sm.webp", alt: "Debate" },
          "every debate,",
          { img: "/img/cricket-sm.webp", alt: "Cricket" },
          "big match and",
          { img: "/img/concert-sm.webp", alt: "Concert" },
          "concert at school. Students, teachers and parents stay on the same page",
          { emoji: "✱" },
          "from the first announcement to the final whistle.",
        ]}
        stats={[
          { label: "Events this year", value: s.events },
          { label: "Coming up", value: s.upcoming },
          { label: "Tickets issued", value: s.tickets },
          { label: "Hype received", value: s.hype },
        ]}
      />

      <Takeover src="/img/royal.webp" lines={["Every debate.", "Every big match.", "One place."]} />

      {featured.length > 0 && <FeaturedRail events={featured} />}

      <section className="mx-auto max-w-[1600px] px-4 py-28 md:px-8 md:py-40">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-4">(04) Coming up</p>
            <SplitReveal as="h2" by="words" className="display text-[clamp(2.8rem,7vw,7rem)]">
              Don&apos;t blink.
            </SplitReveal>
          </div>
          <ButtonLink href="/calendar" variant="ghost">
            See the calendar <Arrow />
          </ButtonLink>
        </div>
        <UpcomingList events={upcoming} />
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-6 px-4 pb-28 md:grid-cols-2 md:px-8 md:pb-40">
        <FadeUp className="relative overflow-hidden rounded-[32px] border border-line bg-ink-2 p-6 md:p-10">
          {liveEvent && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={liveEvent.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
          )}
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="chip border-transparent bg-[#ff4d4d] text-paper">
                <span className="live-dot !bg-paper" /> Live feed
              </span>
              <TLink href="/live" className="font-mono text-xs uppercase tracking-widest text-paper/70 hover:text-lime">
                Open live →
              </TLink>
            </div>
            <h3 className="display mt-8 text-4xl md:text-6xl">{liveEvent ? liveEvent.title : "Nothing live right now"}</h3>
            <p className="mt-3 text-paper/70">{liveEvent ? `${liveEvent.venue} · until ${fmtTime(liveEvent.ends_at)}` : "Live scores and highlights appear here during events."}</p>
            <div className="mt-8">
              <LiveFeed initial={updates.slice(0, 3)} limit={3} compact />
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1} className="rounded-[32px] border border-line p-6 md:p-10">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Announcements</span>
            <TLink href="/announcements" className="font-mono text-xs uppercase tracking-widest text-paper/70 hover:text-lime">
              All news →
            </TLink>
          </div>
          <h3 className="display mb-8 mt-8 text-4xl md:text-6xl">
            Heard the <span className="serif-i text-lime">news?</span>
          </h3>
          <AnnouncementList initial={announcements} limit={3} />
        </FadeUp>
      </section>

      <TicketFan
        tickets={sampleTickets.map(({ e, qr, code }) => (
          <TicketStub
            key={e.id}
            title={e.title}
            date={fmtDay(e.starts_at)}
            time={fmtTime(e.starts_at)}
            venue={e.venue}
            code={code}
            category={e.category}
            cover={thumb(e.cover)}
            qr={qr}
            qrIsSvg
            notch="bg-lime"
          />
        ))}
      />
    </>
  );
}
