"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import type { EventRow } from "@/lib/types";
import { fmtLong, fmtRange, fmtTime, phaseOf } from "@/lib/time";
import { useStream } from "@/lib/useStream";
import { Countdown } from "./Countdown";
import { Button } from "./Button";
import { HypeButton } from "./HypeButton";
import { RegisterDialog } from "./RegisterDialog";
import { priceLabel } from "./EventCard";

const gcal = (e: EventRow, site: string) => {
  const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${f(e.starts_at)}/${f(e.ends_at)}`,
    details: `${e.tagline}\n${site}/events/${e.slug}`,
    location: e.venue,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
};

export function EventAside({ event, site }: { event: EventRow; site: string }) {
  const [taken, setTaken] = useState(event.taken);
  const [hype, setHype] = useState(event.hype);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState(() => phaseOf(event));
  const [copied, setCopied] = useState(false);

  useStream(
    {
      seats: (d: { taken: number }) => setTaken(d.taken),
      hype: (d: { hype: number }) => setHype(d.hype),
    },
    event.id,
  );

  const left = Math.max(0, event.capacity - taken);
  const pct = Math.min(100, (taken / event.capacity) * 100);
  const closed = event.status !== "published" || phase === "past" || left === 0;
  const close = useCallback(() => setOpen(false), []);

  const share = async () => {
    const url = `${site}/events/${event.slug}`;
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.tagline, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <div className="rounded-[28px] border border-line bg-ink-2 p-6">
        {phase === "upcoming" && (
          <>
            <p className="eyebrow mb-4">Starts in</p>
            <Countdown to={event.starts_at} onDone={() => setPhase("live")} />
          </>
        )}
        {phase === "live" && (
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <p className="display text-4xl">Happening now</p>
          </div>
        )}
        {phase === "past" && <p className="display text-4xl text-paper/60">This one&apos;s a wrap.</p>}

        <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
          <Row label="When">
            <span className="block">{fmtLong(event.starts_at)}</span>
            <span className="text-paper/60">{fmtRange(event.starts_at, event.ends_at)}</span>
          </Row>
          <Row label="Where">{event.venue}</Row>
          {event.organizer && <Row label="Host">{event.organizer}</Row>}
          <Row label="Entry">{priceLabel(event.price)}</Row>
        </dl>

        <div className="mt-6">
          <div className="mb-2 flex justify-between font-mono text-[11px] uppercase tracking-widest">
            <span className="text-mute">{taken.toLocaleString("en")} going</span>
            <span className={clsx(left < event.capacity * 0.1 ? "text-[#ff8a8a]" : "text-lime")}>{left === 0 ? "Sold out" : `${left.toLocaleString("en")} left`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper/10">
            <motion.div className="h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </div>

        <Button onClick={() => setOpen(true)} disabled={closed} className="mt-6 w-full !py-4 text-base" data-cursor="Go">
          {event.status === "cancelled" ? "Event cancelled" : phase === "past" ? "Registrations closed" : left === 0 ? "Sold out" : event.price ? "Reserve a seat" : "Get a free ticket"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <HypeButton slug={event.slug} initial={hype} onChange={setHype} />
        <a href={gcal(event, site)} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-3 text-sm hover:border-paper/50">
          + Google Calendar
        </a>
        <a href={`/api/events/${event.slug}/ics`} className="rounded-full border border-line px-4 py-3 text-sm hover:border-paper/50">
          .ics
        </a>
        <button onClick={share} className="rounded-full border border-line px-4 py-3 text-sm hover:border-paper/50">
          {copied ? "Link copied ✓" : "Share"}
        </button>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-mute">Doors close at {fmtTime(event.ends_at)}</p>

      <RegisterDialog event={event} open={open} onClose={close} seatsLeft={left} />
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-3">
      <dt className="font-mono text-[11px] uppercase tracking-widest text-mute">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
