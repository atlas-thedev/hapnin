"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

const pad = (n: number) => String(n).padStart(2, "0");

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** One digit column that slides when the value changes. */
function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center align-top leading-none">
      <span key={value} className="absolute inset-0 animate-[digit_0.5s_cubic-bezier(0.16,1,0.3,1)]">
        {value}
      </span>
    </span>
  );
}

export function Countdown({ to, className, size = "lg", onDone }: { to: string; className?: string; size?: "sm" | "lg"; onDone?: () => void }) {
  const target = new Date(to).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = target - Date.now();
      setLeft(ms);
      if (ms <= 0) onDone?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, onDone]);

  const t = split(left ?? 0);
  const units = [
    ["d", t.d > 99 ? String(t.d) : pad(t.d)],
    ["h", pad(t.h)],
    ["m", pad(t.m)],
    ["s", pad(t.s)],
  ] as const;

  return (
    <div className={clsx("flex items-end gap-3 md:gap-5", className)} role="timer" aria-live="off">
      {units.map(([unit, val]) => (
        <div key={unit} className="flex flex-col">
          <span className={clsx("display whitespace-nowrap tabular-nums", size === "lg" ? "text-5xl xl:text-6xl" : "text-2xl md:text-3xl")}>
            {left === null ? "--" : val.split("").map((c, i) => <Digit key={i} value={c} />)}
          </span>
          <span className="eyebrow mt-1">{{ d: "days", h: "hrs", m: "min", s: "sec" }[unit]}</span>
        </div>
      ))}
    </div>
  );
}
