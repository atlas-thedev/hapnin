"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import type { Announcement, EventRow, LiveUpdate } from "@/lib/types";
import { TLink } from "../PageTransition";
import { EventsAdmin } from "./EventsAdmin";
import { AnnouncementsAdmin } from "./AnnouncementsAdmin";
import { LiveAdmin } from "./LiveAdmin";
import { CheckinAdmin } from "./CheckinAdmin";
import { RegistrationsAdmin } from "./RegistrationsAdmin";
import { api } from "./api";

type Stats = { events: number; upcoming: number; tickets: number; hype: number; live: number };

const TABS = [
  ["events", "Events"],
  ["news", "Announcements"],
  ["live", "Live updates"],
  ["checkin", "Check-in"],
  ["people", "Registrations"],
] as const;
type Tab = (typeof TABS)[number][0];

export function AdminDashboard({ events, announcements, updates, stats }: { events: EventRow[]; announcements: Announcement[]; updates: LiveUpdate[]; stats: Stats }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");
  const refresh = () => router.refresh();

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 md:px-8">
      <header className="mx-auto flex max-w-[1400px] items-center justify-between">
        <TLink href="/" className="display text-2xl">
          hapnin<span className="text-lime">✱</span> <span className="eyebrow ml-2">organiser</span>
        </TLink>
        <div className="flex gap-2">
          <TLink href="/" className="rounded-full border border-line px-4 py-2 text-sm hover:border-paper/50">
            View site
          </TLink>
          <button
            onClick={async () => {
              await api("POST", "/api/admin/logout");
              refresh();
            }}
            className="rounded-full border border-line px-4 py-2 text-sm hover:border-paper/50"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-[1400px]">
        <h1 className="display text-6xl md:text-8xl">
          Dashboard<span className="serif-i text-lime">.</span>
        </h1>
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-line bg-line md:grid-cols-5">
          {[
            ["Events", stats.events],
            ["Upcoming", stats.upcoming],
            ["Live now", stats.live],
            ["Seats booked", stats.tickets],
            ["Hype", stats.hype],
          ].map(([label, v]) => (
            <div key={label} className="bg-ink p-5">
              <p className="display text-4xl">{Number(v).toLocaleString("en")}</p>
              <p className="eyebrow mt-2">{label}</p>
            </div>
          ))}
        </div>

        <nav className="no-scrollbar mt-10 flex gap-1 overflow-x-auto border-b border-line" data-lenis-prevent>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={clsx("relative shrink-0 px-4 pb-3 pt-2 text-sm transition-colors", tab === k ? "text-paper" : "text-paper/50 hover:text-paper")}>
              {label}
              {tab === k && <motion.span layoutId="admin-tab" className="absolute inset-x-2 -bottom-px h-0.5 bg-lime" />}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="pt-8">
            {tab === "events" && <EventsAdmin events={events} onChange={refresh} />}
            {tab === "news" && <AnnouncementsAdmin items={announcements} events={events} onChange={refresh} />}
            {tab === "live" && <LiveAdmin updates={updates} events={events} onChange={refresh} />}
            {tab === "checkin" && <CheckinAdmin />}
            {tab === "people" && <RegistrationsAdmin events={events} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}