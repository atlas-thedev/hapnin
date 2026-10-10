"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import type { EventRow } from "@/lib/types";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { EventCard } from "./EventCard";

const WHEN = [
  ["upcoming", "Upcoming"],
  ["live", "Live now"],
  ["past", "Past"],
  ["all", "All"],
] as const;

export function EventsBrowser({ initial }: { initial: EventRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [events, setEvents] = useState(initial);
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [when, setWhen] = useState(params.get("when") ?? "upcoming");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      const sp = new URLSearchParams();
      if (category) sp.set("category", category);
      if (when !== "upcoming") sp.set("when", when);
      if (q) sp.set("q", q);
      router.replace(`/events${sp.size ? `?${sp}` : ""}`, { scroll: false });
      if (!sp.has("when")) sp.set("when", "upcoming");
      fetch(`/api/events?${sp}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => startTransition(() => setEvents(d.events)))
        .catch(() => {});
    }, q ? 250 : 0);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [category, when, q, router]);

  return (
    <div>
      <div className="sticky top-20 z-30 -mx-4 mb-10 border-y border-line bg-ink/80 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center">
          <div className="no-scrollbar flex gap-2 overflow-x-auto" data-lenis-prevent>
            <FilterPill active={!category} onClick={() => setCategory("")}>
              Everything
            </FilterPill>
            {CATEGORY_KEYS.map((c) => (
              <FilterPill key={c} active={category === c} onClick={() => setCategory(category === c ? "" : c)} dot={CATEGORIES[c].color}>
                {CATEGORIES[c].label}
              </FilterPill>
            ))}
          </div>
          <div className="flex gap-2 lg:ml-auto">
            <div className="flex rounded-full border border-line p-1">
              {WHEN.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setWhen(k)}
                  className={clsx("relative rounded-full px-3 py-1.5 text-xs transition-colors", when === k ? "text-ink" : "text-paper/60 hover:text-paper")}
                >
                  {when === k && <motion.span layoutId="when-pill" className="absolute inset-0 rounded-full bg-lime" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>
            <label className="relative flex-1 lg:w-56 lg:flex-none">
              <span className="sr-only">Search events</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="field !rounded-full !py-2 text-sm" />
            </label>
          </div>
        </div>
      </div>

      <div className={clsx("transition-opacity duration-300", pending && "opacity-60")}>
        {events.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line p-16 text-center">
            <p className="display text-4xl">Nothing here… yet.</p>
            <p className="mt-3 text-mute">Try another category or check back soon.</p>
          </div>
        ) : (
          <motion.ul layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {events.map((e, i) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.7, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  <EventCard event={e} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children, dot }: { active: boolean; onClick: () => void; children: React.ReactNode; dot?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-300",
        active ? "bg-paper text-ink" : "border border-line text-paper/70 hover:border-paper/40 hover:text-paper",
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}
