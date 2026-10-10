"use client";

import { useEffect, useRef } from "react";

type Handlers = Partial<Record<"update" | "announcement" | "hype" | "seats", (data: any) => void>>;

/** Subscribes to the server-sent event stream. Reconnects on its own via EventSource. */
export function useStream(handlers: Handlers, eventId?: number) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const es = new EventSource(`/api/stream${eventId ? `?event=${eventId}` : ""}`);
    const names = ["update", "announcement", "hype", "seats"] as const;
    const listeners = names.map((name) => {
      const fn = (e: MessageEvent) => ref.current[name]?.(JSON.parse(e.data));
      es.addEventListener(name, fn);
      return [name, fn] as const;
    });
    return () => {
      listeners.forEach(([name, fn]) => es.removeEventListener(name, fn));
      es.close();
    };
  }, [eventId]);
}
