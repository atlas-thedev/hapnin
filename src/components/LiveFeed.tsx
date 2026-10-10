"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { LiveUpdate } from "@/lib/types";
import { relative, fmtTime } from "@/lib/time";
import { useStream } from "@/lib/useStream";
import { TLink } from "./PageTransition";

const KIND: Record<LiveUpdate["kind"], { label: string; cls: string }> = {
  update: { label: "Update", cls: "bg-paper/10 text-paper" },
  score: { label: "Score", cls: "bg-sky/20 text-sky" },
  highlight: { label: "Highlight", cls: "bg-lime/20 text-lime" },
};

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Live updates list that receives new posts over SSE and animates them in. */
export function LiveFeed({
  initial,
  eventId,
  showEvent = false,
  limit = 20,
  compact = false,
}: {
  initial: LiveUpdate[];
  eventId?: number;
  showEvent?: boolean;
  limit?: number;
  compact?: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [fresh, setFresh] = useState<number | null>(null);
  const now = useNow();

  useStream(
    {
      update: (u: LiveUpdate) => {
        setItems((prev) => (prev.some((p) => p.id === u.id) ? prev : [u, ...prev].slice(0, limit)));
        setFresh(u.id);
      },
    },
    eventId,
  );

  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-mute">No updates yet. They&apos;ll show up here the moment organisers post them.</p>;
  }

  return (
    <ol className="relative space-y-3">
      <AnimatePresence initial={false}>
        {items.map((u) => (
          <motion.li
            key={u.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={clsx(
              "rounded-2xl border bg-ink-2 transition-colors duration-1000",
              fresh === u.id ? "border-lime/60" : "border-line",
              compact ? "p-4" : "p-5",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={clsx("rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest", KIND[u.kind].cls)}>{KIND[u.kind].label}</span>
              <span suppressHydrationWarning className="font-mono text-[11px] text-mute" title={fmtTime(u.created_at)}>
                {relative(u.created_at, now)}
              </span>
            </div>
            <p className={clsx("mt-3 leading-relaxed text-paper/90", compact ? "text-sm" : "text-base")}>{u.body}</p>
            {u.image && !compact && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" className="mt-4 max-h-72 w-full rounded-xl object-cover" loading="lazy" />
            )}
            {showEvent && u.event_slug && (
              <TLink href={`/events/${u.event_slug}`} className="mt-3 inline-block font-mono text-[11px] uppercase tracking-widest text-lime hover:underline">
                {u.event_title} →
              </TLink>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
