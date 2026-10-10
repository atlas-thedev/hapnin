"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from "@/lib/gsap";

/** Infinite marquee that speeds up and flips direction with scroll velocity. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const loop = gsap.to("[data-track]", { xPercent: -50, repeat: -1, duration: 28, ease: "none" });
      let dir = 1;
      const st = ScrollTrigger.create({
        onUpdate(self) {
          if (self.direction !== dir) {
            dir = self.direction;
            gsap.to(loop, { timeScale: dir, duration: 0.4 });
          }
          const boost = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 300);
          gsap.fromTo(loop, { timeScale: dir * boost }, { timeScale: dir, duration: 1.2, ease: "power2.out", overwrite: true });
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className={`display px-6 text-[clamp(3rem,8vw,7rem)] ${i % 2 ? "serif-i text-lime" : "text-outline"}`}>{t}</span>
          <span className="text-4xl text-lime">✱</span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={root} className={`overflow-hidden border-y border-line py-6 ${className ?? ""}`} aria-hidden>
      <div data-track className="flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}
