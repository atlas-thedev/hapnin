"use client";

import { useRef, useState } from "react";
import type { EventRow } from "@/lib/types";
import { CATEGORIES, thumb } from "@/lib/categories";
import { dateParts, fmtTime } from "@/lib/time";
import { gsap, useGSAP } from "@/lib/gsap";
import { TLink } from "./PageTransition";
import { Arrow } from "./Button";

/** Classic hover-reveal index: a preview image trails the cursor over the list. */
export function UpcomingList({ events }: { events: EventRow[] }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const moveX = useRef<gsap.QuickToFunc | null>(null);
  const moveY = useRef<gsap.QuickToFunc | null>(null);

  useGSAP(
    () => {
      gsap.set(preview.current, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
      moveX.current = gsap.quickTo(preview.current, "x", { duration: 0.6, ease: "power3" });
      moveY.current = gsap.quickTo(preview.current, "y", { duration: 0.6, ease: "power3" });
      gsap.from("[data-row]", { y: 40, opacity: 0, stagger: 0.06, duration: 1.1, scrollTrigger: { trigger: root.current, start: "top 80%", once: true } });
    },
    { scope: root },
  );

  const show = (i: number | null) => {
    setActive(i);
    gsap.to(preview.current, { scale: i === null ? 0.6 : 1, opacity: i === null ? 0 : 1, rotate: i === null ? -8 : 0, duration: 0.5, ease: "expo.out" });
  };

  return (
    <div
      ref={root}
      className="relative"
      onPointerMove={(e) => {
        const r = root.current!.getBoundingClientRect();
        moveX.current?.(e.clientX - r.left);
        moveY.current?.(e.clientY - r.top);
      }}
      onPointerLeave={() => show(null)}
    >
      <ul className="border-b border-line">
        {events.map((e, i) => {
          const d = dateParts(e.starts_at);
          return (
            <li key={e.id} data-row className="border-t border-line">
              <TLink
                href={`/events/${e.slug}`}
                onPointerEnter={() => show(i)}
                className="group relative grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 overflow-hidden py-6 md:grid-cols-[7rem_1fr_10rem_14rem_3rem] md:py-8"
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-lime transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
                <span className="relative font-mono text-xs uppercase tracking-widest text-mute transition-colors group-hover:text-ink">
                  {d.day} {d.month}
                </span>
                <span className="display relative text-3xl transition-all duration-500 group-hover:translate-x-3 group-hover:text-ink md:text-5xl">
                  {e.title}
                </span>
                <span className="relative hidden items-center gap-2 font-mono text-xs uppercase tracking-widest text-paper/70 group-hover:text-ink md:flex">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORIES[e.category].color }} />
                  {CATEGORIES[e.category].label}
                </span>
                <span className="relative hidden truncate text-sm text-paper/60 group-hover:text-ink md:block">
                  {fmtTime(e.starts_at)} · {e.venue}
                </span>
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line transition-all group-hover:-rotate-45 group-hover:border-ink group-hover:text-ink">
                  <Arrow />
                </span>
              </TLink>
            </li>
          );
        })}
      </ul>

      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-10 hidden h-56 w-80 overflow-hidden rounded-2xl opacity-0 md:block"
      >
        {events.map((e, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={e.id}
            src={thumb(e.cover)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-[clip-path] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ clipPath: active === i ? "inset(0 0 0 0)" : "inset(100% 0 0 0)" }}
          />
        ))}
      </div>
    </div>
  );
}
