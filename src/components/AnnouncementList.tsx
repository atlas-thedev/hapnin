"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import clsx from "clsx";
import type { Announcement } from "@/lib/types";
import { fmtDay, relative } from "@/lib/time";
import { useStream } from "@/lib/useStream";
import { TLink } from "./PageTransition";

export const PRIORITY: Record<Announcement["priority"], { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-[#ff4d4d] text-paper" },
  important: { label: "Important", cls: "bg-lime text-ink" },
  normal: { label: "Notice", cls: "bg-paper/10 text-paper/80" },
};

export function AnnouncementList({ initial, filterable = false, limit }: { initial: Announcement[]; filterable?: boolean; limit?: number }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | Announcement["priority"]>("all");

  useStream({
    announcement: (a: Announcement) => setItems((prev) => (prev.some((p) => p.id === a.id) ? prev : [a, ...prev])),
  });

  const shown = items.filter((a) => filter === "all" || a.priority === filter).slice(0, limit ?? items.length);

  return (
    <div>
      {filterable && (
        <div className="mb-8 flex flex-wrap gap-2" role="tablist">
          {(["all", "urgent", "important", "normal"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={clsx("relative rounded-full px-4 py-2 text-sm capitalize transition-colors", filter === f ? "text-ink" : "border border-line text-paper/70 hover:text-paper")}
            >
              {filter === f && <motion.span layoutId="ann-filter" className="absolute inset-0 rounded-full bg-paper" />}
              <span className="relative">{f === "normal" ? "Notices" : f}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((a) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-[22px] border border-line bg-ink-2 p-5 transition-colors hover:border-paper/30 md:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx("rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest", PRIORITY[a.priority].cls)}>{PRIORITY[a.priority].label}</span>
                {a.pinned && <span className="font-mono text-[10px] uppercase tracking-widest text-mute">📌 Pinned</span>}
                <span suppressHydrationWarning className="ml-auto font-mono text-[11px] text-mute" title={fmtDay(a.created_at)}>
                  {relative(a.created_at)}
                </span>
              </div>
              <h3 className="display mt-4 text-2xl leading-tight md:text-3xl">{a.title}</h3>
              <p className="mt-2 leading-relaxed text-paper/70">{a.body}</p>
              {a.event_slug && (
                <TLink href={`/events/${a.event_slug}`} className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-lime hover:underline">
                  {a.event_title} →
                </TLink>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {!shown.length && <p className="text-mute">Nothing here yet.</p>}
    </div>
  );
}
