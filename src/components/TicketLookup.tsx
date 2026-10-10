"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import type { Ticket } from "@/lib/types";
import { fmtDay, fmtTime, phaseOf } from "@/lib/time";
import { thumb } from "@/lib/categories";
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

  if (state.status === "loading") return <div className="mx-auto h-72 max-w-md animate-pulse rounded-[28px] border border-line bg-ink-2" />;
  if (state.status === "signed-out") return <SignIn onSignedIn={load} />;

  const { user, tickets } = state;
  const upcoming = tickets.filter((t) => phaseOf(t) !== "past");
  const past = tickets.filter((t) => phaseOf(t) === "past").reverse();
  const list = tab === "upcoming" ? upcoming : past;
  const first = user.name?.split(" ")[0];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Signed in as {user.email}</p>
          <p className="display mt-2 text-3xl md:text-4xl">
            {first ? `Hey ${first}.` : "Hey there."} <span className="serif-i text-lime">{upcoming.length ? `${upcoming.length} coming up.` : "Nothing booked yet."}</span>
          </p>
        </div>
        <button onClick={signOut} className="rounded-full border border-line px-4 py-2.5 text-sm text-paper/70 hover:border-paper/50 hover:text-paper">
          Sign out
        </button>
      </div>

      <div className="mt-6 flex gap-1 rounded-full border border-line p-1 text-sm sm:inline-flex" role="tablist">
        {(["upcoming", "past"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={clsx("flex-1 rounded-full px-5 py-2 capitalize transition-colors sm:flex-none", tab === k ? "bg-paper text-ink" : "text-paper/60 hover:text-paper")}
          >
            {k} <span className="ml-1 font-mono text-xs opacity-60">{k === "upcoming" ? upcoming.length : past.length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-[22px] border border-dashed border-line p-10 text-center">
          <p className="text-paper/70">{tab === "upcoming" ? "No upcoming tickets." : "No past events yet."}</p>
          {tab === "upcoming" && (
            <TLink href="/events" className="mt-4 inline-block rounded-full bg-lime px-5 py-3 text-sm font-medium text-ink">
              Find something to go to
            </TLink>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((t, i) => {
            const phase = phaseOf(t);
            return (
              <motion.li key={t.code} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                <TLink href={`/tickets/${t.code}`} data-cursor="Open" className="group flex overflow-hidden rounded-[22px] border border-line bg-ink-2 transition-colors hover:border-lime/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(t.event_cover)} alt="" loading="lazy" className={clsx("w-28 object-cover", phase === "past" && "grayscale")} />
                  <div className="min-w-0 flex-1 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-mute">
                      {fmtDay(t.starts_at)} · {fmtTime(t.starts_at)}
                    </p>
                    <p className="display mt-1 truncate text-2xl group-hover:text-lime">{t.event_title}</p>
                    <p className="mt-2 font-mono text-xs tracking-wider">{t.code}</p>
                    <p className={clsx("mt-1 font-mono text-[10px] uppercase tracking-widest", phase === "live" ? "text-lime" : "text-mute")}>
                      {t.checked_in_at ? "✓ Checked in" : phase === "past" ? "Past event" : phase === "live" ? "● Live now" : `Admit ${t.seats}`}
                    </p>
                  </div>
                </TLink>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
