"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

export function HypeButton({ slug, initial, onChange }: { slug: string; initial: number; onChange?: (n: number) => void }) {
  const [count, setCount] = useState(initial);
  const [pops, setPops] = useState<number[]>([]);
  const queued = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const btn = useRef<HTMLButtonElement>(null);

  // Keep in sync with hype from other people arriving over the live stream.
  useEffect(() => setCount((c) => Math.max(c, initial)), [initial]);

  // Clicks are batched so mashing the button sends one request.
  const flush = () => {
    const by = queued.current;
    queued.current = 0;
    fetch(`/api/events/${slug}/hype`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ by }) })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.hype === "number") {
          setCount(d.hype);
          onChange?.(d.hype);
        }
      })
      .catch(() => {});
  };

  const hype = () => {
    setCount((c) => c + 1);
    queued.current = Math.min(10, queued.current + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
    const id = Date.now() + Math.random();
    setPops((p) => [...p.slice(-6), id]);

    const r = btn.current!.getBoundingClientRect();
    confetti({
      particleCount: 24,
      spread: 70,
      startVelocity: 28,
      scalar: 0.8,
      ticks: 90,
      origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
      colors: ["#d7ff3d", "#ff5ca8", "#4de1ff", "#f3eee3"],
      disableForReducedMotion: true,
    });
  };

  return (
    <motion.button
      ref={btn}
      whileTap={{ scale: 0.9 }}
      onClick={hype}
      data-cursor="Hype!"
      className="relative flex items-center gap-3 rounded-full border border-line px-5 py-3 transition-colors hover:border-lime hover:text-lime"
      aria-label={`Hype this event (${count})`}
    >
      <span className="text-xl">🔥</span>
      <span className="font-mono text-sm tabular-nums">{count.toLocaleString("en")}</span>
      <span className="text-sm text-paper/60">hyped</span>
      <AnimatePresence>
        {pops.map((id) => (
          <motion.span
            key={id}
            className="pointer-events-none absolute left-6 top-0 font-mono text-sm text-lime"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.8 }}
            onAnimationComplete={() => setPops((p) => p.filter((x) => x !== id))}
          >
            +1
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
