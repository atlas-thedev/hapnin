import clsx from "clsx";
import type { EventRow } from "@/lib/types";
import { CATEGORIES, thumb } from "@/lib/categories";
import { dateParts, fmtTime, phaseOf } from "@/lib/time";
import { TLink } from "./PageTransition";

export const priceLabel = (p: number) => (p === 0 ? "Free" : `LKR ${p.toLocaleString("en")}`);

export function CategoryChip({ category, className }: { category: EventRow["category"]; className?: string }) {
  const c = CATEGORIES[category];
  return (
    <span className={clsx("chip bg-ink/60 backdrop-blur", className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

export function EventCard({ event, size = "md", className }: { event: EventRow; size?: "md" | "lg"; className?: string }) {
  const d = dateParts(event.starts_at);
  const phase = phaseOf(event);
  const left = Math.max(0, event.capacity - event.taken);

  return (
    <TLink href={`/events/${event.slug}`} data-cursor="View" className={clsx("group block", className)}>
      <div className={clsx("relative overflow-hidden rounded-[28px] bg-ink-3", size === "lg" ? "aspect-[4/5]" : "aspect-[5/6]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-parallax
          src={size === "lg" ? event.cover : thumb(event.cover)}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-[1.12] object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/20 to-transparent" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <div className="flex flex-wrap gap-2">
            <CategoryChip category={event.category} />
            {phase === "live" && (
              <span className="chip border-transparent bg-[#ff4d4d] text-paper">
                <span className="h-1.5 w-1.5 rounded-full bg-paper" /> Live
              </span>
            )}
            {event.status === "cancelled" && <span className="chip bg-ink/70 text-[#ff8a8a]">Cancelled</span>}
          </div>
          <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-paper text-ink transition-transform duration-700 group-hover:rotate-[-12deg]">
            <span className="display text-2xl leading-none">{d.day}</span>
            <span className="font-mono text-[9px] tracking-widest">{d.month}</span>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5">
          <h3 className={clsx("display leading-[0.92]", size === "lg" ? "text-[clamp(2rem,3.4vw,3.4rem)]" : "text-3xl")}>{event.title}</h3>
          <p className="mt-2 line-clamp-1 text-sm text-paper/70">{event.tagline}</p>
          <div className="mt-4 flex items-center justify-between border-t border-paper/15 pt-3 font-mono text-[11px] uppercase tracking-wider text-paper/70">
            <span className="truncate pr-3">{d.weekday} · {fmtTime(event.starts_at)} · {event.venue}</span>
            <span className={clsx("shrink-0", left === 0 ? "text-[#ff8a8a]" : "text-lime")}>{left === 0 ? "Sold out" : priceLabel(event.price)}</span>
          </div>
        </div>
      </div>
    </TLink>
  );
}
