"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import type { EventRow, Ticket } from "@/lib/types";
import { fmtDay, fmtTime, phaseOf } from "@/lib/time";
import { CATEGORIES, thumb } from "@/lib/categories";
import { TLink } from "./PageTransition";
import { SignIn } from "./SignIn";

type User = { id: number; email: string; name: string | null };
type State = { status: "loading" } | { status: "signed-out" } | { status: "ready"; user: User; tickets: Ticket[] };

export function TicketLookup() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(async () => {
    // ask /me first so a signed-out visit doesn't log a 401 in the console
    const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
    if (!me.user) return setState({ status: "signed-out" });
    const res = await fetch("/api/tickets", { cache: "no-store" });
    if (res.status === 401) return setState({ status: "signed-out" });
    const data = await res.json();
    setState({ status: "ready", user: data.user, tickets: data.tickets });
  }, []);

  useEffect(() => {
    load().catch(() => setState({ status: "signed-out" }));
  }, [load]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ status: "signed-out" });
  };

  if (state.status === "loading") return <div className="h-80 animate-pulse rounded-[28px] border border-line bg-ink-2" />;
  if (state.status === "signed-out") return <SignedOut onSignedIn={load} />;

  const { user, tickets } = state;
  const upcoming = tickets.filter((t) => phaseOf(t) !== "past");
  const past = tickets.filter((t) => phaseOf(t) === "past").reverse();
  const checked = tickets.filter((t) => t.checked_in_at).length;
  const list = tab === "upcoming" ? upcoming : past;
  const first = user.name?.split(" ")[0];
  const initial = (first || user.email)[0]?.toUpperCase();

  return (
    <div className="grid gap-10 border-t border-line pt-10 lg:grid-cols-12 lg:gap-8">
      <aside className="order-2 lg:order-1 lg:col-span-4">
        <div className="rounded-[28px] border border-line bg-ink-2 p-6 lg:sticky lg:top-28">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-lime font-display text-2xl text-ink">{initial}</span>
            <div className="min-w-0">
              <p className="eyebrow">Signed in as</p>
              <p className="mt-1 truncate text-paper">{user.email}</p>
            </div>
          </div>
          <dl className="mt-8 grid grid-cols-3 divide-x divide-line border-y border-line py-5 text-center">
            {[
              ["Upcoming", upcoming.length],
              ["Past", past.length],
              ["Checked in", checked],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dd className="display text-4xl">{v}</dd>
                <dt className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mute">{k}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm leading-relaxed text-paper/60">Show the QR at the door. Tickets were also emailed to you, so they work offline too.</p>
          <button onClick={signOut} className="mt-6 w-full rounded-full border border-line py-3 text-sm text-paper/70 transition-colors hover:border-paper/50 hover:text-paper">
            Sign out
          </button>
        </div>
      </aside>

      <section className="order-1 lg:order-2 lg:col-span-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95]">
            {first ? `Hey ${first}.` : "Hey there."}
            <span className="serif-i block pb-1 text-lime">{upcoming.length ? `${upcoming.length} coming up.` : "Nothing booked yet."}</span>
          </h2>
          <div className="flex gap-1 rounded-full border border-line p-1 text-sm" role="tablist">
            {(["upcoming", "past"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={clsx("rounded-full px-5 py-2 capitalize transition-colors", tab === k ? "bg-paper text-ink" : "text-paper/60 hover:text-paper")}
              >
                {k} <span className="ml-1 font-mono text-xs opacity-60">{k === "upcoming" ? upcoming.length : past.length}</span>
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <Empty past={tab === "past"} />
        ) : (
          <ul className="mt-10 grid gap-4">
            {list.map((t, i) => (
              <motion.li key={t.code} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                <Stub t={t} />
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** A ticket drawn like a real paper stub: photo, details, perforated tear-off with the code. */
function Stub({ t }: { t: Ticket }) {
  const phase = phaseOf(t);
  return (
    <TLink href={`/tickets/${t.code}`} data-cursor="Open" className="group relative flex overflow-hidden rounded-[22px] border border-line bg-ink-2 transition-colors hover:border-lime/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb(t.event_cover)} alt="" loading="lazy" className={clsx("hidden w-56 object-cover transition-transform duration-700 group-hover:scale-105 sm:block", phase === "past" && "grayscale")} />
      <div className="min-w-0 flex-1 p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-mute">
          {CATEGORIES[t.category]?.label} · {fmtDay(t.starts_at)} · {fmtTime(t.starts_at)}
        </p>
        <p className="display mt-2 text-2xl leading-tight group-hover:text-lime md:text-3xl">{t.event_title}</p>
        <p className="mt-2 truncate text-sm text-paper/60">{t.event_venue}</p>
        <p className={clsx("mt-4 inline-block rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest", phase === "live" ? "border-lime/50 text-lime" : "border-line text-mute")}>
          {t.checked_in_at ? "✓ Checked in" : phase === "past" ? "Past event" : phase === "live" ? "● Live now" : `Admit ${t.seats}`}
        </p>
      </div>
      <div className="relative flex w-28 shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-line px-3 md:w-36">
        <span className="absolute -left-3 -top-3 size-6 rounded-full border border-line bg-ink" aria-hidden />
        <span className="absolute -bottom-3 -left-3 size-6 rounded-full border border-line bg-ink" aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Code</span>
        <span className="break-all text-center font-mono text-sm tracking-wider">{t.code}</span>
        <span className="mt-1 text-xs text-lime transition-transform group-hover:translate-x-1">Open →</span>
      </div>
    </TLink>
  );
}

function Empty({ past }: { past: boolean }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  useEffect(() => {
    if (past) return;
    fetch("/api/events?when=upcoming&limit=3")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, [past]);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-dashed border-line p-6 md:p-8">
        <p className="text-paper/70">{past ? "No past events yet. Go make some memories." : "No tickets yet. Here's what's coming up."}</p>
        <TLink href="/events" className="rounded-full bg-lime px-5 py-3 text-sm font-medium text-ink">
          Browse all events
        </TLink>
      </div>
      {events.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {events.map((e, i) => (
            <motion.li key={e.slug} className={clsx(i === 2 && "hidden sm:block")} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <TLink href={`/events/${e.slug}`} data-cursor="View" className="group block overflow-hidden rounded-[22px] border border-line bg-ink-2 transition-colors hover:border-lime/60">
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(e.cover)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-3 sm:p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
                    {fmtDay(e.starts_at)} · {fmtTime(e.starts_at)}
                  </p>
                  <p className="display mt-1 text-base leading-tight group-hover:text-lime sm:text-xl">{e.title}</p>
                </div>
              </TLink>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignedOut({ onSignedIn }: { onSignedIn: () => void }) {
  const steps = [
    ["Your email", "The one you used when you registered."],
    ["A 6 digit code", "Lands in your inbox. Works for 10 minutes."],
    ["You're in", "Stay signed in for 30 days on this device."],
  ];
  return (
    <div className="grid gap-10 border-t border-line pt-10 lg:grid-cols-12 lg:gap-8">
      <ol className="lg:col-span-5">
        {steps.map(([title, text], i) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-6 border-b border-line py-6 first:pt-0"
          >
            <span className="font-mono text-sm text-lime">0{i + 1}</span>
            <div>
              <p className="display text-2xl md:text-3xl">{title}</p>
              <p className="mt-1 text-paper/60">{text}</p>
            </div>
          </motion.li>
        ))}
        <p className="mt-6 text-sm text-mute">No password to remember. That&apos;s it.</p>
      </ol>
      <div className="flex lg:col-span-6 lg:col-start-7 lg:justify-end">
        <SignIn onSignedIn={onSignedIn} />
      </div>
    </div>
  );
}
