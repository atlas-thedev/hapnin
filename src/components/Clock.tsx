"use client";

import { useEffect, useState } from "react";
import { TZ } from "@/lib/time";

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export function Clock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={`tabular-nums ${className ?? ""}`}>{now ?? "--:--:--"} COL</span>;
}
