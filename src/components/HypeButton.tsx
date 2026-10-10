"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

/** One hype per device. Tap again to take it back. */
export function HypeButton({ slug, initial, onChange, className }: { slug: string; initial: number; onChange?: (n: number) => void; className?: string }) {
  const [count, setCount] = useState(initial);
  const [hyped, setHyped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState<number | null>(null);
  const btn = useRef<HTMLButtonElement>(null);

  // Totals from other people arrive over the live stream.
  useEffect(() => setCount(initial), [initial]);

  useEffect(() => {
    fetch(`/api/events/${slug}/hype`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.hyped === "boolean") setHyped(d.hyped);
        if (typeof d.hype === "number") setCount(d.hype);
      })
      .catch(() => {});
  }, [slug]);

  const toggle = async () => {
    if (busy) return;
    const next = !hyped;
    setBusy(true);
    setHyped(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      setPop(Date.now());
      const r = btn.current!.getBoundingClientRect();
      confetti({
        particleCount: 24,
        spread: 70,
        startVelocity: 28,
        scalar: 0.8,
        ticks: 90,
        origin: { x: (r.left + 28) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
        colors: ["#d7ff3d", "#ff5ca8", "#4de1ff", "#f3eee3"],
        disableForReducedMotion: true,
      });
    }
    try {
      const res = await fetch(`/api/events/${slug}/hype`, { method: "POST" });
      const d = await res.json();
      if (res.ok) {
        setHyped(d.hyped);
        setCount(d.hype);
        onChange?.(d.hype);
      } else {
        setHyped(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    } catch {
      setHyped(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.button
      ref={btn}
      whileTap={{ scale: 0.94 }}
      onClick={toggle}
      data-cursor={hyped ? "Undo" : "Hype!"}
      aria-pressed={hyped}
      aria-label={hyped ? `You hyped this. ${count} people hyped` : `Hype this event. ${count} people hyped`}
      className={clsx(
        "relative flex items-center gap-3 rounded-full border px-5 py-3 transition-colors",
        hyped ? "border-lime bg-lime/10 text-lime" : "border-line hover:border-lime hover:text-lime",
        className,
      )}
    >
      <motion.span className="text-xl" animate={hyped ? { scale: [1, 1.35, 1], rotate: [0, -12, 0] } : { scale: 1 }} transition={{ duration: 0.45 }}>
        🔥
      </motion.span>
      <span className="font-mono text-sm tabular-nums">{count.toLocaleString("en")}</span>
      <span className={clsx("text-sm", hyped ? "text-lime/80" : "text-paper/60")}>{hyped ? "hyped · you're in" : "hyped"}</span>
      <AnimatePresence>
        {pop && (
          <motion.span
            key={pop}
            className="pointer-events-none absolute left-6 top-0 font-mono text-sm text-lime"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.8 }}
            onAnimationComplete={() => setPop(null)}
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
