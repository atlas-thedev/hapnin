"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { EventRow } from "@/lib/types";
import { CATEGORIES, thumb } from "@/lib/categories";
import { dayKey, fmtLong, fmtRange, fmtTime } from "@/lib/time";
import { TLink } from "./PageTransition";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Every calendar day an event touches, so multi-day events show on each day. */
function daysOf(e: EventRow) {
  const out: string[] = [];
  const end = dayKey(e.ends_at);
  let cur = dayKey(e.starts_at);
  for (let guard = 0; guard < 60; guard++) {
    out.push(cur);
    if (cur >= end) break;
    const [y, m, d] = cur.split("-").map(Number);
    cur = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  }
  return out;
}

export function CalendarView({ events, today }: { events: EventRow[]; today: string }) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [dir, setDir] = useState(1);
  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<"month" | "agenda">("month");

  const byDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) for (const k of daysOf(e)) map.set(k, [...(map.get(k) ?? []), e]);
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1));
    const offset = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const list: { key: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(view.y, view.m, 1 - offset + i));
      list.push({ key: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === view.m });
    }
    return days + offset <= 35 ? list.slice(0, 35) : list;
  }, [view]);

  const shift = (n: number) => {
    setDir(n);
    setView((v) => {
      const d = new Date(Date.UTC(v.y, v.m + n, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  };

  const monthKey = `${view.y}-${String(view.m + 1).padStart(2, "0")}`;
  const dayEvents = byDay.get(selected) ?? [];
  const agenda = events.filter((e) => dayKey(e.starts_at).startsWith(monthKey));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h2
                key={monthKey}
                initial={{ y: dir * 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: dir * -60, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="display pb-[0.08em] pr-[0.12em] text-5xl md:text-7xl"
              >
                {MONTHS[view.m]} <span className="serif-i text-lime">{view.y}</span>
              </motion.h2>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 flex rounded-full border border-line p-1">
              {(["month", "agenda"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={clsx("relative rounded-full px-3 py-1.5 text-xs capitalize", mode === m ? "text-ink" : "text-paper/60")}>
                  {mode === m && <motion.span layoutId="cal-mode" className="absolute inset-0 rounded-full bg-paper" />}
                  <span className="relative">{m}</span>
                </button>
              ))}
            </div>
            <button onClick={() => shift(-1)} className="h-11 w-11 rounded-full border border-line hover:border-paper/50" aria-label="Previous month">
              ←
            </button>
            <button
              onClick={() => {
                setDir(ty * 12 + tm - 1 > view.y * 12 + view.m ? 1 : -1);
                setView({ y: ty, m: tm - 1 });
                setSelected(today);
              }}
              className="rounded-full border border-line px-4 py-2.5 text-sm hover:border-paper/50"
            >
              Today
            </button>
            <button onClick={() => shift(1)} className="h-11 w-11 rounded-full border border-line hover:border-paper/50" aria-label="Next month">
              →
            </button>
          </div>
        </div>

        {mode === "month" ? (
          <div className="overflow-hidden rounded-[28px] border border-line">
            <div className="grid grid-cols-7 border-b border-line bg-ink-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="eyebrow px-3 py-3 text-center md:text-left">
                  {d}
                </div>
              ))}
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={monthKey}
                initial={{ x: dir * 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir * -80, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-7"
              >
                {cells.map((c, i) => {
                  const list = byDay.get(c.key) ?? [];
                  const isToday = c.key === today;
                  const isSel = c.key === selected;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setSelected(c.key)}
                      className={clsx(
                        "relative flex min-h-[4.5rem] flex-col items-start gap-1 border-line p-2 text-left transition-colors md:min-h-[8rem] md:p-3",
                        i % 7 !== 6 && "border-r",
                        i < cells.length - 7 && "border-b",
                        !c.inMonth && "text-paper/25",
                        isSel ? "bg-paper/[0.07]" : "hover:bg-paper/[0.03]",
                      )}
                      aria-label={`${c.key}${list.length ? `, ${list.length} events` : ""}`}
                      aria-pressed={isSel}
                    >
                      <span className={clsx("flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm", isToday && "bg-lime text-ink", isSel && !isToday && "ring-1 ring-paper")}>
                        {c.day}
                      </span>
                      <span className="flex flex-wrap gap-1 md:hidden">
                        {list.slice(0, 3).map((e) => (
                          <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORIES[e.category].color }} />
                        ))}
                      </span>
                      <span className="hidden w-full flex-col gap-1 md:flex">
                        {list.slice(0, 2).map((e) => (
                          <span key={e.id} className="truncate rounded-md px-2 py-1 text-[11px] font-medium text-ink" style={{ background: CATEGORIES[e.category].color }}>
                            {e.title}
                          </span>
                        ))}
                        {list.length > 2 && <span className="px-1 text-[11px] text-mute">+{list.length - 2} more</span>}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <ul className="space-y-3">
            {agenda.length === 0 && <li className="rounded-[28px] border border-dashed border-line p-10 text-center text-mute">Nothing scheduled this month.</li>}
            {agenda.map((e) => (
              <li key={e.id}>
                <TLink href={`/events/${e.slug}`} className="group flex items-center gap-5 rounded-[22px] border border-line p-4 transition-colors hover:border-paper/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(e.cover)} alt="" loading="lazy" className="h-20 w-28 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-mute">{fmtRange(e.starts_at, e.ends_at)}</p>
                    <p className="display truncate text-2xl group-hover:text-lime">{e.title}</p>
                    <p className="truncate text-sm text-paper/60">{e.venue}</p>
                  </div>
                </TLink>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-4">
          {Object.entries(CATEGORIES).map(([k, c]) => (
            <span key={k} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-mute">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.label}
            </span>
          ))}
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow mb-3">Selected day</p>
        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}>
            <p className="display text-3xl">{fmtLong(`${selected}T06:30:00Z`)}</p>
            <div className="mt-6 space-y-3">
              {dayEvents.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-mute">A quiet day. Nothing scheduled.</p>}
              {dayEvents.map((e) => (
                <TLink key={e.id} href={`/events/${e.slug}`} data-cursor="View" className="group block overflow-hidden rounded-[22px] border border-line bg-ink-2">
                  <div className="relative h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(e.cover)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <span className="chip absolute left-3 top-3 bg-ink/70">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORIES[e.category].color }} />
                      {CATEGORIES[e.category].label}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="display text-2xl leading-tight">{e.title}</p>
                    <p className="mt-1 text-sm text-paper/60">
                      {fmtTime(e.starts_at)} · {e.venue}
                    </p>
                  </div>
                </TLink>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </aside>
    </div>
  );
}