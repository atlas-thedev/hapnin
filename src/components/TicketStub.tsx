import clsx from "clsx";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/types";

type Props = {
  title: string;
  date: string;
  time: string;
  venue: string;
  code: string;
  name?: string;
  seats?: number;
  category: Category;
  cover: string;
  qr: string;
  qrIsSvg?: boolean;
  className?: string;
  checkedIn?: boolean;
  notch?: string;
};

/** A collectible ticket: photo strip, perforation and QR. */
export function TicketStub({ title, date, time, venue, code, name, seats, category, cover, qr, qrIsSvg, className, checkedIn, notch = "bg-ink" }: Props) {
  const color = CATEGORIES[category].color;
  return (
    <div className={clsx("relative w-full max-w-[22rem] overflow-hidden rounded-[26px] bg-paper text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]", className)}>
      <div className="relative h-36 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, transparent 30%, ${color}cc)` }} />
        <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-paper">
          Admit {seats ?? 1}
        </span>
        <span className="display absolute bottom-3 right-4 text-xl text-ink">hapnin✱</span>
      </div>

      <div className="px-5 pb-4 pt-4">
        <p className="display text-[1.7rem] leading-[0.95]">{title}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-[11px] uppercase tracking-wide">
          <div>
            <dt className="text-ink/45">Date</dt>
            <dd>{date}</dd>
          </div>
          <div>
            <dt className="text-ink/45">Time</dt>
            <dd>{time}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink/45">Venue</dt>
            <dd className="truncate">{venue}</dd>
          </div>
          {name && (
            <div className="col-span-2">
              <dt className="text-ink/45">Guest</dt>
              <dd className="truncate">{name}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="relative flex items-center">
        <span className={clsx("absolute -left-3 h-6 w-6 rounded-full", notch)} />
        <span className="mx-5 h-px flex-1 border-t-2 border-dashed border-ink/20" />
        <span className={clsx("absolute -right-3 h-6 w-6 rounded-full", notch)} />
      </div>

      <div className="flex items-center gap-4 px-5 py-4">
        {qrIsSvg ? (
          <div className="h-24 w-24 shrink-0 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR code for ticket ${code}`} className="h-24 w-24 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">Ticket code</p>
          <p className="font-mono text-lg font-semibold tracking-wider">{code}</p>
          <p className={clsx("mt-1 font-mono text-[10px] uppercase tracking-widest", checkedIn ? "text-green-700" : "text-ink/45")}>
            {checkedIn ? "✓ Checked in" : "Show this at the gate"}
          </p>
        </div>
      </div>
    </div>
  );
}
