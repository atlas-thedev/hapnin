export const TZ = "Asia/Colombo";

const make = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });

const dayFmt = make({ weekday: "short", day: "numeric", month: "short" });
const longFmt = make({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFmt = make({ hour: "numeric", minute: "2-digit", hour12: true });
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = make({ day: "2-digit", month: "short", weekday: "short" });

export const fmtDay = (d: string | Date) => dayFmt.format(new Date(d));
export const fmtLong = (d: string | Date) => longFmt.format(new Date(d));
export const fmtTime = (d: string | Date) => timeFmt.format(new Date(d)).replace(" ", "").toUpperCase();

/** YYYY-MM-DD in Colombo time — used as a stable calendar key on server and client. */
export const dayKey = (d: string | Date) => keyFmt.format(new Date(d));

export function dateParts(d: string | Date) {
  const parts = Object.fromEntries(partsFmt.formatToParts(new Date(d)).map((p) => [p.type, p.value]));
  return { day: parts.day, month: parts.month.toUpperCase(), weekday: parts.weekday };
}

export function fmtRange(start: string, end: string) {
  const sameDay = dayKey(start) === dayKey(end);
  return sameDay
    ? `${fmtDay(start)} · ${fmtTime(start)} – ${fmtTime(end)}`
    : `${fmtDay(start)} – ${fmtDay(end)}`;
}

export function relative(d: string | Date, now = Date.now()) {
  const diff = Math.round((new Date(d).getTime() - now) / 1000);
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [86400, "day"],
    [3600, "hr"],
    [60, "min"],
  ];
  for (const [secs, label] of units) {
    if (abs >= secs) {
      const v = Math.floor(abs / secs);
      const s = `${v} ${label}${v > 1 ? "s" : ""}`;
      return diff > 0 ? `in ${s}` : `${s} ago`;
    }
  }
  return "just now";
}

export type Phase = "upcoming" | "live" | "past";

export function phaseOf(e: { starts_at: string; ends_at: string }, now = Date.now()): Phase {
  if (now < new Date(e.starts_at).getTime()) return "upcoming";
  if (now <= new Date(e.ends_at).getTime()) return "live";
  return "past";
}
